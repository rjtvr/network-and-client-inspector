# Network Capture Inspector

Network Capture Inspector is a Chrome extension for capturing and reviewing network requests from the currently active browser tab. It includes a compact popup for starting or stopping capture and a larger inspector view for request analysis, security findings, performance review, and client context inspection.

## Tech Stack

- Chrome Extension Manifest V3
- TypeScript
- React
- Vite
- Tailwind CSS

## What You Need

- Google Chrome
- Node.js LTS
- npm

## Project Structure

- `src/popup` - popup interface used to start and stop capture
- `src/inspector` - full inspector UI for reviewing captured sessions
- `src/background` - background service worker, message handling, and request capture logic
- `src/shared` - shared types and runtime messaging contracts
- `manifest.json` - Chrome extension manifest
- `dist` - production build output used when loading the extension into Chrome

## Setup

1. Open the project folder.
2. Install dependencies:

```bash
npm install
```

3. Create the production build:

```bash
npm run build
```

After the build completes, the extension files will be available in the `dist/` folder.

## Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`.
2. Enable `Developer mode` using the toggle in the top-right corner.
3. Click `Load unpacked`.
4. Select the `dist` folder from this project:

```text
E:\github-repos\network-and-client-inspector\dist
```

5. Chrome will install the unpacked extension and show it in the extensions list.

## How to Use the Extension

1. Open the website or web app you want to inspect in Chrome.
2. Click the Network Capture Inspector extension icon.
3. In the popup, confirm the active tab details.
4. Click `Start Capture` to begin recording requests for that tab only.
5. Interact with the page so network requests are generated.
6. Click `Open Inspector` to review the live session.

## Inspector Views

- `Requests` - browse the captured request list and request details
- `Security` - review heuristic findings such as insecure transport or sensitive-looking values in URLs
- `Performance` - inspect request timing and slow-request summaries
- `Client` - view browser, device, screen, network, page, and tab context

## Session Controls

Inside the inspector, you can:

- Pause capture
- Resume capture
- Clear the current session
- Export the captured session as JSON

## Important Notes

- Capture is tab-scoped and only starts after you explicitly enable it.
- The extension listens to `http` and `https` traffic.
- Request payload capture is best-effort and may be unavailable for some requests.
- Sensitive-looking payload values are redacted where possible.
- Response body capture is currently not supported by the existing architecture.

## Development Notes

Use the following commands during development:

```bash
npm install
npm run build
```

If you make code changes, rebuild the project and then reload the extension from the Chrome extensions page.

## Documentation

Additional project documentation is available in the `docs/` folder, including:

- project description
- application flow diagram
- logical flow diagram
