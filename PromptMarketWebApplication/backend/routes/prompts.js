// backend/routes/prompts.js
// Basic CRUD routes for prompts.
// All routes use async/await and return JSON responses.

const express = require('express');
const pool = require('../db');
const multer = require('multer');

const router = express.Router();

// Use memory storage so we can directly store the uploaded thumbnail buffer in MySQL.
// This is simple for a local class demo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/prompts
// Return all prompts.
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        title,
        description,
        model,
        author_id,
        category_id,
        thumbnail_url,
        thumbnail_mime_type,
        created_at
      FROM prompts
      ORDER BY created_at DESC`
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
      `SELECT
        id,
        title,
        description,
        content,
        model,
        author_id,
        category_id,
        thumbnail_url,
        thumbnail_mime_type,
        created_at
      FROM prompts
      WHERE id = ?`,
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

// GET /api/prompts/:id/thumbnail
// Return the thumbnail binary data (stored in thumbnail_data).
router.get('/:id/thumbnail', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid prompt id.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT thumbnail_data, thumbnail_mime_type FROM prompts WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found.' });
    }

    const row = rows[0];
    if (!row.thumbnail_data) {
      return res.status(404).json({ error: 'No thumbnail exists for this prompt.' });
    }

    const mimeType = row.thumbnail_mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.send(row.thumbnail_data);
  } catch (err) {
    console.error('Error fetching thumbnail:', err.message);
    res.status(500).json({ error: 'Failed to fetch thumbnail.' });
  }
});

// POST /api/prompts
// Create a new prompt.
router.post('/', upload.single('thumbnail'), async (req, res) => {
  // For multipart/form-data, the text fields are in req.body and the file is in req.file.
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

  const authorIdInt = parseInt(author_id, 10);
  if (Number.isNaN(authorIdInt)) {
    return res.status(400).json({ error: 'author_id must be a number.' });
  }

  const categoryIdInt = category_id ? parseInt(category_id, 10) : null;
  if (category_id && Number.isNaN(categoryIdInt)) {
    return res.status(400).json({ error: 'category_id must be a number when provided.' });
  }

  const safeModel = model || 'ChatGPT';

  // Optional thumbnail file
  let thumbnailData = null;
  let thumbnailMimeType = null;
  if (req.file) {
    if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Uploaded thumbnail must be an image file.' });
    }
    thumbnailData = req.file.buffer;
    thumbnailMimeType = req.file.mimetype;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO prompts
        (title, description, content, model, author_id, category_id, thumbnail_data, thumbnail_mime_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        content,
        safeModel,
        authorIdInt,
        categoryIdInt,
        thumbnailData,
        thumbnailMimeType
      ]
    );

    const insertedId = result.insertId;
    const [rows] = await pool.query(
      `SELECT
        id,
        title,
        description,
        content,
        model,
        author_id,
        category_id,
        thumbnail_mime_type,
        created_at
      FROM prompts
      WHERE id = ?`,
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

