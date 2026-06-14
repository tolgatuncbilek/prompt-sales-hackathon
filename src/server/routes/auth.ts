import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import {
  SESSION_COOKIE_NAME,
  signSession,
  verifySession,
} from '../../lib/auth.js';

const auth = new Hono();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** GET /users — list all users (for login picker, no auth required) */
auth.get('/users', async (c) => {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users);
  return c.json(allUsers);
});

/** POST /login — body { userId }, set session cookie */
auth.post('/login', async (c) => {
  const body = await c.req.json<{ userId?: string }>();
  if (!body.userId) {
    return c.json({ error: 'userId is required', status: 400 }, 400);
  }
  if (!UUID_PATTERN.test(body.userId)) {
    return c.json({ error: 'userId must be a valid UUID', status: 400 }, 400);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, body.userId))
    .limit(1);

  if (!user) {
    return c.json({ error: 'User not found', status: 404 }, 404);
  }

  const sessionValue = signSession(user.id);

  setCookie(c, SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

/** POST /logout — clear session cookie */
auth.post('/logout', async (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
  return c.json({ ok: true });
});

/** GET /session — return current session user or 401 */
auth.get('/session', async (c) => {
  const cookie = getCookie(c, SESSION_COOKIE_NAME);
  if (!cookie) {
    return c.json({ error: 'Not authenticated', status: 401 }, 401);
  }

  const userId = verifySession(cookie);
  if (!userId) {
    return c.json({ error: 'Invalid session', status: 401 }, 401);
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: 'User not found', status: 401 }, 401);
  }

  return c.json(user);
});

export default auth;
