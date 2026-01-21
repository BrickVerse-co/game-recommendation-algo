# BrickVerses' Game Recommendation &amp; Discovery Algorithm Engine

**Privacy-First, Child-Safe Recommendation Engine**

This repository contains the game discovery and recommendation system used to surface relevant experiences to players while maintaining strict privacy, safety, and regulatory constraints.

The system is designed to:

- Avoid personal data and identity-based profiling
- Support users under 13 by default
- Scale horizontally
- Remain explainable and auditable
  
## License
BrickVerses' Game Recommendation &amp; Discovery Algorithm Engine © 2026 by Meta Games LLC is licensed under Creative Commons Attribution-ShareAlike 4.0 International. To view a copy of this license, visit https://creativecommons.org/licenses/by-sa/4.0/

---

## 1. System Overview

The recommendation pipeline is a **multi-stage ranking system** built around aggregated behavioral signals and game metadata.

```
┌────────────┐
│ User Input │  (age band, session context)
└─────┬──────┘
      ↓
┌─────────────────────┐
│ Candidate Generator │
└─────┬───────────────┘
      ↓
┌──────────────────────┐
│ Eligibility & Safety │
│ Filtering            │
└─────┬────────────────┘
      ↓
┌────────────────────┐
│ Scoring Engine     │
└─────┬──────────────┘
      ↓
┌────────────────────┐
│ Diversity Pass     │
└─────┬──────────────┘
      ↓
┌─────────────────────┐
│ Sponsored Injection │
└─────┬───────────────┘
      ↓
┌────────────────────┐
│ Ranked Buckets     │
└────────────────────┘
```

Each stage is intentionally **isolated** so contributors can modify logic without impacting safety guarantees.

---

## 2. Core Concepts

### Age Bands

Age is represented only as a **coarse enum**:

```ts
enum AgeBand {
	UNDER_9,
	AGE_9_TO_12,
	AGE_13_PLUS,
}
```

Exact age or birthdate is **never stored or computed**.

---

### Genre Vectors

Games and users are represented as **weighted genre vectors**.

```ts
type GenreVector = Map<GenreId, float>;
```

Weights are derived from **aggregated engagement**, not raw actions.

---

## 3. Candidate Generation

Candidate generation produces a **large, safe pool** of games before ranking.

### Sources

- Genre-aligned games
- Age-band popularity tables
- Recently trending games
- Editorially curated games
- Sponsored games (flagged)

### Pseudocode

```pseudo
function generateCandidates(userContext):
    candidates = Set()

    candidates += topGamesByGenres(userContext.genreVector)
    candidates += popularGamesByAgeBand(userContext.ageBand)
    candidates += trendingGames()
    candidates += editorialPicks()

    if sponsoredEnabled:
        candidates += sponsoredGames()

    return candidates
```

Candidate generation should be **fast** and use **precomputed tables**.

---

## 4. Eligibility & Safety Filtering

This stage enforces **hard safety rules**.
Games failing this stage are **never scored**.

### Pseudocode

```pseudo
function filterEligible(candidates, userContext):
    eligible = []

    for game in candidates:
        if game.minAgeBand > userContext.ageBand:
            continue

        if game.moderationScore < MODERATION_THRESHOLD:
            continue

        if userContext.ageBand < AGE_13_PLUS
           and game.features.contains("VOICE_CHAT"):
            continue

        eligible.append(game)

    return eligible
```

This layer must remain **deterministic and auditable**.

---

## 5. Scoring Engine

Each eligible game receives a composite score derived from independent signals.

### Score Formula

```text
scorealue =
    w1 * genreAffinity
  + w2 * ageBandPopularity
  + w3 * engagementSimilarity
  + w4 * recencyBoost
  + w5 * sponsoredBoost (proportional to sponsoredAmount, capped)
  - w6 * repetitionPenalty
```

Weights are configurable and environment-specific.

---

### Signal Computation

#### Genre Affinity

```pseudo
function genreAffinity(userVector, gameVector):
    return cosineSimilarity(userVector, gameVector)
```

---

#### Age-Band Popularity

```pseudo
function ageBandPopularity(game, ageBand):
    return log(1 + game.playsByAgeBand[ageBand])
```

---

#### Engagement Similarity

Uses similarity against **previously enjoyed games**, not users.

```pseudo
function engagementSimilarity(game, userHistory):
    return average(
        similarity(game, history.longPlayGames),
        similarity(game, history.likedGames)
    )
```

---

#### Recency Boost

```pseudo
function recencyBoost(game):
    days = daysSince(game.releaseDate)
    return exp(-days / RECENCY_DECAY)
```

---

#### Sponsored Boost (Amount-Based, Capped)

```pseudo
function sponsoredBoost(game):
    if not game.isSponsored or game.sponsoredAmount <= 0:
        return 0

    rawBoost = game.sponsoredAmount * SPONSORED_AMOUNT_MULTIPLIER
    return min(rawBoost, MAX_SPONSORED_BOOST)
```

**How it works:**
- Games pay a `sponsoredAmount` (in dollars) for promotion
- Boost is calculated as: `sponsoredAmount * multiplier`
- Example: $1000 sponsorship with 0.001 multiplier = 1.0 boost
- Hard cap ensures no sponsor can dominate regardless of spending
- Sponsored signals **never bypass filtering**.

---

#### Repetition Penalty

```pseudo
function repetitionPenalty(game, userHistory):
    if game.id in userHistory.heavilyPlayed:
        return HIGH_PENALTY

    return 0
```

---

## 6. Diversity & Fairness Pass

After scoring, a post-processing step ensures variety.

### Rules (Example)

- At least 2 distinct genres
- Maximum N games from the same genre
- Include at least one low-intensity game
- Avoid all-multiplayer lists

### Pseudocode

```pseudo
function diversify(sortedGames):
    diversified = []

    for game in sortedGames:
        if violatesDiversityRules(game, diversified):
            continue

        diversified.append(game)

        if diversified.size == MAX_RESULTS:
            break

    return diversified
```

---

## 7. Sponsored Injection

Sponsored content is injected **after diversity**, not before.

**Sponsorship Model:**
- Games pay a `sponsoredAmount` (in dollars) for visibility
- Higher sponsorship amounts receive proportionally higher boost scores
- Boost is calculated as: `sponsoredAmount * multiplier`, capped at maximum
- Example: $1000 = 1.0 boost, $2000 = 2.0 boost (with 0.001 multiplier)

Rules:

- Clearly labeled
- Hard capped per list
- Never placed above ineligible content
- Must pass all safety filters regardless of amount

```pseudo
function injectSponsored(games, sponsoredGames):
    insert sponsoredGames at predefined slots
    return games
```

---

## 8. Output Buckets

Recommendations are returned as **named sections**.

```ts
type RecommendationBucket = {
	id: string;
	title: string;
	games: GameId[];
};
```

Examples:

- `recommended_for_you`
- `popular_by_age`
- `new_and_trending`
- `sponsored_events`

Buckets improve transparency and UX clarity.

---

## 9. Database Schema (Conceptual)

### Users (Minimal)

```sql
UserContext {
  user_id UUID
  age_band ENUM
  platform ENUM
}
```

No PII. No raw logs.

---

### User Aggregates

```sql
UserGenreAggregate {
  user_id UUID
  genre_id INT
  weight FLOAT
}
```

---

### Games

```sql
Game {
  game_id UUID
  min_age_band ENUM
  moderation_score FLOAT
  release_date DATE
  is_sponsored BOOLEAN
  sponsored_amount DECIMAL(10,2)
}
```

---

### Game Genres

```sql
GameGenre {
  game_id UUID
  genre_id INT
  weight FLOAT
}
```

---

### Popularity Tables (Precomputed)

```sql
GamePopularityByAge {
  game_id UUID
  age_band ENUM
  play_count BIGINT
}
```

---

## 10. Data Retention & Privacy

- Session data: short-lived
- Aggregates only stored long-term
- No cross-product tracking
- No individual-to-individual similarity
- All analytics are anonymized

---

## 11. Algorithmic Charts & Ranking Buckets

The system generates multiple **dynamic charts or “buckets”** that surface games under different criteria.
Each chart is **precomputed periodically** using aggregated, privacy-safe data. Charts are **age-band and platform aware**.

### Core Chart Types

| Chart Name                     | Description                                 | Data Source                     | Ranking Logic                                                               |
| ------------------------------ | ------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| **Top Trending**               | Games with fastest recent growth            | Plays & likes in last 7–14 days | Growth rate = `(plays_last_7_days - plays_prev_7_days) / plays_prev_7_days` |
| **Up & Coming**                | New games gaining traction                  | Plays & likes in last 30 days   | Weighted combination of recency + engagement growth                         |
| **Top Playing Now**            | Most concurrent players                     | Active sessions                 | `rank by current_sessions count`                                            |
| **Top Re-Played**              | Games users return to frequently            | User history (aggregated)       | `replay_rate = sessions_per_user / total_players`                           |
| **Top Earning**                | Highest revenue (if monetization exists)    | Purchases / in-app revenue      | `rank by total_revenue last 30d`                                            |
| **Top Rated**                  | Games with highest community ratings        | Likes/favorites (aggregated)    | `rating_score = likes / total_plays`                                        |
| **Trending in X Genre**        | Genre-specific rising games                 | Plays & likes filtered by genre | Similar to Top Trending but restricted to genre                             |
| **Top VR / Platform-Specific** | Best games for a platform (VR, mobile, etc) | Plays by platform               | Filter by platform + rank by popularity                                     |

---

### Chart Generation Flow (High-Level)

```
┌───────────────────────┐
│ Data Aggregation Jobs │ (daily / hourly)
└─────────┬─────────────┘
          ↓
┌─────────────────────────┐
│ Chart Computation Layer │
│  - Compute metrics      │
│  - Apply age-band filter│
│  - Apply platform filter│
└─────────┬───────────────┘
          ↓
┌──────────────────────────┐
│ Chart Storage / Cache    │
│  - Redis or Cassandra    │
│  - TTL for freshness     │
└─────────┬────────────────┘
          ↓
┌──────────────────────────┐
│ API Layer / Frontend     │
│  - Return per age-band   │
│  - Return per platform   │
└──────────────────────────┘
```

---

### Pseudocode Example: Top Trending

```pseudo
function computeTopTrending(ageBand, platform):
    candidates = fetchGamesByAgeAndPlatform(ageBand, platform)
    trendingList = []

    for game in candidates:
        recentPlays = game.getPlays(last_7_days)
        previousPlays = game.getPlays(prev_7_days)
        if previousPlays == 0:
            score = recentPlays
        else:
            score = (recentPlays - previousPlays) / previousPlays

        trendingList.append({game_id: game.id, score: score})

    trendingList.sort(descending by score)
    return trendingList.top(N)
```

> All counts and ratios are **aggregated**, never tied to individual players.

---

### Pseudocode Example: Top Re-Played

```pseudo
function computeTopReplayed(ageBand, platform):
    candidates = fetchGamesByAgeAndPlatform(ageBand, platform)
    replayList = []

    for game in candidates:
        totalSessions = game.totalSessions(ageBand, platform)
        uniquePlayers = game.uniquePlayers(ageBand, platform)
        replayRate = totalSessions / uniquePlayers
        replayList.append({game_id: game.id, score: replayRate})

    replayList.sort(descending by score)
    return replayList.top(N)
```

---

### Notes on Chart Design

1. **Age-Band Filtering:**
   All charts are filtered by **user age band** to ensure safety and regulatory compliance.

2. **Platform Filtering:**
   Charts can be restricted per platform (VR, mobile, console).

3. **Time Windows:**
   Metrics are computed over configurable windows (daily, weekly, monthly) depending on chart type.

4. **Cache & TTL:**
   Charts are precomputed and stored in Redis or Cassandra. TTL ensures freshness while reducing query load.

5. **Diversity & Fairness:**
   Charts can optionally enforce:
   - Minimum genre diversity
   - Inclusion of new releases
   - Capping repeated entries from the same developer

6. **Sponsored Content:**
   Sponsored games can optionally appear in specific charts but **never override eligibility or safety rules**.

## Contribution Guidelines

When contributing:

- ❌ Do not introduce identity-based features
- ❌ Do not store exact age or timestamps tied to users
- ✅ Prefer aggregates over raw logs
- ✅ Add safety checks before scoring logic
- ✅ Keep logic explainable

Any PR affecting filtering or age handling **must include tests**.
