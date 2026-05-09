export const GROUP_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

export type GroupLetter = (typeof GROUP_LETTERS)[number];

/** Editorial “group of death” style label from the 2026 draw discussion (not a FIFA stat). */
export const GROUP_DIFFICULTY: Record<GroupLetter, "Strong" | "Moderate" | "Weak"> = {
  A: "Moderate",
  B: "Moderate",
  C: "Moderate",
  D: "Moderate",
  E: "Weak",
  F: "Strong",
  G: "Weak",
  H: "Moderate",
  I: "Strong",
  J: "Moderate",
  K: "Moderate",
  L: "Strong",
};

export type StoryTag = "HOST" | "PLAYOFF" | "DEBUT" | "RETURN";

/** Draw/story labels for UI chips (aligned to public draw narrative). */
export const TEAM_STORY_TAG: Partial<Record<string, StoryTag>> = {
  t01: "HOST",
  t03: "HOST",
  t11: "HOST",
  t36: "PLAYOFF",
  t06: "PLAYOFF",
  t07: "PLAYOFF",
  t48: "PLAYOFF",
  t28: "PLAYOFF",
  t27: "DEBUT",
  t12: "DEBUT",
  t15: "DEBUT",
  t14: "DEBUT",
  t13: "RETURN",
  t46: "RETURN",
  t16: "RETURN",
};

export function storyTagForTeam(teamId: string): StoryTag | undefined {
  return TEAM_STORY_TAG[teamId];
}
