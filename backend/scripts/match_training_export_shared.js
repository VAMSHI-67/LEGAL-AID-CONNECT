const fs = require('fs');
const path = require('path');

const { buildMlFeatures } = require('../utils/matchFeatures');
const matchmaking = require('../utils/matchmaking');

const OUTPUT_DIR = path.join(__dirname, '../../mlops/data/validation');
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'match_training_data.csv');
const OUTPUT_SUMMARY = path.join(OUTPUT_DIR, 'match_training_summary.json');

const priorityMap = {
  low: 1,
  medium: 3,
  high: 4,
  urgent: 5,
};

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toId(value) {
  if (!value) return '';
  return String(value._id || value);
}

function toBooleanNumber(value) {
  return value ? 1 : 0;
}

function getCaseLanguage(caseDoc) {
  if (Array.isArray(caseDoc.languages) && caseDoc.languages.length) return caseDoc.languages;
  if (caseDoc.language) return [caseDoc.language];
  if (caseDoc.clientId?.language?.length) return caseDoc.clientId.language;
  return ['English'];
}

function getLawyerSuccessRate(lawyer) {
  const totalCases = Number(lawyer.totalCases || 0);
  if (!totalCases) return 0;
  return Math.round((Number(lawyer.completedCases || 0) / totalCases) * 100);
}

function getFeatureSnapshot(caseDoc, lawyer) {
  const mlFeatures = buildMlFeatures(caseDoc, lawyer);
  const ruleMatch = matchmaking.calculateMatchScore(lawyer, caseDoc);

  return {
    mlFeatures,
    ruleScore: ruleMatch.score,
    ruleReasons: ruleMatch.matchReasons,
    detailedScores: ruleMatch.scores,
  };
}

function buildCandidateIndex(events, caseIds) {
  const allowed = new Set(caseIds.map((id) => toId(id)));
  const index = new Map();

  for (const event of events || []) {
    if (!allowed.has(toId(event.caseId))) continue;
    const key = `${toId(event.caseId)}:${toId(event.lawyerId)}`;
    if (!index.has(key)) {
      index.set(key, {
        assigned: false,
        accepted: false,
        declined: false,
        shownToUser: false,
        consultationBooked: false,
        caseCompleted: false,
        ruleScore: null,
        mlScore: null,
        finalScore: null,
        rankPosition: null,
        mode: event.mode || '',
        modelVersion: event.modelVersion || '',
        reasons: [],
      });
    }

    const current = index.get(key);
    current.assigned = current.assigned || Boolean(event.assigned) || event.stage === 'assigned';
    current.accepted = current.accepted || Boolean(event.accepted) || event.stage === 'accepted';
    current.declined = current.declined || Boolean(event.declined) || event.stage === 'declined';
    current.shownToUser = current.shownToUser || Boolean(event.shownToUser);
    current.consultationBooked = current.consultationBooked || Boolean(event.consultationBooked);
    current.caseCompleted = current.caseCompleted || Boolean(event.caseCompleted) || event.stage === 'completed';
    current.ruleScore = current.ruleScore ?? event.ruleScore ?? null;
    current.mlScore = current.mlScore ?? event.mlScore ?? null;
    current.finalScore = current.finalScore ?? event.finalScore ?? null;
    current.rankPosition = current.rankPosition ?? event.rankPosition ?? null;
    current.mode = current.mode || event.mode || '';
    current.modelVersion = current.modelVersion || event.modelVersion || '';
    current.reasons = current.reasons.length ? current.reasons : (event.reasons || []);
  }

  return index;
}

function buildBookingIndex(bookings, caseIds) {
  const allowed = new Set(caseIds.map((id) => toId(id)));
  const index = new Map();

  for (const booking of bookings || []) {
    if (!allowed.has(toId(booking.caseId))) continue;
    index.set(`${toId(booking.caseId)}:${toId(booking.lawyerId)}`, {
      booked: true,
      confirmed: booking.status === 'confirmed',
      cancelled: booking.status === 'cancelled',
    });
  }

  return index;
}

function buildAssignedCandidate(caseDoc) {
  if (!caseDoc.lawyerId) return [];
  return [{
    lawyer: caseDoc.lawyerId,
    assignedAt: caseDoc.assignedAt || caseDoc.updatedAt || caseDoc.createdAt,
    source: 'case-assignment',
  }];
}

function mergeCandidateSources(caseDoc, candidateIndex) {
  const merged = new Map();

  for (const candidate of buildAssignedCandidate(caseDoc)) {
    merged.set(toId(candidate.lawyer), candidate);
  }

  if (Array.isArray(caseDoc.assignmentHistory)) {
    for (const history of caseDoc.assignmentHistory) {
      if (!history.lawyerId) continue;
      const lawyerId = toId(history.lawyerId);
      if (!merged.has(lawyerId)) {
        merged.set(lawyerId, {
          lawyer: history.lawyerId,
          assignedAt: history.assignedAt || caseDoc.updatedAt || caseDoc.createdAt,
          source: history.reason || 'assignment-history',
        });
      }
    }
  }

  for (const [key] of candidateIndex.entries()) {
    const [caseId, lawyerId] = key.split(':');
    if (caseId !== toId(caseDoc._id)) continue;
    if (!merged.has(lawyerId)) {
      merged.set(lawyerId, {
        lawyer: lawyerId,
        assignedAt: caseDoc.updatedAt || caseDoc.createdAt,
        source: 'match-event',
      });
    }
  }

  return [...merged.values()];
}

function buildRows({ cases, usersById, events, bookings }) {
  const caseIds = cases.map((caseDoc) => caseDoc._id);
  const candidateIndex = buildCandidateIndex(events, caseIds);
  const bookingIndex = buildBookingIndex(bookings, caseIds);
  const rows = [];

  for (const caseDoc of cases) {
    const candidates = mergeCandidateSources(caseDoc, candidateIndex);
    if (!candidates.length) continue;

    for (const candidate of candidates) {
      const lawyer = usersById.get(toId(candidate.lawyer));
      if (!lawyer || lawyer.role !== 'lawyer') continue;

      const pairKey = `${toId(caseDoc._id)}:${toId(lawyer._id)}`;
      const eventData = candidateIndex.get(pairKey) || {};
      const bookingData = bookingIndex.get(pairKey) || {};
      const { mlFeatures, ruleScore, ruleReasons, detailedScores } = getFeatureSnapshot(caseDoc, lawyer);

      const assigned = eventData.assigned || toId(caseDoc.lawyerId) === toId(lawyer._id);
      const accepted = eventData.accepted || (assigned && caseDoc.lawyerAccepted === true);
      const declined = eventData.declined || false;
      const caseCompleted = eventData.caseCompleted || caseDoc.status === 'completed';
      const consultationBooked = eventData.consultationBooked || bookingData.booked || false;
      const consultationConfirmed = bookingData.confirmed || false;

      rows.push({
        case_id: toId(caseDoc._id),
        lawyer_id: toId(lawyer._id),
        client_id: toId(caseDoc.clientId),
        created_at: caseDoc.createdAt ? new Date(caseDoc.createdAt).toISOString() : '',
        assigned_at: candidate.assignedAt ? new Date(candidate.assignedAt).toISOString() : '',
        case_status: caseDoc.status || '',
        case_category: caseDoc.category || '',
        case_priority: caseDoc.priority || '',
        case_priority_score: priorityMap[String(caseDoc.priority || '').toLowerCase()] || 3,
        case_state: caseDoc.location?.state || '',
        case_district: caseDoc.location?.district || '',
        case_budget_min: Number(caseDoc.budget?.min || 0),
        case_budget_max: Number(caseDoc.budget?.max || 0),
        case_duration_days: Number(caseDoc.estimatedDuration || 0),
        client_languages: getCaseLanguage(caseDoc).join('|'),
        lawyer_state: lawyer.location?.state || '',
        lawyer_district: lawyer.location?.district || '',
        lawyer_specializations: Array.isArray(lawyer.specialization) ? lawyer.specialization.join('|') : '',
        lawyer_experience: Number(lawyer.experience || 0),
        lawyer_rating: Number(lawyer.rating || 0),
        lawyer_availability: lawyer.availability || '',
        lawyer_hourly_rate: Number(lawyer.hourlyRate || 0),
        lawyer_total_cases: Number(lawyer.totalCases || 0),
        lawyer_completed_cases: Number(lawyer.completedCases || 0),
        lawyer_success_rate: getLawyerSuccessRate(lawyer),
        lawyer_is_verified: toBooleanNumber(lawyer.isVerified),
        candidate_source: candidate.source || '',
        match_mode: eventData.mode || '',
        model_version: eventData.modelVersion || '',
        candidate_rank: Number(eventData.rankPosition || 0),
        event_rule_score: eventData.ruleScore ?? '',
        event_ml_score: eventData.mlScore ?? '',
        event_final_score: eventData.finalScore ?? '',
        recalculated_rule_score: ruleScore,
        domain_score: detailedScores.domainMatch,
        location_score: detailedScores.locationProximity,
        availability_score: detailedScores.availability,
        rating_experience_score: detailedScores.ratingExperience,
        language_score: detailedScores.languageMatch,
        rule_reasons: ruleReasons.join('|'),
        ml_case_duration_months: mlFeatures.case_duration_months,
        ml_legal_domain: mlFeatures.legal_domain,
        ml_case_complexity: mlFeatures.case_complexity,
        ml_client_budget: mlFeatures.client_budget,
        ml_lawyer_experience_years: mlFeatures.lawyer_experience_years,
        ml_lawyer_success_rate: mlFeatures.lawyer_success_rate,
        ml_client_location: mlFeatures.client_location,
        ml_lawyer_location: mlFeatures.lawyer_location,
        ml_language_match: mlFeatures.language_match,
        ml_availability_match: mlFeatures.availability_match,
        ml_cost_preference: mlFeatures.cost_preference,
        ml_specialization_match: mlFeatures.specialization_match,
        ml_communication_style: mlFeatures.communication_style,
        ml_case_urgency: mlFeatures.case_urgency,
        ml_lawyer_caseload: mlFeatures.lawyer_caseload,
        label_assigned: toBooleanNumber(assigned),
        label_accepted: toBooleanNumber(accepted),
        label_declined: toBooleanNumber(declined),
        label_consultation_booked: toBooleanNumber(consultationBooked),
        label_consultation_confirmed: toBooleanNumber(consultationConfirmed),
        label_completed: toBooleanNumber(caseCompleted),
        label_client_rating: Number(caseDoc.clientRating?.rating || 0),
        label_successful_outcome: toBooleanNumber(caseDoc.outcome?.status === 'successful'),
      });
    }
  }

  return rows;
}

function writeDataset(rows) {
  if (!rows.length) {
    console.warn('No candidate rows were generated. Export skipped.');
    return null;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const header = Object.keys(rows[0]);
  const csvLines = [
    header.join(','),
    ...rows.map((row) => header.map((column) => escapeCsv(row[column])).join(',')),
  ];

  fs.writeFileSync(OUTPUT_CSV, csvLines.join('\n'));

  const summary = {
    exportedAt: new Date().toISOString(),
    outputCsv: OUTPUT_CSV,
    rowCount: rows.length,
    caseCount: new Set(rows.map((row) => row.case_id)).size,
    lawyerCount: new Set(rows.map((row) => row.lawyer_id)).size,
    assignedPositiveRate: rows.filter((row) => row.label_assigned === 1).length / rows.length,
    acceptedPositiveRate: rows.filter((row) => row.label_accepted === 1).length / rows.length,
    completedPositiveRate: rows.filter((row) => row.label_completed === 1).length / rows.length,
    consultationBookedRate: rows.filter((row) => row.label_consultation_booked === 1).length / rows.length,
    fields: header,
  };

  fs.writeFileSync(OUTPUT_SUMMARY, JSON.stringify(summary, null, 2));
  return { csv: OUTPUT_CSV, summary: OUTPUT_SUMMARY, rowCount: rows.length };
}

module.exports = {
  buildRows,
  writeDataset,
  toId,
};
