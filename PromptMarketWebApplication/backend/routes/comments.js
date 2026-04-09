const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/comments?prompt_id=X — comments for a prompt
// GET /api/comments?author_id=X — all comments by a user (optionally also filtered by prompt_id)
router.get('/', async (req, res) => {
  const { prompt_id, author_id } = req.query;
  if (!prompt_id && !author_id) {
    return res.status(400).json({ error: 'prompt_id or author_id is required.' });
  }
  try {
    const where = [];
    const params = [];
    if (prompt_id) { where.push('c.prompt_id = ?'); params.push(parseInt(prompt_id, 10)); }
    if (author_id) { where.push('c.author_id = ?'); params.push(parseInt(author_id, 10)); }
    const [rows] = await pool.query(
      `SELECT c.id, c.prompt_id, c.author_id, c.content, c.created_at,
              u.username AS author_username, u.avatar_style, u.avatar_seed
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE ${where.join(' AND ')}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// POST /api/comments — add comment { prompt_id, author_id, content }
router.post('/', async (req, res) => {
  const { prompt_id, author_id, content } = req.body || {};
  if (!prompt_id || !author_id || !content) {
    return res.status(400).json({ error: 'prompt_id, author_id, and content are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (prompt_id, author_id, content) VALUES (?, ?, ?)',
      [prompt_id, author_id, content.trim()]
    );
    const [rows] = await pool.query(
      `SELECT c.id, c.prompt_id, c.author_id, c.content, c.created_at,
              u.username AS author_username, u.avatar_style, u.avatar_seed
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// DELETE /api/comments/:id — delete a comment
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid comment id.' });
  }
  try {
    await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error deleting comment:', err.message);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

module.exports = router;
