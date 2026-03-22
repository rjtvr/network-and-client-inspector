import type { RequestBodyCapture, ResponseBodyCapture } from "../../shared/types";
import type { InspectorRequest } from "../models";

const sectionOrder: Array<{
  key: "overview" | "security" | "query" | "payload" | "response";
  label: string;
}> = [
  { key: "overview", label: "Overview" },
  { key: "security", label: "Security" },
  { key: "query", label: "Query" },
  { key: "payload", label: "Payload" },
  { key: "response", label: "Response" }
];

interface DetailPanelProps {
  request: InspectorRequest | null;
}

export function DetailPanel({ request }: DetailPanelProps) {
  if (!request) {
    return (
      <aside className="rounded-[28px] border border-line bg-panel p-5">
        <h2 className="text-lg font-semibold">Details</h2>
        <p className="mt-4 text-sm leading-6 text-slate">Select a request to inspect its details.</p>
      </aside>
    );
  }

  const overviewEntries = [
    ["Method", request.method],
    ["URL", request.url],
    ["Status", String(request.status ?? "-")],
    ["Type", request.type],
    ["Duration", `${request.duration ?? 0} ms`],
    ["Timestamp", new Date(request.timestamp).toLocaleTimeString()]
  ];

  return (
    <aside className="rounded-[28px] border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Details</p>
          <h2 className="mt-2 text-xl font-semibold">{request.method} request</h2>
        </div>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
          {request.type}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {sectionOrder.map((section) => (
          <section key={section.key} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
            <h3 className="text-sm font-semibold text-ink">{section.label}</h3>
            {section.key === "overview" ? (
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {overviewEntries.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">{label}</dt>
                    <dd className="mt-1 break-all text-sm text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {section.key === "security" ? <SecurityFindings findings={request.findings} /> : null}
            {section.key === "query" ? <KeyValueList entries={request.query} /> : null}
            {section.key === "payload" ? <BodyCapturePanel body={request.payload} label="Payload" /> : null}
            {section.key === "response" ? <ResponseCapturePanel body={request.response} /> : null}
          </section>
        ))}
      </div>
    </aside>
  );
}

function SecurityFindings({ findings }: { findings: InspectorRequest["findings"] }) {
  if (findings.length === 0) {
    return <p className="mt-3 text-sm text-slate">No security findings on this request.</p>;
  }

  return (
    <div className="mt-3 space-y-3">
      {findings.map((finding) => (
        <article key={finding.id} className="rounded-xl border border-white bg-white px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{finding.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate">{finding.detail}</p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
              {finding.severity}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            {finding.location}
          </p>
        </article>
      ))}
    </div>
  );
}

function KeyValueList({ entries }: { entries: Record<string, string> }) {
  const pairs = Object.entries(entries);

  if (pairs.length === 0) {
    return <p className="mt-3 text-sm text-slate">No query parameters.</p>;
  }

  return (
    <dl className="mt-3 space-y-3">
      {pairs.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-white bg-white px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">{key}</dt>
          <dd className="mt-1 break-all text-sm text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BodyCapturePanel({ body, label }: { body: RequestBodyCapture; label: string }) {
  return (
    <div className="mt-3 space-y-3">
      <BodyMetaRow
        status={body.status}
        contentType={body.contentType}
        size={body.size}
        label={label}
      />
      {body.parsedEntries ? <KeyValueList entries={body.parsedEntries} /> : null}
      <CodeBlock content={body.preview ?? `${label} body is unavailable.`} />
    </div>
  );
}

function ResponseCapturePanel({ body }: { body: ResponseBodyCapture }) {
  return (
    <div className="mt-3 space-y-3">
      <BodyMetaRow status={body.status} contentType={body.contentType} size={body.size} label="Response" />
      <CodeBlock content={body.preview ?? "Response body is unavailable."} />
    </div>
  );
}

function BodyMetaRow({
  status,
  contentType,
  size,
  label
}: {
  status: string;
  contentType: string | null;
  size: number | null;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <MetaPill label="Status" value={status} />
      <MetaPill label="Type" value={contentType ?? "unknown"} />
      <MetaPill label="Size" value={size !== null ? `${size} bytes` : "unknown"} />
      <MetaPill label="Source" value={label} />
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
      {label}: {value}
    </span>
  );
}

function CodeBlock({ content }: { content: string }) {
  return (
    <pre className="mt-3 overflow-auto rounded-xl border border-white bg-white p-3 text-xs leading-6 text-ink">
      <code>{content}</code>
    </pre>
  );
}
