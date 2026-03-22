import { registerClientContextLifecycle } from "./client-context";
import { registerBackgroundMessaging } from "./messaging";
import { registerWebRequestCapture } from "./web-request";

chrome.runtime.onInstalled.addListener(() => {
  console.info("Network Capture Inspector installed");
});

registerBackgroundMessaging();
registerWebRequestCapture();
registerClientContextLifecycle();
