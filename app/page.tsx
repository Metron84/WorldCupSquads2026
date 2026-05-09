import Link from "next/link";
import { getProjections } from "@/lib/data";
import { TeamCard } from "@/components/TeamCard";
import { slugifyTeam } from "@/lib/data";

export default function Home() {
  const teams = getProjections().sort((a, b) => a.team.localeCompare(b.team));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-2xl bg-brand-900 p-6 text-white">
        <h1 className="text-3xl font-bold">World Cup Squads 2026</h1>
        <p className="mt-3 max-w-3xl text-sm text-brand-100">
          A projected squad pool for currently qualified teams, built from qualification
          call-ups and recent friendlies. Selections are probabilistic and non-official.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/methodology"
            className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          >
            Read methodology
          </Link>
          <Link
            href="/teams"
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium hover:bg-brand-700"
          >
            Browse qualified teams
          </Link>
          <Link
            href="/coverage"
            className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          >
            Coverage dashboard
          </Link>
        </div>
      </header>

      <section className="mb-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-slate-500">Qualified teams tracked</p>
          <p className="text-2xl font-semibold text-slate-900">{teams.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Update model</p>
          <p className="text-sm text-slate-700">Run `npm run data:build` after editing `data/raw/callups.json`.</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Disclaimer</p>
          <p className="text-sm text-slate-700">Projected pool only. Official squads are announced later by federations.</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Featured teams</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.slice(0, 6).map((team) => (
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
      </section>
    </main>
  );
}
