import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/articles/sub-categories?category=<hebrew>
// Returns the distinct sub-categories that exist in the DB for a given main category.
// The frontend uses this to build the sub-navbar dynamically — no hardcoding needed.
router.get('/sub-categories', (req, res) => {
  const db = getDb();
  const { category } = req.query;

  const rows = category
    ? db.prepare(
        `SELECT DISTINCT sub_category
         FROM articles
         WHERE category = ?
         ORDER BY sub_category ASC`
      ).all(category)
    : db.prepare(
        `SELECT DISTINCT sub_category FROM articles ORDER BY sub_category ASC`
      ).all();

  res.json({ data: rows.map((r) => r.sub_category) });
});

// GET /api/articles?category=<hebrew>&sub_category=<hebrew>
// Both params are optional. sub_category requires category to be meaningful.
router.get('/', (req, res) => {
  const db = getDb();
  const { category, sub_category } = req.query;

  let rows;
  if (category && sub_category) {
    rows = db.prepare(
      `SELECT * FROM articles
       WHERE category = ? AND sub_category = ?
       ORDER BY created_at DESC`
    ).all(category, sub_category);
  } else if (category) {
    rows = db.prepare(
      `SELECT * FROM articles
       WHERE category = ?
       ORDER BY created_at DESC`
    ).all(category);
  } else {
    rows = db.prepare(
      `SELECT * FROM articles ORDER BY created_at DESC`
    ).all();
  }

  res.json({ data: rows, total: rows.length });
});

export default router;
