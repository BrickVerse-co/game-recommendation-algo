/**
 * Main Recommendation Pipeline
 * 
 * Orchestrates all components of the recommendation engine.
 */

import { CandidateGenerator, CandidateDataSource } from './candidateGenerator';
import { EligibilityFilter } from './eligibilityFilter';
import { ScoringEngine } from './scoringEngine';
import { DiversityPass } from './diversityPass';
import { SponsoredInjector, BucketOrganizer } from './bucketOrganizer';
import { ChartGenerator, ChartDataSource } from './chartGenerator';
import {
  UserContext,
  UserHistory,
  RecommendationBucket,
  RecommendationConfig,
  ScoredGame,
  Game,
  AgeBand,
  Platform,
  ChartEntry,
  ChartType,
  GenreId,
} from './types';

/**
 * Main recommendation engine pipeline
 */
export class RecommendationEngine {
  private candidateGenerator: CandidateGenerator;
  private eligibilityFilter: EligibilityFilter;
  private scoringEngine: ScoringEngine;
  private diversityPass: DiversityPass;
  private sponsoredInjector: SponsoredInjector;
  private bucketOrganizer: BucketOrganizer;
  private chartGenerator: ChartGenerator;

  constructor(
    private config: RecommendationConfig,
    candidateDataSource: CandidateDataSource,
    chartDataSource: ChartDataSource,
    sponsoredEnabled: boolean = true
  ) {
    this.candidateGenerator = new CandidateGenerator(
      candidateDataSource,
      sponsoredEnabled
    );
    this.eligibilityFilter = new EligibilityFilter({
      moderationThreshold: config.moderationThreshold,
    });
    this.scoringEngine = new ScoringEngine(config);
    this.diversityPass = new DiversityPass(config);
    this.sponsoredInjector = new SponsoredInjector(config.maxSponsoredPerList);
    this.bucketOrganizer = new BucketOrganizer();
    this.chartGenerator = new ChartGenerator(chartDataSource);
  }

  /**
   * Generate personalized recommendations for a user
   * Main pipeline execution
   */
  async generateRecommendations(
    userContext: UserContext,
    userHistory: UserHistory
  ): Promise<RecommendationBucket[]> {
    // Stage 1: Generate candidates
    const candidates = await this.candidateGenerator.generateCandidates(
      userContext
    );

    // Stage 2: Apply eligibility and safety filtering
    const eligible = this.eligibilityFilter.filterEligible(candidates, userContext);

    // Stage 3: Score games
    const scored = this.scoringEngine.scoreGames(eligible, userContext, userHistory);

    // Stage 4: Apply diversity pass
    const diversified = this.diversityPass.diversify(scored);

    // Stage 5: Inject sponsored content
    const sponsoredGames = scored.filter((sg) => sg.game.isSponsored);
    const withSponsored = this.sponsoredInjector.injectSponsored(
      diversified,
      sponsoredGames
    );

    // Stage 6: Organize into buckets
    const popularGames = await this.getPopularGames(userContext);
    const trendingGames = await this.getTrendingGames(userContext);

    const buckets = this.bucketOrganizer.organizeBuckets(
      withSponsored,
      popularGames,
      trendingGames,
      sponsoredGames
    );

    return buckets;
  }

  /**
   * Generate a specific chart
   */
  async generateChart(
    chartType: ChartType,
    ageBand: AgeBand,
    platform: Platform,
    limit: number = 50,
    genreId?: GenreId
  ): Promise<ChartEntry[]> {
    switch (chartType) {
      case ChartType.TOP_TRENDING:
        return this.chartGenerator.generateTopTrending(ageBand, platform, limit);

      case ChartType.UP_AND_COMING:
        return this.chartGenerator.generateUpAndComing(ageBand, platform, limit);

      case ChartType.TOP_PLAYING_NOW:
        return this.chartGenerator.generateTopPlayingNow(ageBand, platform, limit);

      case ChartType.TOP_REPLAYED:
        return this.chartGenerator.generateTopReplayed(ageBand, platform, limit);

      case ChartType.TOP_EARNING:
        return this.chartGenerator.generateTopEarning(ageBand, platform, limit);

      case ChartType.TOP_RATED:
        return this.chartGenerator.generateTopRated(ageBand, platform, limit);

      case ChartType.TRENDING_IN_GENRE:
        if (!genreId) {
          throw new Error('genreId is required for TRENDING_IN_GENRE chart');
        }
        return this.chartGenerator.generateTrendingInGenre(
          genreId,
          ageBand,
          platform,
          limit
        );

      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }
  }

  /**
   * Helper: Get popular games for user's age band
   */
  private async getPopularGames(userContext: UserContext): Promise<ScoredGame[]> {
    const popularGames = await this.candidateGenerator.getPopularGamesByAgeBand(
      userContext.ageBand,
      20
    );

    const eligible = this.eligibilityFilter.filterEligible(
      popularGames,
      userContext
    );

    return eligible.map((game) => ({
      game,
      score: 0,
      breakdown: {
        genreAffinity: 0,
        ageBandPopularity: 0,
        engagementSimilarity: 0,
        favouriteAffinity: 0,
        communityRating: 0,
        recencyBoost: 0,
        sponsoredBoost: 0,
        repetitionPenalty: 0,
        creationRecencyPenalty: 0,
      },
    }));
  }

  /**
   * Helper: Get trending games
   */
  private async getTrendingGames(userContext: UserContext): Promise<ScoredGame[]> {
    const trendingEntries = await this.chartGenerator.generateTopTrending(
      userContext.ageBand,
      userContext.platform,
      20
    );

    // This would need to fetch the actual game objects
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get configuration
   */
  getConfig(): RecommendationConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RecommendationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.scoringEngine = new ScoringEngine(this.config);
    this.diversityPass = new DiversityPass(this.config);
  }
}
