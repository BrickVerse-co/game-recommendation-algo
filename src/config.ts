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
    recencyBoost: 0.5,
    sponsoredBoost: 0.3,
    repetitionPenalty: 2.0,
  },
  moderationThreshold: 0.8,
  recencyDecayDays: 90,
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
