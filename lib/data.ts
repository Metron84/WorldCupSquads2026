import projections from "@/data/generated/projections.json";
import completenessReport from "@/data/generated/completeness_report.json";
import teamsCanonical from "@/data/canonical/teams.json";
import type { CanonicalTeamRow, CompletenessReportRow, TeamProjection } from "@/lib/types";
import {
  GROUP_DIFFICULTY,
  GROUP_LETTERS,
  type GroupLetter,
} from "@/lib/world-cup-groups";

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

export function getCanonicalTeams(): CanonicalTeamRow[] {
  return teamsCanonical as unknown as CanonicalTeamRow[];
}

export function getCanonicalTeamBySlug(slug: string): CanonicalTeamRow | undefined {
  return getCanonicalTeams().find((t) => slugifyTeam(t.name) === slug);
}

export function getWorldCupGroupCards(): {
  letter: GroupLetter;
  difficulty: "Strong" | "Moderate" | "Weak";
  teams: CanonicalTeamRow[];
  confederationsLabel: string;
}[] {
  const teams = getCanonicalTeams();
  const byLetter = new Map<GroupLetter, CanonicalTeamRow[]>();
  for (const L of GROUP_LETTERS) byLetter.set(L, []);
  for (const t of teams) {
    const g = t.world_cup_group as GroupLetter;
    const bucket = byLetter.get(g);
    if (bucket) bucket.push(t);
  }
  return GROUP_LETTERS.map((letter) => {
    const groupTeams = (byLetter.get(letter) ?? []).sort((a, b) => a.name.localeCompare(b.name));
    const confeds = [...new Set(groupTeams.map((x) => x.confederation))].sort();
    return {
      letter,
      difficulty: GROUP_DIFFICULTY[letter],
      teams: groupTeams,
      confederationsLabel: confeds.join(", "),
    };
  });
}
