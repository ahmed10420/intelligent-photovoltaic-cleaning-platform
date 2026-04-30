const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    centralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Central',
      required: true,
    },
    imageOriginal: {
      type: String,
      default: '',
      trim: true,
    },
    imageAnnotee: {
      type: String,
      default: '',
      trim: true,
    },
    scoreGlobal: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    classPercentages: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    defectsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    messageDecision: {
      type: String,
      enum: ['etat correct', 'surveillance', 'urgent', 'critique'],
      default: 'etat correct',
    },
    modelName: {
      type: String,
      default: 'YOLO',
      trim: true,
    },
    inferenceMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', analysisSchema);
