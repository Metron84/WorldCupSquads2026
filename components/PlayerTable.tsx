import type { ProjectedPlayer } from "@/lib/types";

type Props = {
  title: string;
  players: ProjectedPlayer[];
};

export function PlayerTable({ title, players }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {players.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No players in this tier yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Player</th>
                <th className="px-2 py-2">Pos</th>
                <th className="px-2 py-2">Score</th>
                <th className="px-2 py-2">Caps</th>
                <th className="px-2 py-2">Starts</th>
                <th className="px-2 py-2">Minutes</th>
                <th className="px-2 py-2">Qual</th>
                <th className="px-2 py-2">Frnd</th>
                <th className="px-2 py-2">Last call-up</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={`${title}-${player.player}`} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-800">{player.player}</td>
                  <td className="px-2 py-2">{player.position}</td>
                  <td className="px-2 py-2">{player.selectionScore.toFixed(3)}</td>
                  <td className="px-2 py-2">{player.capsInWindow}</td>
                  <td className="px-2 py-2">{player.startsInWindow}</td>
                  <td className="px-2 py-2">{player.minutesInWindow}</td>
                  <td className="px-2 py-2">{player.qualifierSelections}</td>
                  <td className="px-2 py-2">{player.friendlySelections}</td>
                  <td className="px-2 py-2">{player.lastCallupDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
