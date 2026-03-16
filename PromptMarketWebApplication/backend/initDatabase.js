// backend/initDatabase.js
// Database initialization and seed script.
// This file is safe to run multiple times.
// It will:
// - connect to MySQL even if the PromptMarket database does not exist yet
// - create the PromptMarket database if needed
// - create required tables if they do not exist
// - insert basic seed data using INSERT IGNORE

const mysql = require('mysql2/promise');

// Raw connection settings (without specifying database)
// Uses the shared MySQL credentials for this project.
const CONNECTION_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'admin',
  multipleStatements: true
};

async function initializeDatabase() {
  let connection;
  try {
    // Connect without database first so we can create it if missing
    connection = await mysql.createConnection(CONNECTION_CONFIG);

    // Create database if it does not exist
    await connection.query(
      'CREATE DATABASE IF NOT EXISTS `PromptMarket` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );

    // Switch to the PromptMarket database
    await connection.changeUser({ database: 'PromptMarket' });

    // Create tables in the correct order for foreign keys
    await createTables(connection);

    // Insert seed data (safe to run multiple times)
    await seedData(connection);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (_) {
        // swallow close errors
      }
    }
  }
}

// Create all required tables with IF NOT EXISTS
async function createTables(conn) {
  // users table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // categories table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  // prompts table (depends on users, categories)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS prompts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      model VARCHAR(100),
      author_id INT NOT NULL,
      category_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_prompts_author
        FOREIGN KEY (author_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_prompts_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE SET NULL
    )
  `);

  // tags table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL
    )
  `);

  // prompt_tags table (depends on prompts, tags)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS prompt_tags (
      prompt_id INT NOT NULL,
      tag_id INT NOT NULL,
      PRIMARY KEY (prompt_id, tag_id),
      CONSTRAINT fk_prompt_tags_prompt
        FOREIGN KEY (prompt_id) REFERENCES prompts(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_prompt_tags_tag
        FOREIGN KEY (tag_id) REFERENCES tags(id)
        ON DELETE CASCADE
    )
  `);
}

// Insert starter data using INSERT IGNORE so it is idempotent
async function seedData(conn) {
  // Seed categories
  const categories = ['Education', 'Coding', 'Productivity', 'Design'];
  for (const name of categories) {
    await conn.query(
      'INSERT IGNORE INTO categories (name) VALUES (?)',
      [name]
    );
  }

  // Seed tags
  const tags = ['ChatGPT', 'AI', 'Homework', 'Programming', 'Creative'];
  for (const name of tags) {
    await conn.query(
      'INSERT IGNORE INTO tags (name) VALUES (?)',
      [name]
    );
  }

  // Seed admin user
  // Password is stored in plain text here for simplicity, as requested.
  await conn.query(
    'INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    ['admin', 'admin@example.com', 'root', 'admin']
  );

  // Ensure there is at least one example prompt.
  // We will assume that the first user (admin) has id = 1
  // and that the first category (Education) has id = 1,
  // which is true for a fresh database. If rows already exist,
  // INSERT IGNORE keeps this safe to re-run.
  await conn.query(
    `INSERT IGNORE INTO prompts
      (id, title, description, content, model, author_id, category_id)
     VALUES
      (?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      'Essay Helper',
      'Helps generate essay outlines',
      'Create a 5 paragraph essay outline about climate change',
      'ChatGPT-4',
      1,
      1
    ]
  );
}

module.exports = {
  initializeDatabase
};

