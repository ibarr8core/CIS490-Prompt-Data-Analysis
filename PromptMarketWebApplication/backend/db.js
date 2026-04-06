// backend/db.js
// MySQL connection pool (mysql2/promise). Lazy: no connection is opened at import time.

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
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 9470)
  };
}

const pool = mysql.createPool(buildPoolConfig());

module.exports = pool;
