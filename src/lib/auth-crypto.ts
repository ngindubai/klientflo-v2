import crypto from "crypto";

// Pure auth primitives (no Next/Prisma) so they can be unit-tested. Wrapped by
// src/server/auth.ts, which supplies the secret and the clock.

/** Hash a password with scrypt and a random salt → "scrypt:salt:hash". */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

/** Constant-time verify of a password against a stored scrypt hash. */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, salt, 64);
  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}

/** Constant-time string compare (for the legacy shared-password path). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Sign a session token: `userId.expMs.hmac`. */
export function signSession(
  userId: string,
  expMs: number,
  secret: string,
): string {
  const payload = `${userId}.${expMs}`;
  const mac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

/**
 * Verify a session token's signature and expiry. Returns the userId, or null if
 * malformed, tampered, or expired (`now` defaults to Date.now()).
 */
export function verifySession(
  token: string,
  secret: string,
  now: number = Date.now(),
): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, mac] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${userId}.${expStr}`)
    .digest("hex");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return null;
  return userId;
}
