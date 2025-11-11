const { matchLawyer } = require('../src/matchLawyer');
const { lawyers, clients } = require('./mockData');

describe('matchLawyer', () => {
  test('Divorce case matches highest-scoring Family lawyer in client city', () => {
    const client = clients[0]; // Hyderabad, Divorce
    const result = matchLawyer(client, lawyers);
    expect(result).toBeDefined();
    expect(result.specialization).toBe('Family');
    expect(result.city).toBe('Hyderabad');
    // Should be Alice Family (highest score, available)
    expect(result.name).toBe('Alice Family');
  });

  test('Fraud case in Bangalore prefers Cyber lawyer over Corporate if rating is higher', () => {
    const client = clients[1]; // Bangalore, Fraud
    // Charlie Cyber has higher rating than Dave Corporate
    let foundCyber = false, foundCorporate = false;
    for (let i = 0; i < 10; i++) {
      const result = matchLawyer(client, lawyers);
      if (result.specialization === 'Cyber') foundCyber = true;
      if (result.specialization === 'Corporate') foundCorporate = true;
    }
    expect(foundCyber).toBe(true);
    // Both are possible, but Cyber should be preferred if rating is higher
    const result = matchLawyer(client, lawyers);
    expect(result.specialization).toBe('Cyber');
  });

  test('No lawyer available returns null', () => {
    const unavailableLawyers = lawyers.map(l => ({ ...l, available: false }));
    const client = clients[0];
    const result = matchLawyer(client, unavailableLawyers);
    expect(result).toBeNull();
  });

  test('Fairness: two lawyers with equal scores chosen randomly', () => {
    // Make two Family lawyers with equal scores and available
    const fairLawyers = [
      { id: 6, name: 'F1', specialization: 'Family', city: 'Hyderabad', available: true, experience: 10, rating: 4.5, casesWon: 20, casesTotal: 25 },
      { id: 7, name: 'F2', specialization: 'Family', city: 'Hyderabad', available: true, experience: 10, rating: 4.5, casesWon: 20, casesTotal: 25 }
    ];
    const client = clients[0];
    const results = new Set();
    for (let i = 0; i < 10; i++) {
      const result = matchLawyer(client, fairLawyers);
      results.add(result.name);
    }
    expect(results.size).toBeGreaterThan(1); // Should pick both at least once
  });

  test('Extensibility: easy to adjust weights', () => {
    const client = clients[0];
    // All weights to experience
    const resultExp = matchLawyer(client, lawyers, { experience: 1, rating: 0, success: 0 });
    // All weights to rating
    const resultRating = matchLawyer(client, lawyers, { experience: 0, rating: 1, success: 0 });
    expect(resultExp).not.toBe(resultRating);
  });
});
