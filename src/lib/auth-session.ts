import crypto from "crypto";

// Stateless, HMAC-signed session token replacing a bare, unsigned user id
// cookie. The payload (`sub`/`iat`/`exp`) is never trusted on its own -- its
// signature is verified with a constant-time comparison before `sub` is used
// as an identity, and `exp` is checked independently of the cookie's own
// browser-enforced Max-Age (which a raw HTTP client can simply ignore).
//
// This does NOT add server-side session storage: there is no revocation
// list, so a captured token remains valid until it expires even after
// logout or a password change. See the session-hardening task's final
// report for why that tradeoff was chosen over adding a database session
// table in this pass, and what closing it would require.

export const SESSION_COOKIE_NAME = "fhc_session";
export const LEGACY_COOKIE_NAME = "fhc_user_id";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours -- unchanged from the previous cookie's Max-Age

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is not configured (or is too short). Set a random value of at least 32 characters in the environment before issuing sessions.",
    );
  }
  return secret;
}

function sign(payloadEncoded: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payloadEncoded).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const issuedAt = Date.now();
  const payload: SessionPayload = {
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const payloadEncoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

// Returns the authenticated user id, or null if the token is missing,
// malformed, has an invalid signature, or has expired.
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;

  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) return null;

  const payloadEncoded = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  let expectedSignature: string;
  try {
    expectedSignature = sign(payloadEncoded);
  } catch {
    return null;
  }

  const providedBuf = Buffer.from(signature, "base64url");
  const expectedBuf = Buffer.from(expectedSignature, "base64url");
  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.sub !== "string" || !payload.sub) return null;
  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;

  return payload.sub;
}
