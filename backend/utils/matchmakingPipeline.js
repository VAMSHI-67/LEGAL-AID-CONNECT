const User = require('../models/User');
const MatchEvent = require('../models/MatchEvent');
const matchmaking = require('./matchmaking');
const { buildMlFeatures } = require('./matchFeatures');
const { scoreCandidate } = require('./mlRankingClient');
const config = require('../config/matchmaking');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeRuleScore = (score) => clamp(Number(score || 0) / 100, 0, 1);

const computeFinalScore = (ruleScore, mlScore, mode) => {
  const normalizedRule = normalizeRuleScore(ruleScore);
  const normalizedMl = typeof mlScore === 'number' ? clamp(mlScore, 0, 1) : null;

  if (mode === 'ml' && normalizedMl !== null) return normalizedMl * 100;
  if (mode === 'hybrid' && normalizedMl !== null) {
    return ((normalizedRule * config.ruleWeight) + (normalizedMl * config.mlWeight)) * 100;
  }

  return normalizedRule * 100;
};

const shouldUseMl = (mode, options = {}) => {
  const enableMl = options.enableMl ?? config.enableMl;
  if (!enableMl) return false;
  return mode === 'hybrid' || mode === 'ml';
};

async function persistMatchEvents(caseData, rankedMatches, metadata = {}) {
  if (!config.logEvents || !rankedMatches.length) return;

  try {
    const docs = rankedMatches.map((match, index) => ({
      caseId: caseData._id || caseData.id || null,
      clientId: caseData.clientId || null,
      lawyerId: match.lawyer?._id || null,
      stage: metadata.stage || 'shortlist',
      mode: metadata.mode || config.mode,
      modelVersion: match.modelVersion || 'rules',
      ruleScore: match.ruleScore,
      mlScore: match.mlScore ?? null,
      finalScore: match.finalScore,
      rankPosition: index + 1,
      shownToUser: Boolean(metadata.shownToUser),
      assigned: Boolean(metadata.assigned && index === 0),
      reasons: match.matchReasons || [],
      metadata: {
        matchSource: match.matchSource,
        detailedScores: match.detailedScores,
      },
    }));

    await MatchEvent.insertMany(docs, { ordered: false });
  } catch (error) {
    console.warn('Match event logging failed:', error.message);
  }
}

async function scoreWithMl(caseData, candidates, options = {}) {
  if (!candidates.length || !shouldUseMl(options.mode, options)) {
    return candidates.map((candidate) => ({
      ...candidate,
      mlScore: null,
      finalScore: candidate.ruleScore,
      modelVersion: 'rules',
      matchSource: 'rules',
    }));
  }

  const scored = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const features = buildMlFeatures(caseData, candidate.lawyer);
        const result = await scoreCandidate(features, options);
        return {
          ...candidate,
          mlFeatures: features,
          mlScore: result.score,
          finalScore: computeFinalScore(candidate.ruleScore, result.score, options.mode),
          modelVersion: result.modelVersion,
          matchSource: options.mode === 'ml' ? 'ml' : 'hybrid',
        };
      } catch (error) {
        return {
          ...candidate,
          mlFeatures: buildMlFeatures(caseData, candidate.lawyer),
          mlScore: null,
          finalScore: computeFinalScore(candidate.ruleScore, null, 'rules'),
          modelVersion: 'rules-fallback',
          matchSource: 'rules-fallback',
          mlError: error.message,
        };
      }
    })
  );

  return scored;
}

async function getEligibleLawyers(caseData, options = {}) {
  if (Array.isArray(options.candidateLawyers)) return options.candidateLawyers;

  const query = { role: 'lawyer', isActive: true };
  if (!options.includeUnverified) query.isVerified = true;
  query.availability = { $ne: 'unavailable' };

  return User.find(query)
    .select('-password -verificationToken -resetPasswordToken')
    .limit(options.candidateLimit || 200);
}

async function findRankedMatches(caseData, limit = 10, options = {}) {
  const mode = options.mode || config.mode;
  const lawyers = await getEligibleLawyers(caseData, options);

  const ruleMatches = matchmaking.rankEligibleLawyers(lawyers, caseData, {
    minScore: options.minRuleScore ?? config.minRuleScore,
  });

  const shortlisted = ruleMatches.slice(0, options.shortlistLimit || config.shortlistLimit);
  const rescored = await scoreWithMl(caseData, shortlisted, {
    ...options,
    mode,
  });

  const ranked = rescored
    .sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      return b.ruleScore - a.ruleScore;
    })
    .slice(0, limit)
    .map((match) => ({
      lawyer: match.lawyer,
      score: Math.round(match.finalScore),
      ruleScore: Math.round(match.ruleScore),
      mlScore: typeof match.mlScore === 'number' ? Number(match.mlScore.toFixed(4)) : null,
      finalScore: Math.round(match.finalScore),
      matchReasons: match.matchReasons,
      detailedScores: match.detailedScores,
      modelVersion: match.modelVersion,
      matchSource: match.matchSource,
      mlFeatures: match.mlFeatures,
      mlError: match.mlError,
    }));

  await persistMatchEvents(caseData, ranked, {
    mode,
    stage: options.stage || 'shortlist',
    shownToUser: options.shownToUser,
    assigned: options.assigned,
  });

  return ranked;
}

module.exports = {
  findRankedMatches,
  computeFinalScore,
};
