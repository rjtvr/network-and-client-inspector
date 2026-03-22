import { useMemo } from "react";
import type { SecurityFindingSeverity } from "../../shared/types";
import type { InspectorRequest } from "../models";

interface SecurityPanelProps {
  requests: InspectorRequest[];
  onFocusRequest: (requestId: string, findingsOnly: boolean) => void;
}

const severityOrder: SecurityFindingSeverity[] = ["high", "medium", "low"];

export function SecurityPanel({ requests, onFocusRequest }: SecurityPanelProps) {
  const findings = useMemo(
    () =>
      requests.flatMap((request) =>
        request.findings.map((finding) => ({
          request,
          finding
        }))
      ),
    [requests]
  );

  const groupedFindings = useMemo(
    () =>
      severityOrder.map((severity) => ({
        severity,
        items: findings.filter((entry) => entry.finding.severity === severity)
      })),
    [findings]
  );

  const highCount = groupedFindings.find((group) => group.severity === "high")?.items.length ?? 0;
  const mediumCount = groupedFindings.find((group) => group.severity === "medium")?.items.length ?? 0;
  const lowCount = groupedFindings.find((group) => group.severity === "low")?.items.length ?? 0;

  return (
    <section className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Findings" value={String(findings.length)} tone="default" />
        <MetricCard label="High" value={String(highCount)} tone="high" />
        <MetricCard label="Medium" value={String(mediumCount)} tone="medium" />
        <MetricCard label="Low" value={String(lowCount)} tone="low" />
      </div>

      <div className="rounded-[28px] border border-line bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Security Findings</h2>
            <p className="mt-1 text-sm text-slate">
              Passive URL and metadata analysis only. No payload or header inspection is used here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFocusRequest("", true)}
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-zinc-50"
          >
            Show Requests With Findings
          </button>
        </div>

        {findings.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 p-6 text-sm text-slate">
            No security findings were detected for the current session.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {groupedFindings
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <section key={group.severity}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate">
                    {group.severity} Severity
                  </h3>
                  <div className="mt-3 space-y-3">
                    {group.items.map(({ request, finding }) => (
                      <article key={finding.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">{finding.title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate">{finding.detail}</p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                              {finding.location}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onFocusRequest(request.id, false)}
                            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-zinc-50"
                          >
                            Open Request
                          </button>
                        </div>
                        <p className="mt-3 truncate text-sm text-slate">{request.url}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "default" | "high" | "medium" | "low";
}) {
  const toneClass =
    tone === "high"
      ? "border-rose-200 bg-rose-50"
      : tone === "medium"
        ? "border-amber-200 bg-amber-50"
        : tone === "low"
          ? "border-teal-200 bg-teal-50"
          : "border-line bg-panel";

  return (
    <article className={`rounded-[24px] border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </article>
  );
}
