# System Architecture

This document maps the codebase to the README specification.

## Pipeline Stages (README Section 1)

The multi-stage ranking system is implemented as follows:

```
┌────────────┐
│ User Input │  → UserContext (types.ts)
└─────┬──────┘
      ↓
┌─────────────────────┐
│ Candidate Generator │  → candidateGenerator.ts
└─────┬───────────────┘
      ↓
┌──────────────────────┐
│ Eligibility & Safety │
│ Filtering            │  → eligibilityFilter.ts
└─────┬────────────────┘
      ↓
┌────────────────────┐
│ Scoring Engine     │  → scoringEngine.ts
└─────┬──────────────┘
      ↓
┌────────────────────┐
│ Diversity Pass     │  → diversityPass.ts
└─────┬──────────────┘
      ↓
┌─────────────────────┐
│ Sponsored Injection │  → bucketOrganizer.ts (SponsoredInjector)
└─────┬───────────────┘
      ↓
┌────────────────────┐
│ Ranked Buckets     │  → bucketOrganizer.ts (BucketOrganizer)
└────────────────────┘
```

## File Structure

```
src/
├── types.ts                    # Section 2: Core Concepts (AgeBand, GenreVector, etc.)
├── config.ts                   # Default configuration with weights
├── candidateGenerator.ts       # Section 3: Candidate Generation
├── eligibilityFilter.ts        # Section 4: Eligibility & Safety Filtering
├── scoringEngine.ts            # Section 5: Scoring Engine (all 6 signals)
├── diversityPass.ts            # Section 6: Diversity & Fairness Pass
├── bucketOrganizer.ts          # Section 7 & 8: Sponsored Injection + Bucketing
├── chartGenerator.ts           # Section 11: Algorithmic Charts & Ranking
├── recommendationEngine.ts     # Main pipeline orchestrator
├── index.ts                    # Public API
└── example.ts                  # Usage demonstration
```

## Implementation Mapping

### Section 2: Core Concepts
- **Age Bands** → `AgeBand` enum in types.ts
- **Genre Vectors** → `GenreVector` type in types.ts

### Section 3: Candidate Generation
- **Implementation** → candidateGenerator.ts
- **Data Sources** → `CandidateDataSource` interface
- **Sources**: Genre-aligned, Age-band popularity, Trending, Editorial, Sponsored

### Section 4: Eligibility & Safety Filtering
- **Implementation** → eligibilityFilter.ts
- **Rules**: Age band checks, moderation threshold, feature restrictions
- **Special**: Under-13 voice chat blocking

### Section 5: Scoring Engine
- **Implementation** → scoringEngine.ts
- **6 Signals**:
  1. `genreAffinity` - Cosine similarity
  2. `ageBandPopularity` - Logarithmic scale
  3. `engagementSimilarity` - History-based
  4. `recencyBoost` - Exponential decay
  5. `sponsoredBoost` - **Amount-based (proportional to sponsoredAmount), capped**
  6. `repetitionPenalty` - Heavily played games

### Section 6: Diversity & Fairness Pass
- **Implementation** → diversityPass.ts
- **Rules**: Min genres, max per genre, low-intensity requirement, multiplayer mix

### Section 7: Sponsored Injection
- **Implementation** → bucketOrganizer.ts (SponsoredInjector)
- **Model**: Amount-based sponsorship with `sponsoredAmount` field
- **Calculation**: `boost = min(sponsoredAmount * multiplier, maxBoost)`
- **Rules**: Post-diversity injection, clearly labeled, hard capped

### Section 8: Output Buckets
- **Implementation** → bucketOrganizer.ts (BucketOrganizer)
- **Buckets**: recommended_for_you, popular_by_age, new_and_trending, sponsored_events

### Section 9: Database Schema
- **Conceptual Types** → types.ts interfaces
- **Key Addition**: `sponsoredAmount` field in Game interface (DECIMAL)

### Section 11: Algorithmic Charts
- **Implementation** → chartGenerator.ts
- **7 Chart Types**: Top Trending, Up & Coming, Top Playing Now, Top Replayed, Top Earning, Top Rated, Trending in Genre

## Sponsored Amount System

### Configuration (config.ts)
```typescript
sponsoredAmountMultiplier: 0.001  // $1000 = 1.0 boost
maxSponsoredBoost: 2.0             // Hard cap
```

### Game Interface (types.ts)
```typescript
interface Game {
  isSponsored: boolean;
  sponsoredAmount: number;  // amount spent on sponsorship
  // ... other fields
}
```

### Scoring Logic (scoringEngine.ts)
```typescript
sponsoredBoost = min(
  game.sponsoredAmount * config.sponsoredAmountMultiplier,
  config.maxSponsoredBoost
)
```

### Examples
- $500 sponsorship → 0.5 boost
- $1000 sponsorship → 1.0 boost
- $2000 sponsorship → 2.0 boost (capped)
- $10000 sponsorship → 2.0 boost (capped at maxSponsoredBoost)

## Privacy & Safety Guarantees

✅ No PII stored  
✅ Coarse age bands only  
✅ Aggregated metrics  
✅ Deterministic filtering  
✅ Auditable logic  
✅ Sponsored content must pass all safety filters  
✅ Voice chat blocked for under-13  

## Extensibility

Each stage is isolated and can be modified independently:
- Add new candidate sources → Update CandidateGenerator
- Change scoring weights → Modify config.ts
- Add new signals → Extend ScoringEngine
- Adjust diversity rules → Update diversityRules in config
- Create new charts → Add methods to ChartGenerator
