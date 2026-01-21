/**
 * Diversity & Fairness Pass Module
 * 
 * Post-processing step to ensure variety in recommendations.
 */

import { ScoredGame, GameFeature, RecommendationConfig, GenreId } from './types';

/**
 * Diversity rules checker and enforcer
 */
export class DiversityPass {
  constructor(private config: RecommendationConfig) {}

  /**
   * Apply diversity rules to scored games
   */
  diversify(sortedGames: ScoredGame[]): ScoredGame[] {
    const diversified: ScoredGame[] = [];
    const genreCounts = new Map<GenreId, number>();

    for (const scoredGame of sortedGames) {
      // Check if adding this game would violate diversity rules
      if (this.violatesDiversityRules(scoredGame, diversified, genreCounts)) {
        continue;
      }

      // Add game to diversified list
      diversified.push(scoredGame);

      // Update genre counts
      this.updateGenreCounts(scoredGame, genreCounts);

      // Stop if we've reached max results
      if (diversified.length >= this.config.maxResults) {
        break;
      }
    }

    // Post-process to ensure minimum requirements
    this.ensureMinimumRequirements(diversified);

    return diversified;
  }

  /**
   * Check if adding a game would violate diversity rules
   */
  private violatesDiversityRules(
    scoredGame: ScoredGame,
    diversified: ScoredGame[],
    genreCounts: Map<GenreId, number>
  ): boolean {
    // Check max per genre constraint
    if (this.violatesMaxPerGenre(scoredGame, genreCounts)) {
      return true;
    }

    // Check all-multiplayer constraint
    if (this.violatesAllMultiplayer(scoredGame, diversified)) {
      return true;
    }

    return false;
  }

  /**
   * Check if max games per genre would be exceeded
   */
  private violatesMaxPerGenre(
    scoredGame: ScoredGame,
    genreCounts: Map<GenreId, number>
  ): boolean {
    const maxPerGenre = this.config.diversityRules.maxPerGenre;

    for (const [genreId] of scoredGame.game.genreVector) {
      const count = genreCounts.get(genreId) || 0;
      if (count >= maxPerGenre) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if adding this game would create all-multiplayer list
   */
  private violatesAllMultiplayer(
    scoredGame: ScoredGame,
    diversified: ScoredGame[]
  ): boolean {
    if (!this.config.diversityRules.avoidAllMultiplayer) {
      return false;
    }

    // If all existing games are multiplayer and this one is too
    if (scoredGame.game.features.has(GameFeature.MULTIPLAYER)) {
      const allMultiplayer = diversified.every((sg) =>
        sg.game.features.has(GameFeature.MULTIPLAYER)
      );

      if (allMultiplayer && diversified.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update genre counts after adding a game
   */
  private updateGenreCounts(
    scoredGame: ScoredGame,
    genreCounts: Map<GenreId, number>
  ): void {
    for (const [genreId] of scoredGame.game.genreVector) {
      const current = genreCounts.get(genreId) || 0;
      genreCounts.set(genreId, current + 1);
    }
  }

  /**
   * Ensure minimum requirements are met
   */
  private ensureMinimumRequirements(diversified: ScoredGame[]): void {
    // Check minimum genre diversity
    const uniqueGenres = this.countUniqueGenres(diversified);
    if (uniqueGenres < this.config.diversityRules.minGenres) {
      console.warn(
        `Warning: Only ${uniqueGenres} genres in recommendations (minimum: ${this.config.diversityRules.minGenres})`
      );
    }

    // Check for low-intensity game requirement
    if (this.config.diversityRules.requireLowIntensity) {
      const hasLowIntensity = diversified.some((sg) =>
        sg.game.features.has(GameFeature.LOW_INTENSITY)
      );

      if (!hasLowIntensity) {
        console.warn('Warning: No low-intensity game in recommendations');
      }
    }
  }

  /**
   * Count unique genres in diversified list
   */
  private countUniqueGenres(diversified: ScoredGame[]): number {
    const genres = new Set<GenreId>();

    for (const scoredGame of diversified) {
      for (const [genreId] of scoredGame.game.genreVector) {
        genres.add(genreId);
      }
    }

    return genres.size;
  }

  /**
   * Get genre diversity stats for a list
   */
  getGenreStats(games: ScoredGame[]): Map<GenreId, number> {
    const stats = new Map<GenreId, number>();

    for (const scoredGame of games) {
      for (const [genreId] of scoredGame.game.genreVector) {
        const current = stats.get(genreId) || 0;
        stats.set(genreId, current + 1);
      }
    }

    return stats;
  }
}
