import { getUnsupportedResponseCapture, inspectRequestPayload } from "./payload-inspection";
import { analyzeRequestSecurity } from "./security-analysis";
import type { CaptureSession, NetworkRequest, RequestBodyCapture } from "../shared/types";

type RequestBodyValue = string | ArrayBuffer;

const MAX_REQUESTS_PER_TAB = 1000;
const sessions = new Map<number, CaptureSession>();
const pendingRequests = new Map<string, PendingRequest>();

interface RequestBodyDetails {
  error?: string;
  formData?: Record<string, RequestBodyValue[]>;
  raw?: Array<{
    bytes?: ArrayBuffer | ArrayBufferLike;
  }>;
}

interface PendingRequest {
  id: string;
  tabId: number;
  url: string;
  method: string;
  type: string;
  timestamp: number;
  payload: RequestBodyCapture;
}

interface RequestStartDetails {
  requestId: string;
  tabId: number;
  url: string;
  method: string;
  type?: string;
  timeStamp: number;
  requestBody?: RequestBodyDetails;
}

interface RequestEndDetails {
  requestId: string;
  tabId: number;
  timeStamp: number;
  statusCode?: number;
}

function createIdleSession(tabId: number): CaptureSession {
  const now = Date.now();

  return {
    tabId,
    state: "idle",
    requests: [],
    startedAt: null,
    updatedAt: now
  };
}

function getPendingKey(tabId: number, requestId: string) {
  return `${tabId}:${requestId}`;
}

function clearPendingRequestsForTab(tabId: number) {
  for (const key of pendingRequests.keys()) {
    if (key.startsWith(`${tabId}:`)) {
      pendingRequests.delete(key);
    }
  }
}

function setSession(session: CaptureSession) {
  sessions.set(session.tabId, session);
  return session;
}

function appendRequest(tabId: number, request: NetworkRequest) {
  const currentSession = getSession(tabId);
  const nextRequests =
    currentSession.requests.length >= MAX_REQUESTS_PER_TAB
      ? [...currentSession.requests.slice(1), request]
      : [...currentSession.requests, request];

  return setSession({
    ...currentSession,
    requests: nextRequests,
    updatedAt: Date.now()
  });
}

export function getSession(tabId: number): CaptureSession {
  const existingSession = sessions.get(tabId);

  if (existingSession) {
    return existingSession;
  }

  const session = createIdleSession(tabId);
  sessions.set(tabId, session);
  return session;
}

export function startCapture(tabId: number): CaptureSession {
  const currentSession = getSession(tabId);

  return setSession({
    ...currentSession,
    state: "capturing",
    startedAt: currentSession.startedAt ?? Date.now(),
    updatedAt: Date.now()
  });
}

export function pauseCapture(tabId: number): CaptureSession {
  const currentSession = getSession(tabId);
  clearPendingRequestsForTab(tabId);

  return setSession({
    ...currentSession,
    state: "paused",
    updatedAt: Date.now()
  });
}

export function resumeCapture(tabId: number): CaptureSession {
  const currentSession = getSession(tabId);

  return setSession({
    ...currentSession,
    state: "capturing",
    startedAt: currentSession.startedAt ?? Date.now(),
    updatedAt: Date.now()
  });
}

export function stopCapture(tabId: number): CaptureSession {
  const currentSession = getSession(tabId);
  clearPendingRequestsForTab(tabId);

  return setSession({
    ...currentSession,
    state: "idle",
    updatedAt: Date.now()
  });
}

export function clearSession(tabId: number): CaptureSession {
  clearPendingRequestsForTab(tabId);
  return setSession(createIdleSession(tabId));
}

export function isCapturing(tabId: number) {
  return getSession(tabId).state === "capturing";
}

export function beginTrackedRequest(details: RequestStartDetails) {
  // Privacy gate: requests are ignored until the user explicitly starts capture for this tab.
  if (details.tabId < 0 || !isCapturing(details.tabId)) {
    return;
  }

  pendingRequests.set(getPendingKey(details.tabId, details.requestId), {
    id: details.requestId,
    tabId: details.tabId,
    url: details.url,
    method: details.method,
    type: details.type ?? "other",
    timestamp: details.timeStamp,
    payload: inspectRequestPayload(details.requestBody)
  });
}

export function completeTrackedRequest(details: RequestEndDetails) {
  if (details.tabId < 0) {
    return;
  }

  const key = getPendingKey(details.tabId, details.requestId);
  const pendingRequest = pendingRequests.get(key);

  if (!pendingRequest) {
    return;
  }

  pendingRequests.delete(key);

  if (!isCapturing(details.tabId)) {
    return;
  }

  const request: NetworkRequest = {
    id: pendingRequest.id,
    tabId: pendingRequest.tabId,
    url: pendingRequest.url,
    method: pendingRequest.method,
    type: pendingRequest.type,
    statusCode: details.statusCode ?? 0,
    timestamp: pendingRequest.timestamp,
    duration: Math.max(0, details.timeStamp - pendingRequest.timestamp),
    payload: pendingRequest.payload,
    response: getUnsupportedResponseCapture()
  };

  const findings = analyzeRequestSecurity(request);

  appendRequest(details.tabId, {
    ...request,
    findings: findings.length > 0 ? findings : undefined
  });
}
