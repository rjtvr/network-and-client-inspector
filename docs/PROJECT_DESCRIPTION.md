# Network Capture Inspector

Network Capture Inspector is a Chrome extension that helps developers observe and review network activity from the currently active browser tab in real time. It provides a lightweight capture workflow through a popup and a richer inspector view for exploring requests, timing data, client environment details, and basic security findings.

The project is built for debugging API-heavy applications, validating request behavior during manual testing, and surfacing risky patterns early in development. Instead of capturing traffic globally, the extension keeps scope focused to the selected tab and only records requests after the user explicitly starts a capture session.

## Core Capabilities

- Start and stop network capture for the active tab from the popup UI.
- Inspect live request streams in a dedicated React-based inspector.
- Filter and search requests by method, status, type, and security findings.
- Review request metadata such as URL, method, status code, timestamp, and duration.
- Export the current session as JSON for sharing or offline analysis.
- View basic performance summaries for slow or failing requests.
- Surface heuristic security findings for insecure transport and sensitive-looking values in URLs.
- Show client and browser context, including device, screen, network, tab, and page state.

## Privacy and Data Handling

The extension is designed with a session-based workflow: traffic is ignored until capture is explicitly enabled for a tab. Request payload inspection is best-effort and includes redaction logic for sensitive-looking keys and token-like values. Response body capture is not currently supported in the existing architecture and is reported honestly in the inspector state.

## Technical Overview

Network Capture Inspector is built with Manifest V3, TypeScript, React, Vite, and Tailwind CSS. A background service worker listens to Chrome `webRequest` lifecycle events, stores tab-scoped sessions in memory, analyzes requests for security heuristics, and serves data to the popup and inspector through a shared messaging layer.

## Ideal Use Cases

- Debugging frontend-to-backend request flows during development
- Inspecting request timing and failure patterns
- Reviewing whether sensitive data is leaking into URLs
- Capturing a tab-scoped session for QA or issue reproduction
