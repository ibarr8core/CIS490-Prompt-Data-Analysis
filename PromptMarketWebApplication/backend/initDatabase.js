// backend/initDatabase.js
// Database initialization and seed script.
// This file is safe to run multiple times.
// It will:
// - connect to MySQL even if the PromptMarket database does not exist yet
// - create the PromptMarket database if needed
// - create required tables if they do not exist
// - insert basic seed data using INSERT IGNORE

const mysql = require('mysql2/promise');

const DATABASE_NAME = process.env.DB_NAME;

function buildInitConnectionConfig() {
  const base = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  };
  if (process.env.INSTANCE_UNIX_SOCKET) {
    return {
      ...base,
      socketPath: process.env.INSTANCE_UNIX_SOCKET
    };
  }
  return {
    ...base,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 9470)
  };
}

async function initializeDatabase() {
  if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error(
      '[DB] Skipping initialization: DB_USER, DB_PASSWORD, and DB_NAME must be set'
    );
    return;
  }

  let connection;
  try {
    // Connect without database first so we can create it if missing
    connection = await mysql.createConnection(buildInitConnectionConfig());
    await connection.query('SELECT 1');

    // Create database if it does not exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    // Switch to the configured database
    await connection.changeUser({ database: DATABASE_NAME });

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
      thumbnail_url VARCHAR(255) NULL,
      thumbnail_data LONGBLOB NULL,
      thumbnail_mime_type VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_prompts_author
        FOREIGN KEY (author_id) REFERENCES users(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_prompts_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE SET NULL
    )
  `);

  // For existing databases where prompts table was created before thumbnail_url existed,
  // add the column only if it is missing. This keeps initialization idempotent.
  const [columns] = await conn.query(
    "SHOW COLUMNS FROM prompts LIKE 'thumbnail_url'"
  );
  if (columns.length === 0) {
    await conn.query(
      'ALTER TABLE prompts ADD COLUMN thumbnail_url VARCHAR(255) NULL AFTER category_id'
    );
  }

  // For existing databases where prompts table was created before thumbnail_data existed,
  // add the columns only if they are missing (idempotent migration).
  const [thumbDataColumns] = await conn.query(
    "SHOW COLUMNS FROM prompts LIKE 'thumbnail_data'"
  );
  if (thumbDataColumns.length === 0) {
    await conn.query(
      'ALTER TABLE prompts ADD COLUMN thumbnail_data LONGBLOB NULL AFTER thumbnail_url'
    );
  }

  const [thumbMimeColumns] = await conn.query(
    "SHOW COLUMNS FROM prompts LIKE 'thumbnail_mime_type'"
  );
  if (thumbMimeColumns.length === 0) {
    await conn.query(
      'ALTER TABLE prompts ADD COLUMN thumbnail_mime_type VARCHAR(100) NULL AFTER thumbnail_data'
    );
  }

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
  // Demo prompts are intentionally not inserted anymore.
  //
  // If your database already contains demo prompts from previous runs, do a manual cleanup:
  //   DELETE FROM prompts;
  // (Do not auto-run destructive SQL in code.)
}

module.exports = {
  initializeDatabase
};

