const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');
const db = require('../database/db');

// Register a new device (student)
router.post('/register', async (req, res) => {
  try {
    const {appId, firstName, age, schoolId, parentalConsent, privacyConsent} =
      req.body;

    // Validate
    if (!appId || !firstName || !age || !parentalConsent || !privacyConsent) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    if (age < 5 || age > 18) {
      return res.status(400).json({error: 'Invalid age'});
    }

    // Check if already registered
    const existing = await db.query(
      'SELECT id FROM students WHERE app_id = $1',
      [appId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({error: 'Device already registered'});
    }

    // Insert student
    const result = await db.query(
      `INSERT INTO students (
        app_id, first_name, age, school_id,
        parental_consent, privacy_consent
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, app_id, first_name, age, registered_at`,
      [appId, firstName, age, schoolId || null, parentalConsent, privacyConsent]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      student: result.rows[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({error: 'Registration failed'});
  }
});

// Teacher/Admin login
router.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({error: 'Email and password required'});
    }

    // Find user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({error: 'Invalid credentials'});
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({error: 'Invalid credentials'});
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.school_id,
      },
      process.env.JWT_SECRET || 'change-this-secret',
      {expiresIn: '7d'}
    );

    // Update last login
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [
      user.id,
    ]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        schoolId: user.school_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({error: 'Login failed'});
  }
});

// Create admin/teacher account (protected - would need auth middleware in production)
router.post('/create-user', async (req, res) => {
  try {
    const {email, password, fullName, role, schoolId} = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.status(409).json({error: 'Email already registered'});
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role, school_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, school_id`,
      [email, passwordHash, fullName, role || 'teacher', schoolId || null]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({error: 'Failed to create user'});
  }
});

module.exports = router;
