/**
 * Authentication Controller
 * 
 * This file contains all authentication-related controller functions.
 * It handles login, OTP verification, logout, and user management.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { supabase } = require('../config/database');
const { JWT_CONFIG, EMAIL_CONFIG } = require('../config/app');
const { MESSAGES, STATUS_CODES } = require('../utils/constants');

// Email transporter setup
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

/**
 * Handle user login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    // Find user in Supabase by username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    // Log for monitoring (remove debug info in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Login attempt:', { username, userFound: !!user });
    }

    if (error || !user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        status: 'error',
        message: MESSAGES.ERROR.INVALID_CREDENTIALS
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        status: 'error',
        message: MESSAGES.ERROR.INVALID_CREDENTIALS
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store OTP and user info in session (like your working code)
    req.session.otp = otp;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.otpExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes from now

    if (process.env.NODE_ENV === 'development') {
      console.log('Session after OTP generation:', {
        sessionId: req.sessionID,
        sessionOtp: req.session.otp,
        sessionUserId: req.session.userId,
        otpExpiry: new Date(req.session.otpExpiry)
      });
    }

    // Send OTP email (using your working email template)
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: user.email,
      subject: "FOCAL - Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">FOCAL Attention Monitoring System</h2>
          <p>Hello <strong>${user.first_name || user.username}</strong>,</p>
          <p>Your OTP code is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This code expires in 5 minutes.</strong></p>
          <p>If you didn't request this login, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">FOCAL Team</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('OTP sent successfully to:', user.email);
      }

      res.json({
        status: 'success',
        message: 'OTP sent to your email address',
        data: {
          requiresOTP: true,
          email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for security
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Handle OTP verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (process.env.NODE_ENV === 'development') {
      console.log('OTP Verification attempt:', {
        sessionId: req.sessionID,
        sessionOtp: req.session.otp,
        sessionUserId: req.session.userId,
        receivedOtp: otp,
        sessionData: req.session
      });
    }

    if (!otp) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        status: 'error',
        message: 'OTP is required'
      });
    }

    // Check if OTP exists in session
    if (!req.session.otp || !req.session.userId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        status: 'error',
        message: 'No pending OTP verification. Please login again.'
      });
    }

    // Check if OTP has expired
    if (Date.now() > req.session.otpExpiry) {
      // Clear expired session data
      req.session.otp = null;
      req.session.userId = null;
      req.session.username = null;
      req.session.otpExpiry = null;
      
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        status: 'error',
        message: 'OTP has expired. Please login again.'
      });
    }

    // Verify OTP
    if (parseInt(otp) !== req.session.otp) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        status: 'error',
        message: MESSAGES.ERROR.INVALID_OTP
      });
    }

    // Get user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.session.userId)
      .single();

    if (error || !user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        status: 'error',
        message: MESSAGES.ERROR.USER_NOT_FOUND
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name
      },
      JWT_CONFIG.secret,
      { expiresIn: JWT_CONFIG.expiresIn }
    );

    // Clear session data after successful verification
    req.session.otp = null;
    req.session.userId = null;
    req.session.username = null;
    req.session.otpExpiry = null;

    res.json({
      status: 'success',
      message: MESSAGES.SUCCESS.OTP_VERIFIED,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          userType: user.user_type,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email
        }
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, email, user_type, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        status: 'error',
        message: MESSAGES.ERROR.USER_NOT_FOUND
      });
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          userType: user.user_type,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          createdAt: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyToken = (req, res) => {
  res.json({
    status: 'success',
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
};

/**
 * Handle user logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token. This endpoint can be used for logging purposes.
  
  res.json({
    status: 'success',
    message: MESSAGES.SUCCESS.LOGOUT
  });
};

module.exports = {
  login,
  verifyOtp,
  getProfile,
  verifyToken,
  logout
};
