import {
  messageTypes,
  type ClearSessionResponse,
  type GetClientContextResponse,
  type GetSessionStateResponse,
  type PauseCaptureResponse,
  type ResumeCaptureResponse,
  type RuntimeMessage,
  type StartCaptureResponse,
  type StopCaptureResponse
} from "../shared/messaging";
import {
  clearSession as clearCaptureSession,
  getSession,
  pauseCapture,
  resumeCapture,
  startCapture,
  stopCapture
} from "./capture-store";
import { getClientContext, updateClientRuntimeSnapshot } from "./client-context";

function handleStartCapture(tabId: number): StartCaptureResponse {
  return { session: startCapture(tabId) };
}

function handleStopCapture(tabId: number): StopCaptureResponse {
  return { session: stopCapture(tabId) };
}

function handlePauseCapture(tabId: number): PauseCaptureResponse {
  return { session: pauseCapture(tabId) };
}

function handleResumeCapture(tabId: number): ResumeCaptureResponse {
  return { session: resumeCapture(tabId) };
}

function handleGetSessionState(tabId: number): GetSessionStateResponse {
  return { session: getSession(tabId) };
}

function handleClearSession(tabId: number): ClearSessionResponse {
  return { session: clearCaptureSession(tabId) };
}

export function registerBackgroundMessaging() {
  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case messageTypes.startCapture:
        sendResponse(handleStartCapture(message.tabId));
        return false;
      case messageTypes.stopCapture:
        sendResponse(handleStopCapture(message.tabId));
        return false;
      case messageTypes.pauseCapture:
        sendResponse(handlePauseCapture(message.tabId));
        return false;
      case messageTypes.resumeCapture:
        sendResponse(handleResumeCapture(message.tabId));
        return false;
      case messageTypes.getSessionState:
        sendResponse(handleGetSessionState(message.tabId));
        return false;
      case messageTypes.clearSession:
        sendResponse(handleClearSession(message.tabId));
        return false;
      case messageTypes.getClientContext:
        void getClientContext(message.tabId).then((clientContext) => {
          const response: GetClientContextResponse = { clientContext };
          sendResponse(response);
        });
        return true;
      case messageTypes.updateClientRuntimeSnapshot:
        void updateClientRuntimeSnapshot(message.tabId, message.snapshot).then((clientContext) => {
          sendResponse({ clientContext });
        });
        return true;
      default:
        return false;
    }
  });
}
