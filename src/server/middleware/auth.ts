import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { SESSION_COOKIE_NAME, verifySession } from '../../lib/auth.js';

/** The user row type inferred from the schema. */
export type UserSelect = typeof users.$inferSelect;

/** Hono context variables set by the auth middleware. */
export type AuthVariables = {
  user: UserSelect;
};

/**
 * Authentication middleware.
 * Reads session cookie, verifies HMAC, loads user from DB.
 * Sets c.set('user', user) for downstream handlers.
 * Returns 401 if no valid session.
 */
export const authMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const cookie = getCookie(c, SESSION_COOKIE_NAME);
  if (!cookie) {
    return c.json({ error: 'Authentication required', status: 401 }, 401);
  }

  const userId = verifySession(cookie);
  if (!userId) {
    return c.json({ error: 'Invalid session', status: 401 }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: 'User not found', status: 401 }, 401);
  }

  c.set('user', user);
  await next();
});
