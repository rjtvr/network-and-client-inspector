import type {
  ClientContext,
  ClientRuntimeSnapshot,
  NetworkRequest,
  RequestBodyCapture,
  ResponseBodyCapture,
  SecurityFinding
} from "../shared/types";

export type InspectorTab = "requests" | "security" | "performance" | "client";
export type StatusFilter = "all" | "success" | "redirect" | "client-error" | "server-error";

interface NavigatorConnectionLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface InspectorFilters {
  method: string;
  status: StatusFilter;
  type: string;
  findingsOnly: boolean;
}

export interface InspectorRequest {
  id: string;
  method: string;
  url: string;
  status: number | null;
  type: string;
  duration: number | null;
  timestamp: number;
  query: Record<string, string>;
  payload: RequestBodyCapture;
  response: ResponseBodyCapture;
  findings: SecurityFinding[];
}

export interface PerformanceSummary {
  totalRequests: number;
  averageDuration: number;
  errorRate: number;
  slowRequestCount: number;
  slowThresholdMs: number;
  slowestRequests: InspectorRequest[];
  durationBuckets: Array<{ label: string; count: number }>;
}

function getNavigatorValue<T>(factory: () => T | undefined): T | null {
  try {
    const value = factory();
    return value ?? null;
  } catch {
    return null;
  }
}

export function collectClientRuntimeSnapshot(): ClientRuntimeSnapshot {
  const navigatorConnection = getNavigatorValue(
    () => (navigator as Navigator & { connection?: NavigatorConnectionLike }).connection
  );

  return {
    browser: {
      userAgent: getNavigatorValue(() => navigator.userAgent),
      platform: getNavigatorValue(() => navigator.platform),
      vendor: getNavigatorValue(() => navigator.vendor),
      language: getNavigatorValue(() => navigator.language),
      languages: getNavigatorValue(() => [...navigator.languages]) ?? [],
      timezone: getNavigatorValue(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
      cookieEnabled: getNavigatorValue(() => navigator.cookieEnabled),
      pdfViewerEnabled: getNavigatorValue(
        () => (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled
      ),
      webdriver: getNavigatorValue(() => navigator.webdriver)
    },
    device: {
      hardwareConcurrency: getNavigatorValue(() => navigator.hardwareConcurrency),
      deviceMemory: getNavigatorValue(() => (navigator as Navigator & { deviceMemory?: number }).deviceMemory),
      maxTouchPoints: getNavigatorValue(() => navigator.maxTouchPoints),
      colorDepth: getNavigatorValue(() => window.screen.colorDepth),
      pixelDepth: getNavigatorValue(() => window.screen.pixelDepth)
    },
    screen: {
      screenWidth: getNavigatorValue(() => window.screen.width),
      screenHeight: getNavigatorValue(() => window.screen.height),
      availWidth: getNavigatorValue(() => window.screen.availWidth),
      availHeight: getNavigatorValue(() => window.screen.availHeight),
      devicePixelRatio: getNavigatorValue(() => window.devicePixelRatio),
      viewportWidth: getNavigatorValue(() => window.innerWidth),
      viewportHeight: getNavigatorValue(() => window.innerHeight)
    },
    network: {
      online: getNavigatorValue(() => navigator.onLine),
      effectiveType: navigatorConnection?.effectiveType ?? null,
      downlink: navigatorConnection?.downlink ?? null,
      rtt: navigatorConnection?.rtt ?? null,
      saveData: navigatorConnection?.saveData ?? null
    },
    page: {
      referrer: getNavigatorValue(() => document.referrer),
      visibilityState: getNavigatorValue(() => document.visibilityState),
      readyState: getNavigatorValue(() => document.readyState)
    }
  };
}

export function getInitialTabId() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("tabId");

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export async function resolveInspectorTabId() {
  const tabIdFromUrl = getInitialTabId();

  if (tabIdFromUrl !== null) {
    return tabIdFromUrl;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

export function getQueryEntries(url: string) {
  try {
    const targetUrl = new URL(url);
    return Object.fromEntries(targetUrl.searchParams.entries());
  } catch {
    return {};
  }
}

export function matchesStatusFilter(status: number | null, filter: StatusFilter) {
  if (filter === "all") {
    return true;
  }

  if (status === null) {
    return false;
  }

  if (filter === "success") {
    return status >= 200 && status < 300;
  }

  if (filter === "redirect") {
    return status >= 300 && status < 400;
  }

  if (filter === "client-error") {
    return status >= 400 && status < 500;
  }

  return status >= 500;
}

export function toInspectorRequest(request: NetworkRequest): InspectorRequest {
  return {
    id: request.id,
    method: request.method,
    url: request.url,
    status: request.statusCode ?? null,
    type: request.type,
    duration: request.duration ?? null,
    timestamp: request.timestamp,
    query: getQueryEntries(request.url),
    payload: request.payload,
    response: request.response,
    findings: request.findings ?? []
  };
}

export function buildPerformanceSummary(
  requests: InspectorRequest[],
  slowThresholdMs = 1000
): PerformanceSummary {
  const totalRequests = requests.length;
  const totalDuration = requests.reduce((sum, request) => sum + (request.duration ?? 0), 0);
  const failedRequests = requests.filter((request) => (request.status ?? 0) >= 400).length;
  const slowRequests = requests
    .filter((request) => (request.duration ?? 0) >= slowThresholdMs)
    .sort((left, right) => (right.duration ?? 0) - (left.duration ?? 0));

  const durationBuckets = [
    { label: "< 250 ms", count: 0 },
    { label: "250-999 ms", count: 0 },
    { label: "1000-2999 ms", count: 0 },
    { label: "3000+ ms", count: 0 }
  ];

  requests.forEach((request) => {
    const duration = request.duration ?? 0;

    if (duration < 250) {
      durationBuckets[0].count += 1;
      return;
    }

    if (duration < 1000) {
      durationBuckets[1].count += 1;
      return;
    }

    if (duration < 3000) {
      durationBuckets[2].count += 1;
      return;
    }

    durationBuckets[3].count += 1;
  });

  return {
    totalRequests,
    averageDuration: totalRequests > 0 ? totalDuration / totalRequests : 0,
    errorRate: totalRequests > 0 ? failedRequests / totalRequests : 0,
    slowRequestCount: slowRequests.length,
    slowThresholdMs,
    slowestRequests: slowRequests.slice(0, 10),
    durationBuckets
  };
}

export function formatClientValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Unsupported";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Unsupported";
  }

  return String(value);
}

export type { ClientContext };
