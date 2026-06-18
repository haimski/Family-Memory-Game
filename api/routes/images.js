const express = require('express');
const { body, validationResult } = require('express-validator');
const ImageConfig = require('../../models/ImageConfig');
const HostingPlan = require('../../models/HostingPlan');

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
    const images = await ImageConfig.find({ isActive: true })
      .populate('planId', 'name rank')
      .sort({ uploadedAt: -1 });
    res.json({ success: true, count: images.length, data: images });
  } catch (err) {
    next(err);
  }
});

// POST /api/images/update
router.post(
  '/update',
  [
    body('planId').isMongoId().withMessage('planId must be a valid id'),
    body('imageUrl').isString().trim().notEmpty().withMessage('imageUrl is required'),
    body('imageType').optional().isIn(['logo', 'banner', 'screenshot', 'icon']),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { planId, imageUrl, imageType } = req.body;

      const plan = await HostingPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Hosting plan not found' });
      }

      const image = await ImageConfig.findOneAndUpdate(
        { planId, imageType: imageType || 'logo' },
        { imageUrl, uploadedAt: new Date(), isActive: true },
        { new: true, upsert: true, runValidators: true }
      );

      plan.imageUrl = imageUrl;
      await plan.save();

      res.json({ success: true, data: image });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
