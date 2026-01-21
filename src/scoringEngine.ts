/**
 * Scoring Engine Module
 * 
 * Each eligible game receives a composite score derived from independent signals.
 */

import {
  Game,
  UserContext,
  UserHistory,
  GenreVector,
  AgeBand,
  ScoredGame,
  RecommendationConfig,
} from './types';

/**
 * Scoring engine that computes composite scores for games
 */
export class ScoringEngine {
  constructor(private config: RecommendationConfig) {}

  /**
   * Score all eligible games
   */
  scoreGames(
    eligibleGames: Game[],
    userContext: UserContext,
    userHistory: UserHistory
  ): ScoredGame[] {
    const scoredGames: ScoredGame[] = [];

    for (const game of eligibleGames) {
      const breakdown = {
        genreAffinity: this.computeGenreAffinity(
          userContext.genreVector,
          game.genreVector
        ),
        ageBandPopularity: this.computeAgeBandPopularity(game, userContext.ageBand),
        engagementSimilarity: this.computeEngagementSimilarity(game, userHistory),
        favouriteAffinity: this.computeFavouriteAffinity(game, userHistory),
        communityRating: this.computeCommunityRating(game),
        recencyBoost: this.computeRecencyBoost(game),
        sponsoredBoost: this.computeSponsoredBoost(game),
        repetitionPenalty: this.computeRepetitionPenalty(game, userHistory),
        creationRecencyPenalty: this.computeCreationRecencyPenalty(game),
      };

      const score =
        this.config.weights.genreAffinity * breakdown.genreAffinity +
        this.config.weights.ageBandPopularity * breakdown.ageBandPopularity +
        this.config.weights.engagementSimilarity * breakdown.engagementSimilarity +
        this.config.weights.favouriteAffinity * breakdown.favouriteAffinity +
        this.config.weights.communityRating * breakdown.communityRating +
        this.config.weights.recencyBoost * breakdown.recencyBoost +
        this.config.weights.sponsoredBoost * breakdown.sponsoredBoost -
        this.config.weights.repetitionPenalty * breakdown.repetitionPenalty -
        this.config.weights.creationRecencyPenalty * breakdown.creationRecencyPenalty;

      scoredGames.push({ game, score, breakdown });
    }

    // Sort by score descending
    scoredGames.sort((a, b) => b.score - a.score);

    return scoredGames;
  }

  /**
   * Compute genre affinity using cosine similarity
   */
  private computeGenreAffinity(
    userVector: GenreVector,
    gameVector: GenreVector
  ): number {
    return this.cosineSimilarity(userVector, gameVector);
  }

  /**
   * Cosine similarity between two genre vectors
   */
  private cosineSimilarity(vec1: GenreVector, vec2: GenreVector): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    // Get all unique genre IDs
    const allGenres = new Set([...vec1.keys(), ...vec2.keys()]);

    for (const genreId of allGenres) {
      const weight1 = vec1.get(genreId) || 0;
      const weight2 = vec2.get(genreId) || 0;

      dotProduct += weight1 * weight2;
      magnitude1 += weight1 * weight1;
      magnitude2 += weight2 * weight2;
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Compute age-band popularity using logarithmic scale
   */
  private computeAgeBandPopularity(game: Game, ageBand: AgeBand): number {
    const plays = game.playsByAgeBand.get(ageBand) || 0;
    return Math.log(1 + plays);
  }

  /**
   * Compute engagement similarity based on user history
   */
  private computeEngagementSimilarity(game: Game, userHistory: UserHistory): number {
    // This would typically involve comparing game features/genres with
    // features/genres of games the user has enjoyed
    // For now, simplified version
    
    const longPlaySimilarity = this.averageSimilarityToList(
      game,
      userHistory.longPlayGames
    );
    const likedSimilarity = this.averageSimilarityToList(
      game,
      userHistory.likedGames
    );

    return (longPlaySimilarity + likedSimilarity) / 2;
  }

  /**
   * Average similarity to a list of games
   * In a real implementation, this would look up the games and compute actual similarity
   */
  private averageSimilarityToList(game: Game, gameIds: string[]): number {
    // Placeholder - in real implementation would look up games and compute similarity
    // For now, return a small positive value if the list is not empty
    return gameIds.length > 0 ? 0.3 : 0;
  }

  /**
   * Compute favourite affinity based on user's favourited games
   * Favourites are a stronger signal than likes
   */
  private computeFavouriteAffinity(game: Game, userHistory: UserHistory): number {
    const favouriteSimilarity = this.averageSimilarityToList(
      game,
      userHistory.favouritedGames
    );

    // Boost if game is similar to favourited games
    return favouriteSimilarity * 1.5; // 50% stronger than regular similarity
  }

  /**
   * Compute community rating based on likes vs dislikes
   * Returns a normalized score between -1 and 1
   */
  private computeCommunityRating(game: Game): number {
    const totalReactions = game.likes + game.dislikes;

    if (totalReactions === 0) {
      return 0; // No data
    }

    // Calculate ratio: (likes - dislikes) / total
    // This gives a score between -1 (all dislikes) and 1 (all likes)
    const ratio = (game.likes - game.dislikes) / totalReactions;

    // Apply logarithmic scaling based on total reactions
    // More reactions = more reliable rating
    const confidence = Math.min(1, Math.log(1 + totalReactions) / Math.log(1000));

    return ratio * confidence;
  }

  /**
   * Compute recency boost with exponential decay
   */
  private computeRecencyBoost(game: Game): number {
    const now = new Date();
    const daysSinceRelease = Math.floor(
      (now.getTime() - game.releaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.exp(-daysSinceRelease / this.config.recencyDecayDays);
  }

  /**
   * Compute sponsored boost (capped)
   * Boost is proportional to sponsoredAmount with a multiplier and maximum cap
   */
  private computeSponsoredBoost(game: Game): number {
    if (!game.isSponsored || game.sponsoredAmount <= 0) {
      return 0;
    }

    // Calculate boost: sponsoredAmount * multiplier, capped at maxSponsoredBoost
    const rawBoost = game.sponsoredAmount * this.config.sponsoredAmountMultiplier;
    return Math.min(rawBoost, this.config.maxSponsoredBoost);
  }

  /**
   * Compute repetition penalty
   */
  private computeRepetitionPenalty(game: Game, userHistory: UserHistory): number {
    if (userHistory.heavilyPlayed.has(game.gameId)) {
      return 1.0; // High penalty
    }

    return 0;
  }

  /**
   * Compute creation recency penalty
   * Penalizes newly created games as potential scams or low-quality content
   * Penalty decays over time as game proves itself
   */
  private computeCreationRecencyPenalty(game: Game): number {
    const now = new Date();
    const daysSinceCreation = Math.floor(
      (now.getTime() - game.creationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Full penalty for games within grace period
    if (daysSinceCreation < this.config.creationGracePeriodDays) {
      return 1.0;
    }

    // No penalty for games older than max penalty days
    if (daysSinceCreation >= this.config.creationPenaltyMaxDays) {
      return 0;
    }

    // Linear decay from grace period to max penalty days
    const decayRange =
      this.config.creationPenaltyMaxDays - this.config.creationGracePeriodDays;
    const daysInDecay = daysSinceCreation - this.config.creationGracePeriodDays;

    return 1.0 - daysInDecay / decayRange;
  }
}
