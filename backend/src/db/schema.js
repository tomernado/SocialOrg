/**
 * Initialises the SQLite schema.
 * Called once on startup by database.js — safe to call multiple times (IF NOT EXISTS guards).
 */
export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id            TEXT PRIMARY KEY,
      original_url  TEXT NOT NULL UNIQUE,   -- Idempotency key: never store duplicates
      title         TEXT NOT NULL,
      image_url     TEXT,                   -- nullable; frontend must handle missing images
      category      TEXT NOT NULL DEFAULT 'Uncategorised',
      sub_category  TEXT NOT NULL DEFAULT 'Uncategorised',
      tag           TEXT NOT NULL DEFAULT 'General',
      relevance_score INTEGER NOT NULL DEFAULT 0,  -- 0–100; set by LLM in Phase 3
      ai_summary    TEXT NOT NULL DEFAULT '',      -- set by LLM in Phase 3; [RAW] prefix in Phase 2
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    -- Speeds up the FIFO trim query (DELETE oldest N rows per sub_category)
    CREATE INDEX IF NOT EXISTS idx_articles_sub_category_created
      ON articles (sub_category, created_at);
  `);
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
      (id, original_url, title, image_url, category, sub_category, tag, relevance_score, ai_summary)
    VALUES
      (@id, @original_url, @title, @image_url, @category, @sub_category, @tag, @relevance_score, @ai_summary)
  `);

  const result = stmt.run(article);
  return result.changes === 1; // 0 = duplicate skipped, 1 = inserted
}

/**
 * FIFO trim: if a sub_category has more than 20 rows, delete the oldest (lowest created_at).
 * Call this AFTER every successful insert.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} subCategory
 */
export function trimSubCategory(db, subCategory) {
  const MAX = 20;

  const count = db
    .prepare(`SELECT COUNT(*) as n FROM articles WHERE sub_category = ?`)
    .get(subCategory).n;

  if (count <= MAX) return;

  const excess = count - MAX;
  db.prepare(`
    DELETE FROM articles
    WHERE id IN (
      SELECT id FROM articles
      WHERE sub_category = ?
      ORDER BY created_at ASC
      LIMIT ?
    )
  `).run(subCategory, excess);
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
