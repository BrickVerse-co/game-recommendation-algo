# Game Recommendation Engine - TypeScript Implementation

This directory contains the TypeScript implementation of the privacy-first, child-safe game recommendation engine.

## Structure

```
src/
├── types.ts                 # Core type definitions
├── config.ts                # Default configuration
├── candidateGenerator.ts    # Stage 1: Candidate generation
├── eligibilityFilter.ts     # Stage 2: Safety filtering
├── scoringEngine.ts         # Stage 3: Scoring algorithms
├── diversityPass.ts         # Stage 4: Diversity enforcement
├── bucketOrganizer.ts       # Stage 5 & 6: Sponsored injection & bucketing
├── chartGenerator.ts        # Algorithmic chart generation
├── recommendationEngine.ts  # Main pipeline orchestration
├── index.ts                 # Public API exports
└── example.ts               # Usage examples
```

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Running the Example

```bash
npm run build
node dist/example.js
```

## Usage

```typescript
import {
  RecommendationEngine,
  CandidateDataSource,
  ChartDataSource,
  DEFAULT_CONFIG,
  AgeBand,
  Platform,
  ChartType
} from './index';

// Implement data source interfaces
class MyDataSource implements CandidateDataSource, ChartDataSource {
  // ... implement required methods
}

// Create engine
const engine = new RecommendationEngine(
  DEFAULT_CONFIG,
  new MyDataSource(),
  new MyDataSource()
);

// Generate recommendations
const buckets = await engine.generateRecommendations(userContext, userHistory);

// Generate charts
const trending = await engine.generateChart(
  ChartType.TOP_TRENDING,
  AgeBand.AGE_9_TO_12,
  Platform.PC
);
```

## Key Features

✅ **Privacy-First**: No PII, coarse age bands only  
✅ **Child-Safe**: Automatic safety filtering for users under 13  
✅ **Explainable**: Score breakdowns for each recommendation  
✅ **Modular**: Each stage can be modified independently  
✅ **Type-Safe**: Full TypeScript type coverage  
✅ **Auditable**: Deterministic filtering logic  

## Architecture

The engine follows a multi-stage pipeline:

1. **Candidate Generation**: Fetch potential games from multiple sources
2. **Eligibility Filtering**: Apply hard safety rules
3. **Scoring**: Compute composite scores from independent signals
4. **Diversity Pass**: Ensure variety in recommendations
5. **Sponsored Injection**: Add sponsored content at predefined slots
6. **Bucketing**: Organize into named sections

## Configuration

Customize the engine behavior through `RecommendationConfig`:

```typescript
const customConfig = {
  ...DEFAULT_CONFIG,
  weights: {
    genreAffinity: 1.2,
    ageBandPopularity: 0.9,
    // ... other weights
  },
  diversityRules: {
    minGenres: 3,
    maxPerGenre: 4,
    // ... other rules
  }
};
```

## Charts

Generate various algorithmic charts:

- **TOP_TRENDING**: Fastest growing games
- **UP_AND_COMING**: New games gaining traction
- **TOP_PLAYING_NOW**: Most concurrent players
- **TOP_REPLAYED**: Highest replay rate
- **TOP_EARNING**: Revenue leaders
- **TOP_RATED**: Community favorites
- **TRENDING_IN_GENRE**: Genre-specific trends

## Contributing

See the main [README.md](../README.md) for contribution guidelines.

Key principles:
- ❌ No identity-based features
- ❌ No exact age or timestamps
- ✅ Aggregates over raw logs
- ✅ Safety checks before scoring
- ✅ Explainable logic
