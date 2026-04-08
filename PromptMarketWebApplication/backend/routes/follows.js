const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/follows?user_id=X — returns { followers: [...], following: [...] }
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required.' });
  }
  const uid = parseInt(user_id, 10);
  try {
    const [followers] = await pool.query(
      'SELECT follower_id FROM follows WHERE following_id = ?',
      [uid]
    );
    const [following] = await pool.query(
      'SELECT following_id FROM follows WHERE follower_id = ?',
      [uid]
    );
    res.json({ followers, following });
  } catch (err) {
    console.error('Error fetching follows:', err.message);
    res.status(500).json({ error: 'Failed to fetch follows.' });
  }
});

// POST /api/follows — follow { follower_id, following_id }
router.post('/', async (req, res) => {
  const { follower_id, following_id } = req.body || {};
  if (!follower_id || !following_id) {
    return res.status(400).json({ error: 'follower_id and following_id are required.' });
  }
  try {
    await pool.query(
      'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
      [follower_id, following_id]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error following user:', err.message);
    res.status(500).json({ error: 'Failed to follow user.' });
  }
});

// DELETE /api/follows — unfollow { follower_id, following_id }
router.delete('/', async (req, res) => {
  const { follower_id, following_id } = req.body || {};
  if (!follower_id || !following_id) {
    return res.status(400).json({ error: 'follower_id and following_id are required.' });
  }
  try {
    await pool.query(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [follower_id, following_id]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error unfollowing user:', err.message);
    res.status(500).json({ error: 'Failed to unfollow user.' });
  }
});

module.exports = router;
