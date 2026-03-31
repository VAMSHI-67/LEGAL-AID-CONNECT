const axios = require('axios');
const matchmakingConfig = require('../config/matchmaking');

const extractScore = (payload = {}) => {
  if (typeof payload.match_score === 'number') return payload.match_score;
  if (typeof payload.score === 'number') return payload.score;
  if (typeof payload.match_probability === 'number') return payload.match_probability;
  if (payload.data) return extractScore(payload.data);
  return null;
};

const extractModelVersion = (payload = {}) => {
  return payload.model_version || payload.modelVersion || 'ml-service';
};

async function scoreCandidate(features, options = {}) {
  const url = options.mlServiceUrl || matchmakingConfig.mlServiceUrl;
  const timeout = options.timeoutMs || matchmakingConfig.requestTimeoutMs;
  const response = await axios.post(url, { features }, { timeout });
  const score = extractScore(response.data);

  if (typeof score !== 'number') {
    throw new Error('ML service returned no usable score');
  }

  return {
    score,
    modelVersion: extractModelVersion(response.data),
    raw: response.data,
  };
}

module.exports = {
  scoreCandidate,
};
