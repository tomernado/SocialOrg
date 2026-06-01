import { Router } from 'express';

const router = Router();

// GET /api/articles — placeholder until service layer is wired
router.get('/', (_req, res) => {
  res.json({ data: [], message: 'Articles service not yet implemented.' });
});

export default router;
