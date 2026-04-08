// backend/seedPrompts.js
// Populates the database with well-crafted example prompts, tags, and categories.
// Safe to run multiple times — skips any prompt whose title already exists.
//
// Usage:
//   node backend/seedPrompts.js
//
// Requires the same env vars as the server: DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT

const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

function buildConnectionConfig() {
  const base = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false
  };
  if (process.env.INSTANCE_UNIX_SOCKET) {
    return { ...base, socketPath: process.env.INSTANCE_UNIX_SOCKET };
  }
  return {
    ...base,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 9470)
  };
}

// ---------------------------------------------------------------------------
// Image fetching (follows redirects, returns a Buffer)
// ---------------------------------------------------------------------------

function fetchImage(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft === 0) return reject(new Error('Too many redirects: ' + url));
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchImage(res.headers.location, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Picsum Photos: deterministic image for a given seed word (800×450 JPEG)
function picsumUrl(seed) {
  return `https://picsum.photos/seed/${seed}/800/450`;
}

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'Coding & Development',
  'Study & Exam Prep',
  'Academic Writing',
  'Research & Analysis',
  'Design & Media',
  'Career & Professional',
  'Productivity & Organization',
  'AI Automation'
];

const TAGS = [
  'ChatGPT', 'Claude', 'Gemini', 'Midjourney', 'DALL-E',
  'Coding', 'Debugging', 'SQL', 'Python',
  'Writing', 'Essay', 'Resume', 'Cover Letter',
  'Study', 'Flashcards', 'Exam Prep',
  'Research', 'Summarization', 'Analysis',
  'Image Generation', 'Art', 'Design',
  'Productivity', 'Automation', 'Career',
  'AI', 'Prompt Engineering'
];

// Each prompt: { title, description, content, model, category, tags[], imageUrl }
const PROMPTS = [
  // ── Coding & Development ─────────────────────────────────────────────────
  {
    title: 'Code Review Assistant',
    description: 'Get a thorough, actionable code review covering bugs, style, security, and performance.',
    content: `You are a senior software engineer conducting a professional code review. When I paste code, analyze it and provide feedback in the following structure:

**Summary**
A 2–3 sentence overview of what the code does and its overall quality.

**Bugs & Logic Errors**
List any bugs, off-by-one errors, null pointer risks, or incorrect logic. For each, explain the problem and suggest a fix.

**Security Issues**
Flag any security vulnerabilities (e.g., SQL injection, XSS, hardcoded secrets, unvalidated input). Severity: Critical / High / Medium / Low.

**Performance**
Note any inefficiencies — unnecessary loops, missing indexes, expensive operations that could be cached.

**Code Style & Readability**
Comment on naming conventions, function length, comments, and adherence to best practices for the language.

**Suggested Improvements**
Provide a refactored snippet or pseudocode for the most impactful change.

Be specific and concise. Avoid generic advice. Focus on this code only.`,
    model: 'Claude',
    category: 'Coding & Development',
    tags: ['Claude', 'Coding', 'Debugging', 'AI'],
    imageUrl: picsumUrl('codereview42')
  },
  {
    title: 'SQL Query Builder',
    description: 'Describe what data you need in plain English and get a clean, optimized SQL query back.',
    content: `You are an expert database engineer. I will describe a query I need in plain English, and you will:

1. Write the SQL query (use standard ANSI SQL unless I specify a dialect like MySQL, PostgreSQL, or SQLite).
2. Explain each clause briefly so I understand what it does.
3. If my request is ambiguous, make a reasonable assumption and state it.
4. If the query could be optimized (e.g., with an index hint or a CTE instead of a subquery), mention it.

Format your response as:
\`\`\`sql
-- your query here
\`\`\`
**Explanation:** ...
**Assumptions:** ...
**Optimization tip (if any):** ...

My request: [describe what data you need]`,
    model: 'ChatGPT',
    category: 'Coding & Development',
    tags: ['ChatGPT', 'SQL', 'Coding'],
    imageUrl: picsumUrl('database77')
  },
  {
    title: 'Bug Explainer & Fixer',
    description: 'Paste an error message or broken code snippet and get a plain-English explanation plus a fixed version.',
    content: `I have a bug in my code. Here is the error message and/or the relevant code snippet:

\`\`\`
[paste your error message here]
\`\`\`

\`\`\`
[paste your code here]
\`\`\`

Please:
1. **Explain the bug** — What is causing this error? Use plain language, not just docs jargon.
2. **Show the fix** — Provide the corrected code with inline comments marking what changed and why.
3. **Prevent it in the future** — Give one tip or pattern that would have caught this earlier (e.g., input validation, a specific lint rule, a unit test).

If you need more context (language version, framework, surrounding code), ask before guessing.`,
    model: 'ChatGPT',
    category: 'Coding & Development',
    tags: ['ChatGPT', 'Debugging', 'Coding', 'AI'],
    imageUrl: picsumUrl('bugfix19')
  },

  // ── Study & Exam Prep ─────────────────────────────────────────────────────
  {
    title: 'Flashcard Generator',
    description: 'Turn any block of notes or a chapter summary into a ready-to-study set of Q&A flashcards.',
    content: `You are a study assistant. I will paste notes, a textbook excerpt, or a list of topics. Your job is to turn this material into a set of flashcards that follow good learning science principles:

- Each card tests **one concept only** (no compound questions).
- Questions use **active recall** phrasing (e.g., "What is…?", "How does…work?", "Give an example of…").
- Answers are **concise** (1–3 sentences max) but complete enough to stand alone.
- For definitions, use the format: **Term** → definition.
- For processes, use numbered steps.

Output format (repeat for each card):
**Q:** [question]
**A:** [answer]

After the cards, add a **"Key Themes"** section listing the 3–5 most important concepts from the material.

My notes/excerpt:
[paste your content here]`,
    model: 'ChatGPT',
    category: 'Study & Exam Prep',
    tags: ['ChatGPT', 'Study', 'Flashcards', 'AI'],
    imageUrl: picsumUrl('flashcards55')
  },
  {
    title: 'Practice Exam Builder',
    description: 'Generate a realistic practice exam with multiple choice, short answer, and essay questions on any topic.',
    content: `You are a university professor creating a practice exam. Based on the topic or material I provide, generate a realistic exam with the following structure:

**Part 1 — Multiple Choice (5 questions)**
Each question should have 4 options (A–D). One clearly correct answer. Distractors should be plausible, not obviously wrong. Include an answer key at the end.

**Part 2 — Short Answer (3 questions)**
Each question requires a 2–4 sentence response. Target conceptual understanding, not rote memorization.

**Part 3 — Essay / Long Answer (1 question)**
An open-ended question that requires synthesis and argumentation. Include a brief rubric (what a full-credit answer would cover).

Difficulty level: [easy / medium / hard — choose one or I'll default to medium]
Topic/material: [paste topic, chapter summary, or list of concepts here]

Make the questions exam-realistic. Avoid trick questions.`,
    model: 'Claude',
    category: 'Study & Exam Prep',
    tags: ['Claude', 'Study', 'Exam Prep', 'AI'],
    imageUrl: picsumUrl('examprep88')
  },

  // ── Academic Writing ──────────────────────────────────────────────────────
  {
    title: 'Essay Outline Builder',
    description: 'Turn a thesis statement or essay prompt into a detailed, structured outline ready to write from.',
    content: `You are an academic writing coach. I will give you an essay prompt or thesis statement, and you will produce a detailed outline I can write from.

The outline must include:
- **Hook** — one sentence that could open the essay compellingly
- **Background / Context** — 2–3 sentences of setup
- **Thesis Statement** — refined version of mine (or a strong one if I only gave a topic)
- **Body Paragraphs** — for each paragraph:
  - Topic sentence
  - 2–3 supporting points or evidence types (with a note on what kind of source to look for)
  - Transition idea to the next paragraph
- **Counterargument Paragraph** — the strongest objection to my thesis and how to rebut it
- **Conclusion** — restatement strategy + final thought / call to action

Format as a numbered/bulleted outline. Keep it scannable — I'll flesh it out myself.

Essay prompt or thesis: [write it here]
Approximate length target: [e.g., 5-paragraph essay, 1500 words, research paper]`,
    model: 'ChatGPT',
    category: 'Academic Writing',
    tags: ['ChatGPT', 'Writing', 'Essay', 'AI'],
    imageUrl: picsumUrl('essay33')
  },
  {
    title: 'Academic Paragraph Rewriter',
    description: 'Paste a rough paragraph and get a polished, academic-tone rewrite that preserves your argument.',
    content: `You are an academic editor. I will paste a rough paragraph I've written. Your job is to rewrite it with:

1. **Clarity** — eliminate wordiness, vague language, and redundancy
2. **Academic tone** — formal but not stiff; appropriate for a university paper
3. **Logical flow** — one clear idea per sentence, strong transitions
4. **Preserved argument** — do NOT change my meaning, add new claims, or remove key points
5. **Active voice** where possible, unless passive is more appropriate

After the rewrite, provide a **"What changed"** bullet list (3–5 points) explaining the most significant edits so I can learn from them.

If my paragraph has structural issues beyond word choice (e.g., it tries to cover two separate ideas), flag that instead of just rewriting.

My paragraph:
[paste here]`,
    model: 'Claude',
    category: 'Academic Writing',
    tags: ['Claude', 'Writing', 'Essay', 'AI'],
    imageUrl: picsumUrl('writing14')
  },

  // ── Research & Analysis ───────────────────────────────────────────────────
  {
    title: 'Research Paper Summarizer',
    description: 'Paste an abstract or full paper text and get a structured summary with key findings and limitations.',
    content: `You are a research analyst. I will paste the text of an academic paper (or just the abstract + introduction). Summarize it using this structure:

**Citation Info** (if visible in the text)
Author(s), year, journal/conference

**Research Question**
What problem or gap does this paper address? (1–2 sentences)

**Methodology**
How did they conduct the study? (data sources, approach, sample size if applicable)

**Key Findings**
Bullet list of the 3–5 most important results or contributions. Use plain language — avoid jargon where possible.

**Limitations**
What did the authors acknowledge as limitations? What do you notice that they may not have addressed?

**Relevance / Takeaway**
In 2–3 sentences: why does this paper matter, and what should a reader do with this information?

Paper text:
[paste here]`,
    model: 'Claude',
    category: 'Research & Analysis',
    tags: ['Claude', 'Research', 'Summarization', 'AI'],
    imageUrl: picsumUrl('research61')
  },
  {
    title: 'Compare & Contrast Analyzer',
    description: 'Structured side-by-side analysis of any two concepts, tools, arguments, or historical events.',
    content: `You are an analytical writer. I will give you two things to compare. Produce a structured comparison using this format:

**Overview**
One paragraph introducing both subjects and why comparing them is useful.

**Comparison Table**
| Dimension | [Subject A] | [Subject B] |
|-----------|-------------|-------------|
(Choose 5–8 relevant dimensions based on the subjects. Examples: cost, scalability, use case, historical context, ease of use, limitations, etc.)

**Key Similarities**
Bullet list of 3–5 meaningful similarities (not trivial ones).

**Key Differences**
Bullet list of 3–5 meaningful differences, noting which is "better" for which use case where applicable.

**When to Choose Each**
2–3 sentences per subject: in what situation would someone prefer this one?

**Verdict / Synthesis**
A balanced 2–3 sentence conclusion. Avoid being wishy-washy — take a defensible position if the evidence supports one.

Compare: [Subject A] vs [Subject B]
Context (optional): [e.g., for a computer science paper, for a business decision, etc.]`,
    model: 'ChatGPT',
    category: 'Research & Analysis',
    tags: ['ChatGPT', 'Research', 'Analysis', 'AI'],
    imageUrl: picsumUrl('analysis92')
  },

  // ── Design & Media (Image Generation) ────────────────────────────────────
  {
    title: 'Cinematic Character Portrait — Midjourney',
    description: 'A Midjourney prompt formula for generating stunning, cinematic character portraits with consistent style.',
    content: `Use this prompt template in Midjourney to generate a high-quality cinematic character portrait. Replace the [bracketed] sections with your character details.

---
**Midjourney Prompt:**

A cinematic portrait of [character description — age, gender, ethnicity, expression], wearing [clothing/armor/outfit details], set in [environment or background — e.g., a rain-soaked cyberpunk alley, a sunlit medieval throne room]. [Lighting description — e.g., dramatic side lighting, golden hour backlighting, neon glow]. The mood is [moody/heroic/melancholic/mysterious]. Shot in the style of a [film genre] movie still. Ultra-detailed, sharp focus, shallow depth of field, 8K, photorealistic, award-winning photography. --ar 2:3 --style raw --v 6.1

---
**Tips for best results:**
- Be specific about lighting — it's the single biggest quality factor
- Add a reference filmmaker or photographer for stronger style ("in the style of Roger Deakins' cinematography")
- Use --no [things you don't want] to remove unwanted elements
- --style raw gives you more photorealistic output vs. the default stylized look
- Start with --v 6.1 for portraits; try --niji 6 for anime/illustrated styles`,
    model: 'Midjourney',
    category: 'Design & Media',
    tags: ['Midjourney', 'Image Generation', 'Art', 'Design'],
    imageUrl: picsumUrl('portrait7')
  },
  {
    title: 'DALL-E Photorealistic Scene Generator',
    description: 'A prompt formula for generating photorealistic scenes in DALL-E 3 with consistent, high-quality results.',
    content: `Use this template with DALL-E 3 (via ChatGPT or the OpenAI API) to generate photorealistic scenes.

---
**DALL-E 3 Prompt Template:**

A photorealistic [wide/medium/close-up] shot of [scene description — what's happening, where, with what subjects]. The setting is [location details — time of day, weather, era]. Lighting: [natural sunlight / golden hour / overcast / dramatic studio lighting / candlelight]. The color palette is [warm tones / cool blues / high contrast / muted and desaturated]. Shot on a [camera type — e.g., Sony A7R V, Canon 5D Mark IV] with a [focal length — e.g., 35mm, 85mm] lens. [Any style notes — e.g., National Geographic style, architectural photography, food photography].

---
**Power tips:**
- DALL-E 3 follows instructions very literally — be precise about composition
- Say "photorealistic photography" explicitly; otherwise it may render as illustration
- Mention the camera and lens for a more authentic photo look
- For consistent characters across multiple images, describe them the same way every time
- Use "overhead shot" / "eye-level" / "low angle" to control perspective`,
    model: 'DALL-E',
    category: 'Design & Media',
    tags: ['DALL-E', 'Image Generation', 'Design', 'AI'],
    imageUrl: picsumUrl('landscape28')
  },

  // ── Career & Professional ─────────────────────────────────────────────────
  {
    title: 'Resume Bullet Point Enhancer',
    description: 'Transform weak, vague resume bullets into strong, quantified achievement statements.',
    content: `You are a professional resume writer and career coach. I will paste my existing resume bullet points. For each one, rewrite it to follow the **STAR-Q formula**:
- **Situation/Task** — implied context (no fluff)
- **Action** — what YOU specifically did (strong verb, first word)
- **Result** — outcome
- **Quantified** — numbers, percentages, timeframes, scale whenever possible

Rules:
- Start every bullet with a powerful past-tense action verb (Led, Built, Reduced, Increased, Designed, Automated…)
- Remove filler phrases ("Responsible for…", "Helped with…", "Worked on…")
- If I don't provide numbers, suggest a placeholder like "[X%]" and note what I should look up
- Keep bullets under 2 lines (≈ 150 characters)
- Don't invent facts — only restructure and tighten what I give you

After rewriting, give me a **"Before/After Score"** for each bullet (1–10) for impact and clarity.

My bullet points:
[paste here, one per line]`,
    model: 'ChatGPT',
    category: 'Career & Professional',
    tags: ['ChatGPT', 'Resume', 'Career', 'Writing'],
    imageUrl: picsumUrl('office45')
  },
  {
    title: 'Cover Letter Writer',
    description: 'Generate a personalized, compelling cover letter from your resume and the job description.',
    content: `You are a professional cover letter writer. Using the resume summary and job description I provide, write a tailored cover letter that:

1. **Opens with a hook** — not "I am writing to apply for…" — something specific that shows genuine interest
2. **Connects my experience to their needs** — directly maps 2–3 of my achievements to requirements in the job description
3. **Shows cultural fit** — references something specific about the company (I'll provide it) that resonates with me
4. **Closes with confidence** — a clear ask (interview), not desperation
5. **Tone** — professional but human; avoid corporate buzzwords like "synergy" or "passionate"
6. **Length** — 3 paragraphs, no longer than 350 words

Format: Ready to paste into an email or document (no placeholders left unfilled).

---
**My resume summary / relevant experience:**
[paste 3–5 bullet points or a short paragraph]

**Job title and company:**
[e.g., Software Engineer at Stripe]

**Key requirements from the job description:**
[paste 3–5 bullet points]

**One thing I know/like about this company:**
[e.g., "They recently open-sourced their payment SDK and I've used it in a project"]`,
    model: 'Claude',
    category: 'Career & Professional',
    tags: ['Claude', 'Cover Letter', 'Career', 'Writing'],
    imageUrl: picsumUrl('professional66')
  },

  // ── Productivity & Organization ───────────────────────────────────────────
  {
    title: 'Meeting Agenda & Action Item Organizer',
    description: 'Turn a messy list of topics into a tight meeting agenda, then extract clean action items from notes.',
    content: `You are a productivity consultant. I'll use you in two modes — pick the one that matches what I paste:

---
**Mode 1 — Build an Agenda**
I'll paste a list of topics I want to cover. Turn them into a structured meeting agenda:
- Suggested time allocation per item (based on importance/complexity)
- Clear goal for each item (decision needed? update only? brainstorm?)
- Any items that could be async (email/doc) instead of taking meeting time
- Suggested meeting length

---
**Mode 2 — Extract Action Items from Notes**
I'll paste raw meeting notes. Extract:
- A bulleted list of **action items** in the format: [Owner] will [task] by [deadline if mentioned]
- **Decisions made** (clearly marked)
- **Open questions** that still need resolution
- A 2–3 sentence **meeting summary** suitable for sharing with someone who wasn't there

---
Paste either your topic list (Mode 1) or your raw meeting notes (Mode 2) below:
[paste here]`,
    model: 'ChatGPT',
    category: 'Productivity & Organization',
    tags: ['ChatGPT', 'Productivity', 'AI'],
    imageUrl: picsumUrl('meeting53')
  },

  // ── AI Automation ─────────────────────────────────────────────────────────
  {
    title: 'Python Script Automator',
    description: 'Describe a repetitive task in plain English and get a complete, runnable Python automation script.',
    content: `You are a Python automation engineer. I will describe a repetitive task I do manually. Write a complete, runnable Python script that automates it.

Requirements for your script:
1. **Runnable** — include all necessary imports; note any \`pip install\` dependencies at the top as a comment
2. **Readable** — use clear variable names; add a comment for any non-obvious line
3. **Robust** — handle the most likely errors (file not found, bad input, network timeout) with helpful error messages — not just bare \`except: pass\`
4. **Configurable** — put any values I'd want to change (file paths, API keys, thresholds) at the top of the file as clearly named constants
5. **No over-engineering** — this is a script, not a package. No classes unless they genuinely help.

After the code, provide:
- **How to run it** (one-line command)
- **What to change** for my specific use case
- **One extension idea** if I want to go further

My task to automate:
[describe it here — e.g., "rename all files in a folder by adding today's date as a prefix", "read a CSV and send a summary email for each row"]`,
    model: 'ChatGPT',
    category: 'AI Automation',
    tags: ['ChatGPT', 'Python', 'Automation', 'Coding'],
    imageUrl: picsumUrl('automation37')
  }
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function upsertTag(conn, name) {
  const [result] = await conn.query(
    'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
    [name]
  );
  return result.insertId;
}

async function getCategoryId(conn, name) {
  const [rows] = await conn.query('SELECT id FROM categories WHERE name = ?', [name]);
  return rows.length ? rows[0].id : null;
}

async function getAdminUserId(conn) {
  const [rows] = await conn.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!rows.length) throw new Error('No admin user found. Run initDatabase.js first.');
  return rows[0].id;
}

async function promptExists(conn, title) {
  const [rows] = await conn.query('SELECT id FROM prompts WHERE title = ?', [title]);
  return rows.length > 0;
}

async function seedCategories(conn) {
  console.log('  Seeding categories...');
  for (const name of CATEGORIES) {
    await conn.query('INSERT IGNORE INTO categories (name) VALUES (?)', [name]);
  }
}

async function seedTags(conn) {
  console.log('  Seeding tags...');
  for (const name of TAGS) {
    await conn.query('INSERT IGNORE INTO tags (name) VALUES (?)', [name]);
  }
}

async function seedPrompt(conn, prompt, authorId) {
  if (await promptExists(conn, prompt.title)) {
    console.log(`  [skip] "${prompt.title}" already exists`);
    return;
  }

  process.stdout.write(`  [fetch] Downloading image for "${prompt.title}"... `);
  let imageData = null;
  let imageMime = null;
  try {
    imageData = await fetchImage(prompt.imageUrl);
    imageMime = 'image/jpeg';
    console.log(`${imageData.length} bytes`);
  } catch (err) {
    console.log(`failed (${err.message}) — inserting without image`);
  }

  const categoryId = await getCategoryId(conn, prompt.category);

  const [result] = await conn.query(
    `INSERT INTO prompts
       (title, description, content, model, author_id, category_id, thumbnail_data, thumbnail_mime_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      prompt.title,
      prompt.description,
      prompt.content,
      prompt.model,
      authorId,
      categoryId,
      imageData,
      imageMime
    ]
  );

  const promptId = result.insertId;

  for (const tagName of prompt.tags) {
    const tagId = await upsertTag(conn, tagName);
    await conn.query(
      'INSERT IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)',
      [promptId, tagId]
    );
  }

  console.log(`  [done]  "${prompt.title}" inserted (id=${promptId})`);
}

async function run() {
  if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('Error: DB_USER, DB_PASSWORD, and DB_NAME must be set.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const conn = await mysql.createConnection(buildConnectionConfig());

  try {
    console.log('Connected.\n');

    await seedCategories(conn);
    await seedTags(conn);

    console.log('\nSeeding prompts...');
    const adminId = await getAdminUserId(conn);

    for (const prompt of PROMPTS) {
      await seedPrompt(conn, prompt, adminId);
    }

    console.log(`\nDone. ${PROMPTS.length} prompts processed.`);
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
