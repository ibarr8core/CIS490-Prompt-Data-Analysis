// backend/server.js
// Main Express server for the Prompt Marketplace project.
// - Serves the existing frontend as static files (except GET /)
// - Exposes /api/* endpoints
// - Database initialization runs after listen (non-blocking); failures are logged only

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./initDatabase');
const promptsRouter = require('./routes/prompts');
const usersRouter = require('./routes/users');
const categoriesRouter = require('./routes/categories');
const tagsRouter = require('./routes/tags');

const app = express();
const port = process.env.PORT || 3000;

console.log('[startup] PromptMarket server loading...');
console.log('[startup] NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('[startup] PORT from env:', process.env.PORT !== undefined ? process.env.PORT : '(unset, using default)');
console.log('[startup] Listening on port:', port);

app.use(express.json());
app.use(cors());

app.use('/api/prompts', promptsRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);

app.get('/', (req, res) => {
  res.send('PromptMarket API is running');
});

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);

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
