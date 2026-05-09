import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerTable } from "@/components/PlayerTable";
import { getProjectionBySlug, getProjections } from "@/lib/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getProjections().map((team) => ({
    slug: team.team.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  }));
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const team = getProjectionBySlug(slug);
  if (!team) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/teams" className="text-sm text-brand-700 hover:underline">
        ← Back to teams
      </Link>
      <header className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{team.team}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {team.confederation} • {team.qualifiedVia}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Last model update: {team.updatedAt}. This is a projected pool, not an official squad.
        </p>
      </header>

      <div className="mt-6 grid gap-4">
        <PlayerTable title="Likely 26" players={team.likely26} />
        <PlayerTable title="Bubble players" players={team.bubble} />
        <PlayerTable title="Longshots" players={team.longshots} />
      </div>
    </main>
  );
}
