/**
 * Chart Generation Module
 * 
 * Generates various algorithmic charts (Top Trending, Up & Coming, etc.)
 * based on aggregated, privacy-safe data.
 */

import { Game, AgeBand, Platform, ChartEntry, GenreId } from './types';

/**
 * Data source for chart metrics
 */
export interface ChartDataSource {
  getGameMetrics(
    gameId: string,
    ageBand: AgeBand,
    platform: Platform
  ): Promise<GameMetrics>;
  fetchGamesByAgeAndPlatform(
    ageBand: AgeBand,
    platform: Platform
  ): Promise<Game[]>;
}

/**
 * Game metrics for chart calculations
 */
export interface GameMetrics {
  playsLast7Days: number;
  playsPrev7Days: number;
  playsLast30Days: number;
  totalSessions: number;
  uniquePlayers: number;
  currentSessions: number;
  totalRevenue: number;
  likes: number;
  dislikes: number;
  favourites: number;
  totalPlays: number;
}

/**
 * Chart generator for algorithmic rankings
 */
export class ChartGenerator {
  constructor(private dataSource: ChartDataSource) {}

  /**
   * Generate Top Trending chart
   * Games with fastest recent growth
   */
  async generateTopTrending(
    ageBand: AgeBand,
    platform: Platform,
    limit: number = 50
  ): Promise<ChartEntry[]> {
    const candidates = await this.dataSource.fetchGamesByAgeAndPlatform(
      ageBand,
      platform
    );
    const chartList: ChartEntry[] = [];

    for (const game of candidates) {
      const metrics = await this.dataSource.getGameMetrics(
        game.gameId,
        ageBand,
        platform
      );

      let score: number;
      if (metrics.playsPrev7Days === 0) {
        score = metrics.playsLast7Days;
      } else {
        score =
          (metrics.playsLast7Days - metrics.playsPrev7Days) /
          metrics.playsPrev7Days;
      }

      chartList.push({
        gameId: game.gameId,
        score,
        rank: 0, // Will be set after sorting
      });
    }

    // Sort by score descending
    chartList.sort((a, b) => b.score - a.score);

    // Assign ranks and return top N
    return chartList.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  /**
   * Generate Up & Coming chart
   * New games gaining traction
   */
  async generateUpAndComing(
    ageBand: AgeBand,
    platform: Platform,
    limit: number = 50
  ): Promise<ChartEntry[]> {
    const candidates = await this.dataSource.fetchGamesByAgeAndPlatform(
      ageBand,
      platform
    );
    const chartList: ChartEntry[] = [];

    const now = new Date();

    for (const game of candidates) {
      // Only include games released in last 30 days
      const daysSinceRelease = Math.floor(
        (now.getTime() - game.releaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceRelease > 30) {
        continue;
      }

      const metrics = await this.dataSource.getGameMetrics(
        game.gameId,
        ageBand,
        platform
      );

      // Weighted combination of recency + engagement growth
      const recencyWeight = 1 - daysSinceRelease / 30;
      const engagementScore = Math.log(1 + metrics.playsLast30Days);
      const score = recencyWeight * 0.4 + engagementScore * 0.6;

      chartList.push({
        gameId: game.gameId,
        score,
        rank: 0,
      });
    }

    chartList.sort((a, b) => b.score - a.score);

    return chartList.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  /**
   * Generate Top Playing Now chart
   * Most concurrent players
   */
  async generateTopPlayingNow(
    ageBand: AgeBand,
    platform: Platform,
    limit: number = 50
  ): Promise<ChartEntry[]> {
    const candidates = await this.dataSource.fetchGamesByAgeAndPlatform(
      ageBand,
      platform
    );
    const chartList: ChartEntry[] = [];

    for (const game of candidates) {
      const metrics = await this.dataSource.getGameMetrics(
        game.gameId,
        ageBand,
        platform
      );

      chartList.push({
        gameId: game.gameId,
        score: metrics.currentSessions,
        rank: 0,
      });
    }

    chartList.sort((a, b) => b.score - a.score);

    return chartList.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  /**
   * Generate Top Re-Played chart
   * Games users return to frequently
   */
  async generateTopReplayed(
    ageBand: AgeBand,
    platform: Platform,
    limit: number = 50
  ): Promise<ChartEntry[]> {
    const candidates = await this.dataSource.fetchGamesByAgeAndPlatform(
      ageBand,
      platform
    );
    const chartList: ChartEntry[] = [];

    for (const game of candidates) {
      const metrics = await this.dataSource.getGameMetrics(
        game.gameId,
        ageBand,
        platform
      );

      if (metrics.uniquePlayers === 0) {
        continue;
      }

      const replayRate = metrics.totalSessions / metrics.uniquePlayers;

      chartList.push({
        gameId: game.gameId,
        score: replayRate,
        rank: 0,
      });
    }

    chartList.sort((a, b) => b.score - a.score);

    return chartList.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  /**
   * Generate Top Earning chart
   * Highest revenue games
   */
  async generateTopEarning(
    ageBand: AgeBand,
    platform: Platform,
    limit: number = 50
  ): Promise<ChartEntry[]> {
    const candidates = await this.dataSource.fetchGamesByAgeAndPlatform(
      ageBand,
      platform
    );
    const chartList: ChartEntry[] = [];

    for (const game of candidates) {
      const metrics = await this.dataSource.getGameMetrics(
        game.gameId,
        ageBand,
        platform
      );

      chartList.push({
        gameId: game.gameId,
        score: metrics.totalRevenue,
        rank: 0,
      });
    }

    chartList.sort((a, b) => b.score - a.score);

    return chartList.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  /**
   * Generate Top Rated chart
   * Games with highest community ratings
   */
  async generateTopRated(
    ageBand: AgeBand,
    platform: Platform,
    limit: number = 50
  ): Promise<ChartEntry[]> {
    const candidates = await this.dataSource.fetchGamesByAgeAndPlatform(
      ageBand,
      platform
    );
    const chartList: ChartEntry[] = [];

    for (const game of candidates) {
      const metrics = await this.dataSource.getGameMetrics(
        game.gameId,
        ageBand,
        platform
      );

      const totalReactions = metrics.likes + metrics.dislikes;
      if (totalReactions === 0) {
        continue;
      }

      // Community rating: (likes - dislikes) / total, weighted by volume
      const ratio = (metrics.likes - metrics.dislikes) / totalReactions;
      const confidence = Math.min(1, Math.log(1 + totalReactions) / Math.log(1000));
      const ratingScore = ratio * confidence;

      chartList.push({
        gameId: game.gameId,
        score: ratingScore,
        rank: 0,
      });
    }

    chartList.sort((a, b) => b.score - a.score);

    return chartList.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  /**
   * Generate Trending in Genre chart
   * Genre-specific rising games
   */
  async generateTrendingInGenre(
    genreId: GenreId,
    ageBand: AgeBand,
    platform: Platform,
    limit: number = 50
  ): Promise<ChartEntry[]> {
    const allCandidates = await this.dataSource.fetchGamesByAgeAndPlatform(
      ageBand,
      platform
    );

    // Filter by genre
    const candidates = allCandidates.filter((game) =>
      game.genreVector.has(genreId)
    );

    const chartList: ChartEntry[] = [];

    for (const game of candidates) {
      const metrics = await this.dataSource.getGameMetrics(
        game.gameId,
        ageBand,
        platform
      );

      let score: number;
      if (metrics.playsPrev7Days === 0) {
        score = metrics.playsLast7Days;
      } else {
        score =
          (metrics.playsLast7Days - metrics.playsPrev7Days) /
          metrics.playsPrev7Days;
      }

      chartList.push({
        gameId: game.gameId,
        score,
        rank: 0,
      });
    }

    chartList.sort((a, b) => b.score - a.score);

    return chartList.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }
}
