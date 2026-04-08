const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/saves?user_id=X — all saves for a user
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT prompt_id FROM saves WHERE user_id = ?',
      [parseInt(user_id, 10)]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching saves:', err.message);
    res.status(500).json({ error: 'Failed to fetch saves.' });
  }
});

// POST /api/saves — save a prompt { user_id, prompt_id }
router.post('/', async (req, res) => {
  const { user_id, prompt_id } = req.body || {};
  if (!user_id || !prompt_id) {
    return res.status(400).json({ error: 'user_id and prompt_id are required.' });
  }
  try {
    await pool.query(
      'INSERT IGNORE INTO saves (user_id, prompt_id) VALUES (?, ?)',
      [user_id, prompt_id]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error saving prompt:', err.message);
    res.status(500).json({ error: 'Failed to save prompt.' });
  }
});

// DELETE /api/saves — unsave a prompt { user_id, prompt_id }
router.delete('/', async (req, res) => {
  const { user_id, prompt_id } = req.body || {};
  if (!user_id || !prompt_id) {
    return res.status(400).json({ error: 'user_id and prompt_id are required.' });
  }
  try {
    await pool.query(
      'DELETE FROM saves WHERE user_id = ? AND prompt_id = ?',
      [user_id, prompt_id]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error unsaving prompt:', err.message);
    res.status(500).json({ error: 'Failed to unsave prompt.' });
  }
});

module.exports = router;
