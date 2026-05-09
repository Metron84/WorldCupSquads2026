export type CompetitionType = "qualifier" | "friendly";
export type SquadTier = "likely" | "bubble" | "longshot";

export type RawCallupRow = {
  team: string;
  player: string;
  position: "GK" | "DF" | "MF" | "FW";
  competitionType: CompetitionType;
  selected: number;
  starts: number;
  minutes: number;
  lastCallupDate: string;
};

export type ProjectedPlayer = {
  player: string;
  position: "GK" | "DF" | "MF" | "FW";
  selectionScore: number;
  capsInWindow: number;
  startsInWindow: number;
  minutesInWindow: number;
  qualifierSelections: number;
  friendlySelections: number;
  lastCallupDate: string;
  tier: SquadTier;
};

export type TeamProjection = {
  team: string;
  confederation: string;
  qualifiedVia: string;
  updatedAt: string;
  likely26: ProjectedPlayer[];
  bubble: ProjectedPlayer[];
  longshots: ProjectedPlayer[];
};
