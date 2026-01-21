/**
 * Sponsored Injection & Output Bucketing Module
 * 
 * Handles sponsored content injection and organizes results into named sections.
 */

import { ScoredGame, RecommendationBucket, GameId } from './types';

/**
 * Sponsored content injector
 */
export class SponsoredInjector {
  constructor(private maxSponsoredPerList: number) {}

  /**
   * Inject sponsored games at predefined slots
   * Sponsored content is injected after diversity, not before
   */
  injectSponsored(
    diversifiedGames: ScoredGame[],
    sponsoredGames: ScoredGame[]
  ): ScoredGame[] {
    // Filter to only eligible sponsored games not already in list
    const existingIds = new Set(diversifiedGames.map((sg) => sg.game.gameId));
    const eligibleSponsored = sponsoredGames
      .filter((sg) => !existingIds.has(sg.game.gameId))
      .slice(0, this.maxSponsoredPerList);

    if (eligibleSponsored.length === 0) {
      return diversifiedGames;
    }

    // Define injection slots (e.g., positions 3, 7, 11)
    const slots = this.calculateInjectionSlots(
      diversifiedGames.length,
      eligibleSponsored.length
    );

    const result: ScoredGame[] = [];
    let sponsoredIndex = 0;
    let organicIndex = 0;

    for (let i = 0; i < diversifiedGames.length + eligibleSponsored.length; i++) {
      if (slots.includes(i) && sponsoredIndex < eligibleSponsored.length) {
        result.push(eligibleSponsored[sponsoredIndex++]);
      } else if (organicIndex < diversifiedGames.length) {
        result.push(diversifiedGames[organicIndex++]);
      }
    }

    return result;
  }

  /**
   * Calculate injection slots for sponsored content
   */
  private calculateInjectionSlots(
    organicCount: number,
    sponsoredCount: number
  ): number[] {
    const slots: number[] = [];
    const spacing = Math.floor(organicCount / (sponsoredCount + 1));

    for (let i = 0; i < sponsoredCount; i++) {
      slots.push(spacing * (i + 1) + i);
    }

    return slots;
  }
}

/**
 * Bucket organizer for recommendations
 */
export class BucketOrganizer {
  /**
   * Organize games into named recommendation buckets
   */
  organizeBuckets(
    recommendedGames: ScoredGame[],
    popularGames: ScoredGame[],
    trendingGames: ScoredGame[],
    sponsoredGames: ScoredGame[]
  ): RecommendationBucket[] {
    const buckets: RecommendationBucket[] = [];

    // Recommended for you bucket
    if (recommendedGames.length > 0) {
      buckets.push({
        id: 'recommended_for_you',
        title: 'Recommended For You',
        games: recommendedGames.map((sg) => sg.game.gameId),
      });
    }

    // Popular by age bucket
    if (popularGames.length > 0) {
      buckets.push({
        id: 'popular_by_age',
        title: 'Popular in Your Age Group',
        games: popularGames.map((sg) => sg.game.gameId),
      });
    }

    // New and trending bucket
    if (trendingGames.length > 0) {
      buckets.push({
        id: 'new_and_trending',
        title: 'New & Trending',
        games: trendingGames.map((sg) => sg.game.gameId),
      });
    }

    // Sponsored events bucket (clearly labeled)
    if (sponsoredGames.length > 0) {
      buckets.push({
        id: 'sponsored_events',
        title: 'Sponsored Events',
        games: sponsoredGames.map((sg) => sg.game.gameId),
      });
    }

    return buckets;
  }

  /**
   * Create a bucket from a list of scored games
   */
  createBucket(id: string, title: string, games: ScoredGame[]): RecommendationBucket {
    return {
      id,
      title,
      games: games.map((sg) => sg.game.gameId),
    };
  }

  /**
   * Merge multiple buckets
   */
  mergeBuckets(buckets: RecommendationBucket[]): RecommendationBucket[] {
    // Remove duplicates across buckets while preserving order
    const seenGameIds = new Set<GameId>();
    const mergedBuckets: RecommendationBucket[] = [];

    for (const bucket of buckets) {
      const uniqueGames = bucket.games.filter((gameId) => {
        if (seenGameIds.has(gameId)) {
          return false;
        }
        seenGameIds.add(gameId);
        return true;
      });

      if (uniqueGames.length > 0) {
        mergedBuckets.push({
          ...bucket,
          games: uniqueGames,
        });
      }
    }

    return mergedBuckets;
  }
}
