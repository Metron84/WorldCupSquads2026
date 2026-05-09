# Offline FBref HTML — filing rules for assistants

The user adds saved FBref pages over time. **Every new HTML file must go under the correct confederation**, matching the Excel sheet names used by `scrape_fbref_wc2026_stats.py`.

## Confederation folders (required)

| Folder | Region |
|--------|--------|
| `UEFA/` | Europe |
| `CONMEBOL/` | South America |
| `CONCACAF/` | North America, Central America, Caribbean |
| `CAF/` | Africa (e.g. Algeria, Egypt) |
| `AFC/` | Asia / Australia |

Do **not** put national squad saves in the offline root except where noted below. Do **not** mix confederations (e.g. never put an African nation under `UEFA/`).

## Two valid layouts per confederation

1. **Single competition page (legacy):** one file `{CONF}.html` in the **offline root**, e.g. `CAF.html` for the whole CAF WCQ stats URL.  
   - If this file exists, it **takes precedence** over a `{CONF}/` folder.

2. **Per-nation squad saves:** directory `{CONF}/` containing one or more `*.html` files (browser “Save As…” from each nation’s squad stats page).  
   - The **filename without `.html`** becomes the **`Squad` column** (underscores become spaces, e.g. `Ivory_Coast.html` → `Ivory Coast`).  
   - Match FBref’s spelling for that nation.

## Friendlies

Keep friendlies exports in the **offline root** only, using one of: `Friendlies_2026.html`, `Friendlies.html`, or `2026-Friendlies-M-Stats.html` (see `OFFLINE_FILES` in the script).

## Replacing placeholders

Files under `offline_pages/` may contain minimal placeholder tables so the pipeline runs before real saves exist. **Replace** those HTML files with full FBref “Save Page As…” exports when available.
