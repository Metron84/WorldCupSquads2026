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

## Data model

### Raw inputs (`data/raw`)

- `teams.json` - represented/qualified team metadata
- `matches.json` - qualifier/friendly match windows
- `callups_or_appearances.json` - per-match player selection rows
- `availability-overrides.json` - manual injury/suspension/doubtful layer

### Generated outputs (`data/generated`)

- `player_pool.json` - aggregated player features by team
- `completeness_report.json` - confidence and coverage warnings
- `projections.json` - likely26/bubble/longshot projections

## Pipeline stages

```bash
npm run data:seed
npm run data:load
npm run data:normalize
npm run data:aggregate
npm run data:coverage
npm run data:project
```

Or run everything:

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

Each team receives a confidence level:

- **high**: strong match/sample coverage
- **medium**: adequate but partial
- **low**: sparse coverage; use caution

Warnings are surfaced per team in `/coverage`.

## Injury & availability overrides

Use `data/raw/availability-overrides.json` with statuses:

- `available`
- `doubtful`
- `injured`
- `suspended`
- `unavailable`

The override layer affects score and likely26 eligibility.

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
