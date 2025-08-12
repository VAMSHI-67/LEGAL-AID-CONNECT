const User = require('../models/User');

/**
 * Intelligent Matchmaking Algorithm for LegalAid Connect
 * 
 * Scoring weights:
 * - Domain Match: 40%
 * - Location Proximity: 25%
 * - Lawyer Availability: 15%
 * - Lawyer Rating/Experience: 10%
 * - Language Preference Match: 10%
 */

class MatchmakingAlgorithm {
  constructor() {
    this.weights = {
      domainMatch: 0.40,
      locationProximity: 0.25,
      availability: 0.15,
      ratingExperience: 0.10,
      languageMatch: 0.10
    };
  }

  /**
   * Calculate match score for a lawyer against a case
   * @param {Object} lawyer - Lawyer object
   * @param {Object} caseData - Case data
   * @returns {Object} Match score and reasons
   */
  calculateMatchScore(lawyer, caseData) {
    const scores = {
      domainMatch: this.calculateDomainMatch(lawyer.specialization, caseData.category),
      locationProximity: this.calculateLocationProximity(lawyer.location, caseData.location),
      availability: this.calculateAvailabilityScore(lawyer.availability),
      ratingExperience: this.calculateRatingExperienceScore(lawyer.rating, lawyer.experience),
      languageMatch: this.calculateLanguageMatch(lawyer.languages, caseData.language || ['English'])
    };

    const totalScore = this.calculateWeightedScore(scores);
    const matchReasons = this.generateMatchReasons(scores, lawyer, caseData);

    return {
      score: totalScore,
      scores,
      matchReasons
    };
  }

  /**
   * Calculate domain match score
   * @param {Array} lawyerSpecializations - Lawyer's specializations
   * @param {String} caseCategory - Case category
   * @returns {Number} Score from 0-100
   */
  calculateDomainMatch(lawyerSpecializations, caseCategory) {
    if (!lawyerSpecializations || !caseCategory) return 0;

    // Exact match gets full score
    if (lawyerSpecializations.includes(caseCategory)) {
      return 100;
    }

    // Check for related domains (you can expand this mapping)
    const relatedDomains = this.getRelatedDomains(caseCategory);
    const relatedMatches = lawyerSpecializations.filter(spec => 
      relatedDomains.includes(spec)
    );

    if (relatedMatches.length > 0) {
      return 75; // Good match for related domains
    }

    return 0; // No match
  }

  /**
   * Calculate location proximity score
   * @param {Object} lawyerLocation - Lawyer's location
   * @param {Object} caseLocation - Case location
   * @returns {Number} Score from 0-100
   */
  calculateLocationProximity(lawyerLocation, caseLocation) {
    if (!lawyerLocation || !caseLocation) return 0;

    // Exact district match
    if (lawyerLocation.district === caseLocation.district) {
      return 100;
    }

    // Same state match
    if (lawyerLocation.state === caseLocation.state) {
      return 70;
    }

    // Neighboring states (you can expand this mapping)
    const neighboringStates = this.getNeighboringStates(caseLocation.state);
    if (neighboringStates.includes(lawyerLocation.state)) {
      return 40;
    }

    return 10; // Minimum score for any location
  }

  /**
   * Calculate availability score
   * @param {String} availability - Lawyer's availability status
   * @returns {Number} Score from 0-100
   */
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

  /**
   * Calculate rating and experience score
   * @param {Number} rating - Lawyer's rating (0-5)
   * @param {Number} experience - Years of experience
   * @returns {Number} Score from 0-100
   */
  calculateRatingExperienceScore(rating, experience) {
    // Rating component (60% weight)
    const ratingScore = (rating / 5) * 60;
    
    // Experience component (40% weight)
    const experienceScore = Math.min(experience / 20, 1) * 40; // Cap at 20 years
    
    return Math.round(ratingScore + experienceScore);
  }

  /**
   * Calculate language match score
   * @param {Array} lawyerLanguages - Languages lawyer speaks
   * @param {Array} caseLanguages - Languages required for case
   * @returns {Number} Score from 0-100
   */
  calculateLanguageMatch(lawyerLanguages, caseLanguages) {
    if (!lawyerLanguages || !caseLanguages) return 0;

    const commonLanguages = lawyerLanguages.filter(lang => 
      caseLanguages.includes(lang)
    );

    if (commonLanguages.length === 0) return 0;
    if (commonLanguages.length >= caseLanguages.length) return 100;
    
    return Math.round((commonLanguages.length / caseLanguages.length) * 100);
  }

  /**
   * Calculate weighted total score
   * @param {Object} scores - Individual scores
   * @returns {Number} Weighted total score
   */
  calculateWeightedScore(scores) {
    let totalScore = 0;
    
    for (const [key, score] of Object.entries(scores)) {
      totalScore += score * this.weights[key];
    }
    
    return Math.round(totalScore);
  }

  /**
   * Generate match reasons for transparency
   * @param {Object} scores - Individual scores
   * @param {Object} lawyer - Lawyer object
   * @param {Object} caseData - Case data
   * @returns {Array} Array of match reasons
   */
  generateMatchReasons(scores, lawyer, caseData) {
    const reasons = [];

    if (scores.domainMatch >= 75) {
      reasons.push(`Expertise in ${caseData.category}`);
    }

    if (scores.locationProximity >= 70) {
      reasons.push(`Located in ${lawyer.location.state}`);
    }

    if (scores.availability >= 60) {
      reasons.push('Currently available for new cases');
    }

    if (scores.ratingExperience >= 70) {
      reasons.push(`Highly rated (${lawyer.rating}/5) with ${lawyer.experience} years experience`);
    }

    if (scores.languageMatch >= 50) {
      const commonLanguages = lawyer.languages.filter(lang => 
        (caseData.language || ['English']).includes(lang)
      );
      reasons.push(`Speaks ${commonLanguages.join(', ')}`);
    }

    return reasons;
  }

  /**
   * Find matched lawyers for a case
   * @param {Object} caseData - Case data
   * @param {Number} limit - Number of matches to return
   * @returns {Array} Array of matched lawyers with scores
   */
  async findMatchedLawyers(caseData, limit = 10) {
    try {
      // Build query for eligible lawyers
      const query = {
        role: 'lawyer',
        isActive: true,
        isVerified: true
      };

      // Add location filter if specified
      if (caseData.location) {
        if (caseData.location.state) {
          query['location.state'] = caseData.location.state;
        }
      }

      // Add availability filter
      query.availability = { $ne: 'unavailable' };

      // Find eligible lawyers
      const eligibleLawyers = await User.find(query)
        .select('-password -verificationToken -resetPasswordToken')
        .limit(50); // Limit initial search

      // Calculate scores for each lawyer
      const scoredLawyers = eligibleLawyers.map(lawyer => {
        const matchResult = this.calculateMatchScore(lawyer, caseData);
        return {
          lawyer: lawyer.toJSON(),
          score: matchResult.score,
          matchReasons: matchResult.matchReasons,
          detailedScores: matchResult.scores
        };
      });

      // Sort by score and return top matches
      return scoredLawyers
        .filter(match => match.score > 30) // Minimum threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error in findMatchedLawyers:', error);
      throw error;
    }
  }

  /**
   * Get related legal domains
   * @param {String} category - Primary category
   * @returns {Array} Related categories
   */
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
      'Education Law': ['Constitutional Law', 'Civil Law']
    };

    return domainRelations[category] || [];
  }

  /**
   * Get neighboring states (simplified mapping)
   * @param {String} state - State name
   * @returns {Array} Neighboring states
   */
  getNeighboringStates(state) {
    // This is a simplified mapping - you can expand this
    const neighboringStates = {
      'California': ['Oregon', 'Nevada', 'Arizona'],
      'New York': ['New Jersey', 'Pennsylvania', 'Connecticut'],
      'Texas': ['New Mexico', 'Oklahoma', 'Arkansas', 'Louisiana'],
      'Florida': ['Georgia', 'Alabama'],
      'Illinois': ['Wisconsin', 'Indiana', 'Kentucky', 'Missouri', 'Iowa']
    };

    return neighboringStates[state] || [];
  }

  /**
   * Optimize matchmaking for specific criteria
   * @param {Object} caseData - Case data
   * @param {Object} preferences - User preferences
   * @returns {Array} Optimized matches
   */
  async findOptimizedMatches(caseData, preferences = {}) {
    const baseMatches = await this.findMatchedLawyers(caseData, 20);

    // Apply additional filters based on preferences
    let filteredMatches = baseMatches;

    // Filter by minimum rating
    if (preferences.minRating) {
      filteredMatches = filteredMatches.filter(match => 
        match.lawyer.rating >= preferences.minRating
      );
    }

    // Filter by experience range
    if (preferences.minExperience) {
      filteredMatches = filteredMatches.filter(match => 
        match.lawyer.experience >= preferences.minExperience
      );
    }

    // Filter by budget range
    if (preferences.maxHourlyRate) {
      filteredMatches = filteredMatches.filter(match => 
        !match.lawyer.hourlyRate || match.lawyer.hourlyRate <= preferences.maxHourlyRate
      );
    }

    // Recalculate scores with preference weights
    if (preferences.priorityFactors) {
      filteredMatches = filteredMatches.map(match => {
        const adjustedScore = this.adjustScoreForPreferences(
          match.detailedScores, 
          preferences.priorityFactors
        );
        return { ...match, score: adjustedScore };
      });

      // Re-sort by adjusted scores
      filteredMatches.sort((a, b) => b.score - a.score);
    }

    return filteredMatches.slice(0, preferences.limit || 10);
  }

  /**
   * Adjust score based on user preferences
   * @param {Object} scores - Detailed scores
   * @param {Object} priorityFactors - User priority factors
   * @returns {Number} Adjusted score
   */
  adjustScoreForPreferences(scores, priorityFactors) {
    let adjustedScore = 0;
    
    for (const [factor, weight] of Object.entries(priorityFactors)) {
      if (scores[factor] !== undefined) {
        adjustedScore += scores[factor] * weight;
      }
    }
    
    return Math.round(adjustedScore);
  }
}

module.exports = new MatchmakingAlgorithm(); 