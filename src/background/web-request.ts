import { beginTrackedRequest, completeTrackedRequest } from "./capture-store";

export function registerWebRequestCapture() {
  // webRequest is the only runtime permission needed for passive request lifecycle events.
  // Host access is limited to http/https pages because the extension only inspects real web traffic.
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      beginTrackedRequest(details);
      return undefined;
    },
    { urls: ["http://*/*", "https://*/*"] },
    ["requestBody"]
  );

  chrome.webRequest.onCompleted.addListener(
    (details) => {
      completeTrackedRequest(details);
      return undefined;
    },
    { urls: ["http://*/*", "https://*/*"] }
  );

  chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
      completeTrackedRequest(details);
      return undefined;
    },
    { urls: ["http://*/*", "https://*/*"] }
  );
}
