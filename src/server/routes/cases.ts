import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { cases } from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';
import { writeActivity } from '../lib/helpers.js';

const app = new Hono<{ Variables: AuthVariables }>();

/** GET / — list cases with filters */
app.get('/', async (c) => {
  const status = c.req.query('status');
  const priority = c.req.query('priority');
  const ownerUserId = c.req.query('owner_user_id');
  const accountId = c.req.query('account_id');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10);

  const conditions = [];
  if (status) conditions.push(eq(cases.status, status));
  if (priority) conditions.push(eq(cases.priority, priority));
  if (ownerUserId) conditions.push(eq(cases.ownerUserId, ownerUserId));
  if (accountId) conditions.push(eq(cases.accountId, accountId));

  let query = db.select().from(cases);

  if (conditions.length > 0) {
    query = query.where(
      conditions.length === 1 ? conditions[0]! : and(...conditions),
    );
  }

  const rows = await query
    .orderBy(desc(cases.updatedAt))
    .limit(limit)
    .offset(offset);

  return c.json(rows);
});

/** POST / — create case */
app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const [newCase] = await db
    .insert(cases)
    .values({
      accountId: body.account_id,
      serviceId: body.service_id ?? null,
      ownerUserId: body.owner_user_id ?? user.id,
      contactId: body.contact_id ?? null,
      status: body.status ?? 'open',
      priority: body.priority ?? 'medium',
      escalated: body.escalated ?? false,
      thirdPartyRef: body.third_party_ref ?? null,
      slaDeadline: body.sla_deadline ? new Date(body.sla_deadline) : null,
    })
    .returning();

  if (!newCase) {
    return c.json({ error: 'Failed to create case', status: 500 }, 500);
  }

  await writeActivity({
    accountId: newCase.accountId,
    actorUserId: user.id,
    entityType: 'case',
    entityId: newCase.id,
    eventType: 'case_opened',
    payload: { priority: newCase.priority, status: newCase.status },
  });

  return c.json(newCase, 201);
});

/** GET /:id — get case detail */
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await db
    .select()
    .from(cases)
    .where(eq(cases.id, id))
    .limit(1);

  if (!row) {
    return c.json({ error: 'Case not found', status: 404 }, 404);
  }

  return c.json(row);
});

/** PATCH /:id — update case */
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json();

  const [existing] = await db
    .select()
    .from(cases)
    .where(eq(cases.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: 'Case not found', status: 404 }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.escalated !== undefined) updates.escalated = body.escalated;
  if (body.owner_user_id !== undefined) updates.ownerUserId = body.owner_user_id;
  if (body.third_party_ref !== undefined) updates.thirdPartyRef = body.third_party_ref;
  if (body.sla_deadline !== undefined)
    updates.slaDeadline = body.sla_deadline ? new Date(body.sla_deadline) : null;
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(cases)
    .set(updates)
    .where(eq(cases.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Case not found', status: 404 }, 404);
  }

  // Write activity on status change
  if (body.status !== undefined && body.status !== existing.status) {
    await writeActivity({
      accountId: updated.accountId,
      actorUserId: user.id,
      entityType: 'case',
      entityId: updated.id,
      eventType: 'case_status_changed',
      payload: { from: existing.status, to: updated.status },
    });
  }

  return c.json(updated);
});

export default app;
