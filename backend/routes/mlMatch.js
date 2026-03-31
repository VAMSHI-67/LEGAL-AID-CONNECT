const express = require('express');
const axios = require('axios');
const matchmakingConfig = require('../config/matchmaking');

const router = express.Router();

const forwardToMlService = async (payload) => {
  const response = await axios.post(matchmakingConfig.mlServiceUrl, payload, {
    timeout: matchmakingConfig.requestTimeoutMs,
  });
  return response.data;
};

// POST /api/ml-match
// Supports single scoring and simple batch scoring.
router.post('/', async (req, res) => {
  try {
    if (Array.isArray(req.body?.pairs)) {
      const results = await Promise.all(
        req.body.pairs.map(async (pair) => {
          const data = await forwardToMlService({ features: pair.features || pair });
          return {
            lawyerId: pair.lawyerId || null,
            caseId: pair.caseId || null,
            score: data.match_score ?? data.score ?? data.match_probability ?? null,
            modelVersion: data.model_version || data.modelVersion || 'ml-service',
            raw: data,
          };
        })
      );
      return res.json({ success: true, data: { results } });
    }

    const payload = req.body?.features ? req.body : { features: req.body };
    const data = await forwardToMlService(payload);
    const score = data.match_score ?? data.score ?? data.match_probability ?? null;

    return res.json({
      success: true,
      data: {
        score,
        modelVersion: data.model_version || data.modelVersion || 'ml-service',
        raw: data,
      },
    });
  } catch (error) {
    const status = error.response?.status || 502;
    const message = error.response?.data || error.message || 'ML service unavailable';
    return res.status(status).json({ success: false, message });
  }
});

module.exports = router;


