const User = require('../models/User');

class MatchmakingAlgorithm {
  constructor() {
    this.weights = {
      domainMatch: 0.4,
      locationProximity: 0.25,
      availability: 0.15,
      ratingExperience: 0.1,
      languageMatch: 0.1,
    };
  }

  calculateMatchScore(lawyer, caseData) {
    const caseLanguages = Array.isArray(caseData.language)
      ? caseData.language
      : Array.isArray(caseData.languages)
        ? caseData.languages
        : caseData.language
          ? [caseData.language]
          : ['English'];

    const scores = {
      domainMatch: this.calculateDomainMatch(lawyer.specialization, caseData.category),
      locationProximity: this.calculateLocationProximity(lawyer.location, caseData.location),
      availability: this.calculateAvailabilityScore(lawyer.availability),
      ratingExperience: this.calculateRatingExperienceScore(lawyer.rating, lawyer.experience),
      languageMatch: this.calculateLanguageMatch(lawyer.languages, caseLanguages),
    };

    return {
      score: this.calculateWeightedScore(scores),
      scores,
      matchReasons: this.generateMatchReasons(scores, lawyer, caseData),
    };
  }

  calculateDomainMatch(lawyerSpecializations, caseCategory) {
    if (!lawyerSpecializations || !caseCategory) return 0;
    const normalizedSpecs = lawyerSpecializations.map((spec) => String(spec || '').trim().toLowerCase());
    const normalizedCategory = String(caseCategory || '').trim().toLowerCase();

    const variants = new Set();
    normalizedSpecs.forEach((spec) => {
      variants.add(spec);
      if (!spec.endsWith(' law')) variants.add(`${spec} law`);
      if (spec.endsWith(' law')) variants.add(spec.replace(/ law$/, ''));
    });

    if (variants.has(normalizedCategory)) return 100;

    const relatedDomains = this.getRelatedDomains(caseCategory).map((domain) =>
      String(domain).trim().toLowerCase()
    );

    return [...variants].some((variant) => relatedDomains.includes(variant)) ? 75 : 0;
  }

  calculateLocationProximity(lawyerLocation, caseLocation) {
    if (!lawyerLocation || !caseLocation) return 0;

    const lState = String(lawyerLocation.state || '').toLowerCase().replace(/\s+state$/i, '');
    const cState = String(caseLocation.state || '').toLowerCase().replace(/\s+state$/i, '');
    const lDistrict = String(lawyerLocation.district || '').toLowerCase();
    const cDistrict = String(caseLocation.district || '').toLowerCase();

    if (lDistrict && cDistrict && lDistrict === cDistrict) return 100;
    if (lState && cState && lState === cState) return 70;

    const neighbors = this.getNeighboringStates(caseLocation.state || '').map((state) =>
      String(state).toLowerCase()
    );
    return neighbors.includes(lState) ? 40 : 10;
  }

  calculateAvailabilityScore(availability) {
    switch (availability) {
      case 'available':
        return 100;
      case 'busy':
        return 60;
      case 'unavailable':
        return 0;
      default:
        return 50;
    }
  }

  calculateRatingExperienceScore(rating, experience) {
    const ratingScore = (Number(rating || 0) / 5) * 60;
    const experienceScore = Math.min(Number(experience || 0) / 20, 1) * 40;
    return Math.round(ratingScore + experienceScore);
  }

  calculateLanguageMatch(lawyerLanguages, caseLanguages) {
    if (!lawyerLanguages || !caseLanguages) return 0;

    const normalizedLawyer = lawyerLanguages.map((lang) => String(lang).toLowerCase());
    const normalizedCase = caseLanguages.map((lang) => String(lang).toLowerCase());
    const common = normalizedLawyer.filter((lang) => normalizedCase.includes(lang));

    if (common.length === 0) return 0;
    if (common.length >= normalizedCase.length) return 100;
    return Math.round((common.length / normalizedCase.length) * 100);
  }

  calculateWeightedScore(scores) {
    return Math.round(
      Object.entries(scores).reduce((total, [key, score]) => total + score * this.weights[key], 0)
    );
  }

  generateMatchReasons(scores, lawyer, caseData) {
    const reasons = [];

    if (scores.domainMatch >= 75) reasons.push(`Expertise in ${caseData.category}`);
    if (scores.locationProximity >= 70) reasons.push(`Located in ${lawyer.location?.state || 'target region'}`);
    if (scores.availability >= 60) reasons.push('Currently available for new cases');
    if (scores.ratingExperience >= 70) {
      reasons.push(`Highly rated (${lawyer.rating || 0}/5) with ${lawyer.experience || 0} years experience`);
    }
    if (scores.languageMatch >= 50) {
      const commonLanguages = (lawyer.languages || []).filter((lang) =>
        (caseData.language || caseData.languages || ['English']).includes(lang)
      );
      reasons.push(`Speaks ${commonLanguages.join(', ')}`);
    }

    return reasons;
  }

  rankEligibleLawyers(lawyers, caseData, options = {}) {
    const minScore = Number(options.minScore ?? 0);

    return lawyers
      .map((lawyer) => {
        const result = this.calculateMatchScore(lawyer.toJSON ? lawyer.toJSON() : lawyer, caseData);
        return {
          lawyer: lawyer.toJSON ? lawyer.toJSON() : lawyer,
          score: result.score,
          ruleScore: result.score,
          matchReasons: result.matchReasons,
          detailedScores: result.scores,
        };
      })
      .filter((match) => match.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }

  async findMatchedLawyers(caseData, limit = 10, options = {}) {
    try {
      const query = { role: 'lawyer', isActive: true };
      if (!options.includeUnverified) query.isVerified = true;
      query.availability = { $ne: 'unavailable' };

      let eligibleLawyers = await User.find(query)
        .select('-password -verificationToken -resetPasswordToken')
        .limit(200);

      if (caseData.location?.state && eligibleLawyers.length > 60) {
        const targetState = String(caseData.location.state).toLowerCase();
        const sameState = eligibleLawyers.filter(
          (lawyer) => lawyer.location?.state && lawyer.location.state.toLowerCase() === targetState
        );
        if (sameState.length) {
          const rest = eligibleLawyers.filter((lawyer) => !sameState.includes(lawyer));
          eligibleLawyers = [...sameState, ...rest];
        }
      }

      const ranked = this.rankEligibleLawyers(eligibleLawyers, caseData, {
        minScore: 25,
      });

      if (ranked.length > 0) return ranked.slice(0, limit);

      return eligibleLawyers
        .map((lawyer) => ({
          lawyer: lawyer.toJSON ? lawyer.toJSON() : lawyer,
          score: 0,
          ruleScore: 0,
          matchReasons: ['Baseline eligibility (low score)'],
          detailedScores: {
            domainMatch: 0,
            locationProximity: 0,
            availability: this.calculateAvailabilityScore(lawyer.availability),
            ratingExperience: this.calculateRatingExperienceScore(lawyer.rating, lawyer.experience),
            languageMatch: 0,
          },
        }))
        .slice(0, Math.min(limit, 5));
    } catch (error) {
      console.error('Error in findMatchedLawyers:', error);
      throw error;
    }
  }

  getRelatedDomains(category) {
    const domainRelations = {
      'Civil Law': ['Property Law', 'Family Law', 'Consumer Law'],
      'Criminal Law': ['Constitutional Law', 'Cyber Law'],
      'Corporate Law': ['Tax Law', 'Banking Law', 'Insurance Law'],
      'Family Law': ['Civil Law', 'Property Law'],
      'Property Law': ['Real Estate Law', 'Civil Law'],
      'Tax Law': ['Corporate Law', 'Banking Law'],
      'Intellectual Property': ['Corporate Law', 'Cyber Law'],
      'Labor Law': ['Corporate Law', 'Civil Law'],
      'Environmental Law': ['Property Law', 'Corporate Law'],
      'Banking Law': ['Corporate Law', 'Insurance Law'],
      'Insurance Law': ['Corporate Law', 'Banking Law'],
      'Real Estate Law': ['Property Law', 'Civil Law'],
      'Immigration Law': ['Constitutional Law', 'Civil Law'],
      'Consumer Law': ['Civil Law', 'Corporate Law'],
      'Cyber Law': ['Criminal Law', 'Intellectual Property'],
      'Media Law': ['Constitutional Law', 'Intellectual Property'],
      'Sports Law': ['Corporate Law', 'Labor Law'],
      'Healthcare Law': ['Corporate Law', 'Civil Law'],
      'Education Law': ['Constitutional Law', 'Civil Law'],
    };

    return domainRelations[category] || [];
  }

  getNeighboringStates(state) {
    const neighboringStates = {
      California: ['Oregon', 'Nevada', 'Arizona'],
      'New York': ['New Jersey', 'Pennsylvania', 'Connecticut'],
      Texas: ['New Mexico', 'Oklahoma', 'Arkansas', 'Louisiana'],
      Florida: ['Georgia', 'Alabama'],
      Illinois: ['Wisconsin', 'Indiana', 'Kentucky', 'Missouri', 'Iowa'],
    };

    return neighboringStates[state] || [];
  }
}

module.exports = new MatchmakingAlgorithm();
