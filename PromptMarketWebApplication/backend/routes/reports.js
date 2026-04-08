const express = require('express');
const pool = require('../db');

const router = express.Router();

// POST /api/reports — submit a report { reporter_id, prompt_id?, reported_user_id?, reason }
router.post('/', async (req, res) => {
  const { reporter_id, prompt_id, reported_user_id, reason } = req.body || {};
  if (!reporter_id || !reason) {
    return res.status(400).json({ error: 'reporter_id and reason are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO reports (reporter_id, prompt_id, reported_user_id, reason) VALUES (?, ?, ?, ?)',
      [reporter_id, prompt_id || null, reported_user_id || null, reason.trim()]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error submitting report:', err.message);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

// GET /api/reports — admin: get all reports with context
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.reason, r.created_at,
              reporter.username AS reporter_username,
              r.prompt_id,
              p.title AS prompt_title,
              r.reported_user_id,
              target.username AS reported_username
       FROM reports r
       JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN prompts p ON p.id = r.prompt_id
       LEFT JOIN users target ON target.id = r.reported_user_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reports:', err.message);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// DELETE /api/reports/:id — dismiss a report
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid report id.' });
  }
  try {
    await pool.query('DELETE FROM reports WHERE id = ?', [id]);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error deleting report:', err.message);
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

module.exports = router;
