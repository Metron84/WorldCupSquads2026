import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const C = path.join(ROOT, "data", "canonical");
const SOURCES = path.join(ROOT, "data", "sources", "sources.json");

async function read(name) {
  return JSON.parse(await fs.readFile(path.join(C, name), "utf-8"));
}

function fail(msg) {
  console.error(`VALIDATION ERROR: ${msg}`);
  process.exit(1);
}

async function loadSourceIds() {
  const raw = JSON.parse(await fs.readFile(SOURCES, "utf-8"));
  if (!Array.isArray(raw.sources)) fail("sources.json must contain a sources array");
  return new Set(raw.sources.map((s) => s.source_id).filter(Boolean));
}

async function main() {
  const allowedSourceIds = await loadSourceIds();
  const [teams, players, aliases, matches, callups, overrides] = await Promise.all([
    read("teams.json"),
    read("players_master.json"),
    read("player_aliases.json"),
    read("matches.json"),
    read("callups_or_appearances.json"),
    read("availability_overrides.json"),
  ]);

  const teamIds = new Set(teams.map((t) => t.team_id));
  const playerIds = new Set(players.map((p) => p.player_id));
  const matchIds = new Set(matches.map((m) => m.match_id));

  const allowedCallupStatus = new Set(["starter", "substitute", "bench", "withdrawn"]);
  const allowedAvailability = new Set(["available", "doubtful", "injured", "suspended", "unavailable"]);
  const allowedCompType = new Set(["qualifier", "friendly"]);
  const allowedSquadPos = new Set(["GK", "DF", "MF", "FW"]);

  for (const p of players) {
    if (!teamIds.has(p.team_id)) fail(`players_master.team_id missing in teams: ${p.player_id}`);
  }
  for (const a of aliases) {
    if (!playerIds.has(a.player_id)) fail(`player_aliases.player_id missing in players_master: ${a.alias_id}`);
  }
  for (const m of matches) {
    if (!teamIds.has(m.home_team_id)) fail(`matches.home_team_id missing in teams: ${m.match_id}`);
    if (!teamIds.has(m.away_team_id)) fail(`matches.away_team_id missing in teams: ${m.match_id}`);
    if (!allowedCompType.has(m.competition_type)) fail(`invalid matches.competition_type: ${m.match_id}`);
    if (m.source_id != null && m.source_id !== "" && !allowedSourceIds.has(m.source_id)) {
      fail(`matches.source_id not in data/sources/sources.json: ${m.match_id} -> ${m.source_id}`);
    }
  }
  for (const c of callups) {
    if (!playerIds.has(c.player_id)) fail(`callups.player_id missing in players_master: ${c.record_id}`);
    if (!teamIds.has(c.team_id)) fail(`callups.team_id missing in teams: ${c.record_id}`);
    if (!matchIds.has(c.match_id)) fail(`callups.match_id missing in matches: ${c.record_id}`);
    if (!allowedCallupStatus.has(c.status)) fail(`invalid callups.status: ${c.record_id}`);
    if (c.source_id != null && c.source_id !== "" && !allowedSourceIds.has(c.source_id)) {
      fail(`callups.source_id not in data/sources/sources.json: ${c.record_id} -> ${c.source_id}`);
    }
    if (c.squad_position_group != null && c.squad_position_group !== "" && !allowedSquadPos.has(c.squad_position_group)) {
      fail(`invalid callups.squad_position_group: ${c.record_id}`);
    }
  }
  for (const o of overrides) {
    if (!playerIds.has(o.player_id)) fail(`availability_overrides.player_id missing in players_master: ${o.override_id}`);
    if (!allowedAvailability.has(o.status)) fail(`invalid availability_overrides.status: ${o.override_id}`);
  }

  console.log(`Canonical validation passed (${allowedSourceIds.size} sources in allowlist).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
