#!/usr/bin/env python3
"""
Scrape FBref WCQ / 2026 Friendlies player stats into one Excel workbook.
Uses requests + pandas.read_html; sleeps between requests. Check FBref ToS before heavy use.
"""

from __future__ import annotations

import re
import time
from pathlib import Path

import pandas as pd
import requests

# FBref often blocks bare User-Agent strings; mimic a desktop browser.
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
REQUEST_SLEEP_SEC = 4


def build_session() -> requests.Session:
    """Session + homepage hit sometimes avoids 403 vs bare GET."""
    s = requests.Session()
    s.headers.update(HEADERS)
    try:
        s.get("https://fbref.com/", timeout=30)
    except requests.RequestException:
        pass
    return s

SOURCES: list[tuple[str, str]] = [
    ("UEFA", "https://fbref.com/en/comps/36/stats/WCQ----UEFA-M-Stats"),
    ("CONMEBOL", "https://fbref.com/en/comps/35/stats/WCQ----CONMEBOL-M-Stats"),
    ("CONCACAF", "https://fbref.com/en/comps/34/stats/WCQ----CONCACAF-M-Stats"),
    ("CAF", "https://fbref.com/en/comps/2/stats/WCQ----CAF-M-Stats"),
    ("AFC", "https://fbref.com/en/comps/37/stats/WCQ----AFC-M-Stats"),
]

FRIENDLIES_URL = "https://fbref.com/en/comps/218/2026/stats/2026-Friendlies-M-Stats"
FRIENDLIES_SHEET_NAME = "Friendlies_2026"

KEEP_COLS = ["Player", "Squad", "Pos", "Age", "MP", "Min", "Gls", "Ast"]


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


def fetch_stats_table(session: requests.Session, url: str, label: str) -> pd.DataFrame:
    print(f"Fetching {label} …")
    r = session.get(url, timeout=60)
    r.raise_for_status()
    dfs = pd.read_html(r.text)
    raw = pick_player_stats_table(dfs)
    out = map_to_keep_cols(raw)
    out = clean_player_table(out)
    print(f"  OK — {label}: {len(out)} rows")
    return out


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


def scrape_friendlies_2026(session: requests.Session) -> pd.DataFrame:
    df = fetch_stats_table(session, FRIENDLIES_URL, "Friendlies (2026)")
    df = filter_friendlies_date_range(df)
    df = df.copy()
    df.insert(0, "Season", "2026")
    cols = ["Season"] + KEEP_COLS
    return df[cols]


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


def main() -> None:
    out_path = Path(__file__).resolve().parent / "WC2026_Player_Stats.xlsx"
    sheets: dict[str, pd.DataFrame] = {}

    session = build_session()

    for sheet_name, url in SOURCES:
        time.sleep(REQUEST_SLEEP_SEC)
        sheets[sheet_name] = fetch_stats_table(session, url, sheet_name)

    time.sleep(REQUEST_SLEEP_SEC)
    sheets[FRIENDLIES_SHEET_NAME] = scrape_friendlies_2026(session)

    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        for sheet_name, df in sheets.items():
            df.to_excel(writer, sheet_name=sheet_name[:31], index=False)

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
        pcol = "Player" if "Player" in df.columns else None
        scol = "Squad" if "Squad" in df.columns else None
        if pcol and scol:
            for _, row in df.iterrows():
                keys.append((str(row[pcol]), str(row[scol])))
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


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        r = e.response
        code = r.status_code if r is not None else "?"
        print(
            f"\nHTTP {code} from FBref. Automated requests are often blocked.\n"
            "Try: run this script on your local machine, increase REQUEST_SLEEP_SEC "
            "to 6–8, or use a residential network. See README.md in this folder.\n",
        )
        raise SystemExit(1) from e
