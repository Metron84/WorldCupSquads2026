export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Methodology</h1>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        This app estimates probable 2026 World Cup squad pools for currently qualified teams.
        Official squad lists are announced later by each federation, so the output is a modelled
        projection rather than a confirmed final roster.
      </p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Inputs</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Qualification call-ups and appearances</li>
          <li>Recent friendly call-ups and appearances</li>
          <li>Match metadata windows and date ranges per nation</li>
          <li>Availability overrides (injury, suspension, doubtful status)</li>
          <li>Player minutes and starting frequency</li>
          <li>Recency weighting based on last call-up date</li>
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Selection score</h2>
        <p className="mt-2 text-sm text-slate-700">
          Score combines selection frequency (40%), minutes (30%), recency (20%), and starts
          consistency (10%), then applies a competition weighting where qualification windows
          carry more signal than friendlies.
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tiering logic</h2>
        <p className="mt-2 text-sm text-slate-700">
          The model builds a likely 26 with positional targets (3 GKs, 9 defenders, 8 midfielders,
          6 forwards), then ranks remaining tracked players into bubble and longshot tiers.
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Coverage confidence</h2>
        <p className="mt-2 text-sm text-slate-700">
          Each nation gets a confidence level (high / medium / low) based on observed player count,
          qualifier sample size, and friendly sample size. Coverage warnings surface where pools are
          too small for robust projection.
        </p>
      </section>
    </main>
  );
}
