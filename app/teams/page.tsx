import { TeamsBrowser } from "@/components/TeamsBrowser";
import { getProjections } from "@/lib/data";

export default function TeamsPage() {
  const teams = getProjections().sort((a, b) => a.team.localeCompare(b.team));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Qualified Teams</h1>
      <p className="mt-2 text-sm text-slate-600">
        Projected pool built from qualification and recent friendlies selection data.
      </p>

      <TeamsBrowser teams={teams} />
    </main>
  );
}
