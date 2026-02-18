const Database = require('better-sqlite3');
const db = new Database('faceit.db');

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS anchor_counts (
    player_id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
  )
`);

module.exports = db;