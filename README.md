# World Cup Squads 2026 (PWA)

Projected World Cup 2026 squad pools by nation, with confidence scoring and coverage warnings.  
Outputs are **non-official** and intended for analytical projection only.

## Tech Stack

- Next.js App Router (TypeScript strict)
- Tailwind CSS
- PWA support (`manifest.webmanifest` + `sw.js`)

## Local setup

```bash
cd "/Users/wajeddoumani/Desktop/World Cup Squads"
npm install
npm run data:build
npm run dev
```

Open `http://localhost:3000`.

## Canonical data model

This project now uses an ID-driven canonical layer derived from the Gemini inputs.

### Canonical tables (`data/canonical`)

- `teams.json`
- `players_master.json`
- `player_aliases.json`
- `matches.json`
- `callups_or_appearances.json`
- `availability_overrides.json`

### Source allowlist (`data/sources`)

- `sources.json` — tier **A/B/C** feeds (`source_id`) with `confidence_weight` for conservative team-level scoring
- `README.md` — how to attach `matches.source_id` / `callups_or_appearances.source_id`

### Schema docs (`data/schemas`)

- `normalized-schema.json` - schema definition and enums
- `README.md` - field intent and referential links

### Generated outputs (`data/generated`)

- `projections.json` - likely26/bubble/longshot by team
- `completeness_report.json` - confidence and coverage warnings
- `identity_review_queue.json` - alias/name records needing manual review
- `migration_report.json` - canonical migration counts

## Data pipeline commands

### Migration from Gemini source files

```bash
npm run data:migrate
```

### Validate canonical referential integrity

```bash
npm run data:validate
```

### Build projections from canonical tables

```bash
npm run data:project
```

### Full pipeline

```bash
npm run data:build
```

## Scoring logic

Selection score combines:

- selection frequency weight
- minutes weight
- recency decay
- starts consistency
- qualifier weighting over friendlies
- availability multiplier override

Likely squad uses positional balancing targets:

- GK: 3
- DF: 9
- MF: 8
- FW: 6

Then remaining players are tiered to `bubble` and `longshot`.

## Confidence framework

Each team receives a confidence level derived from observed players, qualifier/friendly match counts, confederation tuning, **and** the minimum `confidence_weight` among any **`source_id`** present on relevant call-ups (see `data/sources/sources.json`). Rows without `source_id` incur no lineage penalty (`1.0`).

- **high**: strong match/sample coverage
- **medium**: adequate but partial
- **low**: sparse coverage; use caution

Warnings are surfaced per team in `/coverage`.

## Injury & availability overrides

Use `data/canonical/availability_overrides.json` with statuses:

- `available`
- `doubtful`
- `injured`
- `suspended`
- `unavailable`

The override layer affects score and likely26 eligibility.

## Identity-resolution workflow

The identity matching strategy uses normalized strings plus Jaro-Winkler similarity thresholds:

- score `>= 0.95`: auto-link
- score `>= 0.80`: send to manual review
- score `< 0.80`: treat as new-record candidate

Manual review queue is generated at:

- `data/generated/identity_review_queue.json`

## Quality checks

```bash
npm run lint
npm run build
```

## Deploy on Vercel

### GitHub flow

1. Push `main` to GitHub.
2. Import repository into Vercel.
3. Deploy with Next.js preset.

### CLI flow

```bash
npm i -g vercel
vercel
vercel --prod
```

## Limitations

- This is a projection system, not official federation publication.
- Output quality depends on input coverage and recency.
- Teams marked low confidence need expanded raw match windows.
