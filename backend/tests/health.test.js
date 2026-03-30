require('./setup');
const request = require('supertest');

// We need to create a minimal test app since the real server.js connects to MongoDB
const express = require('express');

describe('Health Check & Error Handling', () => {
  let app;

  beforeAll(() => {
    // Create a minimal app that mirrors server.js structure
    app = express();
    app.use(express.json({ limit: '1mb', strict: true }));

    // Health check (simplified)
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        environment: 'test'
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        code: 'NOT_FOUND'
      });
    });

    // Error handler
    app.use((err, req, res, _next) => {
      if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    });
  });

  describe('GET /health', () => {
    test('should return 200 with health info', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.uptime).toBeDefined();
      expect(res.body.environment).toBe('test');
    });

    test('should return JSON content type', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('NOT_FOUND');
      expect(res.body.message).toContain('Route not found');
    });

    test('should return 404 for unknown POST routes', async () => {
      const res = await request(app).post('/api/nonexistent').send({ data: 'test' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    test('should include method and path in 404 message', async () => {
      const res = await request(app).delete('/api/something/123');
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('DELETE');
      expect(res.body.message).toContain('/api/something/123');
    });
  });

  describe('JSON Parsing', () => {
    test('should accept valid JSON', async () => {
      const res = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send({ name: 'test' });
      // Will hit 404 since route doesn't exist, but parsing was fine
      expect(res.status).toBe(404);
    });

    test('should reject invalid JSON', async () => {
      const res = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_JSON');
    });
  });
});

describe('Validate Middleware Integration', () => {
  const express = require('express');
  const { body } = require('express-validator');
  const validate = require('../middleware/validate');

  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Test route with validation
    app.post('/test',
      [
        body('email').isEmail().withMessage('Email invalide'),
        body('name').notEmpty().withMessage('Nom requis').trim()
      ],
      validate,
      (req, res) => {
        res.json({ success: true, data: req.body });
      }
    );
  });

  test('should pass with valid data', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'test@test.com', name: 'Test User' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('should return 400 with invalid email', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'not-an-email', name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(res.body.errors[0].field).toBe('email');
  });

  test('should return 400 with missing name', async () => {
    const res = await request(app)
      .post('/test')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.some(e => e.field === 'name')).toBe(true);
  });

  test('should return multiple errors for multiple invalid fields', async () => {
    const res = await request(app)
      .post('/test')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Sanitize Middleware Integration', () => {
  const express = require('express');
  const sanitize = require('../middleware/sanitize');

  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(sanitize);

    app.post('/test', (req, res) => {
      res.json({ success: true, body: req.body });
    });
  });

  test('should sanitize NoSQL injection in request', async () => {
    const res = await request(app)
      .post('/test')
      .send({
        email: 'admin@test.com',
        password: { '$gt': '' }
      });
    expect(res.status).toBe(200);
    expect(res.body.body.password['$gt']).toBeUndefined();
  });

  test('should sanitize XSS in request', async () => {
    const res = await request(app)
      .post('/test')
      .send({
        name: '<script>alert("xss")</script>Normal'
      });
    expect(res.status).toBe(200);
    expect(res.body.body.name).not.toContain('<script>');
    expect(res.body.body.name).toContain('Normal');
  });
});