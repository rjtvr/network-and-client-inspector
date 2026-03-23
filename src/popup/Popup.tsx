import { useEffect, useMemo, useState } from "react";
import { getSessionState, startCapture, stopCapture } from "../shared/messaging";
import {
  getSiteAccessStateForTab,
  removeSiteAccessForTab,
  requestSiteAccessForTab,
  type SiteAccessState
} from "../shared/site-access";
import type { CaptureSession } from "../shared/types";
import { PopupActionRow } from "./components/PopupActionRow";
import { PopupHeader } from "./components/PopupHeader";
import { PopupStats } from "./components/PopupStats";

interface ActiveTabInfo {
  id: number;
  title: string;
  domain: string;
  url: string | null;
}

interface AccessFeedback {
  kind: "denied" | "error" | "info";
  message: string;
}

function getStatusLabel(session: CaptureSession | null) {
  switch (session?.state) {
    case "capturing":
      return "Capturing";
    case "paused":
      return "Paused";
    default:
      return "Idle";
  }
}

function getDomain(url?: string) {
  if (!url) {
    return "Unavailable";
  }

  try {
    return new URL(url).hostname;
  } catch {
    return "Unavailable";
  }
}

async function queryActiveTab(): Promise<ActiveTabInfo | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.id === undefined) {
    return null;
  }

  return {
    id: tab.id,
    title: tab.title || "Active tab",
    domain: getDomain(tab.url),
    url: tab.url ?? null
  };
}

function getSiteAccessBadge(status: SiteAccessState["status"] | "denied" | "error") {
  switch (status) {
    case "granted":
      return {
        label: "Site Access Granted",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700"
      };
    case "needs-access":
      return {
        label: "Site Access Required",
        tone: "border-amber-200 bg-amber-50 text-amber-700"
      };
    case "denied":
      return {
        label: "Access Denied",
        tone: "border-rose-200 bg-rose-50 text-rose-700"
      };
    case "error":
      return {
        label: "Access Error",
        tone: "border-rose-200 bg-rose-50 text-rose-700"
      };
    default:
      return {
        label: "Unsupported Page",
        tone: "border-zinc-200 bg-zinc-100 text-slate"
      };
  }
}

export function Popup() {
  const [activeTab, setActiveTab] = useState<ActiveTabInfo | null>(null);
  const [session, setSession] = useState<CaptureSession | null>(null);
  const [siteAccess, setSiteAccess] = useState<SiteAccessState | null>(null);
  const [accessFeedback, setAccessFeedback] = useState<AccessFeedback | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: number | undefined;

    async function loadSession() {
      const tab = await queryActiveTab();

      if (!isMounted) {
        return;
      }

      setActiveTab(tab);

      if (!tab) {
        setSession(null);
        setAccessFeedback(null);
        setSiteAccess({
          tabId: null,
          origin: null,
          hostname: "Unavailable",
          permissionPattern: null,
          status: "unsupported",
          message: "Open a regular website to manage capture access."
        });
        return;
      }

      const [response, nextSiteAccess] = await Promise.all([
        getSessionState(tab.id),
        chrome.tabs.get(tab.id).then((resolvedTab) => getSiteAccessStateForTab(resolvedTab)).catch(() => ({
          tabId: tab.id,
          origin: null,
          hostname: "Unavailable",
          permissionPattern: null,
          status: "unsupported" as const,
          message: "Open a regular website to manage capture access."
        }))
      ]);

      if (!isMounted) {
        return;
      }

      setSession(response.session);
      setSiteAccess(nextSiteAccess);
    }

    void loadSession();
    pollTimer = window.setInterval(() => {
      void loadSession();
    }, 1000);

    return () => {
      isMounted = false;
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
    };
  }, []);

  const effectiveAccessState = accessFeedback?.kind === "denied"
    ? "denied"
    : accessFeedback?.kind === "error"
      ? "error"
      : siteAccess?.status ?? "unsupported";
  const siteAccessBadge = getSiteAccessBadge(effectiveAccessState);
  const primaryActionLabel =
    session?.state === "capturing"
      ? "Stop Capture"
      : siteAccess?.status === "granted"
        ? "Start Capture"
        : "Grant Access & Start Capture";
  const totalRequests = session?.requests.length ?? 0;
  const errors = useMemo(
    () => session?.requests.filter((request) => (request.statusCode ?? 0) >= 400).length ?? 0,
    [session]
  );
  const isUnsupportedPage = siteAccess?.status === "unsupported";
  const canRemoveAccess = siteAccess?.status === "granted";

  async function handlePrimaryAction() {
    if (!activeTab) {
      return;
    }

    setIsPending(true);
    setAccessFeedback(null);

    try {
      if (session?.state === "capturing") {
        const response = await stopCapture(activeTab.id);
        setSession(response.session);
        return;
      }

      let nextSiteAccess = siteAccess;

      if (!nextSiteAccess || nextSiteAccess.status !== "granted") {
        const accessResult = await requestSiteAccessForTab(activeTab.id);
        nextSiteAccess = accessResult.state;
        setSiteAccess(accessResult.state);

        if (accessResult.outcome === "denied") {
          setAccessFeedback({ kind: "denied", message: accessResult.message });
          return;
        }

        if (accessResult.outcome === "error") {
          setAccessFeedback({ kind: "error", message: accessResult.message });
          return;
        }
      }

      if (nextSiteAccess?.status !== "granted") {
        return;
      }

      const response = await startCapture(activeTab.id);

      setSession(response.session);
    } finally {
      setIsPending(false);
    }
  }

  async function handleRemoveAccess() {
    if (!activeTab) {
      return;
    }

    setIsPending(true);
    setAccessFeedback(null);

    try {
      if (session?.state && session.state !== "idle") {
        const stoppedSession = await stopCapture(activeTab.id);
        setSession(stoppedSession.session);
      }

      const result = await removeSiteAccessForTab(activeTab.id);
      setSiteAccess(result.state);
      setAccessFeedback({
        kind: result.outcome === "error" ? "error" : "info",
        message: result.message
      });
    } finally {
      setIsPending(false);
    }
  }

  function handleOpenInspector() {
    const inspectorUrl = new URL(chrome.runtime.getURL("inspector.html"));

    if (activeTab) {
      inspectorUrl.searchParams.set("tabId", String(activeTab.id));
    }

    window.open(inspectorUrl.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <main className="flex min-h-[460px] w-[380px] flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef7f6_100%)] p-5 text-ink">
      <section className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-card backdrop-blur">
        <PopupHeader
          tabTitle={activeTab?.title ?? "No active tab"}
          domain={activeTab?.domain ?? "Unavailable"}
          status={getStatusLabel(session)}
        />
        <section className="mt-4 rounded-[22px] border border-zinc-200 bg-zinc-50/90 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Site Access</p>
              <p className="mt-2 text-sm text-ink">
                {siteAccess?.hostname ?? "Unavailable"}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${siteAccessBadge.tone}`}
            >
              {siteAccessBadge.label}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate">
            {accessFeedback?.message ?? siteAccess?.message ?? "Open a regular website to manage capture access."}
          </p>
        </section>
        <PopupStats totalRequests={totalRequests} errors={errors} />
        <section className="mt-4 rounded-[24px] border border-teal-100 bg-teal-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Privacy Notice</p>
          <p className="mt-2 text-sm leading-6 text-slate">
            Request URLs and request bodies may be captured after you start capture. Data stays local in Chrome unless
            you export a session, and exported files may contain sensitive information.
          </p>
        </section>
        <PopupActionRow
          primaryActionLabel={primaryActionLabel}
          isCapturing={session?.state === "capturing"}
          isDisabled={!activeTab || isPending || isUnsupportedPage}
          onPrimaryAction={handlePrimaryAction}
          onOpenInspector={handleOpenInspector}
          revokeActionLabel={canRemoveAccess ? "Remove Site Access" : undefined}
          isRevokeDisabled={isPending}
          onRevokeAction={canRemoveAccess ? handleRemoveAccess : undefined}
        />
      </section>

      <section className="mt-4 rounded-[24px] border border-teal-100 bg-teal-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Live Session</p>
        <p className="mt-2 text-sm leading-6 text-slate">
          Start capture from the popup after granting site access, then open the inspector to watch requests stream in
          for this tab.
        </p>
      </section>
    </main>
  );
}
