import type { NetworkRequest, SecurityFinding, SecurityFindingKind, SecurityFindingSeverity } from "../shared/types";

const PASSWORD_KEY_PATTERN = /(pass(word|wd|phrase)?|pwd|pin)/i;
const SECRET_KEY_PATTERN = /(token|secret|api[_-]?key|auth(orization)?|session|bearer|credential)/i;
const JWT_PATTERN = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+$/;
const LONG_SECRET_PATTERN = /^(?:[A-Fa-f0-9]{24,}|[A-Za-z0-9_-]{24,})$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4}){4,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function createFinding(
  requestId: string,
  kind: SecurityFindingKind,
  severity: SecurityFindingSeverity,
  title: string,
  detail: string,
  location: string
): SecurityFinding {
  return {
    id: `${requestId}:${kind}:${location}`,
    requestId,
    kind,
    severity,
    title,
    detail,
    location
  };
}

function isBase64Like(value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue.length < 16 || normalizedValue.length % 4 !== 0) {
    return false;
  }

  if (!BASE64_PATTERN.test(normalizedValue)) {
    return false;
  }

  return /[A-Z]/.test(normalizedValue) && /[a-z]/.test(normalizedValue) && /\d/.test(normalizedValue);
}

function isSecretLikeValue(value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue.length < 16) {
    return false;
  }

  return JWT_PATTERN.test(normalizedValue) || LONG_SECRET_PATTERN.test(normalizedValue);
}

function addUniqueFinding(target: SecurityFinding[], finding: SecurityFinding) {
  if (!target.some((item) => item.id === finding.id)) {
    target.push(finding);
  }
}

function scanQueryParams(request: NetworkRequest, url: URL, findings: SecurityFinding[]) {
  for (const [key, value] of url.searchParams.entries()) {
    const location = `query.${key}`;

    if ((PASSWORD_KEY_PATTERN.test(key) || SECRET_KEY_PATTERN.test(key)) && value.trim().length > 0) {
      addUniqueFinding(
        findings,
        createFinding(
          request.id,
          "password-parameter",
          "high",
          "Sensitive query parameter detected",
          `Query parameter \`${key}\` looks sensitive and is exposed in the request URL.`,
          location
        )
      );
    }

    if (isSecretLikeValue(value) && !PASSWORD_KEY_PATTERN.test(key)) {
      addUniqueFinding(
        findings,
        createFinding(
          request.id,
          "secret-like-value",
          SECRET_KEY_PATTERN.test(key) ? "high" : "medium",
          "Secret-like value detected",
          `Query parameter \`${key}\` contains a token-like value that should not usually appear in a URL.`,
          location
        )
      );
    }

    if (isBase64Like(value)) {
      addUniqueFinding(
        findings,
        createFinding(
          request.id,
          "base64-like-value",
          "medium",
          "Base64-like value detected",
          `Query parameter \`${key}\` contains a base64-like string and may expose encoded sensitive data.`,
          location
        )
      );
    }
  }
}

function scanPathSegments(request: NetworkRequest, url: URL, findings: SecurityFinding[]) {
  const segments = url.pathname.split("/").filter(Boolean);

  segments.forEach((segment, index) => {
    const location = `path.segment.${index + 1}`;

    if (PASSWORD_KEY_PATTERN.test(segment) || SECRET_KEY_PATTERN.test(segment)) {
      addUniqueFinding(
        findings,
        createFinding(
          request.id,
          "secret-like-value",
          "medium",
          "Sensitive-looking path segment detected",
          "A path segment contains password- or token-like text and may expose sensitive routing data.",
          location
        )
      );
    }

    if (isBase64Like(segment)) {
      addUniqueFinding(
        findings,
        createFinding(
          request.id,
          "base64-like-value",
          "medium",
          "Base64-like path segment detected",
          "A path segment contains a base64-like string and may expose encoded data.",
          location
        )
      );
    }
  });
}

export function analyzeRequestSecurity(request: NetworkRequest) {
  const findings: SecurityFinding[] = [];

  if (request.url.startsWith("http://")) {
    addUniqueFinding(
      findings,
      createFinding(
        request.id,
        "insecure-transport",
        "low",
        "Insecure transport detected",
        "This request uses plain HTTP instead of HTTPS and may be observable in transit.",
        "url"
      )
    );
  }

  try {
    const parsedUrl = new URL(request.url);
    scanQueryParams(request, parsedUrl, findings);
    scanPathSegments(request, parsedUrl, findings);
  } catch {
    if (isBase64Like(request.url)) {
      addUniqueFinding(
        findings,
        createFinding(
          request.id,
          "base64-like-value",
          "medium",
          "Base64-like URL detected",
          "The request URL contains a base64-like string and may expose encoded sensitive data.",
          "url"
        )
      );
    }
  }

  return findings;
}
