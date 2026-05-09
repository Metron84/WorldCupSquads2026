# FBref WC 2026 player stats → Excel

Scrapes WCQ + 2026 Friendlies **standard player stats** tables from FBref into `WC2026_Player_Stats.xlsx`.

## Setup (recommended: virtualenv)

```bash
cd scripts/fbref_wc2026_stats
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scrape_fbref_wc2026_stats.py
```

## Configuration (environment)

| Variable | Meaning |
|----------|---------|
| `FBREF_SLEEP` | Seconds between requests when fetching live (default **8**). |
| `FBREF_COOKIE` | Full **Cookie** header string from your browser after visiting fbref.com (DevTools → Network → any fbref request → Request Headers → copy Cookie). |
| `FBREF_USE_PLAYWRIGHT` | Set to `1` to fetch every URL with Chromium (same as `--playwright`). |
| *(offline)* | Use `--offline DIR` instead of cookies (see below). |

You can also put the cookie string on the **first non-comment line** of `fbref_cookie.txt` next to this script (same format as `FBREF_COOKIE`). That file is gitignored.

## Fetch from your machine (Cloudflare)

FBref sits behind **Cloudflare**. Automated servers and headless browsers usually see **“Just a moment…”** instead of tables. What works on a normal home computer:

1. Open **Chrome**, visit `https://fbref.com` and wait until the stats site loads (complete any check if shown).
2. Open **DevTools** → **Network** → reload a stats URL (e.g. UEFA WCQ stats).
3. Click the **document** request for that page → **Headers** → find **Request Headers** → **cookie:** (long string).
4. Copy the **entire** cookie value and either:
   - `export FBREF_COOKIE='…'` in the same terminal session, or  
   - put it in `fbref_cookie.txt` (one line, no `cookie:` prefix).

Then run **without** `--playwright`:

```bash
FBREF_SLEEP=8 python scrape_fbref_wc2026_stats.py
```

If that still returns 403, use **Save Page As** for each competition page and `--offline` (see above).

## If you get HTTP 403

FBref often blocks automated `requests`. Try in order:

1. **Browser cookie** — Log in / load fbref in Chrome, copy the **Cookie** header into `FBREF_COOKIE` or `fbref_cookie.txt`, then rerun.
2. **Slower pace** — `export FBREF_SLEEP=12` (or higher).
3. **Playwright** — Uses a real browser engine:
   ```bash
   pip install -r requirements-playwright.txt
   playwright install chromium
   python scrape_fbref_wc2026_stats.py --playwright
   ```
4. **Offline HTML** — In the browser, save each stats page (“Save page as…”, Web Page, Complete or HTML only), then point `--offline` at that folder.

   **Option A — one file per confederation (competition-wide stats tables):**

   - `UEFA.html`, `CONMEBOL.html`, `CONCACAF.html`, `CAF.html`, `AFC.html`
   - `Friendlies_2026.html` (or `Friendlies.html`)

   **Option B — per-nation squad saves (no `Squad` column on the page):**

   - Put saves under `UEFA/`, `CONMEBOL/`, … using **folder names that match the sheet** (`CAF`, etc.).
   - One nation per file: `CAF/Egypt.html`, `CAF/Algeria.html`. The **filename (without `.html`) becomes `Squad`** in the spreadsheet (underscores → spaces).
   - If **both** `CAF.html` and a `CAF/` folder exist, **`CAF.html` wins** (folder is ignored for that confederation).

   See `offline_pages/AGENT_INSTRUCTIONS.md` for filing rules for assistants.

   Example:

   ```bash
   python scrape_fbref_wc2026_stats.py --offline ./offline_pages
   ```

## CLI

```text
python scrape_fbref_wc2026_stats.py [--offline DIR] [--playwright]
```

## Output

- **File:** `WC2026_Player_Stats.xlsx` (next to this script)  
- **Sheets:** `UEFA`, `CONMEBOL`, `CONCACAF`, `CAF`, `AFC`, `Friendlies_2026`  
- Friendlies sheet includes column **`Season`** = `2026`.

## JSON for the World Cup Squads app (repo root)

From the repository root, after the workbook exists:

```bash
npm run data:wcq:export
```

This writes `data/generated/wcq_qualifying_stats.json` (WCQ sheets only) for per-player **MP / Min / Gls / Ast** on each team page.

Respect FBref’s terms; use modest request rates.
