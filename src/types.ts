/**
 * Core type definitions for the game recommendation engine
 */

export enum AgeBand {
  UNDER_9 = 'UNDER_9',
  AGE_9_TO_12 = 'AGE_9_TO_12',
  AGE_13_PLUS = 'AGE_13_PLUS',
}

export enum Platform {
  PC = 'PC',
  MOBILE = 'MOBILE',
  VR = 'VR',
  CONSOLE = 'CONSOLE',
}

export enum GameFeature {
  VOICE_CHAT = 'VOICE_CHAT',
  TEXT_CHAT = 'TEXT_CHAT',
  MULTIPLAYER = 'MULTIPLAYER',
  SINGLE_PLAYER = 'SINGLE_PLAYER',
  LOW_INTENSITY = 'LOW_INTENSITY',
}

export type GenreId = number;
export type GameId = string;
export type UserId = string;

/**
 * Genre vector representation - maps genre IDs to weights
 */
export type GenreVector = Map<GenreId, number>;

/**
 * User context - minimal information without PII
 */
export interface UserContext {
  userId: UserId;
  ageBand: AgeBand;
  platform: Platform;
  genreVector: GenreVector;
}

/**
 * User history aggregates
 */
export interface UserHistory {
  longPlayGames: GameId[];
  likedGames: GameId[];
  heavilyPlayed: Set<GameId>;
}

/**
 * Game metadata
 */
export interface Game {
  gameId: GameId;
  minAgeBand: AgeBand;
  moderationScore: number;
  releaseDate: Date;
  isSponsored: boolean;
  sponsoredAmount: number; // Amount spent on sponsorship in dollars
  genreVector: GenreVector;
  features: Set<GameFeature>;
  playsByAgeBand: Map<AgeBand, number>;
  totalSessions: number;
  uniquePlayers: number;
  currentSessions: number;
  totalRevenue: number;
  likes: number;
  totalPlays: number;
}

/**
 * Scored game with breakdown
 */
export interface ScoredGame {
  game: Game;
  score: number;
  breakdown: {
    genreAffinity: number;
    ageBandPopularity: number;
    engagementSimilarity: number;
    recencyBoost: number;
    sponsoredBoost: number;
    repetitionPenalty: number;
  };
}

/**
 * Recommendation bucket for output
 */
export interface RecommendationBucket {
  id: string;
  title: string;
  games: GameId[];
}

/**
 * Chart types for algorithmic ranking
 */
export enum ChartType {
  TOP_TRENDING = 'TOP_TRENDING',
  UP_AND_COMING = 'UP_AND_COMING',
  TOP_PLAYING_NOW = 'TOP_PLAYING_NOW',
  TOP_REPLAYED = 'TOP_REPLAYED',
  TOP_EARNING = 'TOP_EARNING',
  TOP_RATED = 'TOP_RATED',
  TRENDING_IN_GENRE = 'TRENDING_IN_GENRE',
}

/**
 * Chart entry with score
 */
export interface ChartEntry {
  gameId: GameId;
  score: number;
  rank: number;
}

/**
 * Configuration for the recommendation engine
 */
export interface RecommendationConfig {
  weights: {
    genreAffinity: number;
    ageBandPopularity: number;
    engagementSimilarity: number;
    recencyBoost: number;
    sponsoredBoost: number;
    repetitionPenalty: number;
  };
  moderationThreshold: number;
  recencyDecayDays: number;
  sponsoredAmountMultiplier: number; // Multiplier for sponsored amount to calculate boost
  maxSponsoredBoost: number; // Maximum boost value regardless of sponsored amount
  maxResults: number;
  maxSponsoredPerList: number;
  diversityRules: {
    minGenres: number;
    maxPerGenre: number;
    requireLowIntensity: boolean;
    avoidAllMultiplayer: boolean;
  };
}
