import { useEffect, useMemo, useState } from "react";
import { getSessionState, startCapture, stopCapture } from "../shared/messaging";
import type { CaptureSession } from "../shared/types";
import { PopupActionRow } from "./components/PopupActionRow";
import { PopupHeader } from "./components/PopupHeader";
import { PopupStats } from "./components/PopupStats";

interface ActiveTabInfo {
  id: number;
  title: string;
  domain: string;
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
    domain: getDomain(tab.url)
  };
}

export function Popup() {
  const [activeTab, setActiveTab] = useState<ActiveTabInfo | null>(null);
  const [session, setSession] = useState<CaptureSession | null>(null);
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
        return;
      }

      const response = await getSessionState(tab.id);

      if (!isMounted) {
        return;
      }

      setSession(response.session);
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

  const primaryActionLabel = session?.state === "capturing" ? "Stop Capture" : "Start Capture";
  const totalRequests = session?.requests.length ?? 0;
  const errors = useMemo(
    () => session?.requests.filter((request) => (request.statusCode ?? 0) >= 400).length ?? 0,
    [session]
  );

  async function handlePrimaryAction() {
    if (!activeTab) {
      return;
    }

    setIsPending(true);

    try {
      const response =
        session?.state === "capturing"
          ? await stopCapture(activeTab.id)
          : await startCapture(activeTab.id);

      setSession(response.session);
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
        <PopupStats totalRequests={totalRequests} errors={errors} />
        <PopupActionRow
          primaryActionLabel={primaryActionLabel}
          isCapturing={session?.state === "capturing"}
          isDisabled={!activeTab || isPending}
          onPrimaryAction={handlePrimaryAction}
          onOpenInspector={handleOpenInspector}
        />
      </section>

      <section className="mt-4 rounded-[24px] border border-teal-100 bg-teal-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Live Session</p>
        <p className="mt-2 text-sm leading-6 text-slate">
          Start capture from the popup, then open the inspector to watch requests stream in for this tab.
        </p>
      </section>
    </main>
  );
}