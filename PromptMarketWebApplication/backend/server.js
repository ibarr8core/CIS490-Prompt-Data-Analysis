// backend/server.js
// Main Express server for the Prompt Marketplace project.
// - Serves the existing frontend as static files (except GET /)
// - Exposes /api/* endpoints
// - Database initialization is optional and never blocks HTTP bind

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./initDatabase');
const promptsRouter = require('./routes/prompts');
const usersRouter = require('./routes/users');
const categoriesRouter = require('./routes/categories');
const tagsRouter = require('./routes/tags');
const votesRouter = require('./routes/votes');
const savesRouter = require('./routes/saves');
const commentsRouter = require('./routes/comments');
const followsRouter = require('./routes/follows');
const reportsRouter = require('./routes/reports');

const app = express();
const port = process.env.PORT || 3000;

console.log('[startup] PromptMarket server loading...');
console.log('[startup] NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('[startup] Effective PORT:', port);

app.use(express.json());
app.use(cors());

app.use('/api/prompts', promptsRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/votes', votesRouter);
app.use('/api/saves', savesRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/follows', followsRouter);
app.use('/api/reports', reportsRouter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

console.log('[startup] Calling app.listen...');
app.listen(port, () => console.log(`Server running on port ${port}`));
console.log('[startup] app.listen registered (binding in progress)');

setImmediate(() => {
  initializeDatabase()
    .then(() => {
      console.log('[DB] Database initialization complete.');
    })
    .catch((err) => {
      console.error('[DB] Database initialization failed:', err && err.message ? err.message : err);
      if (err && err.stack) {
        console.error('[DB]', err.stack);
      }
    });
});
