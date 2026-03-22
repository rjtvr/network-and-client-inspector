interface PopupStatsProps {
  totalRequests: number;
  errors: number;
}

export function PopupStats({ totalRequests, errors }: PopupStatsProps) {
  return (
    <section className="mt-5 grid grid-cols-2 gap-3">
      <article className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">Total Requests</p>
        <p className="mt-2 text-2xl font-semibold text-ink">{totalRequests}</p>
      </article>
      <article className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">Errors</p>
        <p className="mt-2 text-2xl font-semibold text-ink">{errors}</p>
      </article>
    </section>
  );
}