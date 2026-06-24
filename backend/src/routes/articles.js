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
// Articles with images always surface first (aesthetics + homepage row fill),
// then no-image articles, both groups sorted newest-first within themselves.
const IMAGES_FIRST = `CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 0 ELSE 1 END ASC, created_at DESC`;

router.get('/', (req, res) => {
  const db = getDb();
  const { category, sub_category } = req.query;

  let rows;
  if (category && sub_category) {
    rows = db.prepare(
      `SELECT * FROM articles
       WHERE category = ? AND sub_category = ?
       ORDER BY ${IMAGES_FIRST}`
    ).all(category, sub_category);
  } else if (category) {
    rows = db.prepare(
      `SELECT * FROM articles
       WHERE category = ?
       ORDER BY ${IMAGES_FIRST}`
    ).all(category);
  } else {
    rows = db.prepare(
      `SELECT * FROM articles ORDER BY ${IMAGES_FIRST}`
    ).all();
  }

  res.json({ data: rows, total: rows.length });
});

export default router;
