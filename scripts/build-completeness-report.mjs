import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "data", "generated", "player_pool.json");
const OUTPUT = path.join(ROOT, "data", "generated", "completeness_report.json");

function confidence(summary) {
  if (summary.playersObserved >= 40 && summary.qualifierMatchesUsed >= 10 && summary.friendlyMatchesUsed >= 4) {
    return "high";
  }
  if (summary.playersObserved >= 32 && summary.qualifierMatchesUsed >= 8 && summary.friendlyMatchesUsed >= 2) {
    return "medium";
  }
  return "low";
}

function warnings(summary) {
  const out = [];
  if (summary.playersObserved < 35) out.push("Small observed player universe (<35).");
  if (summary.qualifierMatchesUsed < 8) out.push("Low qualifier match sample (<8).");
  if (summary.friendlyMatchesUsed < 2) out.push("Low friendly match sample (<2).");
  return out;
}

async function main() {
  const data = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  const report = data.teamSummaries.map((s) => ({
    ...s,
    confidenceLevel: confidence(s),
    coverageWarnings: warnings(s),
  }));
  await fs.writeFile(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Built completeness report -> ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
