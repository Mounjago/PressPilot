require('./setup');

describe('Sanitize Middleware', () => {
  const sanitize = require('../middleware/sanitize');

  const createMockReqRes = (body = {}, query = {}, params = {}) => ({
    req: { body, query, params },
    res: {},
    next: jest.fn()
  });

  test('should block MongoDB $ operators in body', () => {
    const { req, res, next } = createMockReqRes({
      email: 'test@test.com',
      '$gt': 'attack',
      '$ne': null
    });
    sanitize(req, res, next);
    expect(req.body['$gt']).toBeUndefined();
    expect(req.body['$ne']).toBeUndefined();
    expect(req.body.email).toBe('test@test.com');
    expect(next).toHaveBeenCalled();
  });

  test('should block nested $ operators', () => {
    const { req, res, next } = createMockReqRes({
      password: { '$gt': '' }
    });
    sanitize(req, res, next);
    expect(req.body.password['$gt']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  test('should block $ operators in query params', () => {
    const { req, res, next } = createMockReqRes({}, {
      role: { '$in': ['admin'] }
    });
    sanitize(req, res, next);
    expect(req.query.role['$in']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  test('should strip script tags from strings', () => {
    const { req, res, next } = createMockReqRes({
      name: 'Hello<script>alert("xss")</script>World'
    });
    sanitize(req, res, next);
    expect(req.body.name).not.toContain('<script>');
    expect(req.body.name).toContain('Hello');
    expect(req.body.name).toContain('World');
    expect(next).toHaveBeenCalled();
  });

  test('should strip javascript: protocol', () => {
    const { req, res, next } = createMockReqRes({
      url: 'javascript:alert(1)'
    });
    sanitize(req, res, next);
    expect(req.body.url).not.toContain('javascript:');
    expect(next).toHaveBeenCalled();
  });

  test('should strip inline event handlers', () => {
    const { req, res, next } = createMockReqRes({
      html: '<div onclick="steal()">click me</div>'
    });
    sanitize(req, res, next);
    expect(req.body.html).not.toContain('onclick');
    expect(next).toHaveBeenCalled();
  });

  test('should handle arrays in body', () => {
    const { req, res, next } = createMockReqRes({
      tags: ['safe', '<script>bad</script>', 'normal']
    });
    sanitize(req, res, next);
    expect(req.body.tags[0]).toBe('safe');
    expect(req.body.tags[1]).not.toContain('<script>');
    expect(req.body.tags[2]).toBe('normal');
    expect(next).toHaveBeenCalled();
  });

  test('should handle null and undefined values', () => {
    const { req, res, next } = createMockReqRes({
      field1: null,
      field2: undefined,
      field3: 42
    });
    sanitize(req, res, next);
    expect(req.body.field1).toBeNull();
    expect(req.body.field3).toBe(42);
    expect(next).toHaveBeenCalled();
  });

  test('should pass through clean data unchanged', () => {
    const cleanData = {
      name: 'Denis ADAM',
      email: 'denis@presspilot.com',
      age: 30,
      active: true
    };
    const { req, res, next } = createMockReqRes({ ...cleanData });
    sanitize(req, res, next);
    expect(req.body).toEqual(cleanData);
    expect(next).toHaveBeenCalled();
  });
});

describe('Validate Middleware', () => {
  const { validationResult } = require('express-validator');

  test('validate middleware should exist and be a function', () => {
    const validate = require('../middleware/validate');
    expect(typeof validate).toBe('function');
  });
});

describe('Auth Middleware', () => {
  test('auth middleware should export required functions', () => {
    // Clear any cached modules to get fresh require
    const authModule = require('../middleware/auth');
    expect(typeof authModule.auth).toBe('function');
    expect(typeof authModule.authorize).toBe('function');
    expect(typeof authModule.optionalAuth).toBe('function');
    expect(typeof authModule.requireActiveSubscription).toBe('function');
    expect(typeof authModule.requirePlan).toBe('function');
    expect(typeof authModule.requireOwnership).toBe('function');
    expect(typeof authModule.logSecureAccess).toBe('function');
  });

  test('auth middleware uses Winston, not console', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '..', 'middleware', 'auth.js'),
      'utf8'
    );
    expect(content).toContain("require('winston')");
    expect(content).not.toContain('console.error');
    expect(content).not.toContain('console.log');
  });
});

describe('Route Files Integrity', () => {
  const routeNames = [
    'auth', 'contacts', 'campaigns', 'projects',
    'artists', 'analytics', 'messages', 'imap', 'uploads', 'ai'
  ];

  routeNames.forEach(name => {
    test(`routes/${name}.js should load as Express Router`, () => {
      const router = require(`../routes/${name}`);
      expect(router).toBeDefined();
      expect(router.stack).toBeDefined();
      expect(Array.isArray(router.stack)).toBe(true);
      expect(router.stack.length).toBeGreaterThan(0);
    });
  });

  test('total route count should be 95', () => {
    let total = 0;
    routeNames.forEach(name => {
      const router = require(`../routes/${name}`);
      total += router.stack.length;
    });
    expect(total).toBe(95);
  });
});

describe('Controller Console Cleanup', () => {
  const controllerNames = [
    'authController', 'artistsController', 'messagesController',
    'projectsController', 'uploadsController', 'contactsController',
    'imapController', 'analyticsController', 'campaignsController', 'aiController'
  ];

  controllerNames.forEach(name => {
    test(`controllers/${name}.js should use Winston, not console.error`, () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '..', 'controllers', `${name}.js`),
        'utf8'
      );
      expect(content).toContain("require('winston')");
      expect(content).not.toContain('console.error');
    });
  });
});

describe('Server Security Configuration', () => {
  test('server.js should have sanitize middleware', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '..', 'server.js'),
      'utf8'
    );
    expect(content).toContain("require('./middleware/sanitize')");
  });

  test('server.js should have upload rate limiter', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '..', 'server.js'),
      'utf8'
    );
    expect(content).toContain('uploadLimiter');
    expect(content).toContain('UPLOAD_RATE_LIMIT_EXCEEDED');
  });

  test('server.js should have CORS credentials enabled', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '..', 'server.js'),
      'utf8'
    );
    expect(content).toContain('credentials: true');
  });

  test('server.js should have Helmet CSP configured', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '..', 'server.js'),
      'utf8'
    );
    expect(content).toContain('contentSecurityPolicy');
    expect(content).toContain("frameSrc: [\"'none'\"]");
    expect(content).toContain("objectSrc: [\"'none'\"]");
  });

  test('server.js should have global and auth rate limiters', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '..', 'server.js'),
      'utf8'
    );
    expect(content).toContain('globalLimiter');
    expect(content).toContain('authLimiter');
    expect(content).toContain('RATE_LIMIT_EXCEEDED');
    expect(content).toContain('AUTH_RATE_LIMIT_EXCEEDED');
  });
});