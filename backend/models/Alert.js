const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    centralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Central',
      required: true,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      default: null,
    },
    severity: {
      type: String,
      enum: ['surveillance', 'urgent', 'critique'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    scoreGlobal: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
    },
    read: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
