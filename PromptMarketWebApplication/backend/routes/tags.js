const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name FROM tags ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching tags:', err.message);
    res.status(500).json({ error: 'Failed to fetch tags.' });
  }
});

router.post('/', async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'name is required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO tags (name) VALUES (?)',
      [name.trim()]
    );
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Tag already exists.' });
    }
    console.error('Error creating tag:', err.message);
    res.status(500).json({ error: 'Failed to create tag.' });
  }
});

router.get('/prompt/:promptId', async (req, res) => {
  const promptId = parseInt(req.params.promptId, 10);
  if (Number.isNaN(promptId)) {
    return res.status(400).json({ error: 'Invalid prompt id.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.name
       FROM prompt_tags pt
       JOIN tags t ON t.id = pt.tag_id
       WHERE pt.prompt_id = ?
       ORDER BY t.name ASC`,
      [promptId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching prompt tags:', err.message);
    res.status(500).json({ error: 'Failed to fetch prompt tags.' });
  }
});

module.exports = router;
