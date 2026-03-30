const User = require('../models/User');
const bcrypt = require('bcryptjs');
const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'presspilot-auth' },
  transports: [new winston.transports.Console()]
});

/**
 * Auth Controller for PressPilot
 * Handles user authentication, registration, and profile management
 */

/**
 * Register a new user
 * @route POST /auth/register
 * @body {name, email, password, company}
 */
const register = async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      name,
      email,
      password,
      company: company || '',
      role: 'user',
      isActive: true,
      emailVerified: false,
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: new Date()
      },
      emailSettings: {
        senderEmail: email,
        senderName: name,
        replyToEmail: email,
        signature: '',
        trackOpens: true,
        trackClicks: true,
        unsubscribeLink: true
      }
    });

    await user.save();

    // Generate auth token
    const token = user.generateAuthToken();

    // Get public profile
    const publicProfile = user.getPublicProfile();

    return res.status(201).json({
      success: true,
      data: {
        user: publicProfile,
        token
      }
    });

  } catch (error) {
    logger.error('Registration error', { error: error.message, stack: error.stack });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating account. Please try again.'
    });
  }
};

/**
 * Login user
 * @route POST /auth/login
 * @body {email, password}
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts on failure
      await user.incLoginAttempts();

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockUntil) {
      await user.resetLoginAttempts();
    }

    // Update last login timestamp
    await user.updateLastLogin();

    // Generate auth token
    const token = user.generateAuthToken();

    // Get public profile
    const publicProfile = user.getPublicProfile();

    return res.json({
      success: true,
      data: {
        user: publicProfile,
        token
      }
    });

  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
};

/**
 * Get current user profile
 * @route GET /auth/me
 * @access Private
 */
const getProfile = async (req, res) => {
  try {
    // Find user by ID from JWT (set by auth middleware)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Return public profile
    const publicProfile = user.getPublicProfile();

    return res.json({
      success: true,
      data: publicProfile
    });

  } catch (error) {
    logger.error('Get profile error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

/**
 * Update user profile
 * @route PUT /auth/profile
 * @body {name, company, avatar}
 * @access Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, company, avatar } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields only
    if (name !== undefined) {
      user.name = name;
    }

    if (company !== undefined) {
      user.company = company;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    // Save updated user
    await user.save();

    // Return updated public profile
    const publicProfile = user.getPublicProfile();

    return res.json({
      success: true,
      data: publicProfile
    });

  } catch (error) {
    logger.error('Update profile error', { error: error.message, stack: error.stack });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

/**
 * Change user password
 * @route PUT /auth/change-password
 * @body {currentPassword, newPassword}
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    logger.error('Change password error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

/**
 * Get email settings
 * @route GET /auth/email-settings
 * @access Private
 */
const getEmailSettings = async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return email settings
    return res.json({
      success: true,
      data: user.emailSettings
    });

  } catch (error) {
    logger.error('Get email settings error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Error fetching email settings'
    });
  }
};

/**
 * Update email settings
 * @route PUT /auth/email-settings
 * @body {senderEmail, senderName, replyToEmail, signature, trackOpens, trackClicks, unsubscribeLink}
 * @access Private
 */
const updateEmailSettings = async (req, res) => {
  try {
    const {
      senderEmail,
      senderName,
      replyToEmail,
      signature,
      trackOpens,
      trackClicks,
      unsubscribeLink
    } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update email settings fields that are provided
    if (senderEmail !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(senderEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sender email format'
        });
      }
      user.emailSettings.senderEmail = senderEmail;
    }

    if (senderName !== undefined) {
      user.emailSettings.senderName = senderName;
    }

    if (replyToEmail !== undefined) {
      // Validate reply-to email if provided
      if (replyToEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(replyToEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid reply-to email format'
          });
        }
      }
      user.emailSettings.replyToEmail = replyToEmail;
    }

    if (signature !== undefined) {
      user.emailSettings.signature = signature;
    }

    if (trackOpens !== undefined) {
      user.emailSettings.trackOpens = Boolean(trackOpens);
    }

    if (trackClicks !== undefined) {
      user.emailSettings.trackClicks = Boolean(trackClicks);
    }

    if (unsubscribeLink !== undefined) {
      user.emailSettings.unsubscribeLink = Boolean(unsubscribeLink);
    }

    // Save updated user
    await user.save();

    // Return updated email settings
    return res.json({
      success: true,
      data: user.emailSettings
    });

  } catch (error) {
    logger.error('Update email settings error', { error: error.message, stack: error.stack });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating email settings'
    });
  }
};

/**
 * Refresh authentication token
 * @route POST /auth/refresh-token
 * @access Private (requires valid, non-expired token)
 */
const refreshToken = async (req, res) => {
  try {
    // req.user is set by auth middleware (token already verified)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Generate a fresh token
    const token = user.generateAuthToken();
    const publicProfile = user.getPublicProfile();

    return res.json({
      success: true,
      data: {
        token,
        user: publicProfile
      }
    });

  } catch (error) {
    logger.error('Refresh token error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
};

/**
 * Logout user (server-side acknowledgment)
 * @route POST /auth/logout
 * @access Private
 */
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, the client handles token removal.
    // This endpoint exists for server-side logging and future token blacklisting.
    logger.info('User logged out', { userId: req.user?.id });

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getEmailSettings,
  updateEmailSettings,
  refreshToken,
  logout
};