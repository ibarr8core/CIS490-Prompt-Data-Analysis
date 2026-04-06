const express = require('express');
const pool = require('../db');

const router = express.Router();

function getPasswordIssues(pw) {
  const issues = [];
  const value = pw || '';
  if (!value || value.length < 8) issues.push('at least 8 characters');
  if (!/[A-Z]/.test(value)) issues.push('one uppercase letter');
  if (!/[0-9]/.test(value)) issues.push('one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) issues.push('one special character');
  return issues;
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required.' });
  }

  const issues = getPasswordIssues(password);
  if (issues.length) {
    return res.status(400).json({
      error: 'Password does not meet the required format.',
      details: issues
    });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username.trim(), email.trim(), password, 'user']
    );
    res.status(201).json({ id: result.insertId, username, email, role: 'user' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    console.error('Error registering user:', err.message);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body || {};
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'emailOrUsername and password are required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, username, email, role
       FROM users
       WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?))
         AND password = ?
       LIMIT 1`,
      [emailOrUsername, emailOrUsername, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error logging in:', err.message);
    res.status(500).json({ error: 'Failed to login.' });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, username, email, role, created_at
       FROM users
       WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  const { username, email, password } = req.body || {};
  if (password !== undefined) {
    const issues = getPasswordIssues(password);
    if (issues.length) {
      return res.status(400).json({
        error: 'Password does not meet the required format.',
        details: issues
      });
    }
  }
  try {
    await pool.query(
      `UPDATE users
       SET
         username = COALESCE(?, username),
         email = COALESCE(?, email),
         password = COALESCE(?, password)
       WHERE id = ?`,
      [username || null, email || null, password || null, id]
    );

    const [rows] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

router.get('/:id/prompts', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, title, description, model, category_id, thumbnail_mime_type, created_at
       FROM prompts
       WHERE author_id = ?
       ORDER BY created_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user prompts:', err.message);
    res.status(500).json({ error: 'Failed to fetch user prompts.' });
  }
});

module.exports = router;
