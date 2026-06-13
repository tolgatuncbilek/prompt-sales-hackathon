import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { activities } from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';

const app = new Hono<{ Variables: AuthVariables }>();

/** GET /accounts/:accountId/activities — list activities for account */
app.get('/accounts/:accountId/activities', async (c) => {
  const accountId = c.req.param('accountId');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10);

  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.accountId, accountId))
    .orderBy(desc(activities.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json(rows);
});

/** POST /accounts/:accountId/activities — create a manual activity */
app.post('/accounts/:accountId/activities', async (c) => {
  const accountId = c.req.param('accountId');
  const user = c.get('user');
  const body = await c.req.json();

  const [activity] = await db
    .insert(activities)
    .values({
      accountId,
      actorUserId: user.id,
      entityType: body.entity_type ?? 'account',
      entityId: body.entity_id ?? accountId,
      eventType: body.event_type ?? 'note_added',
      payload: body.payload ?? {},
      isAiGenerated: false,
    })
    .returning();

  if (!activity) {
    return c.json({ error: 'Failed to create activity', status: 500 }, 500);
  }

  return c.json(activity, 201);
});

export default app;
