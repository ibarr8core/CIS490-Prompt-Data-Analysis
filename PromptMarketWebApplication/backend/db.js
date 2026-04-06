// backend/db.js
// MySQL connection pool (mysql2/promise). Config from environment variables.

const mysql = require('mysql2/promise');

function buildPoolConfig() {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  const poolBase = {
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  if (process.env.INSTANCE_UNIX_SOCKET) {
    return {
      ...poolBase,
      socketPath: process.env.INSTANCE_UNIX_SOCKET
    };
  }

  return {
    ...poolBase,
    host: '127.0.0.1',
    port: 9470
  };
}

const pool = mysql.createPool(buildPoolConfig());

pool
  .getConnection()
  .then((conn) => {
    conn.release();
    console.log('[DB] Connection pool ready');
  })
  .catch((err) => {
    console.error('[DB] Connection pool check failed:', err.message || err);
  });

module.exports = pool;
