# Source allowlist

`data/sources/sources.json` defines **tier A / B / C** feeds you may attach to canonical rows via:

- `matches.source_id` — default lineage for call-ups tied to that fixture, or
- `callups_or_appearances.source_id` — per-row override when a single match blends multiple ingestions.

## Fields (per entry)

| Field | Meaning |
| --- | --- |
| `source_id` | Stable slug stored in canonical JSON (**must stay unique**). |
| `tier` | Human priority band: **A** (authoritative), **B** (strong secondary), **C** (broad/community). |
| `kind` | `federations_overview`, `match_report`, `aggregator`, `encyclopedia`, `data_vendor`, `broadcaster`. |
| `confidence_weight` | Multiplier \(0–1\) used in projections: per team we take **`min(weights)`** across observed call-ups (conservative when mixing sources). Missing `source_id` on both match and row → **no penalty** (\(1.0\)). |
| `access_mode` | Intended ingress: `manual_pdf`, `rss`, `api_license`, `browser_manual`, `scrape_with_consent`. |

## Adding a new feed

1. Append an object under `sources` with a unique `source_id`.
2. Set `tier`, `confidence_weight`, and URLs you will cite in ingestion notes/commits.
3. Run `npm run data:validate` after tagging canonical rows.
4. Rebuild: `npm run data:project` or `npm run data:build`.

Do **not** invent official FIFA lists; keep UI copy as projected / non-final until Tier A confirms.
