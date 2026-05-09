import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "data", "intermediate", "normalized.json");
const OUTPUT = path.join(ROOT, "data", "generated", "player_pool.json");

async function main() {
  const data = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  const matchesById = new Map(data.matches.map((m) => [m.matchId, m]));
  const players = new Map();

  for (const row of data.callups) {
    const match = matchesById.get(row.matchId);
    if (!match) continue;
    const k = `${row.team}::${row.playerKey}`;
    const prev = players.get(k) || {
      team: row.team,
      player: row.player,
      playerKey: row.playerKey,
      position: row.position,
      capsInWindow: 0,
      startsInWindow: 0,
      minutesInWindow: 0,
      qualifierSelections: 0,
      friendlySelections: 0,
      matchIds: [],
      lastCallupDate: row.date,
    };
    prev.capsInWindow += row.selected;
    prev.startsInWindow += row.starts;
    prev.minutesInWindow += row.minutes;
    if (match.competitionType === "qualifier") prev.qualifierSelections += row.selected;
    if (match.competitionType === "friendly") prev.friendlySelections += row.selected;
    prev.matchIds.push(row.matchId);
    if (new Date(row.date) > new Date(prev.lastCallupDate)) prev.lastCallupDate = row.date;
    players.set(k, prev);
  }

  const byTeam = {};
  for (const p of players.values()) {
    if (!byTeam[p.team]) byTeam[p.team] = [];
    byTeam[p.team].push(p);
  }

  const teamSummaries = data.teams.map((teamMeta) => {
    const teamMatches = data.matches.filter((m) => m.team === teamMeta.team);
    const qualifierMatchesUsed = teamMatches.filter((m) => m.competitionType === "qualifier").length;
    const friendlyMatchesUsed = teamMatches.filter((m) => m.competitionType === "friendly").length;
    const playersObserved = (byTeam[teamMeta.team] || []).length;
    const dates = teamMatches.map((m) => m.date).sort();
    const dateRangeUsed = dates.length ? `${dates[0]} -> ${dates[dates.length - 1]}` : "n/a";
    return {
      team: teamMeta.team,
      confederation: teamMeta.confederation,
      qualifiedVia: teamMeta.qualifiedVia,
      qualificationStatus: teamMeta.qualificationStatus,
      playersObserved,
      qualifierMatchesUsed,
      friendlyMatchesUsed,
      dateRangeUsed,
    };
  });

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(
    OUTPUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        teamSummaries,
        players: [...players.values()],
        availabilityOverrides: data.availabilityOverrides,
      },
      null,
      2,
    ),
  );
  console.log(`Aggregated player pool -> ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
