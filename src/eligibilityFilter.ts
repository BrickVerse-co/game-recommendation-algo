/**
 * Eligibility & Safety Filtering Module
 * 
 * Enforces hard safety rules. Games failing this stage are never scored.
 * This layer must remain deterministic and auditable.
 */

import { Game, UserContext, AgeBand, GameFeature } from './types';

/**
 * Configuration for eligibility filtering
 */
export interface EligibilityConfig {
  moderationThreshold: number;
}

/**
 * Eligibility and safety filter
 */
export class EligibilityFilter {
  constructor(private config: EligibilityConfig) {}

  /**
   * Filter candidates based on hard safety rules
   * Games failing these checks are never scored
   */
  filterEligible(candidates: Game[], userContext: UserContext): Game[] {
    const eligible: Game[] = [];

    for (const game of candidates) {
      // Check age band eligibility
      if (!this.isAgeBandEligible(game, userContext.ageBand)) {
        continue;
      }

      // Check moderation score
      if (!this.passesModeration(game)) {
        continue;
      }

      // Check feature restrictions for age
      if (!this.checkFeatureRestrictions(game, userContext.ageBand)) {
        continue;
      }

      eligible.push(game);
    }

    return eligible;
  }

  /**
   * Check if game's minimum age band is appropriate for user
   */
  private isAgeBandEligible(game: Game, userAgeBand: AgeBand): boolean {
    const ageBandOrder = {
      [AgeBand.UNDER_9]: 0,
      [AgeBand.AGE_9_TO_12]: 1,
      [AgeBand.AGE_13_PLUS]: 2,
    };

    return ageBandOrder[game.minAgeBand] <= ageBandOrder[userAgeBand];
  }

  /**
   * Check if game passes moderation threshold
   */
  private passesModeration(game: Game): boolean {
    return game.moderationScore >= this.config.moderationThreshold;
  }

  /**
   * Check feature restrictions based on age band
   */
  private checkFeatureRestrictions(game: Game, userAgeBand: AgeBand): boolean {
    // Users under 13 cannot access games with voice chat
    if (userAgeBand !== AgeBand.AGE_13_PLUS) {
      if (game.features.has(GameFeature.VOICE_CHAT)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate a single game for eligibility
   */
  isEligible(game: Game, userContext: UserContext): boolean {
    return (
      this.isAgeBandEligible(game, userContext.ageBand) &&
      this.passesModeration(game) &&
      this.checkFeatureRestrictions(game, userContext.ageBand)
    );
  }
}
