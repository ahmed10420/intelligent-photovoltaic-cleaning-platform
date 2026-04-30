const mongoose = require('mongoose');

const cleaningSchema = new mongoose.Schema(
  {
    centralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Central',
      required: true,
    },
    dateNettoyage: {
      type: Date,
      required: true,
    },
    typeNettoyage: {
      type: String,
      enum: ['manuel', 'planifie', 'urgent'],
      default: 'manuel',
    },
    remarque: {
      type: String,
      default: '',
      trim: true,
    },
    scoreAvant: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cleaning', cleaningSchema);