// backend/routes/prompts.js
// Prompt CRUD + relational data (author, category, tags).

const express = require('express');
const pool = require('../db');
const multer = require('multer');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function parseTagsValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map(s => s.trim()).filter(Boolean);
  return String(value)
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function upsertPromptTags(connection, promptId, tagNames) {
  await connection.query('DELETE FROM prompt_tags WHERE prompt_id = ?', [promptId]);
  if (!tagNames.length) return;

  for (const name of tagNames) {
    const [tagResult] = await connection.query(
      'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
      [name]
    );
    const tagId = tagResult.insertId;
    await connection.query(
      'INSERT IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)',
      [promptId, tagId]
    );
  }
}

const SELECT_PROMPTS_SQL = `
  SELECT
    p.id,
    p.title,
    p.description,
    p.content,
    p.model,
    p.author_id,
    u.username AS author_username,
    p.category_id,
    c.name AS category_name,
    p.thumbnail_url,
    p.thumbnail_mime_type,
    p.created_at,
    COALESCE(
      JSON_ARRAYAGG(JSON_OBJECT('id', tagged.id, 'name', tagged.name)),
      JSON_ARRAY()
    ) AS tags_json
  FROM prompts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN (
    SELECT DISTINCT pt.prompt_id, t.id, t.name
    FROM prompt_tags pt
    JOIN tags t ON t.id = pt.tag_id
  ) tagged ON tagged.prompt_id = p.id
`;

function normalizePromptRow(row) {
  let tags = [];
  try {
    const parsed = JSON.parse(row.tags_json || '[]');
    tags = parsed.filter(Boolean);
  } catch (_) {
    tags = [];
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    model: row.model,
    author_id: row.author_id,
    author_username: row.author_username,
    category_id: row.category_id,
    category_name: row.category_name,
    thumbnail_url: row.thumbnail_url,
    thumbnail_mime_type: row.thumbnail_mime_type,
    created_at: row.created_at,
    tags
  };
}

router.get('/', async (req, res) => {
  try {
    console.log("Step 1: /api/prompts route hit");
    console.log("Step 2: querying prompts table");
    const [rows] = await pool.query("SELECT * FROM prompts");
    res.json(rows);
  } catch (err) {
    console.error("PROMPTS ERROR FULL:", err);
    res.status(500).json({
      error: "Failed to fetch prompts.",
      details: err.message,
      code: err.code || null
    });
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
      `${SELECT_PROMPTS_SQL}
      WHERE p.id = ?
      GROUP BY
        p.id,
        p.title,
        p.description,
        p.content,
        p.model,
        p.author_id,
        u.username,
        p.category_id,
        c.name,
        p.thumbnail_url,
        p.thumbnail_mime_type,
        p.created_at`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found.' });
    }

    res.json(normalizePromptRow(rows[0]));
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
  const { title, description, content, model, author_id, category_id, tags } = req.body || {};

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
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
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
      const tagNames = parseTagsValue(tags);
      await upsertPromptTags(connection, insertedId, tagNames);

      const [rows] = await connection.query(
        `${SELECT_PROMPTS_SQL}
        WHERE p.id = ?
        GROUP BY p.id, u.username, c.name`,
        [insertedId]
      );

      await connection.commit();
      res.status(201).json(normalizePromptRow(rows[0]));
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error creating prompt:', err.message);
    res.status(500).json({ error: 'Failed to create prompt.' });
  }
});

// PUT /api/prompts/:id
router.put('/:id', upload.single('thumbnail'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid prompt id.' });
  }

  const { title, description, content, model, category_id, tags } = req.body || {};
  const categoryIdInt = category_id ? parseInt(category_id, 10) : null;

  if (category_id && Number.isNaN(categoryIdInt)) {
    return res.status(400).json({ error: 'category_id must be a number when provided.' });
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existingRows] = await connection.query(
        'SELECT id, category_id FROM prompts WHERE id = ?',
        [id]
      );
      if (existingRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Prompt not found.' });
      }

      await connection.query(
        `UPDATE prompts
         SET
           title = COALESCE(?, title),
           description = COALESCE(?, description),
           content = COALESCE(?, content),
           model = COALESCE(?, model),
           category_id = ?
         WHERE id = ?`,
        [
          title || null,
          description || null,
          content || null,
          model || null,
          category_id === undefined ? existingRows[0].category_id : categoryIdInt,
          id
        ]
      );

      if (req.file) {
        if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
          await connection.rollback();
          return res.status(400).json({ error: 'Uploaded thumbnail must be an image file.' });
        }
        await connection.query(
          'UPDATE prompts SET thumbnail_data = ?, thumbnail_mime_type = ? WHERE id = ?',
          [req.file.buffer, req.file.mimetype, id]
        );
      }

      if (tags !== undefined) {
        await upsertPromptTags(connection, id, parseTagsValue(tags));
      }

      const [rows] = await connection.query(
        `${SELECT_PROMPTS_SQL}
        WHERE p.id = ?
        GROUP BY p.id, u.username, c.name`,
        [id]
      );

      await connection.commit();
      res.json(normalizePromptRow(rows[0]));
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error updating prompt:', err.message);
    res.status(500).json({ error: 'Failed to update prompt.' });
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

