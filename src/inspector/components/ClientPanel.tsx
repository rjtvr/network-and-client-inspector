import { formatClientValue, type ClientContext } from "../models";

interface ClientPanelProps {
  clientContext: ClientContext | null;
}

const sectionKeys = ["browser", "device", "screen", "network", "tab", "page"] as const;

export function ClientPanel({ clientContext }: ClientPanelProps) {
  if (!clientContext) {
    return (
      <section className="mt-6 rounded-[28px] border border-line bg-panel p-5">
        <h2 className="text-lg font-semibold">Client Details</h2>
        <p className="mt-3 text-sm leading-6 text-slate">
          Client details are unavailable for this tab right now.
        </p>
      </section>
    );
  }

  const sections = [
    {
      key: "browser",
      label: "Browser",
      entries: [
        ["User Agent", clientContext.browser.userAgent],
        ["Platform", clientContext.browser.platform],
        ["Vendor", clientContext.browser.vendor],
        ["Language", clientContext.browser.language],
        ["Languages", clientContext.browser.languages],
        ["Timezone", clientContext.browser.timezone],
        ["Cookies Enabled", clientContext.browser.cookieEnabled],
        ["PDF Viewer Enabled", clientContext.browser.pdfViewerEnabled],
        ["WebDriver", clientContext.browser.webdriver]
      ]
    },
    {
      key: "device",
      label: "Device",
      entries: [
        ["Hardware Concurrency", clientContext.device.hardwareConcurrency],
        ["Device Memory", clientContext.device.deviceMemory],
        ["Max Touch Points", clientContext.device.maxTouchPoints],
        ["Color Depth", clientContext.device.colorDepth],
        ["Pixel Depth", clientContext.device.pixelDepth]
      ]
    },
    {
      key: "screen",
      label: "Screen",
      entries: [
        ["Screen Width", clientContext.screen.screenWidth],
        ["Screen Height", clientContext.screen.screenHeight],
        ["Available Width", clientContext.screen.availWidth],
        ["Available Height", clientContext.screen.availHeight],
        ["Device Pixel Ratio", clientContext.screen.devicePixelRatio],
        ["Viewport Width", clientContext.screen.viewportWidth],
        ["Viewport Height", clientContext.screen.viewportHeight]
      ]
    },
    {
      key: "network",
      label: "Network",
      entries: [
        ["Online", clientContext.network.online],
        ["Effective Type", clientContext.network.effectiveType],
        ["Downlink", clientContext.network.downlink],
        ["RTT", clientContext.network.rtt],
        ["Save Data", clientContext.network.saveData]
      ]
    },
    {
      key: "tab",
      label: "Tab",
      entries: [
        ["Title", clientContext.tab.title],
        ["URL", clientContext.tab.url],
        ["Origin", clientContext.tab.origin],
        ["Status", clientContext.tab.status],
        ["Active", clientContext.tab.active],
        ["Audible", clientContext.tab.audible],
        ["Muted", clientContext.tab.muted],
        ["Pinned", clientContext.tab.pinned],
        ["Highlighted", clientContext.tab.highlighted],
        ["Discarded", clientContext.tab.discarded],
        ["Auto Discardable", clientContext.tab.autoDiscardable],
        ["Group ID", clientContext.tab.groupId]
      ]
    },
    {
      key: "page",
      label: "Page",
      entries: [
        ["Referrer", clientContext.page.referrer],
        ["Visibility State", clientContext.page.visibilityState],
        ["Ready State", clientContext.page.readyState]
      ]
    }
  ] as const;

  return (
    <section className="mt-6 space-y-6">
      <div className="rounded-[28px] border border-line bg-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Client Details</h2>
            <p className="mt-2 text-sm leading-6 text-slate">
              Background-owned browser and tab metadata with runtime-only client signals from the inspector.
            </p>
          </div>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            Captured {new Date(clientContext.capturedAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <IdentityCard label="Installation ID" value={clientContext.installationId} />
          <IdentityCard label="Tab Instance ID" value={clientContext.tabInstanceId} />
          <IdentityCard label="Tab ID" value={String(clientContext.tabId)} />
          <IdentityCard label="Window ID" value={formatClientValue(clientContext.windowId)} />
          <IdentityCard label="Incognito" value={clientContext.incognitoStatus === "unavailable" ? "Unavailable" : clientContext.incognitoStatus === "yes" ? "Yes" : "No"} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <article key={section.key} className="rounded-[28px] border border-line bg-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{section.label}</h3>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
                {clientContext.availability[section.key as (typeof sectionKeys)[number]]}
              </span>
            </div>
            <dl className="mt-4 space-y-3">
              {section.entries.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">{label}</dt>
                  <dd className="mt-1 break-all text-sm text-ink">{formatClientValue(value)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function IdentityCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate">{label}</p>
      <p className="mt-2 break-all text-sm text-ink">{value}</p>
    </article>
  );
}
