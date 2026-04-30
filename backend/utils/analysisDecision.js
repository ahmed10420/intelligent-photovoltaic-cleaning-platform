function clampScore(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, num));
}

function getDecisionFromScore(score) {
  const safeScore = clampScore(score);

  if (safeScore >= 75) return 'critique';
  if (safeScore >= 50) return 'urgent';
  if (safeScore >= 25) return 'surveillance';
  return 'etat correct';
}

function getAlertContent(centralName, decision, score) {
  const name = centralName || 'Centrale inconnue';
  const safeScore = clampScore(score);

  switch (decision) {
    case 'critique':
      return {
        title: 'Alerte critique',
        message: `La centrale ${name} est en état critique (score ${safeScore}%). Nettoyage immédiat requis.`,
      };
    case 'urgent':
      return {
        title: 'Alerte urgente',
        message: `La centrale ${name} présente un niveau d'encrassement urgent (score ${safeScore}%). Intervention à planifier rapidement.`,
      };
    case 'surveillance':
      return {
        title: 'Alerte de surveillance',
        message: `La centrale ${name} doit être surveillée (score ${safeScore}%). Un contrôle rapproché est recommandé.`,
      };
    default:
      return {
        title: 'État correct',
        message: `La centrale ${name} est dans un état correct (score ${safeScore}%).`,
      };
  }
}

module.exports = {
  clampScore,
  getDecisionFromScore,
  getAlertContent,
};
