const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const Alert = require('../models/Alert');
const Central = require('../models/Central');
const {
  clampScore,
  getDecisionFromScore,
  getAlertContent,
} = require('../utils/analysisDecision');

exports.createAnalysis = async (req, res) => {
  try {
    const {
      centralId,
      imageOriginal = '',
      imageAnnotee = '',
      scoreGlobal,
      score,
      classPercentages = {},
      raw_percentages,
      defectsCount,
      total_detections,
      modelName = 'YOLO',
      inferenceMs = 0,
      rawResponse = {},
    } = req.body;

    if (!centralId) {
      return res.status(400).json({
        success: false,
        message: 'centralId est obligatoire.',
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

    const finalScore = clampScore(scoreGlobal ?? score ?? 0);
    const decision = getDecisionFromScore(finalScore);
    const finalPercentages = raw_percentages || classPercentages || {};
    const finalDefectsCount = Number(defectsCount ?? total_detections ?? 0);

    const analysis = await Analysis.create({
      centralId,
      imageOriginal,
      imageAnnotee,
      scoreGlobal: finalScore,
      classPercentages: finalPercentages,
      defectsCount: Number.isNaN(finalDefectsCount) ? 0 : finalDefectsCount,
      messageDecision: decision,
      modelName,
      inferenceMs: Number(inferenceMs) || 0,
      rawResponse,
    });

    central.etatEfficacite = Math.max(0, Math.min(100, 100 - finalScore));
    central.etatActuel = decision;
    central.dernierScore = finalScore;
    central.derniereDecision = decision;
    central.derniereAnalyseAt = analysis.createdAt;
    central.derniereImageAnnotee = imageAnnotee || '';
    await central.save();

    let alert = null;

    if (['surveillance', 'urgent', 'critique'].includes(decision)) {
      const { title, message } = getAlertContent(central.nom, decision, finalScore);

      alert = await Alert.create({
        centralId,
        analysisId: analysis._id,
        severity: decision,
        title,
        message,
        scoreGlobal: finalScore,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Analyse enregistrée et centrale mise à jour.',
      analysis,
      central,
      alert,
    });
  } catch (error) {
    console.error('Erreur createAnalysis:', error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'enregistrement de l'analyse.",
      error: error.message,
    });
  }
};

exports.getAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find()
      .populate('centralId', 'nom adresse etatEfficacite etatActuel')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error('Erreur getAnalyses:', error);

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des analyses.',
      error: error.message,
    });
  }
};

exports.getAnalysesByCentral = async (req, res) => {
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

    const analyses = await Analysis.find({ centralId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error('Erreur getAnalysesByCentral:', error);

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des analyses de la centrale.',
      error: error.message,
    });
  }
};