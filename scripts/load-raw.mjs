import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "data", "intermediate", "raw_loaded.json");

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(RAW_DIR, file), "utf-8"));
}

async function main() {
  const [teams, matches, callups, availabilityOverrides] = await Promise.all([
    readJson("teams.json"),
    readJson("matches.json"),
    readJson("callups_or_appearances.json"),
    readJson("availability-overrides.json"),
  ]);

  const matchIds = new Set(matches.map((m) => m.matchId));
  const validCallups = callups.filter((c) => matchIds.has(c.matchId));

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(
    OUT,
    JSON.stringify(
      {
        loadedAt: new Date().toISOString(),
        teams,
        matches,
        callups: validCallups,
        availabilityOverrides,
      },
      null,
      2,
    ),
  );
  console.log(`Loaded raw files -> ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
