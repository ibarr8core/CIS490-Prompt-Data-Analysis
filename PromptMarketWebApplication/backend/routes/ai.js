// backend/routes/ai.js
// POST /api/ai/validate
// Validates a prompt submission using the Google Gemini API (single API call).
// Performs validity + similarity in one request to minimize free-tier quota usage.

const express = require('express');
const pool = require('../db');
const { validateAndCheck } = require('../services/aiValidation');

const router = express.Router();

// POST /api/ai/validate
router.post('/validate', async (req, res) => {
  const { title, description, content } = req.body || {};

  if (!content || !String(content).trim()) {
    return res.status(400).json({
      error: 'content is required for AI validation.'
    });
  }

  try {
    // Fetch existing prompts for similarity comparison (lightweight query)
    let existingPrompts = [];
    try {
      const [rows] = await pool.query(
        'SELECT id, title, LEFT(content, 150) AS content FROM prompts ORDER BY created_at DESC LIMIT 30'
      );
      existingPrompts = rows || [];
    } catch (dbErr) {
      console.error('[ai/validate] DB fetch error (skipping similarity):', dbErr.message);
    }

    // Single Gemini API call — does validity + similarity together
    const result = await validateAndCheck(
      String(title || ''),
      String(description || ''),
      String(content),
      existingPrompts
    );

    if (!result.valid) {
      return res.json({
        allowed: false,
        reason: 'invalid',
        message: result.validReason || 'This does not appear to be a valid prompt.',
        similarTo: null,
        similarityScore: 0
      });
    }

    if (result.tooSimilar) {
      return res.json({
        allowed: false,
        reason: 'too_similar',
        message: result.similarTo
          ? `Your prompt is too similar to an existing one: "${result.similarTo}". Please make it more distinct.`
          : 'Your prompt is too similar to an existing prompt. Please make it more distinct.',
        similarTo: result.similarTo,
        similarityScore: result.similarityScore
      });
    }

    return res.json({
      allowed: true,
      reason: 'ok',
      message: 'Prompt looks good!',
      similarTo: null,
      similarityScore: result.similarityScore
    });

  } catch (err) {
    console.error('[ai/validate] Unexpected error:', err.message);
    console.error('[ai/validate] Stack:', err.stack || '(no stack)');
    return res.json({
      allowed: true,
      reason: 'error',
      message: 'AI check could not be completed. Proceeding without validation.',
      similarTo: null,
      similarityScore: 0
    });
  }
});

module.exports = router;
