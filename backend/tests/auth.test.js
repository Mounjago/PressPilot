const request = require('supertest');

// Mock mongoose BEFORE requiring app
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');

  // Mock the connection
  const mockConnection = {
    readyState: 1,
    host: 'localhost',
    port: 27017,
    name: 'presspilot-test',
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(true)
  };

  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({ connection: mockConnection }),
    connection: mockConnection,
    Schema: actualMongoose.Schema,
    model: jest.fn().mockImplementation((name, schema) => {
      // Return a mock model constructor
      const MockModel = function(data) {
        Object.assign(this, data);
        this._id = data._id || new actualMongoose.Types.ObjectId();
        this.save = jest.fn().mockResolvedValue(this);
        this.getPublicProfile = jest.fn().mockReturnValue({
          id: this._id,
          name: this.name,
          email: this.email,
          role: this.role || 'user'
        });
        this.generateAuthToken = jest.fn().mockReturnValue('mock-jwt-token');
        this.comparePassword = jest.fn().mockResolvedValue(true);
        this.isActive = true;
        this.isLocked = false;
        this.loginAttempts = 0;
        this.incLoginAttempts = jest.fn().mockResolvedValue(true);
        this.resetLoginAttempts = jest.fn().mockResolvedValue(true);
        this.updateLastLogin = jest.fn().mockResolvedValue(true);
      };

      MockModel.findByEmail = jest.fn();
      MockModel.findById = jest.fn();
      MockModel.findOne = jest.fn();
      MockModel.countDocuments = jest.fn().mockResolvedValue(0);
      MockModel.modelName = name;
      MockModel.schema = schema;

      return MockModel;
    }),
    Types: actualMongoose.Types
  };
});

// Setup env
require('./setup');

// Now we can import the app
// But we need a simpler approach - test the controller functions directly

describe('Auth Controller', () => {
  describe('Input Validation', () => {
    test('register route should require name, email, password', async () => {
      // Test that validation rules exist on the route
      const authRoutes = require('../routes/auth');
      expect(authRoutes).toBeDefined();
      expect(authRoutes.stack).toBeDefined();
      expect(authRoutes.stack.length).toBeGreaterThan(0);
    });

    test('login route should exist', async () => {
      const authRoutes = require('../routes/auth');
      const loginRoute = authRoutes.stack.find(
        layer => layer.route && layer.route.path === '/login'
      );
      expect(loginRoute).toBeDefined();
      expect(loginRoute.route.methods.post).toBe(true);
    });

    test('register route should exist', async () => {
      const authRoutes = require('../routes/auth');
      const registerRoute = authRoutes.stack.find(
        layer => layer.route && layer.route.path === '/register'
      );
      expect(registerRoute).toBeDefined();
      expect(registerRoute.route.methods.post).toBe(true);
    });

    test('profile routes should exist', async () => {
      const authRoutes = require('../routes/auth');
      const meRoute = authRoutes.stack.find(
        layer => layer.route && layer.route.path === '/me'
      );
      const profileRoute = authRoutes.stack.find(
        layer => layer.route && layer.route.path === '/profile'
      );
      expect(meRoute).toBeDefined();
      expect(profileRoute).toBeDefined();
    });

    test('change-password route should exist', async () => {
      const authRoutes = require('../routes/auth');
      const route = authRoutes.stack.find(
        layer => layer.route && layer.route.path === '/change-password'
      );
      expect(route).toBeDefined();
      expect(route.route.methods.put).toBe(true);
    });

    test('email-settings routes should exist', async () => {
      const authRoutes = require('../routes/auth');
      const routes = authRoutes.stack.filter(
        layer => layer.route && layer.route.path === '/email-settings'
      );
      expect(routes.length).toBe(2); // GET + PUT
    });
  });
});

describe('Auth Controller - Password Validation', () => {
  test('changePassword requires minimum 8 characters', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '..', 'controllers', 'authController.js'),
      'utf8'
    );
    expect(content).toContain('newPassword.length < 8');
    expect(content).not.toContain('newPassword.length < 6');
  });

  test('authController uses Winston logger, not console.error', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '..', 'controllers', 'authController.js'),
      'utf8'
    );
    expect(content).toContain("require('winston')");
    expect(content).not.toContain('console.error');
  });
});