const express = require('express');
const { body, validationResult } = require('express-validator');
const HostingPlan = require('../../models/HostingPlan');

const router = express.Router();

const createValidationRules = [
  body('rank').isInt({ min: 1 }).withMessage('rank must be a positive integer'),
  body('name').isString().trim().notEmpty().withMessage('name is required'),
  body('provider').optional().isString().trim(),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  body('price.monthly').isFloat({ min: 0 }).withMessage('price.monthly must be a non-negative number'),
  body('price.yearly').optional().isFloat({ min: 0 }),
  body('price.currency').optional().isString(),
  body('features').optional().isArray(),
  body('advantages').optional().isArray(),
  body('limitations').optional().isArray(),
  body('imageUrl').optional().isString(),
  body('affiliateUrl').optional().isString(),
  body('description').optional().isString(),
];

const updateValidationRules = [
  body('rank').optional().isInt({ min: 1 }).withMessage('rank must be a positive integer'),
  body('name').optional().isString().trim().notEmpty().withMessage('name cannot be empty'),
  body('provider').optional().isString().trim(),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  body('price.monthly').optional().isFloat({ min: 0 }),
  body('price.yearly').optional().isFloat({ min: 0 }),
  body('price.currency').optional().isString(),
  body('features').optional().isArray(),
  body('advantages').optional().isArray(),
  body('limitations').optional().isArray(),
  body('imageUrl').optional().isString(),
  body('affiliateUrl').optional().isString(),
  body('description').optional().isString(),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// GET /api/hosting-plans
router.get('/', async (req, res, next) => {
  try {
    const plans = await HostingPlan.find({ isActive: true }).sort({ rank: 1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    next(err);
  }
});

// GET /api/hosting-plans/:id
router.get('/:id', async (req, res, next) => {
  try {
    const plan = await HostingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Hosting plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// POST /api/hosting-plans
router.post('/', createValidationRules, handleValidation, async (req, res, next) => {
  try {
    const plan = await HostingPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// PUT /api/hosting-plans/:id
router.put('/:id', updateValidationRules, handleValidation, async (req, res, next) => {
  try {
    const plan = await HostingPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Hosting plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/hosting-plans/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const plan = await HostingPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Hosting plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
