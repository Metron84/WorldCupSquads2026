import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "data", "intermediate", "raw_loaded.json");
const OUTPUT = path.join(ROOT, "data", "intermediate", "normalized.json");

function normalizeName(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function key(team, player) {
  return `${team.toLowerCase()}::${normalizeName(player).toLowerCase()}`;
}

async function main() {
  const raw = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  const normalizedCallups = raw.callups.map((c) => ({
    ...c,
    player: normalizeName(c.player),
    playerKey: key(c.team, c.player),
    minutes: Math.max(0, Number(c.minutes) || 0),
    selected: Number(c.selected) || 0,
    starts: Number(c.starts) || 0,
  }));
  const normalizedOverrides = raw.availabilityOverrides.map((o) => ({
    ...o,
    player: normalizeName(o.player),
    playerKey: key(o.team, o.player),
  }));

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(
      {
        normalizedAt: new Date().toISOString(),
        teams: raw.teams,
        matches: raw.matches,
        callups: normalizedCallups,
        availabilityOverrides: normalizedOverrides,
      },
      null,
      2,
    ),
  );
  console.log(`Normalized player records -> ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
