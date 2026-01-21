/**
 * Main entry point for the Game Recommendation Engine
 */

// Export all types
export * from './types';

// Export main classes
export { CandidateGenerator, CandidateDataSource } from './candidateGenerator';
export { EligibilityFilter, EligibilityConfig } from './eligibilityFilter';
export { ScoringEngine } from './scoringEngine';
export { DiversityPass } from './diversityPass';
export { SponsoredInjector, BucketOrganizer } from './bucketOrganizer';
export { ChartGenerator, ChartDataSource, GameMetrics } from './chartGenerator';
export { RecommendationEngine } from './recommendationEngine';
export { DEFAULT_CONFIG } from './config';

// Re-export for convenience
import { RecommendationEngine } from './recommendationEngine';
import { DEFAULT_CONFIG } from './config';

export default RecommendationEngine;
export { DEFAULT_CONFIG as defaultConfig };
