jest.mock('../backend/models/User', () => ({
  find: jest.fn(),
}));

jest.mock('../backend/models/MatchEvent', () => ({
  insertMany: jest.fn().mockResolvedValue([]),
}));

jest.mock('../backend/utils/mlRankingClient', () => ({
  scoreCandidate: jest.fn(),
}));

const User = require('../backend/models/User');
const { scoreCandidate } = require('../backend/utils/mlRankingClient');
const { findRankedMatches } = require('../backend/utils/matchmakingPipeline');

describe('matchmakingPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const lawyers = [
    {
      _id: '1',
      role: 'lawyer',
      isActive: true,
      isVerified: true,
      specialization: ['Family Law'],
      location: { state: 'Telangana', district: 'Hyderabad' },
      availability: 'available',
      rating: 4.5,
      experience: 8,
      languages: ['English'],
      totalCases: 10,
      completedCases: 9,
      toJSON() {
        return { ...this };
      },
    },
    {
      _id: '2',
      role: 'lawyer',
      isActive: true,
      isVerified: true,
      specialization: ['Corporate Law'],
      location: { state: 'Maharashtra', district: 'Pune' },
      availability: 'busy',
      rating: 4.9,
      experience: 12,
      languages: ['English'],
      totalCases: 12,
      completedCases: 11,
      toJSON() {
        return { ...this };
      },
    },
  ];

  const caseData = {
    _id: 'case-1',
    clientId: 'client-1',
    category: 'Family Law',
    priority: 'high',
    location: { state: 'Telangana', district: 'Hyderabad' },
    budget: { min: 1000, max: 5000 },
    languages: ['English'],
  };

  test('returns rule-based ranking when ML is disabled', async () => {
    User.find.mockReturnValue({
      select: () => ({
        limit: async () => lawyers,
      }),
    });

    const matches = await findRankedMatches(caseData, 5, { includeUnverified: true });

    expect(matches[0].lawyer._id).toBe('1');
    expect(matches[0].matchSource).toBe('rules');
    expect(matches[0].mlScore).toBeNull();
    expect(scoreCandidate).not.toHaveBeenCalled();
  });

  test('uses ML ranking when enabled and falls back safely on ML error', async () => {
    User.find.mockReturnValue({
      select: () => ({
        limit: async () => lawyers,
      }),
    });

    scoreCandidate
      .mockResolvedValueOnce({ score: 0.2, modelVersion: 'ml-v1' })
      .mockRejectedValueOnce(new Error('service unavailable'));

    const matches = await findRankedMatches(caseData, 5, {
      includeUnverified: true,
      mode: 'hybrid',
      enableMl: true,
    });

    expect(matches).toHaveLength(2);
    expect(matches[0].matchSource).toMatch(/hybrid|rules-fallback/);
    expect(matches[0].finalScore).toBeGreaterThan(0);
    expect(matches[1].matchSource).toBe('rules-fallback');
    expect(matches[1].mlError).toBe('service unavailable');
  });
});
