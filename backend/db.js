const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('market.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price REAL,
    category TEXT,
    image TEXT,
    seller_name TEXT,
    seller_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = {
  query: (sql, params = []) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return db.prepare(sql).all(...params);
    } else {
      return db.prepare(sql).run(...params);
    }
  }
};