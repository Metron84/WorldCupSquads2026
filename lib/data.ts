import projections from "@/data/generated/projections.json";
import completenessReport from "@/data/generated/completeness_report.json";
import type { CompletenessReportRow, TeamProjection } from "@/lib/types";

export function getProjections(): TeamProjection[] {
  return projections as unknown as TeamProjection[];
}

export function getCompletenessReport(): CompletenessReportRow[] {
  return completenessReport as unknown as CompletenessReportRow[];
}

export function slugifyTeam(team: string): string {
  return team.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getProjectionBySlug(slug: string): TeamProjection | undefined {
  return getProjections().find((t) => slugifyTeam(t.team) === slug);
}
