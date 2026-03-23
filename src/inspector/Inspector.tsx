import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  clearSession,
  getClientContext,
  getSessionState,
  pauseCapture,
  resumeCapture,
  stopCapture,
  updateClientRuntimeSnapshot
} from "../shared/messaging";
import { getSiteAccessStateForTabId, removeSiteAccessForTab, type SiteAccessState } from "../shared/site-access";
import { ClientPanel } from "./components/ClientPanel";
import { DetailPanel } from "./components/DetailPanel";
import { InspectorTabs } from "./components/InspectorTabs";
import { InspectorToolbar } from "./components/InspectorToolbar";
import { PerformancePanel } from "./components/PerformancePanel";
import { RequestTable } from "./components/RequestTable";
import { SecurityPanel } from "./components/SecurityPanel";
import { SessionControls } from "./components/SessionControls";
import {
  collectClientRuntimeSnapshot,
  getInitialTabId,
  matchesStatusFilter,
  resolveInspectorTabId,
  sanitizeExportClientContext,
  toInspectorRequest,
  type ClientContext,
  type InspectorFilters,
  type InspectorRequest,
  type InspectorTab
} from "./models";

const SLOW_REQUEST_THRESHOLD_MS = 1000;

export function Inspector() {
  const [activeView, setActiveView] = useState<InspectorTab>("requests");
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<InspectorFilters>({
    method: "all",
    status: "all",
    type: "all",
    findingsOnly: false
  });
  const [tabId, setTabId] = useState<number | null>(getInitialTabId());
  const [requests, setRequests] = useState<InspectorRequest[]>([]);
  const [clientContext, setClientContext] = useState<ClientContext | null>(null);
  const [siteAccess, setSiteAccess] = useState<SiteAccessState | null>(null);
  const [captureState, setCaptureState] = useState("idle");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [accessNotice, setAccessNotice] = useState<string | null>(null);

  const deferredRequests = useDeferredValue(requests);
  const deferredSearchValue = useDeferredValue(searchValue);
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: number | undefined;

    async function loadData() {
      const resolvedTabId = tabId ?? (await resolveInspectorTabId());

      if (!isMounted) {
        return;
      }

      if (resolvedTabId === null) {
        setTabId(null);
        setAccessNotice(null);
        startTransition(() => {
          setRequests([]);
          setClientContext(null);
          setSiteAccess(null);
          setCaptureState("idle");
        });
        return;
      }

      if (resolvedTabId !== tabId) {
        setTabId(resolvedTabId);
        setAccessNotice(null);
      }

      const [sessionResponse, clientContextResponse, siteAccessResponse] = await Promise.all([
        getSessionState(resolvedTabId),
        getClientContext(resolvedTabId),
        getSiteAccessStateForTabId(resolvedTabId)
      ]);

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setCaptureState(sessionResponse.session.state);
        setRequests(sessionResponse.session.requests.map(toInspectorRequest));
        setClientContext(clientContextResponse.clientContext);
        setSiteAccess(siteAccessResponse);
      });
    }

    void loadData();
    pollTimer = window.setInterval(() => {
      void loadData();
    }, 1000);

    return () => {
      isMounted = false;
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
    };
  }, [tabId]);

  useEffect(() => {
    if (tabId === null) {
      return;
    }

    let isMounted = true;
    const targetTabId = tabId;

    async function pushRuntimeSnapshot() {
      const response = await updateClientRuntimeSnapshot(targetTabId, collectClientRuntimeSnapshot());

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setClientContext(response.clientContext);
      });
    }

    const handleRuntimeChange = () => {
      void pushRuntimeSnapshot();
    };

    void pushRuntimeSnapshot();

    window.addEventListener("resize", handleRuntimeChange);
    window.addEventListener("online", handleRuntimeChange);
    window.addEventListener("offline", handleRuntimeChange);
    document.addEventListener("visibilitychange", handleRuntimeChange);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleRuntimeChange);
      window.removeEventListener("online", handleRuntimeChange);
      window.removeEventListener("offline", handleRuntimeChange);
      document.removeEventListener("visibilitychange", handleRuntimeChange);
    };
  }, [tabId]);

  const methodOptions = useMemo(
    () => ["all", ...Array.from(new Set(deferredRequests.map((request) => request.method))).sort()],
    [deferredRequests]
  );

  const typeOptions = useMemo(
    () => ["all", ...Array.from(new Set(deferredRequests.map((request) => request.type))).sort()],
    [deferredRequests]
  );

  const findingsCount = useMemo(
    () => deferredRequests.reduce((sum, request) => sum + request.findings.length, 0),
    [deferredRequests]
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = deferredSearchValue.trim().toLowerCase();

    return deferredRequests.filter((request) => {
      const matchesSearch =
        normalizedSearch.length === 0 || request.url.toLowerCase().includes(normalizedSearch);
      const matchesMethod = deferredFilters.method === "all" || request.method === deferredFilters.method;
      const matchesStatus = matchesStatusFilter(request.status, deferredFilters.status);
      const matchesType = deferredFilters.type === "all" || request.type === deferredFilters.type;
      const matchesFindings = !deferredFilters.findingsOnly || request.findings.length > 0;

      return matchesSearch && matchesMethod && matchesStatus && matchesType && matchesFindings;
    });
  }, [deferredFilters, deferredRequests, deferredSearchValue]);

  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0] ?? null;

  useEffect(() => {
    if (selectedRequest && selectedRequest.id !== selectedRequestId) {
      setSelectedRequestId(selectedRequest.id);
      return;
    }

    if (!selectedRequest) {
      setSelectedRequestId("");
    }
  }, [selectedRequest, selectedRequestId]);

  async function handlePauseResume() {
    if (tabId === null) {
      return;
    }

    setIsBusy(true);

    try {
      const response =
        captureState === "paused" ? await resumeCapture(tabId) : await pauseCapture(tabId);

      startTransition(() => {
        setCaptureState(response.session.state);
        setRequests(response.session.requests.map(toInspectorRequest));
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleClear() {
    if (tabId === null) {
      return;
    }

    setIsBusy(true);

    try {
      const response = await clearSession(tabId);

      startTransition(() => {
        setCaptureState(response.session.state);
        setRequests(response.session.requests.map(toInspectorRequest));
        setSelectedRequestId("");
      });
    } finally {
      setIsBusy(false);
    }
  }

  function handleFiltersChange(nextFilters: InspectorFilters) {
    setFilters(nextFilters);
  }

  function handleExport() {
    const payload = {
      tabId,
      captureState,
      exportedAt: new Date().toISOString(),
      clientContext: sanitizeExportClientContext(clientContext),
      requests
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    link.href = downloadUrl;
    link.download = `network-session-${tabId ?? "unknown"}-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }

  function focusRequest(requestId: string, findingsOnly: boolean) {
    setActiveView("requests");
    setFilters((currentFilters) => ({
      ...currentFilters,
      findingsOnly
    }));

    if (requestId) {
      setSelectedRequestId(requestId);
    }
  }

  async function handleRemoveSiteAccess() {
    if (tabId === null) {
      return;
    }

    setIsBusy(true);
    setAccessNotice(null);

    try {
      if (captureState !== "idle") {
        const response = await stopCapture(tabId);
        startTransition(() => {
          setCaptureState(response.session.state);
          setRequests(response.session.requests.map(toInspectorRequest));
        });
      }

      const result = await removeSiteAccessForTab(tabId);
      setSiteAccess(result.state);
      setAccessNotice(result.message);
    } finally {
      setIsBusy(false);
    }
  }

  const siteAccessLabel =
    siteAccess?.status === "granted"
      ? "Site access granted"
      : siteAccess?.status === "needs-access"
        ? "Site access required"
        : "Unsupported page";
  const siteAccessTone =
    siteAccess?.status === "granted"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : siteAccess?.status === "needs-access"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-zinc-200 bg-zinc-100 text-slate";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ccfbf1,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2f6_100%)] px-4 py-6 text-ink md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-card backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Inspector</p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Request viewer</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
                Live requests for tab {tabId ?? "-"}. Capture state: {captureState}.
              </p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-slate">
              {activeView === "security"
                ? `${findingsCount} findings across ${requests.length} requests`
                : activeView === "performance"
                  ? `${requests.length} captured requests available for timing analysis`
                  : activeView === "client"
                    ? clientContext
                      ? "Client context available for this session"
                      : "No client context yet"
                    : `Showing ${filteredRequests.length} of ${requests.length} requests`}
            </div>
          </div>
          <section className="mt-4 rounded-[24px] border border-zinc-200 bg-zinc-50/85 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Privacy & Access</p>
                <p className="mt-2 text-sm text-ink">{siteAccess?.hostname ?? "Unavailable"}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${siteAccessTone}`}
              >
                {siteAccessLabel}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate">
              {accessNotice ??
                siteAccess?.message ??
                "Request URLs and request bodies are only captured after you grant site access and start capture."}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate">
              Captured data stays local in Chrome unless you export it. Exported files may contain sensitive request or
              tab information.
            </p>
          </section>
          <InspectorTabs
            activeTab={activeView}
            requestCount={requests.length}
            findingsCount={findingsCount}
            onTabChange={setActiveView}
          />
          <SessionControls
            captureState={captureState}
            isBusy={isBusy}
            hasRequests={requests.length > 0}
            onPauseResume={handlePauseResume}
            onClear={handleClear}
            onExport={handleExport}
            removeAccessDisabled={siteAccess?.status !== "granted"}
            onRemoveAccess={handleRemoveSiteAccess}
          />
        </header>

        {activeView === "requests" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
            <div className="min-w-0 rounded-[28px] border border-line bg-panel p-5">
              <InspectorToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                filters={filters}
                methodOptions={methodOptions}
                typeOptions={typeOptions}
                onFiltersChange={handleFiltersChange}
              />
              <RequestTable
                requests={filteredRequests}
                selectedRequestId={selectedRequest?.id ?? null}
                onSelectRequest={setSelectedRequestId}
              />
            </div>

            <DetailPanel request={selectedRequest} />
          </section>
        ) : activeView === "security" ? (
          <SecurityPanel requests={requests} onFocusRequest={focusRequest} />
        ) : activeView === "performance" ? (
          <PerformancePanel requests={requests} slowThresholdMs={SLOW_REQUEST_THRESHOLD_MS} />
        ) : (
          <ClientPanel clientContext={clientContext} />
        )}
      </div>
    </main>
  );
}
