export type CompetitionType = "qualifier" | "friendly";
export type SquadTier = "likely" | "bubble" | "longshot";
export type AvailabilityStatus = "available" | "doubtful" | "injured" | "suspended" | "unavailable";
export type ConfidenceLevel = "high" | "medium" | "low";

export type TeamMeta = {
  team: string;
  confederation: string;
  qualifiedVia: string;
  qualificationStatus: "qualified" | "tracked";
};

export type RawMatch = {
  matchId: string;
  date: string;
  competitionType: CompetitionType;
  team: string;
  opponent: string;
};

export type RawCallupRow = {
  matchId: string;
  team: string;
  player: string;
  position: "GK" | "DF" | "MF" | "FW";
  selected: number;
  starts: number;
  minutes: number;
  date: string;
};

export type ProjectedPlayer = {
  team?: string;
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
  availabilityStatus?: AvailabilityStatus;
  availabilityReason?: string;
  scoreBreakdown?: {
    selectionFrequency: number;
    minutes: number;
    recency: number;
    startsConsistency: number;
    qualifierWeight: number;
    availabilityMultiplier: number;
  };
};

export type TeamProjection = {
  team: string;
  confederation: string;
  qualifiedVia: string;
  qualificationStatus: "qualified" | "tracked";
  updatedAt: string;
  evidence: {
    playersObserved: number;
    qualifierMatchesUsed: number;
    friendlyMatchesUsed: number;
    dateRangeUsed: string;
    confidenceLevel: ConfidenceLevel;
    coverageWarnings: string[];
  };
  likely26: ProjectedPlayer[];
  bubble: ProjectedPlayer[];
  longshots: ProjectedPlayer[];
};

export type CompletenessReportRow = {
  team: string;
  confederation: string;
  playersObserved: number;
  qualifierMatchesUsed: number;
  friendlyMatchesUsed: number;
  dateRangeUsed: string;
  confidenceLevel: ConfidenceLevel;
  coverageWarnings: string[];
};
