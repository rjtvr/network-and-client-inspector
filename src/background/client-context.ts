import type {
  ClientAvailability,
  ClientAvailabilityStatus,
  ClientContext,
  ClientRuntimeSnapshot,
  IncognitoStatus
} from "../shared/types";

const INSTALLATION_ID_KEY = "client.installation-id";
const TAB_INSTANCE_KEY_PREFIX = "client.tab-instance:";
const tabRuntimeSnapshots = new Map<number, ClientRuntimeSnapshot>();

function getUnsupportedRuntimeSnapshot(): ClientRuntimeSnapshot {
  return {
    browser: {
      userAgent: null,
      platform: null,
      vendor: null,
      language: null,
      languages: [],
      timezone: null,
      cookieEnabled: null,
      pdfViewerEnabled: null,
      webdriver: null
    },
    device: {
      hardwareConcurrency: null,
      deviceMemory: null,
      maxTouchPoints: null,
      colorDepth: null,
      pixelDepth: null
    },
    screen: {
      screenWidth: null,
      screenHeight: null,
      availWidth: null,
      availHeight: null,
      devicePixelRatio: null,
      viewportWidth: null,
      viewportHeight: null
    },
    network: {
      online: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
      saveData: null
    },
    page: {
      referrer: null,
      visibilityState: null,
      readyState: null
    }
  };
}

function countDefined(values: unknown[]) {
  return values.filter((value) => value !== null && value !== undefined && value !== "").length;
}

function getAvailability(values: unknown[]): ClientAvailabilityStatus {
  const total = values.length;
  const defined = countDefined(values);

  if (defined === 0) {
    return "unsupported";
  }

  if (defined === total) {
    return "available";
  }

  return "partial";
}

function getOrigin(url: string | null) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

async function getInstallationId() {
  const stored = await chrome.storage.local.get(INSTALLATION_ID_KEY);
  const existingId = stored[INSTALLATION_ID_KEY];

  if (typeof existingId === "string" && existingId.length > 0) {
    return existingId;
  }

  const installationId = crypto.randomUUID();
  await chrome.storage.local.set({ [INSTALLATION_ID_KEY]: installationId });
  return installationId;
}

async function hashValue(input: string) {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function getOrCreateTabInstance(tabId: number, windowId: number | null, incognitoStatus: IncognitoStatus) {
  const storageKey = `${TAB_INSTANCE_KEY_PREFIX}${tabId}`;
  const stored = await chrome.storage.session.get(storageKey);
  const existing = stored[storageKey] as { firstSeenAt?: number; tabInstanceId?: string } | undefined;

  if (existing?.tabInstanceId && typeof existing.firstSeenAt === "number") {
    return existing.tabInstanceId;
  }

  const installationId = await getInstallationId();
  const firstSeenAt = Date.now();
  const tabInstanceId = await hashValue(
    `${installationId}:${tabId}:${windowId ?? "none"}:${firstSeenAt}:${incognitoStatus}`
  );

  await chrome.storage.session.set({
    [storageKey]: {
      firstSeenAt,
      tabInstanceId
    }
  });

  return tabInstanceId;
}

function getIncognitoStatus(tab: chrome.tabs.Tab | null): IncognitoStatus {
  if (!tab) {
    return "unavailable";
  }

  return tab.incognito ? "yes" : "no";
}

function buildAvailability(snapshot: ClientRuntimeSnapshot, tab: chrome.tabs.Tab | null): ClientAvailability {
  return {
    browser: getAvailability([
      snapshot.browser.userAgent,
      snapshot.browser.platform,
      snapshot.browser.vendor,
      snapshot.browser.language,
      snapshot.browser.languages,
      snapshot.browser.timezone,
      snapshot.browser.cookieEnabled,
      snapshot.browser.pdfViewerEnabled,
      snapshot.browser.webdriver
    ]),
    device: getAvailability([
      snapshot.device.hardwareConcurrency,
      snapshot.device.deviceMemory,
      snapshot.device.maxTouchPoints,
      snapshot.device.colorDepth,
      snapshot.device.pixelDepth
    ]),
    screen: getAvailability([
      snapshot.screen.screenWidth,
      snapshot.screen.screenHeight,
      snapshot.screen.availWidth,
      snapshot.screen.availHeight,
      snapshot.screen.devicePixelRatio,
      snapshot.screen.viewportWidth,
      snapshot.screen.viewportHeight
    ]),
    network: getAvailability([
      snapshot.network.online,
      snapshot.network.effectiveType,
      snapshot.network.downlink,
      snapshot.network.rtt,
      snapshot.network.saveData
    ]),
    tab: getAvailability([
      tab?.title,
      tab?.url,
      tab?.status,
      tab?.active,
      tab?.audible,
      tab?.mutedInfo?.muted,
      tab?.pinned,
      tab?.highlighted,
      tab?.discarded,
      tab?.autoDiscardable,
      tab?.groupId
    ]),
    page: getAvailability([
      snapshot.page.referrer,
      snapshot.page.visibilityState,
      snapshot.page.readyState
    ])
  };
}

async function tryGetTab(tabId: number) {
  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return null;
  }
}

export async function getClientContext(tabId: number): Promise<ClientContext | null> {
  const tab = await tryGetTab(tabId);

  if (!tab) {
    return null;
  }

  const installationId = await getInstallationId();
  const incognitoStatus = getIncognitoStatus(tab);
  const tabInstanceId = await getOrCreateTabInstance(tabId, tab.windowId ?? null, incognitoStatus);
  const runtimeSnapshot = tabRuntimeSnapshots.get(tabId) ?? getUnsupportedRuntimeSnapshot();

  return {
    installationId,
    tabInstanceId,
    tabId,
    windowId: tab.windowId ?? null,
    incognitoStatus,
    capturedAt: Date.now(),
    browser: runtimeSnapshot.browser,
    device: runtimeSnapshot.device,
    screen: runtimeSnapshot.screen,
    network: runtimeSnapshot.network,
    tab: {
      title: tab.title ?? null,
      url: tab.url ?? null,
      origin: getOrigin(tab.url ?? null),
      status: tab.status ?? null,
      active: tab.active ?? null,
      audible: tab.audible ?? null,
      muted: tab.mutedInfo?.muted ?? null,
      pinned: tab.pinned ?? null,
      highlighted: tab.highlighted ?? null,
      discarded: tab.discarded ?? null,
      autoDiscardable: tab.autoDiscardable ?? null,
      groupId: typeof tab.groupId === "number" ? tab.groupId : null
    },
    page: runtimeSnapshot.page,
    availability: buildAvailability(runtimeSnapshot, tab)
  };
}

export async function updateClientRuntimeSnapshot(tabId: number, snapshot: ClientRuntimeSnapshot) {
  tabRuntimeSnapshots.set(tabId, snapshot);
  return getClientContext(tabId);
}

export async function clearClientContext(tabId: number) {
  tabRuntimeSnapshots.delete(tabId);
  const storageKey = `${TAB_INSTANCE_KEY_PREFIX}${tabId}`;
  await chrome.storage.session.remove(storageKey);
}

export function registerClientContextLifecycle() {
  chrome.tabs.onRemoved.addListener((tabId) => {
    void clearClientContext(tabId);
  });
}
