#!/usr/bin/env python3
"""
Emit `data/generated/wcq_qualifying_stats.json` from `WC2026_Player_Stats.xlsx`.

Run after `python scrape_fbref_wc2026_stats.py` (or `--offline`) so the workbook exists
next to this script. WCQ sheets only (UEFA, CONMEBOL, CONCACAF, CAF, AFC).

Usage (from repo root):
  npm run data:wcq:export
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
XLSX = SCRIPT_DIR / "WC2026_Player_Stats.xlsx"
OUT = ROOT / "data" / "generated" / "wcq_qualifying_stats.json"

WCQ_SHEETS = ("UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC")
KEEP = ("Player", "Squad", "MP", "Min", "Gls", "Ast")


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def flatten_columns(df):
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


def prepare_frame(df):
    df = flatten_columns(df)
    df = df.rename(columns={c: normalize_column_name(c) for c in df.columns})
    df = df.loc[:, ~df.columns.duplicated()].copy()

    missing = [c for c in KEEP if c not in df.columns]
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
        missing = [c for c in KEEP if c not in df.columns]

    if missing:
        raise ValueError(f"Missing columns {missing}; have {list(df.columns)}")

    out = df[list(KEEP)].copy()
    for col in ("MP", "Min", "Gls", "Ast"):
        out[col] = pd.to_numeric(out[col], errors="coerce")
    out = out[out["Player"].astype(str) != "Player"]
    out = out.dropna(subset=["Player"])
    out = out[out["Player"].astype(str).str.strip() != ""]
    col = out["Player"].astype(str).str.strip().str.lower()
    out = out[~col.isin({"squad total", "opponent total"})]
    return out.reset_index(drop=True)


def main() -> int:
    if not XLSX.is_file():
        print(f"Missing workbook: {XLSX}", file=sys.stderr)
        print("Create it with: python scrape_fbref_wc2026_stats.py (or --offline ./offline_pages)", file=sys.stderr)
        return 1

    xl = pd.ExcelFile(XLSX)
    frames = []
    for sheet in WCQ_SHEETS:
        if sheet not in xl.sheet_names:
            continue
        raw = pd.read_excel(xl, sheet_name=sheet)
        frames.append(prepare_frame(raw))

    if not frames:
        print(f"No WCQ sheets found in {XLSX}; expected one of {WCQ_SHEETS}", file=sys.stderr)
        return 1

    all_rows = pd.concat(frames, ignore_index=True)
    # Same nation + player can appear if sheets overlap; keep max minutes.
    all_rows["_min"] = all_rows["Min"].fillna(0)
    idx = all_rows.groupby(["Squad", "Player"])["_min"].idxmax()
    deduped = all_rows.loc[idx].drop(columns=["_min"])

    by_slug: dict[str, list[dict]] = defaultdict(list)
    for _, row in deduped.iterrows():
        squad = str(row["Squad"]).strip()
        if not squad:
            continue
        slug = slugify(squad)
        by_slug[slug].append(
            {
                "player": str(row["Player"]).strip(),
                "mp": int(row["MP"]) if pd.notna(row["MP"]) else 0,
                "minutes": int(row["Min"]) if pd.notna(row["Min"]) else 0,
                "goals": int(row["Gls"]) if pd.notna(row["Gls"]) else 0,
                "assists": int(row["Ast"]) if pd.notna(row["Ast"]) else 0,
            }
        )

    payload = {
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source_note": "FBref WCQ sheets from WC2026_Player_Stats.xlsx — merged on team pages by slugified Squad name.",
        "by_team_slug": {k: sorted(v, key=lambda r: (-r["minutes"], r["player"])) for k, v in sorted(by_slug.items())},
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(by_slug)} nations, {len(deduped)} player rows).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
