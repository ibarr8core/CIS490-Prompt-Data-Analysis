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

function handleUpload(req, res, next) {
  upload.single('thumbnail')(req, res, function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Thumbnail must be under 5 MB.' });
      }
      return res.status(400).json({ error: 'File upload failed.' });
    }
    next();
  });
}

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
    u.avatar_style AS author_avatar_style,
    u.avatar_seed AS author_avatar_seed,
    p.category_id,
    c.name AS category_name,
    p.thumbnail_url,
    p.thumbnail_mime_type,
    p.created_at,
    COUNT(DISTINCT IF(v.value = 1, v.user_id, NULL)) AS upvotes,
    COUNT(DISTINCT IF(v.value = -1, v.user_id, NULL)) AS downvotes,
    COUNT(DISTINCT cmt.id) AS comment_count,
    COUNT(DISTINCT s.user_id) AS save_count,
    COALESCE(
      JSON_ARRAYAGG(JSON_OBJECT('id', tagged.id, 'name', tagged.name)),
      JSON_ARRAY()
    ) AS tags_json
  FROM prompts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN votes v ON v.prompt_id = p.id
  LEFT JOIN comments cmt ON cmt.prompt_id = p.id
  LEFT JOIN saves s ON s.prompt_id = p.id
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
    author_avatar_style: row.author_avatar_style || 'adventurer',
    author_avatar_seed: row.author_avatar_seed || null,
    category_id: row.category_id,
    category_name: row.category_name,
    thumbnail_url: row.thumbnail_url,
    thumbnail_mime_type: row.thumbnail_mime_type,
    created_at: row.created_at,
    upvotes: Number(row.upvotes) || 0,
    downvotes: Number(row.downvotes) || 0,
    comment_count: Number(row.comment_count) || 0,
    save_count: Number(row.save_count) || 0,
    tags
  };
}

router.get('/', async (req, res) => {
  const { categoryId, authorId, q, tag } = req.query;
  const where = [];
  const params = [];

  if (categoryId) {
    if (Number.isNaN(parseInt(categoryId, 10))) {
      return res.status(400).json({ error: 'categoryId must be a number.' });
    }
    where.push('p.category_id = ?');
    params.push(parseInt(categoryId, 10));
  }
  if (authorId) {
    if (Number.isNaN(parseInt(authorId, 10))) {
      return res.status(400).json({ error: 'authorId must be a number.' });
    }
    where.push('p.author_id = ?');
    params.push(parseInt(authorId, 10));
  }
  if (q) {
    where.push('(p.title LIKE ? OR p.description LIKE ? OR p.content LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (tag) {
    where.push(
      'EXISTS (SELECT 1 FROM prompt_tags pt2 JOIN tags t2 ON t2.id = pt2.tag_id WHERE pt2.prompt_id = p.id AND t2.name = ?)'
    );
    params.push(tag);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const [rows] = await pool.query(
      `${SELECT_PROMPTS_SQL}
      ${whereSql}
      GROUP BY
        p.id,
        p.title,
        p.description,
        p.content,
        p.model,
        p.author_id,
        u.username,
        u.avatar_style,
        u.avatar_seed,
        p.category_id,
        c.name,
        p.thumbnail_url,
        p.thumbnail_mime_type,
        p.created_at
      ORDER BY p.created_at DESC`,
      params
    );
    res.json(rows.map(normalizePromptRow));
  } catch (err) {
    console.error('Error fetching prompts:', err);
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
router.post('/', handleUpload, async (req, res) => {
  // For multipart/form-data, the text fields are in req.body and the file is in req.file.
  const { title, description, content, model, author_id, category_id, tags } = req.body || {};

  if (!title || !description || !content || !author_id || !category_id || !model) {
    return res.status(400).json({
      error: 'title, description, content, model, author_id, and category_id are required.'
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
router.put('/:id', handleUpload, async (req, res) => {
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

