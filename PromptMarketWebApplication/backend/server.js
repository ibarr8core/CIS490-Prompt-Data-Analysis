// backend/server.js
// Main Express server for the Prompt Marketplace project.
// - Runs database initialization on startup
// - Serves the existing frontend as static files
// - Exposes /api/prompts endpoints for basic prompt operations

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./initDatabase');
const promptsRouter = require('./routes/prompts');

const app = express();
const PORT = 3000;

// Enable JSON body parsing for API endpoints
app.use(express.json());

// Enable CORS for local development
app.use(cors());

// Serve the existing frontend folder as static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// API routes for prompts, mounted under /api/prompts
app.use('/api/prompts', promptsRouter);

// Ensure http://localhost:3000 loads the main page.
// We send the existing frontend/index.html file.
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start the server only after database initialization has run successfully.
// If initialization fails, we log the error and exit so the app does not
// continue running in a bad state.
(async () => {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialization complete.');

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error during database initialization:', err.message);
    process.exit(1);
  }
})();

