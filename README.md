# World Cup Squads

Projected World Cup 2026 squad pools for currently qualified teams.  
This app uses qualification and recent friendly selection trends to estimate a modelled pool:
`likely`, `bubble`, and `longshot`.

> These are **not official federation squads**.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- PWA (manifest + service worker)

## Run locally

```bash
cd "/Users/wajeddoumani/Desktop/World Cup Squads"
npm install
npm run data:build
npm run dev
```

Open `http://localhost:3000`.

## Data pipeline

Raw inputs:

- `data/raw/qualifiedTeams.json`
- `data/raw/callups.json`

Rebuild projections:

```bash
npm run data:build
```

Generated output:

- `data/generated/projections.json`

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - start production build
- `npm run lint` - lint checks
- `npm run data:build` - regenerate projections

## PWA

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`

The site is installable on supported browsers.

## Deploy to Vercel

### GitHub flow

1. Push repository to GitHub.
2. Import it in Vercel.
3. Deploy with Next.js preset.

### CLI flow

```bash
npm i -g vercel
vercel
vercel --prod
```

## Updating the model

1. Add/update rows in `data/raw/callups.json`.
2. Update `data/raw/qualifiedTeams.json` when qualification status changes.
3. Run `npm run data:build`.
4. Redeploy.
