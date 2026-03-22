import type { RequestBodyCapture, ResponseBodyCapture } from "../shared/types";

const MAX_PREVIEW_LENGTH = 4096;
const SENSITIVE_KEY_PATTERN = /(pass(word|wd|phrase)?|pwd|pin|token|secret|api[_-]?key|auth(orization)?|cookie|session)/i;
const LONG_SECRET_PATTERN = /^(?:[A-Fa-f0-9]{24,}|[A-Za-z0-9_-]{24,}|eyJ[A-Za-z0-9._-]+)$/;

type RequestBodyValue = string | ArrayBuffer;

interface RequestBodyDetails {
  error?: string;
  formData?: Record<string, RequestBodyValue[]>;
  raw?: Array<{
    bytes?: ArrayBuffer | ArrayBufferLike;
  }>;
}

function redactValue(key: string, value: string) {
  if (SENSITIVE_KEY_PATTERN.test(key) || LONG_SECRET_PATTERN.test(value.trim())) {
    return "[REDACTED]";
  }

  return value;
}

function truncatePreview(value: string) {
  if (value.length <= MAX_PREVIEW_LENGTH) {
    return { preview: value, truncated: false };
  }

  return {
    preview: `${value.slice(0, MAX_PREVIEW_LENGTH)}\n...[truncated]`,
    truncated: true
  };
}

function captureUnavailable(message: string): RequestBodyCapture {
  return {
    status: "unavailable",
    contentType: null,
    size: null,
    preview: message,
    parsedEntries: null
  };
}

function captureUnsupportedResponse(): ResponseBodyCapture {
  return {
    status: "unsupported",
    contentType: null,
    size: null,
    preview: "Response body capture is unsupported in the current architecture."
  };
}

function stringifyFormValue(value: RequestBodyValue) {
  return typeof value === "string" ? value : "[binary]";
}

function captureFormData(formData: Record<string, RequestBodyValue[]>): RequestBodyCapture {
  const parsedEntries: Record<string, string> = {};
  let hasRedaction = false;

  for (const [key, values] of Object.entries(formData)) {
    const joinedValue = values.map(stringifyFormValue).join(", ");
    const safeValue = redactValue(key, joinedValue);

    if (safeValue !== joinedValue) {
      hasRedaction = true;
    }

    parsedEntries[key] = safeValue;
  }

  const previewSource = Object.entries(parsedEntries)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const truncatedPreview = truncatePreview(previewSource);

  return {
    status: truncatedPreview.truncated ? "truncated" : hasRedaction ? "redacted" : "captured",
    contentType: "form-data",
    size: previewSource.length,
    preview: truncatedPreview.preview,
    parsedEntries
  };
}

function getRawText(rawEntries: NonNullable<RequestBodyDetails["raw"]>) {
  const chunks: Uint8Array[] = [];

  for (const entry of rawEntries) {
    if (!entry.bytes) {
      continue;
    }

    chunks.push(new Uint8Array(entry.bytes));
  }

  if (chunks.length === 0) {
    return null;
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  try {
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return {
      text: decoded,
      size: bytes.length
    };
  } catch {
    return null;
  }
}

function sanitizeTextPayload(text: string) {
  let hasRedaction = false;
  let parsedEntries: Record<string, string> | null = null;
  let previewSource = text;
  let contentType: string | null = "text/plain";

  try {
    const parsedJson = JSON.parse(text) as Record<string, unknown>;

    if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
      parsedEntries = {};

      for (const [key, value] of Object.entries(parsedJson)) {
        const stringValue = typeof value === "string" ? value : JSON.stringify(value);
        const safeValue = redactValue(key, stringValue);

        if (safeValue !== stringValue) {
          hasRedaction = true;
        }

        parsedEntries[key] = safeValue;
      }

      previewSource = JSON.stringify(parsedEntries, null, 2);
      contentType = "application/json";
    }
  } catch {
    try {
      const params = new URLSearchParams(text);
      const entries = Array.from(params.entries());

      if (entries.length > 0) {
        parsedEntries = {};

        for (const [key, value] of entries) {
          const safeValue = redactValue(key, value);

          if (safeValue !== value) {
            hasRedaction = true;
          }

          parsedEntries[key] = safeValue;
        }

        previewSource = Object.entries(parsedEntries)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");
        contentType = "application/x-www-form-urlencoded";
      }
    } catch {
      previewSource = text;
    }
  }

  const truncatedPreview = truncatePreview(previewSource);

  return {
    status: truncatedPreview.truncated ? "truncated" : hasRedaction ? "redacted" : "captured",
    contentType,
    preview: truncatedPreview.preview,
    parsedEntries
  } as const;
}

export function inspectRequestPayload(requestBody?: RequestBodyDetails): RequestBodyCapture {
  if (!requestBody) {
    return captureUnavailable("Request payload was not exposed by the browser for this request.");
  }

  if (requestBody.error) {
    return captureUnavailable(`Request payload could not be read: ${requestBody.error}`);
  }

  if (requestBody.formData && Object.keys(requestBody.formData).length > 0) {
    return captureFormData(requestBody.formData);
  }

  if (requestBody.raw && requestBody.raw.length > 0) {
    const rawText = getRawText(requestBody.raw);

    if (!rawText) {
      return captureUnavailable("Request payload was present but not available as decodable text.");
    }

    const sanitizedPayload = sanitizeTextPayload(rawText.text);

    return {
      status: sanitizedPayload.status,
      contentType: sanitizedPayload.contentType,
      size: rawText.size,
      preview: sanitizedPayload.preview,
      parsedEntries: sanitizedPayload.parsedEntries
    };
  }

  return captureUnavailable("Request payload was not exposed by the browser for this request.");
}

export function getUnsupportedResponseCapture() {
  return captureUnsupportedResponse();
}
