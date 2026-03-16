// backend/routes/prompts.js
// Basic CRUD routes for prompts.
// All routes use async/await and return JSON responses.

const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/prompts
// Return all prompts.
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM prompts ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching prompts:', err.message);
    res.status(500).json({ error: 'Failed to fetch prompts.' });
  }
});

// GET /api/prompts/:id
// Return a single prompt by id.
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid prompt id.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM prompts WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching prompt:', err.message);
    res.status(500).json({ error: 'Failed to fetch prompt.' });
  }
});

// POST /api/prompts
// Create a new prompt.
router.post('/', async (req, res) => {
  const {
    title,
    description,
    content,
    model,
    author_id,
    category_id
  } = req.body || {};

  // Very basic validation to keep things beginner-friendly.
  if (!title || !content || !author_id) {
    return res.status(400).json({
      error: 'title, content, and author_id are required.'
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO prompts
        (title, description, content, model, author_id, category_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        content,
        model || null,
        author_id,
        category_id || null
      ]
    );

    const insertedId = result.insertId;
    const [rows] = await pool.query(
      'SELECT * FROM prompts WHERE id = ?',
      [insertedId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating prompt:', err.message);
    res.status(500).json({ error: 'Failed to create prompt.' });
  }
});

// DELETE /api/prompts/:id
// Delete a prompt by id.
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid prompt id.' });
  }

  try {
    const [result] = await pool.query(
      'DELETE FROM prompts WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prompt not found.' });
    }

    res.json({ message: 'Prompt deleted successfully.' });
  } catch (err) {
    console.error('Error deleting prompt:', err.message);
    res.status(500).json({ error: 'Failed to delete prompt.' });
  }
});

module.exports = router;

