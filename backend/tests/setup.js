// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-must-be-at-least-32-characters-long-for-tests';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!!';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/presspilot-test';
process.env.PORT = '0'; // Random port for tests