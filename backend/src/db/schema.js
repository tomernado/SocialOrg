/**
 * Initialises the SQLite schema.
 * Called once on startup by database.js — safe to call multiple times (IF NOT EXISTS guards).
 */
export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id            TEXT PRIMARY KEY,
      original_url  TEXT NOT NULL UNIQUE,
      title         TEXT NOT NULL,
      image_url     TEXT,
      category      TEXT NOT NULL DEFAULT 'Uncategorised',
      sub_category  TEXT NOT NULL DEFAULT 'Uncategorised',
      source_name   TEXT NOT NULL DEFAULT '',
      tag           TEXT NOT NULL DEFAULT 'General',
      relevance_score INTEGER NOT NULL DEFAULT 0,
      ai_summary    TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_articles_sub_category_created
      ON articles (sub_category, created_at);
  `);

  // Migrate existing tables that predate the source_name column.
  // SQLite has no "ADD COLUMN IF NOT EXISTS" — try-catch is the idiomatic approach.
  try {
    db.exec(`ALTER TABLE articles ADD COLUMN source_name TEXT NOT NULL DEFAULT ''`);
  } catch {
    // Column already exists — safe to ignore
  }
}

/**
 * Inserts one article row.
 * Returns true if inserted, false if skipped (duplicate original_url).
 *
 * @param {import('better-sqlite3').Database} db
 * @param {{ id:string, original_url:string, title:string, image_url:string|null,
 *           category:string, sub_category:string, tag:string,
 *           relevance_score:number, ai_summary:string }} article
 */
export function insertArticle(db, article) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO articles
      (id, original_url, title, image_url, category, sub_category, source_name, tag, relevance_score, ai_summary)
    VALUES
      (@id, @original_url, @title, @image_url, @category, @sub_category, @source_name, @tag, @relevance_score, @ai_summary)
  `);

  const result = stmt.run(article);
  return result.changes === 1; // 0 = duplicate skipped, 1 = inserted
}

/**
 * FIFO trim: caps at 20 articles per (sub_category + source_name) pair.
 * Each source gets its own 20-slot queue — one high-volume source (e.g. BBC)
 * can no longer push out articles from a smaller source (e.g. Fabrizio Romano).
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} subCategory
 * @param {string} sourceName
 */
export function trimSubCategory(db, subCategory, sourceName) {
  const MAX = 10;

  const count = db
    .prepare(`SELECT COUNT(*) as n FROM articles WHERE sub_category = ? AND source_name = ?`)
    .get(subCategory, sourceName).n;

  if (count <= MAX) return;

  const excess = count - MAX;
  db.prepare(`
    DELETE FROM articles
    WHERE id IN (
      SELECT id FROM articles
      WHERE sub_category = ? AND source_name = ?
      ORDER BY created_at ASC
      LIMIT ?
    )
  `).run(subCategory, sourceName, excess);
}

/**
 * Returns true if an article with the given URL already exists.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} url
 */
export function articleExists(db, url) {
  return !!db.prepare(`SELECT 1 FROM articles WHERE original_url = ? LIMIT 1`).get(url);
}
