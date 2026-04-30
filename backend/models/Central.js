const mongoose = require('mongoose');

const centralSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  latitude: { type: Number },
  longitude: { type: Number },
  capacite: { type: Number, required: true },
  statut: { type: String, enum: ['actif', 'maintenance', 'inactif'], default: 'actif' },
  etatEfficacite: { type: Number, min: 0, max: 100, default: 100 },
  dateInstallation: { type: Date, default: Date.now },
  dernierNettoyage: { type: Date, default: null },
  adresse: { type: String, trim: true, default: '' },

  etatActuel: { type: String, default: '' },
  dernierScore: { type: Number, default: null },
  derniereDecision: { type: String, default: '' },
  derniereAnalyseAt: { type: Date, default: null },
  derniereImageAnnotee: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Central', centralSchema);