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

/** FBref-style WC / WCQ standard stats when merged from `wcq_qualifying_stats.json`. */
export type WcqPlayerStats = {
  mp: number;
  minutes: number;
  goals: number;
  assists: number;
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
  /** World Cup qualifying (or confederation WCQ competition) totals from FBref export when matched. */
  wcq?: WcqPlayerStats;
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
    /** Confederation sampling adjustment (legacy coverage band). */
    confederationMultiplier?: number;
    /** min(confidence_weight) from data/sources/sources.json for lineage on this team. */
    sourcesAuthorityMultiplier?: number;
    /** Distinct source_id values observed on call-ups (row or parent match). */
    sourceIdsObserved?: string[];
    /** Product of confederation × sources authority — backward-compatible combined penalty. */
    sourcePenaltyMultiplier?: number;
    coverageWarnings: string[];
  };
  likely26: ProjectedPlayer[];
  bubble: ProjectedPlayer[];
  longshots: ProjectedPlayer[];
};

/** Row from `data/canonical/teams.json` (includes 2026 group stage assignment). */
export type CanonicalTeamRow = {
  team_id: string;
  name: string;
  short_name: string;
  confederation: string;
  qualification_method: string;
  qualification_status: string;
  fifa_rank: number;
  world_cup_group: string;
};

export type CompletenessReportRow = {
  team: string;
  confederation: string;
  playersObserved: number;
  qualifierMatchesUsed: number;
  friendlyMatchesUsed: number;
  dateRangeUsed: string;
  confidenceLevel: ConfidenceLevel;
  confederationMultiplier?: number;
  sourcesAuthorityMultiplier?: number;
  sourceIdsObserved?: string[];
  sourcePenaltyMultiplier?: number;
  coverageWarnings: string[];
};
