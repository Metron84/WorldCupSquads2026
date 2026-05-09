import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const C = path.join(ROOT, "data", "canonical");
const G = path.join(ROOT, "data", "generated");
const TODAY = new Date("2026-05-09T00:00:00.000Z");
const POSITION_TARGETS = { GK: 3, DF: 9, MF: 8, FW: 6 };
const AVAIL = { available: 1.0, doubtful: 0.82, injured: 0.15, suspended: 0.1, unavailable: 0.0 };
const CONFED_PENALTY = { UEFA: 1, CONMEBOL: 1, CONCACAF: 0.97, CAF: 0.95, AFC: 0.95, OFC: 0.9, Host: 1 };

function normalizeString(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1;
  const a = normalizeString(s1);
  const b = normalizeString(s2);
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

function recencyWeight(dateStr) {
  const days = Math.max(0, Math.floor((TODAY.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
  return Math.exp(-days / 180);
}

function availabilityForPlayer(playerId, overrides) {
  const active = overrides.filter((o) => o.player_id === playerId);
  if (!active.length) return { status: "available", reason: "" };
  const sorted = active.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  return { status: sorted[0].status, reason: sorted[0].reason };
}

function confidenceLevel(playersObserved, qualMatches, friendlyMatches, confedMultiplier) {
  const base =
    (Math.min(playersObserved, 45) / 45) * 0.5 +
    (Math.min(qualMatches, 12) / 12) * 0.35 +
    (Math.min(friendlyMatches, 6) / 6) * 0.15;
  const adjusted = base * confedMultiplier;
  if (adjusted >= 0.8) return "high";
  if (adjusted >= 0.62) return "medium";
  return "low";
}

async function read(name) {
  return JSON.parse(await fs.readFile(path.join(C, name), "utf-8"));
}

async function main() {
  const [teams, players, aliases, matches, callups, overrides] = await Promise.all([
    read("teams.json"),
    read("players_master.json"),
    read("player_aliases.json"),
    read("matches.json"),
    read("callups_or_appearances.json"),
    read("availability_overrides.json"),
  ]);

  const playersById = new Map(players.map((p) => [p.player_id, p]));
  const matchesById = new Map(matches.map((m) => [m.match_id, m]));
  const aliasesByPlayer = new Map();
  for (const a of aliases) {
    if (!aliasesByPlayer.has(a.player_id)) aliasesByPlayer.set(a.player_id, []);
    aliasesByPlayer.get(a.player_id).push(a.alias_name);
  }

  // Identity review queue simulation from alias/canonical divergence.
  const identityReviewQueue = [];
  for (const p of players) {
    const names = [p.canonical_name, ...(aliasesByPlayer.get(p.player_id) || [])];
    if (names.length < 2) continue;
    let best = 0;
    for (let i = 1; i < names.length; i += 1) {
      best = Math.max(best, jaroWinkler(names[0], names[i]));
    }
    if (best >= 0.95) continue;
    if (best >= 0.8) {
      identityReviewQueue.push({
        action: "SEND_TO_MANUAL_REVIEW",
        player_id: p.player_id,
        canonical_name: p.canonical_name,
        best_alias_similarity: Number(best.toFixed(4)),
      });
    } else {
      identityReviewQueue.push({
        action: "CREATE_NEW_RECORD_CANDIDATE",
        player_id: p.player_id,
        canonical_name: p.canonical_name,
        best_alias_similarity: Number(best.toFixed(4)),
      });
    }
  }

  const perTeam = new Map();
  for (const c of callups) {
    const player = playersById.get(c.player_id);
    const match = matchesById.get(c.match_id);
    if (!player || !match) continue;
    const key = `${c.team_id}::${c.player_id}`;
    const prev = perTeam.get(key) || {
      team_id: c.team_id,
      player_id: c.player_id,
      player: player.canonical_name,
      position:
        c.status === "starter" && c.minutes_played <= 5
          ? "FW"
          : ["GK", "DF", "MF", "FW"][Math.abs(player.canonical_name.length) % 4], // fallback deterministic assignment
      capsInWindow: 0,
      startsInWindow: 0,
      minutesInWindow: 0,
      qualifierSelections: 0,
      friendlySelections: 0,
      lastCallupDate: match.date.slice(0, 10),
    };
    prev.capsInWindow += 1;
    if (c.status === "starter") prev.startsInWindow += 1;
    prev.minutesInWindow += c.minutes_played || 0;
    if (match.competition_type === "qualifier") prev.qualifierSelections += 1;
    if (match.competition_type === "friendly") prev.friendlySelections += 1;
    if (new Date(match.date) > new Date(prev.lastCallupDate)) prev.lastCallupDate = match.date.slice(0, 10);
    perTeam.set(key, prev);
  }

  const teamPlayerRows = [...perTeam.values()];
  const byTeam = new Map();
  for (const row of teamPlayerRows) {
    if (!byTeam.has(row.team_id)) byTeam.set(row.team_id, []);
    byTeam.get(row.team_id).push(row);
  }

  const completenessReport = [];
  const projections = [];

  for (const team of teams) {
    const rows = (byTeam.get(team.team_id) || []).map((r) => {
      const avail = availabilityForPlayer(r.player_id, overrides);
      const selectionFrequency = Math.min(1, r.capsInWindow / 10);
      const minutes = Math.min(1, r.minutesInWindow / 900);
      const startsConsistency = Math.min(1, r.startsInWindow / 10);
      const recency = recencyWeight(r.lastCallupDate);
      const qualifierWeight = r.qualifierSelections >= r.friendlySelections ? 1 : 0.9;
      const availabilityMultiplier = AVAIL[avail.status] ?? 1;
      const score =
        (selectionFrequency * 0.4 + minutes * 0.3 + recency * 0.2 + startsConsistency * 0.1) *
        qualifierWeight *
        availabilityMultiplier;
      return {
        ...r,
        selectionScore: Number(score.toFixed(4)),
        tier: "longshot",
        availabilityStatus: avail.status,
        availabilityReason: avail.reason,
        scoreBreakdown: {
          selectionFrequency: Number(selectionFrequency.toFixed(3)),
          minutes: Number(minutes.toFixed(3)),
          recency: Number(recency.toFixed(3)),
          startsConsistency: Number(startsConsistency.toFixed(3)),
          qualifierWeight,
          availabilityMultiplier,
        },
      };
    });

    rows.sort((a, b) => b.selectionScore - a.selectionScore);
    const byPos = {
      GK: rows.filter((r) => r.position === "GK"),
      DF: rows.filter((r) => r.position === "DF"),
      MF: rows.filter((r) => r.position === "MF"),
      FW: rows.filter((r) => r.position === "FW"),
    };
    const likely = [];
    for (const [pos, n] of Object.entries(POSITION_TARGETS)) likely.push(...byPos[pos].slice(0, n));
    const likelySet = new Set(likely.map((r) => r.player_id));
    const rest = rows.filter((r) => !likelySet.has(r.player_id));
    while (likely.length < 26 && rest.length > 0) likely.push(rest.shift());
    const bubble = rest.slice(0, 14);
    const bubbleSet = new Set(bubble.map((r) => r.player_id));
    const longshots = rest.filter((r) => !bubbleSet.has(r.player_id)).slice(0, 30);

    likely.forEach((r) => (r.tier = "likely"));
    bubble.forEach((r) => (r.tier = "bubble"));
    longshots.forEach((r) => (r.tier = "longshot"));

    const teamMatches = matches.filter((m) => m.home_team_id === team.team_id || m.away_team_id === team.team_id);
    const qualifierMatchesUsed = teamMatches.filter((m) => m.competition_type === "qualifier").length;
    const friendlyMatchesUsed = teamMatches.filter((m) => m.competition_type === "friendly").length;
    const dates = teamMatches.map((m) => m.date).sort();
    const dateRangeUsed = dates.length ? `${dates[0].slice(0, 10)} -> ${dates[dates.length - 1].slice(0, 10)}` : "n/a";
    const playersObserved = rows.length;
    const confedMultiplier = CONFED_PENALTY[team.confederation] ?? 0.9;
    const conf = confidenceLevel(playersObserved, qualifierMatchesUsed, friendlyMatchesUsed, confedMultiplier);
    const warnings = [];
    if (playersObserved < 30) warnings.push("Small observed player universe (<30).");
    if (qualifierMatchesUsed < 8) warnings.push("Low qualifier sample (<8).");
    if (friendlyMatchesUsed < 2) warnings.push("Low friendly sample (<2).");

    const evidence = {
      playersObserved,
      qualifierMatchesUsed,
      friendlyMatchesUsed,
      dateRangeUsed,
      confidenceLevel: conf,
      sourcePenaltyMultiplier: confedMultiplier,
      coverageWarnings: warnings,
    };

    completenessReport.push({
      team: team.name,
      confederation: team.confederation,
      playersObserved,
      qualifierMatchesUsed,
      friendlyMatchesUsed,
      dateRangeUsed,
      confidenceLevel: conf,
      sourcePenaltyMultiplier: confedMultiplier,
      coverageWarnings: warnings,
    });

    projections.push({
      team: team.name,
      confederation: team.confederation,
      qualifiedVia: team.qualification_method,
      qualificationStatus: team.qualification_status,
      updatedAt: TODAY.toISOString().slice(0, 10),
      evidence,
      likely26: likely,
      bubble,
      longshots,
    });
  }

  await fs.mkdir(G, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(G, "identity_review_queue.json"), JSON.stringify(identityReviewQueue, null, 2)),
    fs.writeFile(path.join(G, "completeness_report.json"), JSON.stringify(completenessReport, null, 2)),
    fs.writeFile(path.join(G, "projections.json"), JSON.stringify(projections, null, 2)),
  ]);
  console.log(`Built projections from canonical tables for ${projections.length} teams.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
