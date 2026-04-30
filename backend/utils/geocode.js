const axios = require('axios');

async function geocodeAddress(adresse) {
  try {
    const url = 'https://nominatim.openstreetmap.org/search';

    const response = await axios.get(url, {
      params: {
        q: adresse,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'spectra-app/1.0'
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("Adresse introuvable");
    }

    const result = response.data[0];

    return {
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      displayName: result.display_name
    };
  } catch (error) {
    throw new Error(`Erreur géocodage: ${error.message}`);
  }
}

module.exports = geocodeAddress;