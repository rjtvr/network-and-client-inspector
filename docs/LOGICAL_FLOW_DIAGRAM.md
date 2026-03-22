# Logical Flow Diagram

This diagram shows how the extension components interact internally, including popup commands, background processing, tab-scoped session storage, and inspector data retrieval.

```mermaid
flowchart LR
    subgraph UI["User Interface"]
        P["Popup UI"]
        I["Inspector UI"]
    end

    subgraph MSG["Shared Messaging Layer"]
        M["chrome.runtime.sendMessage"]
    end

    subgraph BG["Background Service Worker"]
        B["Background Entry"]
        R["Message Router"]
        W["webRequest Listeners"]
        S["Capture Store"]
        C["Client Context Manager"]
        A["Security Analyzer"]
        PI["Payload Inspection"]
    end

    subgraph CHROME["Chrome APIs"]
        T["tabs API"]
        WR["webRequest API"]
        SL["storage.local"]
        SS["storage.session"]
    end

    P -->|"start/stop + get session"| M
    I -->|"get session + pause/resume + clear"| M
    I -->|"get client context + update runtime snapshot"| M
    M --> R
    B --> R
    B --> W
    B --> C

    R -->|"capture commands"| S
    R -->|"client context commands"| C

    WR --> W
    W -->|"onBeforeRequest"| PI
    PI -->|"sanitized request payload"| S
    W -->|"onCompleted / onErrorOccurred"| S
    S -->|"completed request"| A
    A -->|"findings attached to request"| S

    C --> T
    C --> SL
    C --> SS
    I -->|"browser runtime snapshot"| M
    R --> C

    S -->|"session state response"| R
    C -->|"client context response"| R
    R --> M
    M --> P
    M --> I
```

## Flow Summary

1. The popup and inspector communicate only through the shared runtime messaging layer.
2. The background service worker acts as the central coordinator for session commands and request capture.
3. `chrome.webRequest` events feed into payload inspection and tab-scoped session storage.
4. Completed requests are passed through heuristic security analysis before being stored for the inspector.
5. Client context is assembled from tab metadata, runtime snapshots, and extension storage.
6. The inspector repeatedly fetches session state and client context to present near real-time updates.
