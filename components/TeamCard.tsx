import Link from "next/link";

type Props = {
  team: string;
  confederation: string;
  qualifiedVia: string;
  href: string;
  likelyCount: number;
  confidenceLevel: "high" | "medium" | "low";
  playersObserved: number;
};

export function TeamCard({
  team,
  confederation,
  qualifiedVia,
  href,
  likelyCount,
  confidenceLevel,
  playersObserved,
}: Props) {
  const confidenceClass =
    confidenceLevel === "high"
      ? "bg-emerald-100 text-emerald-800"
      : confidenceLevel === "medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{team}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${confidenceClass}`}>
          {confidenceLevel} confidence
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{confederation}</p>
      <p className="mt-2 text-sm text-slate-700">{qualifiedVia}</p>
      <p className="mt-2 text-xs text-slate-500">Likely squad entries tracked: {likelyCount}</p>
      <p className="mt-1 text-xs text-slate-500">Players observed: {playersObserved}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        View projected squad
      </Link>
    </article>
  );
}
