const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeMode = (mode) => {
  const allowed = new Set(['rules', 'hybrid', 'ml']);
  return allowed.has(mode) ? mode : 'rules';
};

const config = {
  mode: normalizeMode(process.env.MATCHMAKING_MODE || 'rules'),
  enableMl: String(process.env.MATCHMAKING_ENABLE_ML || 'false').toLowerCase() === 'true',
  mlServiceUrl:
    process.env.ML_SERVICE_URL ||
    process.env.MATCHMAKING_ML_SERVICE_URL ||
    'http://localhost:8000/predict_match',
  ruleWeight: toNumber(process.env.MATCHMAKING_RULE_WEIGHT, 0.7),
  mlWeight: toNumber(process.env.MATCHMAKING_ML_WEIGHT, 0.3),
  minRuleScore: toNumber(process.env.MATCHMAKING_MIN_RULE_SCORE, 25),
  autoAssignThreshold: toNumber(process.env.MATCHMAKING_AUTO_ASSIGN_THRESHOLD, 40),
  shortlistLimit: toNumber(process.env.MATCHMAKING_SHORTLIST_LIMIT, 20),
  requestTimeoutMs: toNumber(process.env.MATCHMAKING_ML_TIMEOUT_MS, 5000),
  logEvents: String(process.env.MATCHMAKING_LOG_EVENTS || 'true').toLowerCase() !== 'false',
};

module.exports = config;
