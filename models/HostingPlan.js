const mongoose = require('mongoose');

const hostingPlanSchema = new mongoose.Schema(
  {
    rank: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    price: {
      monthly: {
        type: Number,
        required: true,
        min: 0,
      },
      yearly: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    features: {
      type: [String],
      default: [],
    },
    advantages: {
      type: [String],
      default: [],
    },
    limitations: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    affiliateUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.HostingPlan || mongoose.model('HostingPlan', hostingPlanSchema);
