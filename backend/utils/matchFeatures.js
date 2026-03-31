const normalizeCategory = (category = '') => {
  const normalized = String(category).trim().toLowerCase();
  const map = {
    'civil law': 'Civil',
    'criminal law': 'Criminal',
    'corporate law': 'Corporate',
    'family law': 'Family',
    'property law': 'Real Estate',
    'constitutional law': 'Constitutional',
    'tax law': 'Tax',
    'intellectual property': 'IP',
    'labor law': 'Employment',
    'real estate law': 'Real Estate',
    'consumer law': 'Civil',
    'cyber law': 'Criminal',
  };

  return map[normalized] || 'Civil';
};

const normalizePriority = (priority = 'medium') => {
  const map = {
    low: 2,
    medium: 3,
    high: 4,
    urgent: 5,
  };

  return map[String(priority).toLowerCase()] || 3;
};

const normalizeState = (state = '') => {
  const states = {
    'andhra pradesh': 0,
    'arunachal pradesh': 1,
    assam: 2,
    bihar: 3,
    chhattisgarh: 4,
    goa: 5,
    gujarat: 6,
    haryana: 7,
    'himachal pradesh': 8,
    jharkhand: 9,
    karnataka: 10,
    kerala: 11,
    'madhya pradesh': 12,
    maharashtra: 13,
    manipur: 14,
    meghalaya: 15,
    mizoram: 16,
    nagaland: 17,
    odisha: 18,
    punjab: 19,
    rajasthan: 20,
    sikkim: 21,
    'tamil nadu': 22,
    telangana: 23,
    tripura: 24,
    'uttar pradesh': 25,
    uttarakhand: 26,
    'west bengal': 27,
    delhi: 28,
    puducherry: 29,
    chandigarh: 30,
  };

  return states[String(state).trim().toLowerCase()] ?? 31;
};

const calculateLanguageMatch = (caseLanguages = [], lawyerLanguages = []) => {
  if (!lawyerLanguages.length) return 0;
  if (!caseLanguages.length) return lawyerLanguages.includes('English') ? 1 : 0.5;

  const normalizedCase = caseLanguages.map((lang) => String(lang).toLowerCase());
  const normalizedLawyer = lawyerLanguages.map((lang) => String(lang).toLowerCase());
  const overlap = normalizedLawyer.filter((lang) => normalizedCase.includes(lang));

  return overlap.length ? Math.min(overlap.length / normalizedCase.length, 1) : 0;
};

const calculateSpecializationMatch = (category = '', specializations = []) => {
  const normalizedCategory = String(category).toLowerCase();
  const normalizedSpecs = specializations.map((spec) => String(spec).toLowerCase());
  return normalizedSpecs.some((spec) => spec === normalizedCategory) ? 1 : 0;
};

const calculateCostPreference = (budget, hourlyRate) => {
  const maxBudget = Number(budget?.max ?? budget?.min ?? 0);
  const rate = Number(hourlyRate || 0);
  if (!maxBudget || !rate) return 0.5;
  if (maxBudget >= rate) return 1;
  return Math.max(0, Math.min(maxBudget / rate, 1));
};

const calculateCaseload = (lawyer = {}) => {
  const total = Number(lawyer.totalCases || 0);
  const completed = Number(lawyer.completedCases || 0);
  return Math.max(0, Math.min(total - completed, 20));
};

function buildMlFeatures(caseData, lawyer) {
  const category = normalizeCategory(caseData.category);
  const clientState = normalizeState(caseData.location?.state);
  const lawyerState = normalizeState(lawyer.location?.state);
  const caseLanguages = Array.isArray(caseData.languages)
    ? caseData.languages
    : caseData.language
      ? [caseData.language]
      : ['English'];
  const lawyerLanguages = Array.isArray(lawyer.languages)
    ? lawyer.languages
    : lawyer.language
      ? [lawyer.language]
      : ['English'];

  return {
    case_duration_months: Math.max(1, Math.min(Number(caseData.estimatedDuration || 6), 120)),
    legal_domain: category,
    case_complexity: normalizePriority(caseData.priority),
    client_budget: Number(caseData.budget?.max ?? caseData.budget?.min ?? 0),
    lawyer_experience_years: Number(lawyer.experience || 0),
    lawyer_success_rate: lawyer.totalCases
      ? Math.round((Number(lawyer.completedCases || 0) / Number(lawyer.totalCases || 1)) * 100)
      : 0,
    client_location: clientState,
    lawyer_location: lawyerState,
    language_match: calculateLanguageMatch(caseLanguages, lawyerLanguages),
    availability_match: lawyer.availability === 'available' ? 1 : lawyer.availability === 'busy' ? 0.5 : 0,
    cost_preference: calculateCostPreference(caseData.budget, lawyer.hourlyRate),
    specialization_match: calculateSpecializationMatch(caseData.category, lawyer.specialization || []),
    communication_style: 3,
    case_urgency: normalizePriority(caseData.priority),
    lawyer_caseload: calculateCaseload(lawyer),
  };
}

module.exports = {
  buildMlFeatures,
  calculateLanguageMatch,
  calculateSpecializationMatch,
  calculateCostPreference,
};
