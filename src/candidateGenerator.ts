/**
 * Candidate Generation Module
 * 
 * Produces a large, safe pool of games before ranking.
 * Uses precomputed tables for fast retrieval.
 */

import { Game, UserContext, GenreVector, AgeBand, GameId } from './types';

/**
 * Data access interface for candidate sources
 */
export interface CandidateDataSource {
  getTopGamesByGenres(genreVector: GenreVector, limit: number): Promise<Game[]>;
  getPopularGamesByAgeBand(ageBand: AgeBand, limit: number): Promise<Game[]>;
  getTrendingGames(limit: number): Promise<Game[]>;
  getEditorialPicks(limit: number): Promise<Game[]>;
  getSponsoredGames(limit: number): Promise<Game[]>;
}

/**
 * Generate candidates from multiple sources
 */
export class CandidateGenerator {
  constructor(
    private dataSource: CandidateDataSource,
    private sponsoredEnabled: boolean = true
  ) {}

  /**
   * Main candidate generation function
   * Produces a large, safe pool of games before ranking
   */
  async generateCandidates(userContext: UserContext): Promise<Game[]> {
    const candidateSet = new Map<GameId, Game>();

    // Add genre-aligned games
    const genreGames = await this.dataSource.getTopGamesByGenres(
      userContext.genreVector,
      50
    );
    this.addToCandidateSet(candidateSet, genreGames);

    // Add age-band popular games
    const popularGames = await this.dataSource.getPopularGamesByAgeBand(
      userContext.ageBand,
      50
    );
    this.addToCandidateSet(candidateSet, popularGames);

    // Add trending games
    const trendingGames = await this.dataSource.getTrendingGames(30);
    this.addToCandidateSet(candidateSet, trendingGames);

    // Add editorial picks
    const editorialGames = await this.dataSource.getEditorialPicks(20);
    this.addToCandidateSet(candidateSet, editorialGames);

    // Add sponsored games if enabled
    if (this.sponsoredEnabled) {
      const sponsoredGames = await this.dataSource.getSponsoredGames(15);
      this.addToCandidateSet(candidateSet, sponsoredGames);
    }

    return Array.from(candidateSet.values());
  }

  /**
   * Helper to add games to candidate set, avoiding duplicates
   */
  private addToCandidateSet(candidateSet: Map<GameId, Game>, games: Game[]): void {
    for (const game of games) {
      if (!candidateSet.has(game.gameId)) {
        candidateSet.set(game.gameId, game);
      }
    }
  }

  /**
   * Get top games aligned with user's genre preferences
   */
  async getTopGamesByGenres(
    userContext: UserContext,
    limit: number
  ): Promise<Game[]> {
    return this.dataSource.getTopGamesByGenres(userContext.genreVector, limit);
  }

  /**
   * Get popular games for user's age band
   */
  async getPopularGamesByAgeBand(
    ageBand: AgeBand,
    limit: number
  ): Promise<Game[]> {
    return this.dataSource.getPopularGamesByAgeBand(ageBand, limit);
  }
}
