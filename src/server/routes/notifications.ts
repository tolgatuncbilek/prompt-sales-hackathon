import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { notifications } from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';

const app = new Hono<{ Variables: AuthVariables }>();

/** GET / — list current user's notifications */
app.get('/', async (c) => {
  const user = c.get('user');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10);

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json(rows);
});

/** PATCH /:id/read — mark notification as read */
app.patch('/:id/read', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Notification not found', status: 404 }, 404);
  }

  return c.json(updated);
});

/** POST /mark-all-read — mark all notifications as read for current user */
app.post('/mark-all-read', async (c) => {
  const user = c.get('user');

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(eq(notifications.userId, user.id), eq(notifications.read, false)),
    );

  return c.json({ ok: true });
});

export default app;
