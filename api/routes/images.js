const express = require('express');
const { body, validationResult } = require('express-validator');
const ImageConfig = require('../../models/ImageConfig');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// GET /api/images
router.get('/', async (req, res, next) => {
  try {
    const images = await ImageConfig.find({ isActive: true }).sort({ uploadedAt: -1 });
    res.json({ success: true, count: images.length, data: images });
  } catch (err) {
    next(err);
  }
});

// POST /api/images/update
// An empty/missing imageUrl deletes the override, reverting the card to its default.
router.post(
  '/update',
  [
    body('cardKey').isString().trim().notEmpty().withMessage('cardKey is required'),
    body('imageUrl').optional({ nullable: true }).isString(),
    body('imageType').optional().isIn(['card', 'logo', 'banner', 'screenshot', 'icon']),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { cardKey, imageUrl, imageType } = req.body;
      const type = imageType || 'card';

      if (!imageUrl) {
        await ImageConfig.findOneAndDelete({ cardKey, imageType: type });
        return res.json({ success: true, data: null });
      }

      const image = await ImageConfig.findOneAndUpdate(
        { cardKey, imageType: type },
        { imageUrl, uploadedAt: new Date(), isActive: true },
        { new: true, upsert: true, runValidators: true }
      );

      res.json({ success: true, data: image });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
