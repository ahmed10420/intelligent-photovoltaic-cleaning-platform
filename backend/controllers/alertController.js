const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && ['active', 'resolved'].includes(status)) {
      filter.status = status;
    }

    const alerts = await Alert.find(filter)
      .populate('centralId', 'nom adresse etatEfficacite')
      .populate('analysisId', 'scoreGlobal imageAnnotee createdAt')
      .sort({ createdAt: -1 });

    return res.json({ success: true, alerts });
  } catch (error) {
    console.error('Erreur getAlerts:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des alertes.' });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        read: true,
        resolvedAt: new Date(),
      },
      { new: true }
    )
      .populate('centralId', 'nom adresse etatEfficacite')
      .populate('analysisId', 'scoreGlobal imageAnnotee createdAt');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alerte introuvable.' });
    }

    return res.json({ success: true, message: 'Alerte marquée comme traitée.', alert });
  } catch (error) {
    console.error('Erreur resolveAlert:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour de l’alerte.' });
  }
};
