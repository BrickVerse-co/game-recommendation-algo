/**
 * Default Configuration
 * 
 * Provides sensible defaults for the recommendation engine.
 */

import { RecommendationConfig } from './types';

/**
 * Default configuration for the recommendation engine
 */
export const DEFAULT_CONFIG: RecommendationConfig = {
  weights: {
    genreAffinity: 1.0,
    ageBandPopularity: 0.8,
    engagementSimilarity: 0.9,
    favouriteAffinity: 1.2,
    communityRating: 0.7,
    recencyBoost: 0.5,
    sponsoredBoost: 0.3,
    repetitionPenalty: 2.0,
    creationRecencyPenalty: 1.5, // Penalize very new games
  },
  moderationThreshold: 0.8,
  recencyDecayDays: 90,
  creationGracePeriodDays: 7, // Full penalty for first 7 days
  creationPenaltyMaxDays: 30, // Penalty decays to zero over 30 days
  sponsoredAmountMultiplier: 0.001, // $1000 sponsorship = 1.0 boost
  maxSponsoredBoost: 2.0, // Cap at 2.0 regardless of amount
  maxResults: 50,
  maxSponsoredPerList: 3,
  diversityRules: {
    minGenres: 2,
    maxPerGenre: 5,
    requireLowIntensity: true,
    avoidAllMultiplayer: true,
  },
};
