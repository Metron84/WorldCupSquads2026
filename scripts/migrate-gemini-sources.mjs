import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CANONICAL_DIR = path.join(ROOT, "data", "canonical");
const GENERATED_DIR = path.join(ROOT, "data", "generated");

const SRC = {
  schema: "/Users/wajeddoumani/Downloads/gemini-code-1778318603266.json",
  teams: "/Users/wajeddoumani/Downloads/gemini-code-1778318610989.json",
  players: "/Users/wajeddoumani/Downloads/gemini-code-1778318615291.json",
  aliases: "/Users/wajeddoumani/Downloads/gemini-code-1778318620282.json",
  matches: "/Users/wajeddoumani/Downloads/gemini-code-1778318624584.json",
  callups: "/Users/wajeddoumani/Downloads/gemini-code-1778318629087.json",
  overrides: "/Users/wajeddoumani/Downloads/gemini-code-1778318640026.json",
};

const CONFED_PRIORITY = {
  UEFA: { gold: 1, silver: 0.9, bronze: 0.75, fallback: 0.6 },
  CONMEBOL: { gold: 1, silver: 0.9, bronze: 0.75, fallback: 0.6 },
  CONCACAF: { gold: 1, silver: 0.9, bronze: 0.75, fallback: 0.65 },
  CAF: { gold: 1, silver: 0.9, bronze: 0.75, fallback: 0.6 },
  AFC: { gold: 1, silver: 0.9, bronze: 0.75, fallback: 0.6 },
  OFC: { gold: 1, silver: 0.9, bronze: 0.75, fallback: 0.5 },
  Host: { gold: 1, silver: 0.9, bronze: 0.75, fallback: 0.6 },
};

function toIsoDateTime(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "2026-01-01T00:00:00.000Z";
  return d.toISOString();
}

function toIsoDate(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "2026-01-01";
  return d.toISOString().slice(0, 10);
}

function statusToAvailability(reason) {
  if (reason === "injury") return "injured";
  if (reason === "suspension") return "suspended";
  if (reason === "personal") return "doubtful";
  return "available";
}

function inferCompetitionType(stage) {
  return stage === "group" ? "qualifier" : "friendly";
}

function inferSourceTier(confed, stage) {
  if (stage === "group") return "gold";
  if (confed === "OFC") return "fallback";
  return "silver";
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf-8"));
}

async function main() {
  await fs.mkdir(CANONICAL_DIR, { recursive: true });
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const [teamsRaw, playersRaw, aliasesRaw, matchesRaw, callupsRaw, overridesRaw] = await Promise.all([
    readJson(SRC.teams),
    readJson(SRC.players),
    readJson(SRC.aliases),
    readJson(SRC.matches),
    readJson(SRC.callups),
    readJson(SRC.overrides),
  ]);

  let prevTeamsById = new Map();
  try {
    const prevRaw = JSON.parse(await fs.readFile(path.join(CANONICAL_DIR, "teams.json"), "utf-8"));
    prevTeamsById = new Map(prevRaw.map((row) => [row.team_id, row]));
  } catch {
    /* no existing canonical teams */
  }

  const teams = teamsRaw.map((t) => ({
    team_id: t.team_id,
    name: t.name,
    short_name: t.short_name,
    confederation: t.confederation,
    qualification_method: t.qualification_method,
    qualification_status: "qualified",
    fifa_rank: t.fifa_rank,
    world_cup_group: prevTeamsById.get(t.team_id)?.world_cup_group,
  }));
  const teamMap = new Map(teams.map((t) => [t.team_id, t]));

  const players_master = playersRaw.map((p) => ({
    player_id: p.player_id,
    canonical_name: p.canonical_name,
    dob: toIsoDate(p.dob),
    nationality_iso3: p.nationality_iso3,
    team_id: p.team_id,
  }));

  const player_aliases = aliasesRaw.map((a) => ({
    alias_id: a.alias_id,
    player_id: a.player_id,
    alias_name: a.alias_name,
    alias_type: a.alias_type,
    confidence_score: a.confidence_score,
  }));

  const matches = matchesRaw.map((m) => {
    const home = teamMap.get(m.home_team_id);
    const confed = home?.confederation ?? "UEFA";
    const competition_type = inferCompetitionType(m.stage);
    const source_tier = inferSourceTier(confed, m.stage);
    return {
      match_id: m.match_id,
      date: toIsoDateTime(m.date),
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      stage: m.stage,
      group_name: m.group_name ?? null,
      status: m.status,
      competition_type,
      source_tier,
      source_confidence_multiplier: CONFED_PRIORITY[confed]?.[source_tier] ?? 0.6,
    };
  });
  const matchMap = new Map(matches.map((m) => [m.match_id, m]));

  const callups_or_appearances = callupsRaw.map((c) => {
    const match = matchMap.get(c.match_id);
    return {
      record_id: c.record_id,
      player_id: c.player_id,
      match_id: c.match_id,
      team_id: c.team_id,
      status: c.status,
      minutes_played: c.minutes_played,
      projected_squad_date: match ? match.date.slice(0, 10) : "2026-05-09",
    };
  });

  const availability_overrides = overridesRaw.map((o) => ({
    override_id: o.override_id,
    player_id: o.player_id,
    start_date: toIsoDate(o.start_date),
    end_date: o.end_date ? toIsoDate(o.end_date) : null,
    reason: o.reason,
    status: statusToAvailability(o.reason),
    notes: o.notes,
  }));

  await Promise.all([
    fs.writeFile(path.join(CANONICAL_DIR, "teams.json"), JSON.stringify(teams, null, 2)),
    fs.writeFile(path.join(CANONICAL_DIR, "players_master.json"), JSON.stringify(players_master, null, 2)),
    fs.writeFile(path.join(CANONICAL_DIR, "player_aliases.json"), JSON.stringify(player_aliases, null, 2)),
    fs.writeFile(path.join(CANONICAL_DIR, "matches.json"), JSON.stringify(matches, null, 2)),
    fs.writeFile(path.join(CANONICAL_DIR, "callups_or_appearances.json"), JSON.stringify(callups_or_appearances, null, 2)),
    fs.writeFile(path.join(CANONICAL_DIR, "availability_overrides.json"), JSON.stringify(availability_overrides, null, 2)),
  ]);

  // Minimal migration report.
  const report = {
    migratedAt: new Date().toISOString(),
    counts: {
      teams: teams.length,
      players_master: players_master.length,
      player_aliases: player_aliases.length,
      matches: matches.length,
      callups_or_appearances: callups_or_appearances.length,
      availability_overrides: availability_overrides.length,
    },
  };
  await fs.writeFile(path.join(GENERATED_DIR, "migration_report.json"), JSON.stringify(report, null, 2));

  console.log("Migrated Gemini sources to canonical tables.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
