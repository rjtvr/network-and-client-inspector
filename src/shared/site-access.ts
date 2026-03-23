export type SiteAccessStatus = "unsupported" | "needs-access" | "granted";
export type SiteAccessRequestOutcome = "granted" | "denied" | "error" | "unchanged";
export type SiteAccessRemovalOutcome = "removed" | "error" | "unchanged";

export interface SiteAccessState {
  tabId: number | null;
  origin: string | null;
  hostname: string;
  permissionPattern: string | null;
  status: SiteAccessStatus;
  message: string;
}

export interface SiteAccessRequestResult {
  outcome: SiteAccessRequestOutcome;
  message: string;
  state: SiteAccessState;
}

export interface SiteAccessRemovalResult {
  outcome: SiteAccessRemovalOutcome;
  message: string;
  state: SiteAccessState;
}

function buildUnsupportedState(message: string, tabId: number | null = null): SiteAccessState {
  return {
    tabId,
    origin: null,
    hostname: "Unavailable",
    permissionPattern: null,
    status: "unsupported",
    message
  };
}

function getUrlDetails(url: string | undefined) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    return {
      origin: parsedUrl.origin,
      hostname: parsedUrl.hostname,
      permissionPattern: `${parsedUrl.origin}/*`
    };
  } catch {
    return null;
  }
}

function buildStateFromTab(tab: chrome.tabs.Tab | null): SiteAccessState {
  if (!tab || tab.id === undefined) {
    return buildUnsupportedState("Open a regular website to manage capture access.");
  }

  const details = getUrlDetails(tab.url);

  if (!details) {
    return buildUnsupportedState("Capture access is only available on http and https pages.", tab.id);
  }

  return {
    tabId: tab.id,
    origin: details.origin,
    hostname: details.hostname,
    permissionPattern: details.permissionPattern,
    status: "needs-access",
    message: "Grant site access to inspect requests for this page."
  };
}

async function getTabById(tabId: number) {
  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return null;
  }
}

export async function getSiteAccessStateForTab(tab: chrome.tabs.Tab | null): Promise<SiteAccessState> {
  const baseState = buildStateFromTab(tab);

  if (baseState.status === "unsupported" || !baseState.permissionPattern) {
    return baseState;
  }

  const hasAccess = await chrome.permissions.contains({
    origins: [baseState.permissionPattern]
  });

  return {
    ...baseState,
    status: hasAccess ? "granted" : "needs-access",
    message: hasAccess
      ? "Site access granted. Capture can inspect requests for this page."
      : "Grant site access to inspect requests for this page."
  };
}

export async function getSiteAccessStateForTabId(tabId: number) {
  const tab = await getTabById(tabId);
  return getSiteAccessStateForTab(tab);
}

export async function requestSiteAccessForTab(tabId: number): Promise<SiteAccessRequestResult> {
  const currentState = await getSiteAccessStateForTabId(tabId);

  if (currentState.status === "unsupported" || !currentState.permissionPattern) {
    return {
      outcome: "unchanged",
      message: currentState.message,
      state: currentState
    };
  }

  if (currentState.status === "granted") {
    return {
      outcome: "unchanged",
      message: "Site access is already granted.",
      state: currentState
    };
  }

  try {
    const granted = await chrome.permissions.request({
      origins: [currentState.permissionPattern]
    });
    const nextState = await getSiteAccessStateForTabId(tabId);

    return granted
      ? {
          outcome: "granted",
          message: "Site access granted for the current page.",
          state: nextState
        }
      : {
          outcome: "denied",
          message: "Site access was not granted. Capture stayed off.",
          state: nextState
        };
  } catch {
    return {
      outcome: "error",
      message: "Site access could not be updated. Try again on a regular website tab.",
      state: currentState
    };
  }
}

export async function removeSiteAccessForTab(tabId: number): Promise<SiteAccessRemovalResult> {
  const currentState = await getSiteAccessStateForTabId(tabId);

  if (currentState.status === "unsupported" || !currentState.permissionPattern) {
    return {
      outcome: "unchanged",
      message: currentState.message,
      state: currentState
    };
  }

  if (currentState.status !== "granted") {
    return {
      outcome: "unchanged",
      message: "This site does not currently have access.",
      state: currentState
    };
  }

  try {
    const removed = await chrome.permissions.remove({
      origins: [currentState.permissionPattern]
    });
    const nextState = await getSiteAccessStateForTabId(tabId);

    return removed
      ? {
          outcome: "removed",
          message: "Site access removed for the current page.",
          state: nextState
        }
      : {
          outcome: "unchanged",
          message: "This site still has access. You can remove it from Chrome if needed.",
          state: currentState
        };
  } catch {
    return {
      outcome: "error",
      message: "Site access could not be removed right now.",
      state: currentState
    };
  }
}
