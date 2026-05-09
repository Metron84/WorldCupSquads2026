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

## If you get HTTP 403

FBref often blocks datacenter / automated traffic. Try:

- Run the script on your **home** network (not a cloud runner).
- Increase the sleep in the script (e.g. 6–8 seconds) between requests.
- Open the same URL in a browser; if the site loads, run the script from the same machine.

## Output

- **File:** `WC2026_Player_Stats.xlsx` (next to this script)  
- **Sheets:** `UEFA`, `CONMEBOL`, `CONCACAF`, `CAF`, `AFC`, `Friendlies_2026`  
- Friendlies sheet includes column **`Season`** = `2026`.

Respect FBref’s terms; use modest request rates (the script sleeps **4s** between URLs).
