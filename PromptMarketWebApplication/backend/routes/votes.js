const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/votes?prompt_id=X  — all votes for a prompt
// GET /api/votes?user_id=X    — all votes by a user
router.get('/', async (req, res) => {
  const { prompt_id, user_id } = req.query;
  if (!prompt_id && !user_id) {
    return res.status(400).json({ error: 'prompt_id or user_id is required.' });
  }
  try {
    if (prompt_id) {
      const [rows] = await pool.query(
        'SELECT user_id, value FROM votes WHERE prompt_id = ?',
        [parseInt(prompt_id, 10)]
      );
      return res.json(rows);
    }
    const [rows] = await pool.query(
      'SELECT prompt_id, value FROM votes WHERE user_id = ?',
      [parseInt(user_id, 10)]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching votes:', err.message);
    res.status(500).json({ error: 'Failed to fetch votes.' });
  }
});

// POST /api/votes — upsert { user_id, prompt_id, value }
router.post('/', async (req, res) => {
  const { user_id, prompt_id, value } = req.body || {};
  if (!user_id || !prompt_id || value === undefined) {
    return res.status(400).json({ error: 'user_id, prompt_id, and value are required.' });
  }
  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'value must be 1 or -1.' });
  }
  try {
    await pool.query(
      'INSERT INTO votes (user_id, prompt_id, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [user_id, prompt_id, value]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error upserting vote:', err.message);
    res.status(500).json({ error: 'Failed to save vote.' });
  }
});

// DELETE /api/votes — remove vote { user_id, prompt_id }
router.delete('/', async (req, res) => {
  const { user_id, prompt_id } = req.body || {};
  if (!user_id || !prompt_id) {
    return res.status(400).json({ error: 'user_id and prompt_id are required.' });
  }
  try {
    await pool.query(
      'DELETE FROM votes WHERE user_id = ? AND prompt_id = ?',
      [user_id, prompt_id]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error deleting vote:', err.message);
    res.status(500).json({ error: 'Failed to delete vote.' });
  }
});

module.exports = router;
