import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const POOL_INPUT = path.join(ROOT, "data", "generated", "player_pool.json");
const COVERAGE_INPUT = path.join(ROOT, "data", "generated", "completeness_report.json");
const OUTPUT = path.join(ROOT, "data", "generated", "projections.json");

const TODAY = new Date("2026-05-09T00:00:00.000Z");
const POSITION_TARGETS = { GK: 3, DF: 9, MF: 8, FW: 6 };
const AVAILABILITY_MULT = { available: 1, doubtful: 0.82, injured: 0.15, suspended: 0.1, unavailable: 0 };

function daysSince(date) {
  const ms = TODAY.getTime() - new Date(date).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function recency(date) {
  return Math.exp(-daysSince(date) / 150);
}

function computeScore(p, availability = "available") {
  const selectNorm = Math.min(1, p.capsInWindow / 15);
  const minsNorm = Math.min(1, p.minutesInWindow / 1200);
  const startsNorm = Math.min(1, p.startsInWindow / 11);
  const recencyNorm = recency(p.lastCallupDate);
  const qualifierWeight = p.qualifierSelections >= p.friendlySelections ? 1.0 : 0.9;
  const availabilityMultiplier = AVAILABILITY_MULT[availability] ?? 1;
  const raw = selectNorm * 0.4 + minsNorm * 0.3 + recencyNorm * 0.2 + startsNorm * 0.1;
  return {
    selectionScore: raw * qualifierWeight * availabilityMultiplier,
    scoreBreakdown: {
      selectionFrequency: Number(selectNorm.toFixed(3)),
      minutes: Number(minsNorm.toFixed(3)),
      recency: Number(recencyNorm.toFixed(3)),
      startsConsistency: Number(startsNorm.toFixed(3)),
      qualifierWeight,
      availabilityMultiplier,
    },
  };
}

function selectLikely(players) {
  const available = players.filter((p) => p.availabilityStatus !== "unavailable");
  const byPos = {
    GK: available.filter((p) => p.position === "GK").sort((a, b) => b.selectionScore - a.selectionScore),
    DF: available.filter((p) => p.position === "DF").sort((a, b) => b.selectionScore - a.selectionScore),
    MF: available.filter((p) => p.position === "MF").sort((a, b) => b.selectionScore - a.selectionScore),
    FW: available.filter((p) => p.position === "FW").sort((a, b) => b.selectionScore - a.selectionScore),
  };
  const likely = [];
  for (const [pos, n] of Object.entries(POSITION_TARGETS)) {
    likely.push(...byPos[pos].slice(0, n));
  }
  const ids = new Set(likely.map((p) => p.playerKey));
  const remaining = available.filter((p) => !ids.has(p.playerKey)).sort((a, b) => b.selectionScore - a.selectionScore);
  while (likely.length < 26 && remaining.length > 0) likely.push(remaining.shift());
  return likely.sort((a, b) => b.selectionScore - a.selectionScore);
}

async function main() {
  const pool = JSON.parse(await fs.readFile(POOL_INPUT, "utf-8"));
  const coverage = JSON.parse(await fs.readFile(COVERAGE_INPUT, "utf-8"));
  const coverageByTeam = new Map(coverage.map((c) => [c.team, c]));
  const overrideByKey = new Map(
    pool.availabilityOverrides.map((o) => [o.playerKey, { status: o.status, reason: o.reason }]),
  );

  const projections = pool.teamSummaries.map((teamMeta) => {
    const teamPlayers = pool.players
      .filter((p) => p.team === teamMeta.team)
      .map((p) => {
        const ov = overrideByKey.get(p.playerKey);
        const availabilityStatus = ov?.status ?? "available";
        const { selectionScore, scoreBreakdown } = computeScore(p, availabilityStatus);
        return {
          ...p,
          selectionScore: Number(selectionScore.toFixed(4)),
          availabilityStatus,
          availabilityReason: ov?.reason ?? "",
          scoreBreakdown,
        };
      })
      .sort((a, b) => b.selectionScore - a.selectionScore);

    const likely = selectLikely(teamPlayers).map((p) => ({ ...p, tier: "likely" }));
    const likelySet = new Set(likely.map((p) => p.playerKey));
    const remaining = teamPlayers.filter((p) => !likelySet.has(p.playerKey)).sort((a, b) => b.selectionScore - a.selectionScore);
    const bubble = remaining.slice(0, 14).map((p) => ({ ...p, tier: "bubble" }));
    const bubbleSet = new Set(bubble.map((p) => p.playerKey));
    const longshots = remaining.filter((p) => !bubbleSet.has(p.playerKey)).slice(0, 30).map((p) => ({ ...p, tier: "longshot" }));

    return {
      team: teamMeta.team,
      confederation: teamMeta.confederation,
      qualifiedVia: teamMeta.qualifiedVia,
      qualificationStatus: teamMeta.qualificationStatus,
      updatedAt: TODAY.toISOString().slice(0, 10),
      evidence: coverageByTeam.get(teamMeta.team),
      likely26: likely,
      bubble,
      longshots,
    };
  });

  await fs.writeFile(OUTPUT, JSON.stringify(projections, null, 2));
  console.log(`Projected squads for ${projections.length} teams -> ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
