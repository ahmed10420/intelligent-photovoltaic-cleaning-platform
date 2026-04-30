const Central = require('../models/Central');
const Cleaning = require('../models/Cleaning');
const geocodeAddress = require('../utils/geocode');
const axios = require('axios');

async function reverseGeocode(latitude, longitude) {
  const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: {
      lat: latitude,
      lon: longitude,
      format: 'json'
    },
    headers: {
      'User-Agent': 'cpv-app'
    }
  });

  return response.data?.display_name || '';
}

function normalizeDateValue(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

exports.getCentrals = async (req, res) => {
  try {
    const centrals = await Central.find().sort({ createdAt: -1 });
    res.json({ success: true, count: centrals.length, data: centrals });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createCentral = async (req, res) => {
  try {
    const {
      nom,
      adresse,
      latitude,
      longitude,
      capacite,
      statut,
      etatEfficacite,
      dateInstallation,
      dernierNettoyage,
      typeNettoyage,
      remarque
    } = req.body;

    if (!nom || capacite === undefined || capacite === null || capacite === '') {
      return res.status(400).json({
        success: false,
        message: 'Nom et capacité sont obligatoires'
      });
    }

    let finalLatitude;
    let finalLongitude;
    let finalAdresse = adresse || '';

    if (latitude !== undefined && longitude !== undefined && latitude !== '' && longitude !== '') {
      finalLatitude = Number(latitude);
      finalLongitude = Number(longitude);

      if (!finalAdresse) {
        finalAdresse = await reverseGeocode(finalLatitude, finalLongitude);
      }
    } else {
      if (!adresse) {
        return res.status(400).json({
          success: false,
          message: 'Adresse ou coordonnées GPS obligatoires'
        });
      }

      const geo = await geocodeAddress(adresse);
      finalLatitude = geo.latitude;
      finalLongitude = geo.longitude;
    }

    const central = await Central.create({
      nom,
      adresse: finalAdresse,
      latitude: finalLatitude,
      longitude: finalLongitude,
      capacite: Number(capacite),
      statut: statut || 'actif',
      etatEfficacite:
        etatEfficacite !== undefined && etatEfficacite !== null && etatEfficacite !== ''
          ? Number(etatEfficacite)
          : 100,
      dateInstallation,
      dernierNettoyage
    });

if (dernierNettoyage) {
  try {
    await Cleaning.create({
      centralId: central._id,
      dateNettoyage: new Date(dernierNettoyage),
      typeNettoyage: typeNettoyage || 'manuel',
      remarque: remarque || '',
      scoreAvant:
        central.dernierScore !== undefined && central.dernierScore !== null
          ? Number(central.dernierScore)
          : null,
    });
  } catch (cleanErr) {
    console.error('Cleaning.create error:', cleanErr.message);
  }
}

res.status(201).json({ success: true, data: central })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.getCentral = async (req, res) => {
  try {
    const central = await Central.findById(req.params.id);
    if (!central) {
      return res.status(404).json({ success: false, message: 'Centrale non trouvée' });
    }
    res.json({ success: true, data: central });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateCentral = async (req, res) => {
  try {
    const {
      nom,
      adresse,
      latitude,
      longitude,
      capacite,
      statut,
      etatEfficacite,
      dateInstallation,
      dernierNettoyage,
      typeNettoyage,
      remarque
    } = req.body;

    const ancienneCentrale = await Central.findById(req.params.id);

    if (!ancienneCentrale) {
      return res.status(404).json({
        success: false,
        message: 'Centrale non trouvée'
      });
    }

    const ancienDernierNettoyage = normalizeDateValue(ancienneCentrale.dernierNettoyage);
    const nouveauDernierNettoyage = normalizeDateValue(dernierNettoyage);

    const updateData = {
      nom,
      capacite: capacite !== undefined && capacite !== '' ? Number(capacite) : undefined,
      statut,
      etatEfficacite:
        etatEfficacite !== undefined && etatEfficacite !== ''
          ? Number(etatEfficacite)
          : undefined,
      dateInstallation,
      dernierNettoyage
    };

    if (latitude !== undefined && longitude !== undefined && latitude !== '' && longitude !== '') {
      updateData.latitude = Number(latitude);
      updateData.longitude = Number(longitude);
      updateData.adresse = adresse || await reverseGeocode(updateData.latitude, updateData.longitude);
    } else if (adresse) {
      const geo = await geocodeAddress(adresse);
      updateData.adresse = adresse;
      updateData.latitude = geo.latitude;
      updateData.longitude = geo.longitude;
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const central = await Central.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    const nettoyageModifie =
      nouveauDernierNettoyage &&
      nouveauDernierNettoyage !== ancienDernierNettoyage;

    if (nettoyageModifie) {
      await Cleaning.create({
        centralId: central._id,
        dateNettoyage: new Date(dernierNettoyage),
        typeNettoyage: typeNettoyage || 'manuel',
        remarque: remarque || '',
        scoreAvant:
          ancienneCentrale.dernierScore !== undefined && ancienneCentrale.dernierScore !== null
            ? Number(ancienneCentrale.dernierScore)
            : null,
      });
    }

    res.json({ success: true, data: central });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteCentral = async (req, res) => {
  try {
    const central = await Central.findByIdAndDelete(req.params.id);
    if (!central) {
      return res.status(404).json({ success: false, message: 'Centrale non trouvée' });
    }

    await Cleaning.deleteMany({ centralId: req.params.id });

    res.json({ success: true, message: 'Centrale supprimée' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await Central.countDocuments();
    const actives = await Central.countDocuments({ statut: 'actif' });
    const maintenance = await Central.countDocuments({ statut: 'maintenance' });
    const inactives = await Central.countDocuments({ statut: 'inactif' });
    const all = await Central.find({}, 'etatEfficacite capacite');

    const efficaciteMoyenne = all.length
      ? Math.round(all.reduce((a, c) => a + c.etatEfficacite, 0) / all.length)
      : 0;

    const capaciteTotale = all.reduce((a, c) => a + c.capacite, 0);

    res.json({
      success: true,
      data: { total, actives, maintenance, inactives, efficaciteMoyenne, capaciteTotale }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};