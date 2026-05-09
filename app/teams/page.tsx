import { TeamCard } from "@/components/TeamCard";
import { getProjections, slugifyTeam } from "@/lib/data";

export default function TeamsPage() {
  const teams = getProjections().sort((a, b) => a.team.localeCompare(b.team));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Qualified Teams</h1>
      <p className="mt-2 text-sm text-slate-600">
        Projected pool built from qualification and recent friendlies selection data.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <TeamCard
            key={team.team}
            team={team.team}
            confederation={team.confederation}
            qualifiedVia={team.qualifiedVia}
            likelyCount={team.likely26.length}
            href={`/teams/${slugifyTeam(team.team)}`}
          />
        ))}
      </div>
    </main>
  );
}
