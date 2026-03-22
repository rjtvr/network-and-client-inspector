import { useMemo, useState } from "react";
import { buildPerformanceSummary, type InspectorRequest } from "../models";

interface PerformancePanelProps {
  requests: InspectorRequest[];
  slowThresholdMs: number;
}

type PerformanceFilter = "all" | "slow" | "failed";

function formatDuration(duration: number) {
  return `${duration.toFixed(duration < 100 ? 1 : 0)} ms`;
}

function formatNullableDuration(duration: number | null) {
  if (duration === null) {
    return "-";
  }

  return `${duration.toFixed(duration < 100 ? 1 : 0)} ms`;
}

export function PerformancePanel({ requests, slowThresholdMs }: PerformancePanelProps) {
  const [filter, setFilter] = useState<PerformanceFilter>("all");
  const summary = useMemo(() => buildPerformanceSummary(requests, slowThresholdMs), [requests, slowThresholdMs]);

  const visibleRequests = useMemo(() => {
    const candidates =
      filter === "slow"
        ? summary.slowestRequests
        : filter === "failed"
          ? requests
              .filter((request) => (request.status ?? 0) >= 400)
              .sort((left, right) => (right.duration ?? 0) - (left.duration ?? 0))
          : [...requests].sort((left, right) => (right.duration ?? 0) - (left.duration ?? 0));

    return candidates.slice(0, 12);
  }, [filter, requests, summary.slowestRequests]);

  return (
    <section className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Requests" value={String(summary.totalRequests)} />
        <MetricCard label="Average Duration" value={formatDuration(summary.averageDuration)} />
        <MetricCard label="Slow Requests" value={String(summary.slowRequestCount)} />
        <MetricCard label="Error Rate" value={`${Math.round(summary.errorRate * 100)}%`} />
      </div>

      <div className="rounded-[28px] border border-line bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Performance Analysis</h2>
            <p className="mt-1 text-sm text-slate">
              Slow request threshold is set to {slowThresholdMs} ms for this session.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "slow", label: "Slow Only" },
              { id: "failed", label: "Failed Only" }
            ].map((option) => {
              const isActive = option.id === filter;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id as PerformanceFilter)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    isActive
                      ? "bg-accent text-white"
                      : "border border-line bg-white text-slate hover:border-teal-200 hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
            <h3 className="text-sm font-semibold text-ink">Duration Distribution</h3>
            <div className="mt-4 space-y-3">
              {summary.durationBuckets.map((bucket) => {
                const percent = summary.totalRequests > 0 ? (bucket.count / summary.totalRequests) * 100 : 0;

                return (
                  <div key={bucket.label}>
                    <div className="flex items-center justify-between text-sm text-slate">
                      <span>{bucket.label}</span>
                      <span>{bucket.count}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-zinc-200">
                      <div
                        className="h-2 rounded-full bg-accent"
                        style={{ width: `${Math.max(percent, bucket.count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
            <h3 className="text-sm font-semibold text-ink">Slowest Requests</h3>
            <div className="mt-4 space-y-3">
              {visibleRequests.length > 0 ? (
                visibleRequests.map((request) => (
                  <article key={request.id} className="rounded-xl border border-white bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ink">{request.method}</span>
                      <span className="text-sm tabular-nums text-slate">{formatNullableDuration(request.duration)}</span>
                    </div>
                    <p className="mt-2 truncate text-sm text-slate">{request.url}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate">No requests match the selected performance filter.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-line bg-panel p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </article>
  );
}
