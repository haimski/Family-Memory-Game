const express = require('express');
const { body, validationResult } = require('express-validator');
const Score = require('../../models/Score');

const router = express.Router();

const MAX_SCORES = 5;

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// GET /api/scores
router.get('/', async (req, res, next) => {
  try {
    const scores = await Score.find()
      .sort({ score: -1, createdAt: 1 })
      .limit(MAX_SCORES);
    res.json({ success: true, count: scores.length, data: scores });
  } catch (err) {
    next(err);
  }
});

// POST /api/scores
// Always inserts, then trims the collection back down to the top MAX_SCORES,
// so the table itself never holds more than that - not just the response.
router.post(
  '/',
  [
    body('name').isString().trim().notEmpty().isLength({ max: 20 }).withMessage('name is required (max 20 chars)'),
    body('score').isInt().withMessage('score must be an integer'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { name, score } = req.body;
      await Score.create({ name, score });

      const overflow = await Score.find()
        .sort({ score: -1, createdAt: 1 })
        .skip(MAX_SCORES)
        .select('_id');

      if (overflow.length > 0) {
        await Score.deleteMany({ _id: { $in: overflow.map((doc) => doc._id) } });
      }

      const top = await Score.find().sort({ score: -1, createdAt: 1 }).limit(MAX_SCORES);
      res.status(201).json({ success: true, data: top });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
