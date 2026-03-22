export type CaptureState = "idle" | "capturing" | "paused";
export type SecurityFindingSeverity = "low" | "medium" | "high";
export type SecurityFindingKind =
  | "password-parameter"
  | "secret-like-value"
  | "base64-like-value"
  | "insecure-transport";
export type ClientAvailabilityStatus = "available" | "partial" | "unsupported";
export type IncognitoStatus = "yes" | "no" | "unavailable";
export type BodyCaptureStatus = "captured" | "redacted" | "truncated" | "unavailable" | "unsupported";

export interface SecurityFinding {
  id: string;
  requestId: string;
  kind: SecurityFindingKind;
  severity: SecurityFindingSeverity;
  title: string;
  detail: string;
  location: string;
}

export interface RequestBodyCapture {
  status: BodyCaptureStatus;
  contentType: string | null;
  size: number | null;
  preview: string | null;
  parsedEntries: Record<string, string> | null;
}

export interface ResponseBodyCapture {
  status: BodyCaptureStatus;
  contentType: string | null;
  size: number | null;
  preview: string | null;
}

export interface NetworkRequest {
  id: string;
  tabId: number;
  url: string;
  method: string;
  type: string;
  statusCode?: number;
  timestamp: number;
  duration?: number;
  findings?: SecurityFinding[];
  payload: RequestBodyCapture;
  response: ResponseBodyCapture;
}

export interface CaptureSession {
  tabId: number;
  state: CaptureState;
  requests: NetworkRequest[];
  startedAt: number | null;
  updatedAt: number;
}

export interface ClientRuntimeSnapshot {
  browser: {
    userAgent: string | null;
    platform: string | null;
    vendor: string | null;
    language: string | null;
    languages: string[];
    timezone: string | null;
    cookieEnabled: boolean | null;
    pdfViewerEnabled: boolean | null;
    webdriver: boolean | null;
  };
  device: {
    hardwareConcurrency: number | null;
    deviceMemory: number | null;
    maxTouchPoints: number | null;
    colorDepth: number | null;
    pixelDepth: number | null;
  };
  screen: {
    screenWidth: number | null;
    screenHeight: number | null;
    availWidth: number | null;
    availHeight: number | null;
    devicePixelRatio: number | null;
    viewportWidth: number | null;
    viewportHeight: number | null;
  };
  network: {
    online: boolean | null;
    effectiveType: string | null;
    downlink: number | null;
    rtt: number | null;
    saveData: boolean | null;
  };
  page: {
    referrer: string | null;
    visibilityState: string | null;
    readyState: string | null;
  };
}

export interface ClientAvailability {
  browser: ClientAvailabilityStatus;
  device: ClientAvailabilityStatus;
  screen: ClientAvailabilityStatus;
  network: ClientAvailabilityStatus;
  tab: ClientAvailabilityStatus;
  page: ClientAvailabilityStatus;
}

export interface ClientContext {
  installationId: string;
  tabInstanceId: string;
  tabId: number;
  windowId: number | null;
  incognitoStatus: IncognitoStatus;
  capturedAt: number;
  browser: ClientRuntimeSnapshot["browser"];
  device: ClientRuntimeSnapshot["device"];
  screen: ClientRuntimeSnapshot["screen"];
  network: ClientRuntimeSnapshot["network"];
  tab: {
    title: string | null;
    url: string | null;
    origin: string | null;
    status: string | null;
    active: boolean | null;
    audible: boolean | null;
    muted: boolean | null;
    pinned: boolean | null;
    highlighted: boolean | null;
    discarded: boolean | null;
    autoDiscardable: boolean | null;
    groupId: number | null;
  };
  page: ClientRuntimeSnapshot["page"];
  availability: ClientAvailability;
}
