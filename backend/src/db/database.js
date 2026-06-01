import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initSchema } from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// news.db lives at backend/news.db so it is outside src/ and easy to inspect / back up.
const DB_PATH = resolve(__dirname, '../../news.db');

let _db = null;

export function getDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH);

  // WAL mode: better concurrent read performance, no data loss on crash.
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);

  console.log(`[db] SQLite connected → ${DB_PATH}`);
  return _db;
}
