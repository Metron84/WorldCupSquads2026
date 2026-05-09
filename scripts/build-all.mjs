import { execSync } from "node:child_process";

const steps = [
  "node scripts/seed-representative-data.mjs",
  "node scripts/load-raw.mjs",
  "node scripts/normalize-players.mjs",
  "node scripts/aggregate-team-player-features.mjs",
  "node scripts/build-completeness-report.mjs",
  "node scripts/project-squads.mjs",
];

for (const step of steps) {
  console.log(`\n> ${step}`);
  execSync(step, { stdio: "inherit" });
}

console.log("\nPipeline completed.");
