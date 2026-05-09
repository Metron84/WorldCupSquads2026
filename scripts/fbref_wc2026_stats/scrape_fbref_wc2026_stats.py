#!/usr/bin/env python3
"""
Scrape FBref WCQ / 2026 Friendlies player stats into one Excel workbook.

Modes:
  - Default: requests.Session (optional Cookie from env or fbref_cookie.txt)
  - FBREF_HTML_DIR: parse saved HTML files (no network)
  - FBREF_USE_PLAYWRIGHT=1: fetch pages with Chromium (often bypasses 403)

Env:
  FBREF_SLEEP       seconds between live requests (default 8)
  FBREF_COOKIE      browser Cookie header string (paste from DevTools)
  FBREF_HTML_DIR    (CLI: --offline) dir with flat UEFA.html … and/or per-confederation subfolders
  FBREF_USE_PLAYWRIGHT  set to 1 to use Playwright for HTTP fetches
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from io import StringIO
from pathlib import Path

import pandas as pd
import requests

SCRIPT_DIR = Path(__file__).resolve().parent

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://fbref.com/",
    "Upgrade-Insecure-Requests": "1",
}

SOURCES: list[tuple[str, str]] = [
    ("UEFA", "https://fbref.com/en/comps/36/stats/WCQ----UEFA-M-Stats"),
    ("CONMEBOL", "https://fbref.com/en/comps/35/stats/WCQ----CONMEBOL-M-Stats"),
    ("CONCACAF", "https://fbref.com/en/comps/34/stats/WCQ----CONCACAF-M-Stats"),
    ("CAF", "https://fbref.com/en/comps/2/stats/WCQ----CAF-M-Stats"),
    ("AFC", "https://fbref.com/en/comps/37/stats/WCQ----AFC-M-Stats"),
]

FRIENDLIES_URL = "https://fbref.com/en/comps/218/2026/stats/2026-Friendlies-M-Stats"
FRIENDLIES_SHEET_NAME = "Friendlies_2026"

OFFLINE_FILES = {
    "UEFA": ("UEFA.html",),
    "CONMEBOL": ("CONMEBOL.html",),
    "CONCACAF": ("CONCACAF.html",),
    "CAF": ("CAF.html",),
    "AFC": ("AFC.html",),
    FRIENDLIES_SHEET_NAME: ("Friendlies_2026.html", "Friendlies.html", "2026-Friendlies-M-Stats.html"),
}

KEEP_COLS = ["Player", "Squad", "Pos", "Age", "MP", "Min", "Gls", "Ast"]


def sleep_seconds() -> float:
    return float(os.environ.get("FBREF_SLEEP", "8"))


def load_cookie_string() -> str | None:
    env = os.environ.get("FBREF_COOKIE", "").strip()
    if env:
        return env
    cookie_file = SCRIPT_DIR / "fbref_cookie.txt"
    if cookie_file.is_file():
        for line in cookie_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                return line
    return None


def build_session() -> requests.Session:
    s = requests.Session()
    h = dict(HEADERS)
    ck = load_cookie_string()
    if ck:
        h["Cookie"] = ck
        print("Using Cookie from FBREF_COOKIE or fbref_cookie.txt")
    s.headers.update(h)
    if ck is None:
        try:
            s.get("https://fbref.com/", timeout=30)
        except requests.RequestException:
            pass
    return s


def _read_html_tables(html: str) -> list[pd.DataFrame]:
    """pandas may treat long HTML strings as paths; always parse via StringIO."""
    return pd.read_html(StringIO(html))


def fetch_html_playwright(url: str) -> str:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        raise RuntimeError(
            "Install Playwright: pip install playwright && playwright install chromium",
        ) from e
    headless = os.environ.get("FBREF_PLAYWRIGHT_HEADLESS", "1").strip().lower() not in (
        "0",
        "false",
        "no",
    )
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        try:
            ctx = browser.new_context(
                user_agent=HEADERS["User-Agent"],
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                timezone_id="America/New_York",
            )
            ctx.set_extra_http_headers(
                {
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
            page = ctx.new_page()
            page.goto("https://fbref.com/", wait_until="domcontentloaded", timeout=120000)
            page.wait_for_timeout(2500)
            # Avoid wait_until=networkidle — challenge pages and analytics keep the network busy.
            page.goto(url, wait_until="domcontentloaded", timeout=180000)
            try:
                page.wait_for_selector("table.stats_table", timeout=120000)
            except Exception:
                page.wait_for_timeout(8000)
            page.wait_for_timeout(1500)
            html = page.content()
        finally:
            browser.close()

    if (
        "Just a moment" in html
        or "cf-turnstile" in html
        or "challenges.cloudflare.com" in html
    ) and "stats_table" not in html:
        raise RuntimeError(
            "FBref returned a Cloudflare challenge page (not the stats HTML).\n"
            "Try on your Mac:\n"
            "  FBREF_PLAYWRIGHT_HEADLESS=0 python scrape_fbref_wc2026_stats.py --playwright\n"
            "Or paste your browser Cookie into FBREF_COOKIE / fbref_cookie.txt and run without --playwright.\n"
            "Or save pages manually and use --offline DIR.",
        )
    return html


def fetch_html_requests(session: requests.Session, url: str) -> str:
    r = session.get(url, timeout=90)
    r.raise_for_status()
    return r.text


def flatten_columns(df: pd.DataFrame) -> pd.DataFrame:
    if isinstance(df.columns, pd.MultiIndex):
        new_cols = []
        for col in df.columns:
            parts = [
                str(p).strip()
                for p in col
                if str(p) not in ("nan", "") and "Unnamed" not in str(p)
            ]
            new_cols.append(parts[-1] if parts else str(col))
        out = df.copy()
        out.columns = new_cols
        return out
    return df


def normalize_column_name(name: str) -> str:
    n = str(name).strip()
    aliases = {
        "Matches Played": "MP",
        "Minutes": "Min",
        "Goals": "Gls",
        "Assists": "Ast",
    }
    return aliases.get(n, n)


def pick_player_stats_table(dfs: list[pd.DataFrame]) -> pd.DataFrame:
    for df in dfs:
        df = flatten_columns(df)
        if "Player" in df.columns:
            return df
        if any(str(c).strip() == "Player" for c in df.columns):
            return df
    if dfs:
        return flatten_columns(dfs[0])
    raise ValueError("No tables parsed from page")


def map_to_keep_cols(df: pd.DataFrame) -> pd.DataFrame:
    df = flatten_columns(df)
    df = df.rename(columns={c: normalize_column_name(c) for c in df.columns})
    df = df.loc[:, ~df.columns.duplicated()].copy()

    missing = [c for c in KEEP_COLS if c not in df.columns]
    if missing:
        for want in list(missing):
            for ac in list(df.columns):
                if want.lower() == str(ac).lower():
                    df = df.rename(columns={ac: want})
                    break
                if want == "MP" and re.search(r"\bMP\b", str(ac)):
                    df = df.rename(columns={ac: want})
                    break
                if want == "Min" and "min" in str(ac).lower():
                    df = df.rename(columns={ac: want})
                    break
        missing = [c for c in KEEP_COLS if c not in df.columns]

    if missing:
        raise ValueError(f"Missing columns: {missing}. Available: {list(df.columns)}")

    out = df[KEEP_COLS].copy()
    for col in ["MP", "Min", "Gls", "Ast", "Age"]:
        out[col] = pd.to_numeric(out[col], errors="coerce")
    return out


def clean_player_table(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = df[df["Player"].astype(str) != "Player"]
    df = df.dropna(subset=["Player"])
    df = df[df["Player"].astype(str).str.strip() != ""]
    return df.reset_index(drop=True)


def strip_aggregate_footer_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Drop FBref footer rows like Squad Total / Opponent Total on squad pages."""
    col = df["Player"].astype(str).str.strip().str.lower()
    mask = ~col.isin({"squad total", "opponent total"})
    return df.loc[mask].reset_index(drop=True)


def parse_squad_stats_html(html: str, squad_name: str, label: str) -> pd.DataFrame:
    """Parse a single-nation squad stats HTML page (no Squad column); inject squad_name."""
    if (
        "Just a moment" in html[:8000]
        or "cf-turnstile" in html
        or (
            "challenges.cloudflare.com" in html
            and "stats_table" not in html
        )
    ):
        raise RuntimeError(
            "Received a Cloudflare challenge page instead of FBref stats.\n"
            "Export FBREF_COOKIE from your browser (after the site loads), then run without --playwright.\n"
            "See README.md.",
        )
    dfs = _read_html_tables(html)
    raw = pick_player_stats_table(dfs)
    raw = flatten_columns(raw)
    raw = strip_aggregate_footer_rows(raw)
    raw = raw.copy()
    raw.insert(0, "Squad", squad_name)
    out = map_to_keep_cols(raw)
    out = clean_player_table(out)
    print(f"  OK — {label}: {len(out)} rows")
    return out


def parse_stats_html(html: str, label: str) -> pd.DataFrame:
    if (
        "Just a moment" in html[:8000]
        or "cf-turnstile" in html
        or (
            "challenges.cloudflare.com" in html
            and "stats_table" not in html
        )
    ):
        raise RuntimeError(
            "Received a Cloudflare challenge page instead of FBref stats.\n"
            "Export FBREF_COOKIE from your browser (after the site loads), then run without --playwright.\n"
            "See README.md.",
        )
    dfs = _read_html_tables(html)
    raw = pick_player_stats_table(dfs)
    out = map_to_keep_cols(raw)
    out = clean_player_table(out)
    print(f"  OK — {label}: {len(out)} rows")
    return out


def fetch_stats_table_live(
    session: requests.Session | None,
    url: str,
    label: str,
    *,
    use_playwright: bool,
) -> pd.DataFrame:
    print(f"Fetching {label} …")
    if use_playwright:
        html = fetch_html_playwright(url)
    else:
        assert session is not None
        html = fetch_html_requests(session, url)
    return parse_stats_html(html, label)


def load_offline_html(base: Path, sheet_key: str) -> str:
    names = OFFLINE_FILES[sheet_key]
    for name in names:
        p = base / name
        if p.is_file():
            return p.read_text(encoding="utf-8", errors="replace")
    raise FileNotFoundError(
        f"Missing HTML for {sheet_key}: tried {[base / n for n in names]}",
    )


def load_confederation_offline(base: Path, sheet_key: str) -> pd.DataFrame:
    """
    Prefer a single competition-wide file: {sheet_key}.html in base (legacy).
    Otherwise load every *.html under base/{sheet_key}/ as saved squad pages;
    filename stem (underscores → spaces) becomes the Squad value.
    """
    flat = base / f"{sheet_key}.html"
    squad_dir = base / sheet_key
    if flat.is_file():
        html = flat.read_text(encoding="utf-8", errors="replace")
        return parse_stats_html(html, sheet_key)
    if squad_dir.is_dir():
        files = sorted(squad_dir.glob("*.html"))
        if not files:
            raise FileNotFoundError(
                f"No *.html under {squad_dir} (and no {flat.name} in {base})",
            )
        parts: list[pd.DataFrame] = []
        for hf in files:
            squad = hf.stem.replace("_", " ").strip()
            html = hf.read_text(encoding="utf-8", errors="replace")
            parts.append(parse_squad_stats_html(html, squad, label=f"{sheet_key}/{hf.name}"))
        return pd.concat(parts, ignore_index=True)
    raise FileNotFoundError(
        f"Missing offline data for {sheet_key}: need {flat} or directory {squad_dir}/ with *.html",
    )


def filter_friendlies_date_range(
    df: pd.DataFrame,
    start: str = "2026-01-01",
    end: str = "2026-06-11",
) -> pd.DataFrame:
    date_cols = [c for c in df.columns if re.search(r"date", str(c), re.I)]
    if not date_cols:
        print(
            f"  Note: no date column on aggregate table — season URL only "
            f"(no row filter for {start}–{end}).",
        )
        return df

    dc = date_cols[0]
    parsed = pd.to_datetime(df[dc], errors="coerce")
    mask = (parsed >= pd.Timestamp(start)) & (parsed <= pd.Timestamp(end))
    filtered = df.loc[mask].reset_index(drop=True)
    print(f"  Friendlies date filter: {len(filtered)} rows (was {len(df)})")
    return filtered


def scrape_friendlies_from_html(html: str) -> pd.DataFrame:
    dfs = _read_html_tables(html)
    raw = pick_player_stats_table(dfs)
    out = map_to_keep_cols(raw)
    out = clean_player_table(out)
    out = filter_friendlies_date_range(out)
    out = out.copy()
    out.insert(0, "Season", "2026")
    cols = ["Season"] + KEEP_COLS
    return out[cols]


def scrape_friendlies_2026_live(
    session: requests.Session | None,
    *,
    use_playwright: bool,
) -> pd.DataFrame:
    print(f"Fetching Friendlies (2026) …")
    if use_playwright:
        html = fetch_html_playwright(FRIENDLIES_URL)
    else:
        assert session is not None
        html = fetch_html_requests(session, FRIENDLIES_URL)
    out = scrape_friendlies_from_html(html)
    print(f"  OK — Friendlies (2026): {len(out)} rows")
    return out


def top_goal_scorers_combined(sheets: dict[str, pd.DataFrame], n: int = 5) -> pd.DataFrame:
    parts = []
    for df in sheets.values():
        if df.empty or "Gls" not in df.columns:
            continue
        sub = df[["Player", "Squad", "Gls"]].copy()
        parts.append(sub)
    if not parts:
        return pd.DataFrame(columns=["Player", "Squad", "Gls"])
    all_df = pd.concat(parts, ignore_index=True)
    return (
        all_df.groupby(["Player", "Squad"], as_index=False)["Gls"]
        .sum()
        .sort_values("Gls", ascending=False)
        .head(n)
    )


def run_offline(html_dir: Path) -> dict[str, pd.DataFrame]:
    sheets: dict[str, pd.DataFrame] = {}
    if not html_dir.is_dir():
        raise NotADirectoryError(html_dir)
    print(f"Offline mode: reading HTML from {html_dir}\n")
    for sheet_name in ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC"]:
        print(f"Parsing {sheet_name} …")
        sheets[sheet_name] = load_confederation_offline(html_dir, sheet_name)

    print(f"Parsing {FRIENDLIES_SHEET_NAME} …")
    html = load_offline_html(html_dir, FRIENDLIES_SHEET_NAME)
    sheets[FRIENDLIES_SHEET_NAME] = scrape_friendlies_from_html(html)
    print(f"  OK — {FRIENDLIES_SHEET_NAME}: {len(sheets[FRIENDLIES_SHEET_NAME])} rows")
    return sheets


def run_live(use_playwright: bool) -> dict[str, pd.DataFrame]:
    delay = sleep_seconds()
    print(f"Request delay: {delay}s (set FBREF_SLEEP to change)\n")

    session = None if use_playwright else build_session()
    sheets: dict[str, pd.DataFrame] = {}

    for sheet_name, url in SOURCES:
        time.sleep(delay)
        sheets[sheet_name] = fetch_stats_table_live(session, url, sheet_name, use_playwright=use_playwright)

    time.sleep(delay)
    sheets[FRIENDLIES_SHEET_NAME] = scrape_friendlies_2026_live(session, use_playwright=use_playwright)
    return sheets


def write_workbook(sheets: dict[str, pd.DataFrame], out_path: Path) -> None:
    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        for sheet_name, df in sheets.items():
            df.to_excel(writer, sheet_name=sheet_name[:31], index=False)


def print_summary(sheets: dict[str, pd.DataFrame], out_path: Path) -> None:
    print(f"\nSaved: {out_path}\n")
    print("=== Summary ===")
    total_rows = 0
    for name, df in sheets.items():
        n = len(df)
        total_rows += n
        print(f"  {name}: {n} players")
    print(f"  Total rows (sum across sheets): {total_rows}")

    keys = []
    for df in sheets.values():
        if df.empty:
            continue
        if "Player" in df.columns and "Squad" in df.columns:
            for _, row in df.iterrows():
                keys.append((str(row["Player"]), str(row["Squad"])))
    print(f"  Unique Player+Squad combinations: {len(set(keys))}")

    top5 = top_goal_scorers_combined(sheets, 5)
    print("\n  Top 5 goal scorers (Gls summed across all sheets):")
    if top5.empty:
        print("    (none)")
    else:
        for _, row in top5.iterrows():
            g = row["Gls"]
            g_str = int(g) if pd.notna(g) and float(g).is_integer() else round(float(g), 2)
            print(f"    {row['Player']} ({row['Squad']}) — {g_str} goals")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="FBref WC2026 stats → Excel")
    p.add_argument(
        "--offline",
        type=Path,
        metavar="DIR",
        help="Load HTML from DIR: flat UEFA.html … and/or squad saves under UEFA/, … (see README)",
    )
    p.add_argument(
        "--playwright",
        action="store_true",
        help="Fetch with Chromium via Playwright (install: pip install playwright && playwright install chromium)",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    out_path = SCRIPT_DIR / "WC2026_Player_Stats.xlsx"

    use_pw = args.playwright or os.environ.get("FBREF_USE_PLAYWRIGHT", "").strip() in ("1", "true", "yes")

    if args.offline is not None:
        sheets = run_offline(args.offline.resolve())
    else:
        if use_pw:
            print("Using Playwright (Chromium) for HTTP fetches.\n")
        sheets = run_live(use_playwright=use_pw)

    write_workbook(sheets, out_path)
    print_summary(sheets, out_path)


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        r = e.response
        code = r.status_code if r is not None else "?"
        print(
            f"\nHTTP {code} from FBref.\n"
            "Try:\n"
            "  export FBREF_COOKIE='…'   # paste Cookie header from browser DevTools → Network → request headers\n"
            "  # or create fbref_cookie.txt (one line, same cookie string)\n"
            "  export FBREF_SLEEP=10\n"
            "  pip install playwright && playwright install chromium\n"
            "  python scrape_fbref_wc2026_stats.py --playwright\n"
            "  # or save each stats page as HTML and:\n"
            "  python scrape_fbref_wc2026_stats.py --offline ./saved_pages\n"
            "See README.md.\n",
            file=sys.stderr,
        )
        raise SystemExit(1) from e
    except RuntimeError as e:
        print(e, file=sys.stderr)
        raise SystemExit(1) from e
    except FileNotFoundError as e:
        print(f"\n{e}\n", file=sys.stderr)
        raise SystemExit(1) from e
