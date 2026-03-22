import { useMemo, useState } from "react";
import type { InspectorRequest } from "../models";

const ROW_HEIGHT = 57;
const MAX_VISIBLE_ROWS = 24;
const OVERSCAN_ROWS = 8;
const COLUMN_TEMPLATE = "96px minmax(0,1fr) 88px 132px 108px";

interface RequestTableProps {
  requests: InspectorRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string) => void;
}

function formatDuration(duration: number | null) {
  if (duration === null) {
    return "-";
  }

  if (duration >= 1000) {
    return `${Math.round(duration).toLocaleString()} ms`;
  }

  return `${duration.toFixed(duration < 100 ? 1 : 0)} ms`;
}

export function RequestTable({ requests, selectedRequestId, onSelectRequest }: RequestTableProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const viewportHeight = Math.min(requests.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT;
  const totalHeight = requests.length * ROW_HEIGHT;

  const visibleRange = useMemo(() => {
    const visibleCount = Math.max(1, Math.ceil(viewportHeight / ROW_HEIGHT));
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS);
    const endIndex = Math.min(requests.length, startIndex + visibleCount + OVERSCAN_ROWS * 2);

    return {
      startIndex,
      endIndex,
      offsetTop: startIndex * ROW_HEIGHT
    };
  }, [requests.length, scrollTop, viewportHeight]);

  const visibleRequests = requests.slice(visibleRange.startIndex, visibleRange.endIndex);

  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-[24px] border border-zinc-200">
      <div className="grid bg-zinc-50/95 text-left backdrop-blur" style={{ gridTemplateColumns: COLUMN_TEMPLATE }}>
        <div className="truncate px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate">
          Method
        </div>
        <div className="truncate px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate">
          URL
        </div>
        <div className="truncate px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate">
          Status
        </div>
        <div className="truncate px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate">
          Type
        </div>
        <div className="truncate px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate">
          Duration
        </div>
      </div>

      {requests.length > 0 ? (
        <div
          className="overflow-y-auto overflow-x-hidden"
          style={{ maxHeight: `${Math.max(ROW_HEIGHT * 6, viewportHeight)}px` }}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        >
          <div style={{ height: `${totalHeight}px`, position: "relative" }}>
            <div
              className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${visibleRange.offsetTop}px)` }}
            >
              {visibleRequests.map((request) => {
                const isSelected = request.id === selectedRequestId;
                const statusTone =
                  request.status === null
                    ? "text-slate-500"
                    : request.status >= 400
                      ? "text-rose-600"
                      : "text-teal-700";

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => onSelectRequest(request.id)}
                    title={request.url}
                    style={{ height: `${ROW_HEIGHT}px`, gridTemplateColumns: COLUMN_TEMPLATE }}
                    className={`grid w-full items-center border-t border-zinc-100 px-0 text-left transition hover:bg-zinc-50 ${
                      isSelected ? "bg-teal-50/80" : "bg-white"
                    }`}
                  >
                    <span className="truncate px-4 text-sm font-semibold text-ink">{request.method}</span>
                    <div className="min-w-0 px-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm text-slate">{request.url}</span>
                        {request.findings.length > 0 ? (
                          <span className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-600">
                            {request.findings.length}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className={`truncate px-4 text-sm font-semibold ${statusTone}`}>
                      {request.status ?? "-"}
                    </span>
                    <span className="truncate px-4 text-sm uppercase tracking-wide text-slate">
                      {request.type}
                    </span>
                    <span className="truncate px-4 text-sm tabular-nums text-slate">
                      {formatDuration(request.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-10 text-center text-sm text-slate">
          No requests match the current search and filters.
        </div>
      )}
    </section>
  );
}
