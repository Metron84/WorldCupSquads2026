import Link from "next/link";

type Props = {
  team: string;
  confederation: string;
  qualifiedVia: string;
  href: string;
  likelyCount: number;
};

export function TeamCard({ team, confederation, qualifiedVia, href, likelyCount }: Props) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <h3 className="text-lg font-semibold text-slate-900">{team}</h3>
      <p className="mt-1 text-sm text-slate-600">{confederation}</p>
      <p className="mt-2 text-sm text-slate-700">{qualifiedVia}</p>
      <p className="mt-2 text-xs text-slate-500">Likely squad entries tracked: {likelyCount}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        View projected squad
      </Link>
    </article>
  );
}
