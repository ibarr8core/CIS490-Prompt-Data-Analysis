// backend/db.js
// Simple MySQL connection pool using mysql2/promise.
// This assumes the PromptMarket database already exists.
// The initializeDatabase function in initDatabase.js will
// create the database and tables before the server starts.

const mysql = require('mysql2/promise');

// Create a reusable connection pool for the application.
// Connection settings are exactly as requested.
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'admin',
  database: 'PromptMarket',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

