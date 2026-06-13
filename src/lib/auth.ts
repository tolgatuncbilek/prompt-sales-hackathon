import { createHmac } from 'crypto';

export const SESSION_COOKIE_NAME = 'hmd_session';

const SEPARATOR = '.';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.warn('WARNING: SESSION_SECRET environment variable is not set. Using fallback secret.');
    return 'fallback-dev-secret-unsafe-change-me-in-production';
  }
  return secret;
}

function hmacSign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

/**
 * Sign a userId into a session cookie value: `userId.signature`
 */
export function signSession(userId: string): string {
  const signature = hmacSign(userId);
  return `${userId}${SEPARATOR}${signature}`;
}

/**
 * Verify a session cookie and return the userId, or null if invalid.
 */
export function verifySession(cookie: string): string | null {
  if (!cookie) return null;

  const sepIndex = cookie.lastIndexOf(SEPARATOR);
  if (sepIndex === -1) return null;

  const userId = cookie.slice(0, sepIndex);
  const signature = cookie.slice(sepIndex + 1);

  if (!userId || !signature) return null;

  const expected = hmacSign(userId);

  // Constant-time comparison
  if (expected.length !== signature.length) return null;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return mismatch === 0 ? userId : null;
}
