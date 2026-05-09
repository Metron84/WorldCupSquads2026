import type { ProjectedPlayer, TeamProjection, WcqPlayerStats } from "@/lib/types";
import { slugifyTeam } from "@/lib/data";
import wcqFile from "@/data/generated/wcq_qualifying_stats.json";

export type WcqRow = {
  player: string;
  mp: number;
  minutes: number;
  goals: number;
  assists: number;
};

export type WcqQualifyingFile = {
  updated_at: string | null;
  source_note?: string;
  /**
   * When FBref `Squad` slug differs from the app team URL slug, map canonical slug → key used in `by_team_slug`.
   * Example: FBref uses `USA` → `usa`; app route is `united-states`.
   */
  wcq_extra_keys?: Record<string, string>;
  by_team_slug: Record<string, WcqRow[]>;
};

const WCQ_DATA = wcqFile as WcqQualifyingFile;

function getWcqRowsForCanonicalSlug(slug: string): WcqRow[] | undefined {
  const direct = WCQ_DATA.by_team_slug[slug];
  if (direct?.length) return direct;
  const altKey = WCQ_DATA.wcq_extra_keys?.[slug];
  if (altKey) {
    const alt = WCQ_DATA.by_team_slug[altKey];
    if (alt?.length) return alt;
  }
  return undefined;
}

function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const a = normalizeName(s1);
  const b = normalizeName(s2);
  if (!a || !b) return 0;
  const mDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatch = new Array(a.length).fill(false);
  const bMatch = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - mDist);
    const end = Math.min(i + mDist + 1, b.length);
    for (let j = start; j < end; j += 1) {
      if (bMatch[j] || a[i] !== b[j]) continue;
      aMatch[i] = true;
      bMatch[j] = true;
      matches += 1;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!aMatch[i]) continue;
    while (!bMatch[k]) k += 1;
    if (a[i] !== b[k]) t += 1;
    k += 1;
  }
  const transpositions = t / 2;
  const jaro =
    (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i += 1) {
    if (a[i] === b[i]) prefix += 1;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

function pickBestWcqRow(playerName: string, rows: WcqRow[]): WcqRow | undefined {
  const n = normalizeName(playerName);
  let exact: WcqRow | undefined;
  for (const r of rows) {
    if (normalizeName(r.player) === n) {
      exact = r;
      break;
    }
  }
  if (exact) return exact;

  let best: WcqRow | undefined;
  let bestScore = 0;
  for (const r of rows) {
    const subA = normalizeName(r.player);
    const subB = n;
    if (subA.length >= 5 && subB.includes(subA)) {
      best = r;
      bestScore = 1;
      break;
    }
    if (subB.length >= 5 && subA.includes(subB)) {
      best = r;
      bestScore = 1;
      break;
    }
    const j = jaroWinkler(playerName, r.player);
    if (j > bestScore) {
      bestScore = j;
      best = r;
    }
  }
  if (bestScore >= 0.88) return best;
  return undefined;
}

function rowToStats(row: WcqRow): WcqPlayerStats {
  return {
    mp: row.mp,
    minutes: row.minutes,
    goals: row.goals,
    assists: row.assists,
  };
}

/** Attach WCQ totals from generated JSON when names match FBref rows for this nation. */
export function mergeWcqIntoProjection(projection: TeamProjection): TeamProjection {
  const slug = slugifyTeam(projection.team);
  const rows = getWcqRowsForCanonicalSlug(slug);
  if (!rows?.length) return projection;

  const enrich = (p: ProjectedPlayer): ProjectedPlayer => {
    const hit = pickBestWcqRow(p.player, rows);
    if (!hit) return p;
    return { ...p, wcq: rowToStats(hit) };
  };

  return {
    ...projection,
    likely26: projection.likely26.map(enrich),
    bubble: projection.bubble.map(enrich),
    longshots: projection.longshots.map(enrich),
  };
}

export function getWcqMeta(): { updatedAt: string | null; sourceNote?: string } {
  return {
    updatedAt: WCQ_DATA.updated_at,
    sourceNote: WCQ_DATA.source_note,
  };
}

export function teamHasWcqRows(teamName: string): boolean {
  const slug = slugifyTeam(teamName);
  return (getWcqRowsForCanonicalSlug(slug)?.length ?? 0) > 0;
}
