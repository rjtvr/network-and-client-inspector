# Privacy Policy

## Summary

Network Capture Inspector is a Chrome extension that helps users inspect network requests for a browser tab they choose. The extension is designed to keep captured session data local to the browser unless the user explicitly exports it.

## What the Extension Collects

The extension can collect the following information for a user-approved site after the user starts capture:

- request URLs
- request methods, types, status codes, timestamps, and durations
- request body previews when Chrome exposes them to the extension
- heuristic security findings derived from captured request URLs and payloads
- browser, device, screen, network, page, and tab context shown in the inspector

The extension only requests access for sites the user approves. It does not silently collect data for all websites at install time.

## How Data Is Used

Captured data is used only to provide the extension's network inspection features, including request review, performance summaries, security findings, and client-context views for the active inspected session.

## Storage and Retention

- Captured request sessions are stored locally in the extension runtime for the current browser session.
- A local installation identifier is stored in browser extension storage to support stable internal session metadata.
- Site access grants are managed through Chrome's extension permission system and can be removed by the user.

## Sharing and Transmission

The extension does not transmit captured session data, browsing activity, or client context to the developer's servers. Captured data is not shared with third parties by the extension.

## Export

Users can export a captured session as a JSON file. Exported files are created locally by the browser at the user's request. Exported files may contain sensitive data depending on the inspected traffic. Internal identifiers such as installation and tab-instance identifiers are excluded from export.

## Sensitive Data Handling

The extension applies best-effort redaction for sensitive-looking payload fields and token-like values. Redaction is heuristic and may not remove every sensitive value. Users should review exported data carefully before sharing it.

## User Control

Users control when capture starts, when it stops, and whether site access is granted or removed for the current site. If site access is not granted, the extension does not capture requests for that site.

## Contact

Before publishing, replace this section with the developer contact email or support URL that will appear in the Chrome Web Store listing.
