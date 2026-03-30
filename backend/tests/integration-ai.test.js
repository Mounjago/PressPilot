/**
 * INTEGRATION TESTS - AI Endpoints
 * Tests the multi-provider AI press release generation (OpenAI, Anthropic, Gemini)
 * and settings management endpoints
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');

let mongoServer;
let app;
let authToken;

// Test user data
const TEST_USER = {
  name: 'AI Tester',
  email: 'ai-test@presspilot-test.com',
  password: 'TestPass123!@#',
  company: 'PressPilot AI QA'
};

// Mock Anthropic response (default provider)
const MOCK_ANTHROPIC_RESPONSE = {
  content: [{
    type: 'text',
    text: '# Communique de Presse\n\nUn artiste majeur annonce sa tournee mondiale...'
  }],
  usage: {
    input_tokens: 150,
    output_tokens: 500
  }
};

// Mock OpenAI response
const MOCK_OPENAI_RESPONSE = {
  choices: [{
    message: {
      content: '# Communique de Presse\n\nUn artiste majeur annonce sa tournee mondiale...'
    }
  }],
  usage: {
    prompt_tokens: 150,
    completion_tokens: 500,
    total_tokens: 650
  }
};

// Store original fetch
const originalFetch = global.fetch;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.ENCRYPTION_KEY = 'a'.repeat(32); // Required for AI key encryption

  await mongoose.connect(mongoUri);

  // Build minimal Express app
  app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  const sanitize = require('../middleware/sanitize');
  app.use(sanitize);

  const authRoutes = require('../routes/auth');
  const aiRoutes = require('../routes/ai');
  app.use('/auth', authRoutes);
  app.use('/api/ai', aiRoutes);

  app.use((err, req, res, _next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message
    });
  });

  // Register and login to get auth token
  const registerRes = await request(app)
    .post('/auth/register')
    .send(TEST_USER);
  authToken = registerRes.body.data.token;
});

afterAll(async () => {
  // Restore original fetch
  global.fetch = originalFetch;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ENCRYPTION_KEY;
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(() => {
  // Mock fetch for Anthropic calls by default (default provider)
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => MOCK_ANTHROPIC_RESPONSE
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ================================================================
// TEST SUITE: AI Press Release Generation
// ================================================================
describe('AI Integration - Press Release Generation', () => {

  // ------------------------------------------
  // 1. SUCCESS CASES
  // ------------------------------------------
  describe('POST /api/ai/generate-press-release (success)', () => {

    test('should generate a press release with valid subject', async () => {
      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: 'Lancement de la tournee mondiale de BandStream' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.content).toBeDefined();
      expect(typeof res.body.data.content).toBe('string');
      expect(res.body.data.content.length).toBeGreaterThan(0);
      expect(res.body.data.usage).toBeDefined();
    });

    test('should call provider API with correct parameters', async () => {
      await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: 'Test subject' });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      // Default provider is anthropic
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(options.method).toBe('POST');
      expect(options.headers['x-api-key']).toBe('test-anthropic-key');

      const body = JSON.parse(options.body);
      expect(body.model).toBeDefined();
      expect(body.messages).toBeDefined();
      expect(body.messages[0].content).toContain('Test subject');
      expect(body.max_tokens).toBe(2000);
    });
  });

  // ------------------------------------------
  // 2. AUTHENTICATION CHECKS
  // ------------------------------------------
  describe('POST /api/ai/generate-press-release (auth)', () => {

    test('should reject request without auth token', async () => {
      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .send({ subject: 'Test' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should reject request with invalid token', async () => {
      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', 'Bearer invalid-token')
        .send({ subject: 'Test' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ------------------------------------------
  // 3. VALIDATION CHECKS
  // ------------------------------------------
  describe('POST /api/ai/generate-press-release (validation)', () => {

    test('should reject empty subject', async () => {
      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should reject missing subject', async () => {
      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should reject subject exceeding 2000 characters', async () => {
      const longSubject = 'A'.repeat(2001);
      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: longSubject })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should accept subject at exactly 2000 characters', async () => {
      const maxSubject = 'A'.repeat(2000);
      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: maxSubject })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ------------------------------------------
  // 4. PROVIDER ERROR HANDLING
  // ------------------------------------------
  describe('POST /api/ai/generate-press-release (provider errors)', () => {

    test('should handle provider rate limit (429)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      });

      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: 'Test rate limit' })
        .expect(429);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('rate limit');
    });

    test('should handle provider server error (500)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } })
      });

      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: 'Test server error' })
        .expect(500);

      expect(res.body.success).toBe(false);
    });

    test('should handle provider empty response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: '' }], usage: {} })
      });

      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: 'Test empty response' })
        .expect(502);

      expect(res.body.success).toBe(false);
    });

    test('should handle network error to provider', async () => {
      const networkError = new Error('Connection refused');
      networkError.code = 'ECONNREFUSED';
      global.fetch = jest.fn().mockRejectedValue(networkError);

      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: 'Test network error' })
        .expect(502);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('unreachable');
    });

    test('should handle missing API key', async () => {
      // Temporarily remove API keys
      const savedAnthropicKey = process.env.ANTHROPIC_API_KEY;
      const savedOpenaiKey = process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const res = await request(app)
        .post('/api/ai/generate-press-release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ subject: 'Test no API key' })
        .expect(503);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('non configur');

      // Restore keys
      process.env.ANTHROPIC_API_KEY = savedAnthropicKey;
      process.env.OPENAI_API_KEY = savedOpenaiKey;
    });
  });

  // ------------------------------------------
  // 5. AI SETTINGS ENDPOINTS
  // ------------------------------------------
  describe('GET /api/ai/settings', () => {

    test('should return AI settings for authenticated user', async () => {
      const res = await request(app)
        .get('/api/ai/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('anthropic');
      expect(res.body.data.availableModels).toBeDefined();
      expect(res.body.data.availableModels.openai).toBeInstanceOf(Array);
      expect(res.body.data.availableModels.anthropic).toBeInstanceOf(Array);
      expect(res.body.data.availableModels.gemini).toBeInstanceOf(Array);
      expect(res.body.data.defaultModels).toBeDefined();
    });

    test('should reject without auth', async () => {
      await request(app)
        .get('/api/ai/settings')
        .expect(401);
    });
  });

  describe('PUT /api/ai/settings', () => {

    test('should update AI provider', async () => {
      const res = await request(app)
        .put('/api/ai/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'openai' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('openai');

      // Restore default
      await request(app)
        .put('/api/ai/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'anthropic' });
    });

    test('should reject invalid provider', async () => {
      const res = await request(app)
        .put('/api/ai/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'invalid-provider' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
