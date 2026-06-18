const mongoose = require('mongoose');

const imageConfigSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostingPlan',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imageType: {
      type: String,
      enum: ['logo', 'banner', 'screenshot', 'icon'],
      default: 'logo',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

imageConfigSchema.index({ planId: 1, imageType: 1 }, { unique: true });

module.exports = mongoose.models.ImageConfig || mongoose.model('ImageConfig', imageConfigSchema);
