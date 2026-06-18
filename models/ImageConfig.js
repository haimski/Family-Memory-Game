const mongoose = require('mongoose');

const imageConfigSchema = new mongoose.Schema(
  {
    cardKey: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imageType: {
      type: String,
      enum: ['card', 'logo', 'banner', 'screenshot', 'icon'],
      default: 'card',
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

imageConfigSchema.index({ cardKey: 1, imageType: 1 }, { unique: true });

module.exports = mongoose.models.ImageConfig || mongoose.model('ImageConfig', imageConfigSchema);
