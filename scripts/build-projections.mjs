import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const RAW_CALLUPS = path.join(ROOT, "data/raw/callups.json");
const RAW_TEAMS = path.join(ROOT, "data/raw/qualifiedTeams.json");
const GENERATED = path.join(ROOT, "data/generated/projections.json");

const POSITION_TARGETS = { GK: 3, DF: 9, MF: 8, FW: 6 };
const TODAY = new Date("2026-05-09T00:00:00.000Z");

function daysSince(dateString) {
  const d = new Date(dateString);
  const ms = TODAY.getTime() - d.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function recencyWeight(lastCallupDate) {
  const days = daysSince(lastCallupDate);
  // Smooth half-life style decay.
  return Math.exp(-days / 120);
}

function computeScore(row) {
  const caps = row.selected;
  const starts = row.starts;
  const mins = row.minutes;
  const selectNorm = Math.min(1, caps / 8);
  const startsNorm = Math.min(1, starts / 8);
  const minsNorm = Math.min(1, mins / 720);
  const recencyNorm = recencyWeight(row.lastCallupDate);
  const qualifierBoost = row.competitionType === "qualifier" ? 1.0 : 0.72;

  const weighted =
    selectNorm * 0.4 +
    minsNorm * 0.3 +
    recencyNorm * 0.2 +
    startsNorm * 0.1;
  return weighted * qualifierBoost;
}

function aggregatePlayers(rows) {
  const players = new Map();
  for (const row of rows) {
    const key = `${row.team}::${row.player}`;
    const existing = players.get(key) || {
      team: row.team,
      player: row.player,
      position: row.position,
      selectionScore: 0,
      capsInWindow: 0,
      startsInWindow: 0,
      minutesInWindow: 0,
      qualifierSelections: 0,
      friendlySelections: 0,
      lastCallupDate: row.lastCallupDate,
    };
    const rowScore = computeScore(row);
    existing.selectionScore += rowScore;
    existing.capsInWindow += row.selected;
    existing.startsInWindow += row.starts;
    existing.minutesInWindow += row.minutes;
    if (row.competitionType === "qualifier") {
      existing.qualifierSelections += row.selected;
    } else {
      existing.friendlySelections += row.selected;
    }
    if (new Date(row.lastCallupDate) > new Date(existing.lastCallupDate)) {
      existing.lastCallupDate = row.lastCallupDate;
    }
    players.set(key, existing);
  }
  return [...players.values()];
}

function selectLikely26(players) {
  const byPos = {
    GK: players.filter((p) => p.position === "GK").sort((a, b) => b.selectionScore - a.selectionScore),
    DF: players.filter((p) => p.position === "DF").sort((a, b) => b.selectionScore - a.selectionScore),
    MF: players.filter((p) => p.position === "MF").sort((a, b) => b.selectionScore - a.selectionScore),
    FW: players.filter((p) => p.position === "FW").sort((a, b) => b.selectionScore - a.selectionScore),
  };

  const likely = [];
  for (const [pos, target] of Object.entries(POSITION_TARGETS)) {
    likely.push(...byPos[pos].slice(0, target));
  }

  const ids = new Set(likely.map((p) => p.player));
  const remaining = players
    .filter((p) => !ids.has(p.player))
    .sort((a, b) => b.selectionScore - a.selectionScore);

  while (likely.length < 26 && remaining.length > 0) {
    likely.push(remaining.shift());
  }
  return likely.sort((a, b) => b.selectionScore - a.selectionScore);
}

function tierPlayers(players, likely26) {
  const likelyIds = new Set(likely26.map((p) => p.player));
  const remaining = players
    .filter((p) => !likelyIds.has(p.player))
    .sort((a, b) => b.selectionScore - a.selectionScore);
  const bubble = remaining.slice(0, 8);
  const bubbleIds = new Set(bubble.map((p) => p.player));
  const longshots = remaining.filter((p) => !bubbleIds.has(p.player));
  return { bubble, longshots };
}

async function main() {
  const [callupsRaw, teamsRaw] = await Promise.all([
    fs.readFile(RAW_CALLUPS, "utf-8"),
    fs.readFile(RAW_TEAMS, "utf-8"),
  ]);
  const callups = JSON.parse(callupsRaw);
  const qualifiedTeams = JSON.parse(teamsRaw);
  const aggregated = aggregatePlayers(callups);

  const output = qualifiedTeams.map((teamMeta) => {
    const teamPlayers = aggregated
      .filter((p) => p.team === teamMeta.team)
      .sort((a, b) => b.selectionScore - a.selectionScore)
      .map((p) => ({
        ...p,
        selectionScore: Number(p.selectionScore.toFixed(4)),
      }));
    const likely26 = selectLikely26(teamPlayers);
    const { bubble, longshots } = tierPlayers(teamPlayers, likely26);
    return {
      team: teamMeta.team,
      confederation: teamMeta.confederation,
      qualifiedVia: teamMeta.qualifiedVia,
      updatedAt: TODAY.toISOString().slice(0, 10),
      likely26: likely26.map((p) => ({ ...p, tier: "likely" })),
      bubble: bubble.map((p) => ({ ...p, tier: "bubble" })),
      longshots: longshots.map((p) => ({ ...p, tier: "longshot" })),
    };
  });

  await fs.mkdir(path.dirname(GENERATED), { recursive: true });
  await fs.writeFile(GENERATED, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Built projections for ${output.length} qualified teams -> ${GENERATED}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
