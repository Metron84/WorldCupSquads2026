import Link from "next/link";
import { getCompletenessReport, slugifyTeam } from "@/lib/data";

export default function CoveragePage() {
  const rows = getCompletenessReport().sort((a, b) => {
    const score = { high: 3, medium: 2, low: 1 };
    return score[b.confidenceLevel] - score[a.confidenceLevel] || a.team.localeCompare(b.team);
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Coverage Dashboard</h1>
      <p className="mt-2 text-sm text-slate-600">
        Confidence and data completeness by nation. Use this to identify countries that need
        wider data windows or better source coverage.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Confed</th>
              <th className="px-3 py-2">Players observed</th>
              <th className="px-3 py-2">Qual matches</th>
              <th className="px-3 py-2">Friendly matches</th>
              <th className="px-3 py-2">Date range</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Warnings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.team} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">
                  <Link className="hover:underline" href={`/teams/${slugifyTeam(r.team)}`}>
                    {r.team}
                  </Link>
                </td>
                <td className="px-3 py-2">{r.confederation}</td>
                <td className="px-3 py-2">{r.playersObserved}</td>
                <td className="px-3 py-2">{r.qualifierMatchesUsed}</td>
                <td className="px-3 py-2">{r.friendlyMatchesUsed}</td>
                <td className="px-3 py-2">{r.dateRangeUsed}</td>
                <td className="px-3 py-2">{r.confidenceLevel}</td>
                <td className="px-3 py-2">
                  {r.coverageWarnings.length ? r.coverageWarnings.join(" | ") : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
