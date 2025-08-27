const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.dirname('./database/realestate.db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database('./database/realestate.db', { 
  verbose: console.log 
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

module.exports = db;
