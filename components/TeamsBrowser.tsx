"use client";

import { useMemo, useState } from "react";
import { TeamCard } from "@/components/TeamCard";
import { slugifyTeam } from "@/lib/data";
import type { TeamProjection } from "@/lib/types";

type Props = { teams: TeamProjection[] };

export function TeamsBrowser({ teams }: Props) {
  const [confed, setConfed] = useState("all");
  const [confidence, setConfidence] = useState("all");

  const confeds = useMemo(
    () => ["all", ...Array.from(new Set(teams.map((t) => t.confederation))).sort()],
    [teams],
  );

  const filtered = teams.filter((t) => {
    const confedOk = confed === "all" || t.confederation === confed;
    const confidenceOk = confidence === "all" || t.evidence.confidenceLevel === confidence;
    return confedOk && confidenceOk;
  });

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Confederation</span>
          <select
            value={confed}
            onChange={(e) => setConfed(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {confeds.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Confidence</span>
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="all">all</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-slate-600">Showing {filtered.length} team(s).</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((team) => (
          <TeamCard
            key={team.team}
            team={team.team}
            confederation={team.confederation}
            qualifiedVia={team.qualifiedVia}
            likelyCount={team.likely26.length}
            confidenceLevel={team.evidence.confidenceLevel}
            playersObserved={team.evidence.playersObserved}
            href={`/teams/${slugifyTeam(team.team)}`}
          />
        ))}
      </div>
    </div>
  );
}
