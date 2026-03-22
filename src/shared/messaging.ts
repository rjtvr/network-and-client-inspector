import type { CaptureSession, ClientContext, ClientRuntimeSnapshot } from "./types";

export const messageTypes = {
  startCapture: "capture/start",
  stopCapture: "capture/stop",
  pauseCapture: "capture/pause",
  resumeCapture: "capture/resume",
  getSessionState: "capture/get-session-state",
  clearSession: "capture/clear-session",
  getClientContext: "client/get-context",
  updateClientRuntimeSnapshot: "client/update-runtime-snapshot"
} as const;

export interface StartCaptureMessage {
  type: typeof messageTypes.startCapture;
  tabId: number;
}

export interface StopCaptureMessage {
  type: typeof messageTypes.stopCapture;
  tabId: number;
}

export interface PauseCaptureMessage {
  type: typeof messageTypes.pauseCapture;
  tabId: number;
}

export interface ResumeCaptureMessage {
  type: typeof messageTypes.resumeCapture;
  tabId: number;
}

export interface GetSessionStateMessage {
  type: typeof messageTypes.getSessionState;
  tabId: number;
}

export interface ClearSessionMessage {
  type: typeof messageTypes.clearSession;
  tabId: number;
}

export interface GetClientContextMessage {
  type: typeof messageTypes.getClientContext;
  tabId: number;
}

export interface UpdateClientRuntimeSnapshotMessage {
  type: typeof messageTypes.updateClientRuntimeSnapshot;
  tabId: number;
  snapshot: ClientRuntimeSnapshot;
}

export type RuntimeMessage =
  | StartCaptureMessage
  | StopCaptureMessage
  | PauseCaptureMessage
  | ResumeCaptureMessage
  | GetSessionStateMessage
  | ClearSessionMessage
  | GetClientContextMessage
  | UpdateClientRuntimeSnapshotMessage;

export interface StartCaptureResponse {
  session: CaptureSession;
}

export interface StopCaptureResponse {
  session: CaptureSession;
}

export interface PauseCaptureResponse {
  session: CaptureSession;
}

export interface ResumeCaptureResponse {
  session: CaptureSession;
}

export interface GetSessionStateResponse {
  session: CaptureSession;
}

export interface ClearSessionResponse {
  session: CaptureSession;
}

export interface GetClientContextResponse {
  clientContext: ClientContext | null;
}

export interface UpdateClientRuntimeSnapshotResponse {
  clientContext: ClientContext | null;
}

export interface RuntimeMessageMap {
  [messageTypes.startCapture]: {
    message: StartCaptureMessage;
    response: StartCaptureResponse;
  };
  [messageTypes.stopCapture]: {
    message: StopCaptureMessage;
    response: StopCaptureResponse;
  };
  [messageTypes.pauseCapture]: {
    message: PauseCaptureMessage;
    response: PauseCaptureResponse;
  };
  [messageTypes.resumeCapture]: {
    message: ResumeCaptureMessage;
    response: ResumeCaptureResponse;
  };
  [messageTypes.getSessionState]: {
    message: GetSessionStateMessage;
    response: GetSessionStateResponse;
  };
  [messageTypes.clearSession]: {
    message: ClearSessionMessage;
    response: ClearSessionResponse;
  };
  [messageTypes.getClientContext]: {
    message: GetClientContextMessage;
    response: GetClientContextResponse;
  };
  [messageTypes.updateClientRuntimeSnapshot]: {
    message: UpdateClientRuntimeSnapshotMessage;
    response: UpdateClientRuntimeSnapshotResponse;
  };
}

async function sendRuntimeMessage<T extends keyof RuntimeMessageMap>(
  message: RuntimeMessageMap[T]["message"]
): Promise<RuntimeMessageMap[T]["response"]> {
  return chrome.runtime.sendMessage(message) as Promise<RuntimeMessageMap[T]["response"]>;
}

export function startCapture(tabId: number) {
  return sendRuntimeMessage<typeof messageTypes.startCapture>({
    type: messageTypes.startCapture,
    tabId
  });
}

export function stopCapture(tabId: number) {
  return sendRuntimeMessage<typeof messageTypes.stopCapture>({
    type: messageTypes.stopCapture,
    tabId
  });
}

export function pauseCapture(tabId: number) {
  return sendRuntimeMessage<typeof messageTypes.pauseCapture>({
    type: messageTypes.pauseCapture,
    tabId
  });
}

export function resumeCapture(tabId: number) {
  return sendRuntimeMessage<typeof messageTypes.resumeCapture>({
    type: messageTypes.resumeCapture,
    tabId
  });
}

export function getSessionState(tabId: number) {
  return sendRuntimeMessage<typeof messageTypes.getSessionState>({
    type: messageTypes.getSessionState,
    tabId
  });
}

export function clearSession(tabId: number) {
  return sendRuntimeMessage<typeof messageTypes.clearSession>({
    type: messageTypes.clearSession,
    tabId
  });
}

export function getClientContext(tabId: number) {
  return sendRuntimeMessage<typeof messageTypes.getClientContext>({
    type: messageTypes.getClientContext,
    tabId
  });
}

export function updateClientRuntimeSnapshot(tabId: number, snapshot: ClientRuntimeSnapshot) {
  return sendRuntimeMessage<typeof messageTypes.updateClientRuntimeSnapshot>({
    type: messageTypes.updateClientRuntimeSnapshot,
    tabId,
    snapshot
  });
}
