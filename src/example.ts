/**
 * Example Usage of the Game Recommendation Engine
 * 
 * This file demonstrates how to use the recommendation engine with mock data.
 */

import {
  RecommendationEngine,
  CandidateDataSource,
  ChartDataSource,
  GameMetrics,
  Game,
  UserContext,
  UserHistory,
  AgeBand,
  Platform,
  GameFeature,
  ChartType,
  DEFAULT_CONFIG,
} from './index';

/**
 * Mock implementation of CandidateDataSource for demonstration
 */
class MockCandidateDataSource implements CandidateDataSource {
  async getTopGamesByGenres(genreVector: Map<number, number>, limit: number): Promise<Game[]> {
    return this.createMockGames(limit, false);
  }

  async getPopularGamesByAgeBand(ageBand: AgeBand, limit: number): Promise<Game[]> {
    return this.createMockGames(limit, false);
  }

  async getTrendingGames(limit: number): Promise<Game[]> {
    return this.createMockGames(limit, false);
  }

  async getEditorialPicks(limit: number): Promise<Game[]> {
    return this.createMockGames(limit, false);
  }

  async getSponsoredGames(limit: number): Promise<Game[]> {
    return this.createMockGames(limit, true);
  }

  private createMockGames(count: number, sponsored: boolean): Game[] {
    const games: Game[] = [];
    for (let i = 0; i < count; i++) {
      const genreVector = new Map<number, number>();
      genreVector.set(1, Math.random());
      genreVector.set(2, Math.random());

      const features = new Set<GameFeature>();
      if (Math.random() > 0.5) features.add(GameFeature.MULTIPLAYER);
      if (Math.random() > 0.7) features.add(GameFeature.SINGLE_PLAYER);
      if (Math.random() > 0.8) features.add(GameFeature.LOW_INTENSITY);

      const playsByAgeBand = new Map<AgeBand, number>();
      playsByAgeBand.set(AgeBand.UNDER_9, Math.floor(Math.random() * 10000));
      playsByAgeBand.set(AgeBand.AGE_9_TO_12, Math.floor(Math.random() * 15000));
      playsByAgeBand.set(AgeBand.AGE_13_PLUS, Math.floor(Math.random() * 20000));

      games.push({
        gameId: `game-${sponsored ? 'sponsored-' : ''}${i}`,
        minAgeBand: AgeBand.UNDER_9,
        moderationScore: 0.85 + Math.random() * 0.15,
        releaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        isSponsored: sponsored,
        sponsoredAmount: sponsored ? Math.floor(Math.random() * 5000) + 500 : 0, // $500-$5500 for sponsored
        genreVector,
        features,
        playsByAgeBand,
        totalSessions: Math.floor(Math.random() * 50000),
        uniquePlayers: Math.floor(Math.random() * 10000),
        currentSessions: Math.floor(Math.random() * 1000),
        totalRevenue: Math.floor(Math.random() * 100000),
        likes: Math.floor(Math.random() * 5000),
        totalPlays: Math.floor(Math.random() * 30000),
      });
    }
    return games;
  }
}

/**
 * Mock implementation of ChartDataSource for demonstration
 */
class MockChartDataSource implements ChartDataSource {
  async getGameMetrics(
    gameId: string,
    ageBand: AgeBand,
    platform: Platform
  ): Promise<GameMetrics> {
    return {
      playsLast7Days: Math.floor(Math.random() * 5000),
      playsPrev7Days: Math.floor(Math.random() * 4000),
      playsLast30Days: Math.floor(Math.random() * 15000),
      totalSessions: Math.floor(Math.random() * 50000),
      uniquePlayers: Math.floor(Math.random() * 10000),
      currentSessions: Math.floor(Math.random() * 1000),
      totalRevenue: Math.floor(Math.random() * 100000),
      likes: Math.floor(Math.random() * 5000),
      totalPlays: Math.floor(Math.random() * 30000),
    };
  }

  async fetchGamesByAgeAndPlatform(
    ageBand: AgeBand,
    platform: Platform
  ): Promise<Game[]> {
    const mockDataSource = new MockCandidateDataSource();
    return mockDataSource.getPopularGamesByAgeBand(ageBand, 100);
  }
}

/**
 * Example usage
 */
async function example() {
  console.log('🎮 Game Recommendation Engine - Example Usage\n');

  // Initialize data sources
  const candidateDataSource = new MockCandidateDataSource();
  const chartDataSource = new MockChartDataSource();

  // Create recommendation engine
  const engine = new RecommendationEngine(
    DEFAULT_CONFIG,
    candidateDataSource,
    chartDataSource,
    true // Enable sponsored content
  );

  // Create user context
  const userGenreVector = new Map<number, number>();
  userGenreVector.set(1, 0.8); // Action games
  userGenreVector.set(2, 0.6); // Adventure games

  const userContext: UserContext = {
    userId: 'user-123',
    ageBand: AgeBand.AGE_9_TO_12,
    platform: Platform.PC,
    genreVector: userGenreVector,
  };

  // Create user history
  const userHistory: UserHistory = {
    longPlayGames: ['game-1', 'game-5', 'game-10'],
    likedGames: ['game-2', 'game-7', 'game-12'],
    heavilyPlayed: new Set(['game-1']),
  };

  // Generate recommendations
  console.log('Generating personalized recommendations...\n');
  const recommendations = await engine.generateRecommendations(
    userContext,
    userHistory
  );

  console.log(`✅ Generated ${recommendations.length} recommendation buckets:\n`);
  for (const bucket of recommendations) {
    console.log(`  📦 ${bucket.title} (${bucket.id})`);
    console.log(`     ${bucket.games.length} games: ${bucket.games.slice(0, 3).join(', ')}${bucket.games.length > 3 ? '...' : ''}\n`);
  }

  // Generate charts
  console.log('Generating algorithmic charts...\n');

  const trendingChart = await engine.generateChart(
    ChartType.TOP_TRENDING,
    AgeBand.AGE_9_TO_12,
    Platform.PC,
    10
  );

  console.log('📈 Top Trending Chart:');
  for (const entry of trendingChart.slice(0, 5)) {
    console.log(`  ${entry.rank}. ${entry.gameId} (score: ${entry.score.toFixed(2)})`);
  }
  console.log();

  const topPlayingChart = await engine.generateChart(
    ChartType.TOP_PLAYING_NOW,
    AgeBand.AGE_9_TO_12,
    Platform.PC,
    10
  );

  console.log('🎯 Top Playing Now Chart:');
  for (const entry of topPlayingChart.slice(0, 5)) {
    console.log(`  ${entry.rank}. ${entry.gameId} (${entry.score} players)`);
  }
  console.log();

  console.log('✨ Example completed successfully!');
}

// Run example if this file is executed directly
if (require.main === module) {
  example().catch((error) => {
    console.error('Error running example:', error);
    process.exit(1);
  });
}

export { example };
