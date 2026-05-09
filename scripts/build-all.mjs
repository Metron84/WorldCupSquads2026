import { execSync } from "node:child_process";

const steps = [
  "node scripts/validate-canonical.mjs",
  "node scripts/build-projections-from-canonical.mjs",
];

for (const step of steps) {
  console.log(`\n> ${step}`);
  execSync(step, { stdio: "inherit" });
}

console.log("\nPipeline completed.");
