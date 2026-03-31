const {
  buildMlFeatures,
  calculateLanguageMatch,
  calculateSpecializationMatch,
  calculateCostPreference,
} = require('../backend/utils/matchFeatures');

describe('matchFeatures', () => {
  test('builds a stable ML feature payload from case and lawyer data', () => {
    const features = buildMlFeatures(
      {
        category: 'Family Law',
        priority: 'urgent',
        location: { state: 'Telangana' },
        budget: { min: 1500, max: 5000 },
        languages: ['English', 'Hindi'],
        estimatedDuration: 12,
      },
      {
        experience: 7,
        completedCases: 8,
        totalCases: 10,
        location: { state: 'Telangana' },
        languages: ['English'],
        availability: 'available',
        hourlyRate: 2500,
        specialization: ['Family Law'],
      }
    );

    expect(features.case_duration_months).toBe(12);
    expect(features.legal_domain).toBe('Family');
    expect(features.case_urgency).toBe(5);
    expect(features.language_match).toBe(0.5);
    expect(features.specialization_match).toBe(1);
    expect(features.cost_preference).toBe(1);
  });

  test('derives helper scores consistently', () => {
    expect(calculateLanguageMatch(['English', 'Hindi'], ['Hindi'])).toBe(0.5);
    expect(calculateSpecializationMatch('Cyber Law', ['Civil Law'])).toBe(0);
    expect(calculateCostPreference({ max: 4000 }, 8000)).toBeCloseTo(0.5, 5);
  });
});
