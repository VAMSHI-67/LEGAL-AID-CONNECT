


function matchLawyer(client, lawyers, weights) {
  const defaultWeights = { experience: 0.4, rating: 0.4, success: 0.2 };
  weights = weights || defaultWeights;

  // Map case type to required specialization
  const caseTypeMap = {
    Divorce: 'Family',
    Fraud: ['Corporate', 'Cyber'],
    'Property Dispute': 'Civil',
    // Extend as needed
  };
  const requiredSpecialization = caseTypeMap[client.caseType];
  if (!requiredSpecialization) return null;

  // 1. Filter lawyers who are available
  let availableLawyers = lawyers.filter(lawyer => lawyer.available);
  if (availableLawyers.length === 0) return null;

  // 2. Filter by city and specialization
  let cityLawyers = availableLawyers.filter(lawyer => lawyer.city === client.city);
  let specLawyers = cityLawyers.filter(lawyer => {
    if (Array.isArray(requiredSpecialization)) {
      return requiredSpecialization.includes(lawyer.specialization);
    }
    return lawyer.specialization === requiredSpecialization;
  });
  if (specLawyers.length === 0) return null;


  // 3. Scoring with dynamic weights and fixed normalization
  // Experience normalization: by fixed scale (40 years)
  function score(lawyer) {
    const normalizedExperience = lawyer.experience / 40;
    const normalizedRating = lawyer.rating / 5;
    const successRate = lawyer.casesTotal > 0 ? lawyer.casesWon / lawyer.casesTotal : 0;
    return (
      normalizedExperience * weights.experience +
      normalizedRating * weights.rating +
      successRate * weights.success
    );
  }

  // Sort by score descending, then randomly among equals
  const scored = specLawyers.map(lawyer => ({ lawyer, score: score(lawyer) }));
  scored.sort((a, b) => b.score - a.score);
  const maxScore = scored.length > 0 ? scored[0].score : null;
  const topLawyers = scored.filter(s => s.score === maxScore).map(s => s.lawyer);

  // 4. Fairness: random selection if multiple top scores
  if (topLawyers.length === 0) return null;
  if (topLawyers.length === 1) return topLawyers[0];
  return topLawyers[Math.floor(Math.random() * topLawyers.length)];
}

module.exports = { matchLawyer };
