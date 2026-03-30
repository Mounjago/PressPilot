/**
 * INTEGRATION TESTS - Auth Flow
 * Tests the complete auth lifecycle with real MongoDB (mongodb-memory-server)
 * Flow: register -> login -> get profile -> update profile -> change password -> login with new password
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');

// We need to build a minimal app that mirrors server.js routing
let mongoServer;
let app;

// Test user data - must satisfy the User model password validator:
// min 12 chars, uppercase, lowercase, digit, special char
const TEST_USER = {
  name: 'Integration Tester',
  email: 'integration@presspilot-test.com',
  password: 'TestPass123!@#',
  company: 'PressPilot QA'
};

const NEW_PASSWORD = 'NewSecure456!@#';

// Store tokens/ids across tests
let authToken;
let userId;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Override MONGODB_URI for this test
  process.env.MONGODB_URI = mongoUri;

  // Connect mongoose
  await mongoose.connect(mongoUri);

  // Build minimal Express app with auth routes
  app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Load sanitize middleware
  const sanitize = require('../middleware/sanitize');
  app.use(sanitize);

  // Load auth routes (includes express-validator + validate middleware + auth middleware)
  const authRoutes = require('../routes/auth');
  app.use('/auth', authRoutes);

  // Error handler
  app.use((err, req, res, _next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message
    });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// ================================================================
// TEST SUITE: Full Auth Lifecycle
// ================================================================
describe('Auth Integration - Full Lifecycle', () => {

  // ------------------------------------------
  // 1. REGISTER
  // ------------------------------------------
  describe('POST /auth/register', () => {

    test('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(TEST_USER)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_USER.email);
      expect(res.body.data.user.name).toBe(TEST_USER.name);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.subscription.plan).toBe('free');

      // Password should NOT be in the public profile
      expect(res.body.data.user.password).toBeUndefined();

      // Store for subsequent tests
      authToken = res.body.data.token;
      userId = res.body.data.user.id;
    });

    test('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(TEST_USER)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already');
    });

    test('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'incomplete@test.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Weak Pass User',
          email: 'weak@test.com',
          password: '123' // Too short, no uppercase/special
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Bad Email User',
          email: 'not-an-email',
          password: 'TestPass123!@#'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------
  // 2. LOGIN
  // ------------------------------------------
  describe('POST /auth/login', () => {

    test('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_USER.email);

      // Update token (may differ from registration token)
      authToken = res.body.data.token;
    });

    test('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid');
    });

    test('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'ghost@nowhere.com',
          password: 'AnyPassword123!'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_USER.email })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------
  // 3. GET PROFILE (authenticated)
  // ------------------------------------------
  describe('GET /auth/me', () => {

    test('should return profile for authenticated user', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(TEST_USER.email);
      expect(res.body.data.name).toBe(TEST_USER.name);
      expect(res.body.data.id).toBe(userId);

      // No password in response
      expect(res.body.data.password).toBeUndefined();
    });

    test('should reject access without token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should reject access with invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------
  // 4. UPDATE PROFILE (authenticated)
  // ------------------------------------------
  describe('PUT /auth/profile', () => {

    test('should update profile fields', async () => {
      const res = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Tester' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Tester');
    });

    test('should reject profile update without auth', async () => {
      const res = await request(app)
        .put('/auth/profile')
        .send({ name: 'Hacker' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------
  // 5. CHANGE PASSWORD (authenticated)
  // ------------------------------------------
  describe('PUT /auth/change-password', () => {

    test('should reject change with wrong current password', async () => {
      const res = await request(app)
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongCurrent123!',
          newPassword: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should reject change with too-short new password', async () => {
      const res = await request(app)
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: TEST_USER.password,
          newPassword: 'Ab1!',
          confirmPassword: 'Ab1!'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should change password successfully', async () => {
      const res = await request(app)
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: TEST_USER.password,
          newPassword: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ------------------------------------------
  // 6. LOGIN WITH NEW PASSWORD
  // ------------------------------------------
  describe('POST /auth/login (after password change)', () => {

    test('should reject login with old password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password // old password
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should login with new password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: NEW_PASSWORD
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    });
  });

  // ------------------------------------------
  // 7. EMAIL SETTINGS (authenticated)
  // ------------------------------------------
  describe('GET /auth/email-settings', () => {

    test('should return email settings', async () => {
      const res = await request(app)
        .get('/auth/email-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.trackOpens).toBeDefined();
    });
  });

  // ------------------------------------------
  // 8. REFRESH TOKEN (authenticated)
  // ------------------------------------------
  describe('POST /auth/refresh-token', () => {

    test('should return a new token for authenticated user', async () => {
      const res = await request(app)
        .post('/auth/refresh-token')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_USER.email);

      // Token should be a valid JWT string
      expect(res.body.data.token).toMatch(/^eyJ/);

      // Update token for subsequent tests
      authToken = res.body.data.token;
    });

    test('should reject refresh without token', async () => {
      const res = await request(app)
        .post('/auth/refresh-token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should reject refresh with invalid token', async () => {
      const res = await request(app)
        .post('/auth/refresh-token')
        .set('Authorization', 'Bearer totally-invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------
  // 9. LOGOUT (authenticated)
  // ------------------------------------------
  describe('POST /auth/logout', () => {

    test('should logout successfully', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logged out');
    });

    test('should reject logout without token', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
