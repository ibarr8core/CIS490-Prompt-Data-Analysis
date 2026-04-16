// backend/services/aiValidation.js
// Wraps Google Gemini API calls for prompt validation.
// Uses a SINGLE API call per validation to minimize free-tier quota usage.
//   - validatePrompt()  — quality/validity check
//   - checkSimilarity() — duplicate/near-duplicate detection
//   - validateAndCheck() — does BOTH in one API call (preferred, saves quota)

const { GoogleGenerativeAI } = require('@google/generative-ai');

// gemini-2.5-flash-lite: lighter/cheaper variant, available on free tier
const MODEL_NAME = 'gemini-2.5-flash-lite';

// Similarity threshold (0–1). Prompts scoring at or above this are blocked.
const SIMILARITY_THRESHOLD = 0.75;

// Maximum existing prompts included in similarity context (keeps tokens low).
const MAX_EXISTING_FOR_COMPARISON = 15;

/**
 * Returns a configured Gemini GenerativeModel instance.
 * Uses the v1 API endpoint — required for gemini-2.5-flash.
 */
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
  // apiVersion: 'v1' is required — gemini-2.5-flash is not on v1beta
  const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

/**
 * validateAndCheck(title, description, content, existingPrompts)
 *
 * Performs BOTH the validity check AND similarity check in a single API call.
 * This is the preferred function — use this instead of calling validatePrompt
 * and checkSimilarity separately to conserve free-tier quota.
 *
 * @param {string} title
 * @param {string} description
 * @param {string} content
 * @param {Array<{ id: number|string, title: string, content: string }>} existingPrompts
 * @returns {{
 *   valid: boolean,
 *   validReason: string,
 *   tooSimilar: boolean,
 *   similarTo: string|null,
 *   similarityScore: number
 * }}
 */
async function validateAndCheck(title, description, content, existingPrompts) {
  const model = getModel();

  const hasSimilarityContext = existingPrompts && existingPrompts.length > 0;
  const sample = hasSimilarityContext
    ? existingPrompts.slice(0, MAX_EXISTING_FOR_COMPARISON).map((p, i) => {
        const snippet = (p.content || '').slice(0, 150);
        return `[${i + 1}] Title: "${p.title || 'Untitled'}" | Content snippet: "${snippet}"`;
      }).join('\n')
    : '(no existing prompts yet)';

  const prompt = `You are a content moderator for an AI prompt marketplace. Evaluate the following submission in two ways.

SUBMITTED PROMPT:
Title: ${title || '(none)'}
Description: ${description || '(none)'}
Content: "${(content || '').slice(0, 500)}"

TASK 1 — VALIDITY:
Determine if this is a valid, usable AI prompt.
It is INVALID if it is: gibberish, random characters, completely empty/filler, offensive/harmful, or not actually a prompt (e.g. just "hello" or "test 123").
It is VALID if it is a coherent instruction or template someone could use with an AI model.

TASK 2 — SIMILARITY:
Compare it against these existing prompts in the database:
${sample}

Rate the similarity to the MOST similar existing prompt from 0.0 (totally different) to 1.0 (essentially identical or trivially reworded). A score >= 0.75 means "too similar".

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{"valid":true,"validReason":"Brief explanation","similarityScore":0.0,"mostSimilarTitle":null}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip any accidental markdown code fences
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const score = Math.min(1, Math.max(0, Number(parsed.similarityScore) || 0));
    const tooSimilar = hasSimilarityContext && score >= SIMILARITY_THRESHOLD;

    return {
      valid: Boolean(parsed.valid),
      validReason: String(parsed.validReason || ''),
      tooSimilar,
      similarTo: tooSimilar ? (parsed.mostSimilarTitle || null) : null,
      similarityScore: score
    };
  } catch (err) {
    console.error('[aiValidation] validateAndCheck error:', err.message);
    // Fail-open: if AI check errors, allow the prompt through
    return {
      valid: true,
      validReason: 'AI check unavailable — allowed by default.',
      tooSimilar: false,
      similarTo: null,
      similarityScore: 0
    };
  }
}

/**
 * validatePrompt — kept for backwards compatibility / standalone use.
 * Prefer validateAndCheck() to save API quota.
 */
async function validatePrompt(title, description, content) {
  const result = await validateAndCheck(title, description, content, []);
  return { valid: result.valid, reason: result.validReason };
}

/**
 * checkSimilarity — kept for backwards compatibility / standalone use.
 * Prefer validateAndCheck() to save API quota.
 */
async function checkSimilarity(newPrompt, existingPrompts) {
  const result = await validateAndCheck(
    newPrompt.title,
    newPrompt.description,
    newPrompt.content,
    existingPrompts
  );
  return {
    tooSimilar: result.tooSimilar,
    similarTo: result.similarTo,
    score: result.similarityScore
  };
}

module.exports = { validateAndCheck, validatePrompt, checkSimilarity };
