const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Generate a valid JWT token for testing
 */
const generateTestToken = (userId, role = 'user') => {
  return jwt.sign(
    {
      id: userId || new mongoose.Types.ObjectId().toString(),
      email: 'test@presspilot.com',
      role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      issuer: 'presspilot',
      audience: 'presspilot-users'
    }
  );
};

/**
 * Generate an expired JWT token for testing
 */
const generateExpiredToken = () => {
  return jwt.sign(
    {
      id: new mongoose.Types.ObjectId().toString(),
      email: 'expired@presspilot.com',
      role: 'user'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '-1h',
      issuer: 'presspilot',
      audience: 'presspilot-users'
    }
  );
};

module.exports = {
  generateTestToken,
  generateExpiredToken
};