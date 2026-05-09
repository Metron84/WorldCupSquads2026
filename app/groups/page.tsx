import Link from "next/link";
import { getWorldCupGroupCards } from "@/lib/data";
import { slugifyTeam } from "@/lib/data";
import { storyTagForTeam } from "@/lib/world-cup-groups";

function difficultyClass(d: "Strong" | "Moderate" | "Weak") {
  if (d === "Strong") return "bg-rose-50 text-rose-800 ring-rose-200";
  if (d === "Weak") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function storyClass(tag: "HOST" | "PLAYOFF" | "DEBUT" | "RETURN") {
  switch (tag) {
    case "HOST":
      return "bg-amber-100 text-amber-900";
    case "PLAYOFF":
      return "bg-sky-100 text-sky-900";
    case "DEBUT":
      return "bg-violet-100 text-violet-900";
    case "RETURN":
      return "bg-teal-100 text-teal-900";
  }
}

export default function GroupsPage() {
  const groups = getWorldCupGroupCards();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">World Cup 2026 — Groups</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Group stage from the official draw. Each card lists four teams, an editorial
        &quot;strength of group&quot; label, and story tags (host, playoff, debut, return) where
        they apply. This page is for navigation; squad projections remain on each team page.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g) => (
          <section
            key={g.letter}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Group {g.letter}</h2>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${difficultyClass(
                  g.difficulty,
                )}`}
              >
                {g.difficulty}
              </span>
            </div>
            <ul className="flex flex-1 flex-col gap-2">
              {g.teams.map((t) => {
                const tag = storyTagForTeam(t.team_id);
                return (
                  <li key={t.team_id}>
                    <Link
                      href={`/teams/${slugifyTeam(t.name)}`}
                      className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
                    >
                      <span className="font-medium">{t.name}</span>
                      {tag ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${storyClass(
                            tag,
                          )}`}
                        >
                          {tag}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-snug text-slate-500">
              Confederations: {g.confederationsLabel}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
