const mongoose = require('mongoose');
const Cleaning = require('../models/Cleaning');
const Central = require('../models/Central');

exports.createCleaning = async (req, res) => {
  try {
    const {
      centralId,
      dateNettoyage,
      typeNettoyage = 'manuel',
      remarque = '',
      scoreAvant = null,
    } = req.body;

    if (!centralId || !dateNettoyage) {
      return res.status(400).json({
        success: false,
        message: 'centralId et dateNettoyage sont obligatoires.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(centralId)) {
      return res.status(400).json({
        success: false,
        message: 'centralId invalide.',
      });
    }

    const central = await Central.findById(centralId);

    if (!central) {
      return res.status(404).json({
        success: false,
        message: 'Centrale introuvable.',
      });
    }

    const cleaning = await Cleaning.create({
      centralId,
      dateNettoyage,
      typeNettoyage,
      remarque,
      scoreAvant:
        scoreAvant === null || scoreAvant === undefined || scoreAvant === ''
          ? null
          : Number(scoreAvant),
    });

    central.dernierNettoyage = new Date(dateNettoyage);
    await central.save();

    const populatedCleaning = await Cleaning.findById(cleaning._id).populate(
      'centralId',
      'nom adresse capacite statut etatEfficacite dernierNettoyage'
    );

    return res.status(201).json({
      success: true,
      message: 'Nettoyage enregistré avec succès.',
      cleaning: populatedCleaning,
    });
  } catch (error) {
    console.error('Erreur createCleaning:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'enregistrement du nettoyage.",
      error: error.message,
    });
  }
};

exports.getCleanings = async (req, res) => {
  try {
    const cleanings = await Cleaning.find()
      .populate('centralId', 'nom adresse capacite statut etatEfficacite dernierNettoyage')
      .sort({ dateNettoyage: -1, createdAt: -1 });

    return res.json({
      success: true,
      cleanings,
    });
  } catch (error) {
    console.error('Erreur getCleanings:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des nettoyages.',
      error: error.message,
    });
  }
};

exports.getCleaningsByCentral = async (req, res) => {
  try {
    const { centralId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(centralId)) {
      return res.status(400).json({
        success: false,
        message: 'centralId invalide.',
      });
    }

    const central = await Central.findById(centralId);

    if (!central) {
      return res.status(404).json({
        success: false,
        message: 'Centrale introuvable.',
      });
    }

    const cleanings = await Cleaning.find({ centralId })
      .populate('centralId', 'nom adresse capacite statut etatEfficacite dernierNettoyage')
      .sort({ dateNettoyage: -1, createdAt: -1 });

    return res.json({
      success: true,
      cleanings,
    });
  } catch (error) {
    console.error('Erreur getCleaningsByCentral:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des nettoyages de la centrale.',
      error: error.message,
    });
  }
};

exports.deleteCleaning = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'id invalide.',
      });
    }

    const cleaning = await Cleaning.findByIdAndDelete(id);

    if (!cleaning) {
      return res.status(404).json({
        success: false,
        message: 'Nettoyage introuvable.',
      });
    }

    const lastCleaning = await Cleaning.findOne({ centralId: cleaning.centralId })
      .sort({ dateNettoyage: -1, createdAt: -1 });

    await Central.findByIdAndUpdate(cleaning.centralId, {
      dernierNettoyage: lastCleaning ? lastCleaning.dateNettoyage : null,
    });

    return res.json({
      success: true,
      message: 'Nettoyage supprimé avec succès.',
    });
  } catch (error) {
    console.error('Erreur deleteCleaning:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du nettoyage.',
      error: error.message,
    });
  }
};