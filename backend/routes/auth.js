const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {pool} = require('../db');
const authenticateUser = require('../middleware/authenticateUser');
const { body, validationResult } = require('express-validator');
const uploadProfilePic = require('../middleware/profileUpload');
const router = express.Router();

// User Registration
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, phone } = req.body;

    try {
      // Check if user already exists
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'User already exists with this email or username' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert user
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password_hash, phone) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, phone || null]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.insertId },
        process.env.JWT_SECRET ,
        { expiresIn: '1h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: result.insertId,
          username,
          email,
          phone
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// User Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user
      const [users] = await pool.query(
        'SELECT id, username, email, password_hash, phone FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '1h' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// Get User Profile
router.get('/profile',authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [users] = await pool.query(
      'SELECT id, username, email, phone, profile_pic , created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update User Profile
router.put(
  '/profile',authenticateUser,
  [
    body('username').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('phone')
    .optional({ checkFalsy: true }) 
    .isMobilePhone()

  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.id;
      const { username, email, phone } = req.body;
      
      // Build update query dynamically
      const updates = [];
      const params = [];
      
      if (username) {
        updates.push('username = ?');
        params.push(username);
      }
      if (email) {
        updates.push('email = ?');
        params.push(email);
      }
      if (phone) {
        updates.push('phone = ?');
        params.push(phone);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      params.push(userId);
      
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await pool.query(query, params);
      
      // Get updated user
      const [users] = await pool.query(
        'SELECT id, username, email, phone, created_at FROM users WHERE id = ?',
        [userId]
      );
      
      res.status(200).json({
        message: 'Profile updated successfully',
        user: users[0]
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
//Profile Pic                                                                                                                                                                                                                                                                                                                                                  
router.put(
  '/profile-picture',
  authenticateUser,
  uploadProfilePic.single('profile_pic'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const userId = req.user.id;
      const filePath = `uploads/profile_pics/${req.file.filename}`;

      await pool.query(
        'UPDATE users SET profile_pic = ? WHERE id = ?',
        [filePath, userId]
      );

      res.status(200).json({
        message: 'Profile picture updated successfully',
        profile_pic: filePath
      });

    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

//Delete User Account
router.delete(
  '/delete-account',
  authenticateUser,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const connection = await pool.getConnection();

    try {
      const userId = req.user.id;
      const { password } = req.body;

      // Verify password
      const [users] = await connection.query(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (!users.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, users[0].password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Start transaction
      await connection.beginTransaction();

      //  Delete related data
      await connection.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM claims WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM matches WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM lost_items WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM found_items WHERE user_id = ?', [userId]);

      //  Delete user
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);

      await connection.commit();

      res.status(200).json({
        message: 'Account deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      connection.release();
    }
  }
);
//Change Password
router.put(
  '/change-password',
  authenticateUser,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),

    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      //Get current password hash
      const [users] = await pool.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (!users.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      const currentHash = users[0].password_hash;

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, currentHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Prevent reusing same password
      const isSame = await bcrypt.compare(newPassword, currentHash);
      if (isSame) {
        return res.status(400).json({
          error: 'New password must be different from current password'
        });
      }

      // Hash new password
      const newHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [newHash, userId]
      );

      res.status(200).json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = router;