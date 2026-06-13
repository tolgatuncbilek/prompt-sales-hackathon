import { Hono } from 'hono';
import { eq, ilike, sql, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { accounts } from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';
import { writeActivity } from '../lib/helpers.js';

const app = new Hono<{ Variables: AuthVariables }>();

/** GET / — list accounts with optional search, pagination */
app.get('/', async (c) => {
  const q = c.req.query('q');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10);

  let query = db.select().from(accounts);

  if (q) {
    query = query.where(ilike(accounts.name, `%${q}%`));
  }

  const rows = await query
    .orderBy(desc(accounts.updatedAt))
    .limit(limit)
    .offset(offset);

  return c.json(rows);
});

/** POST / — create account */
app.post('/', async (c) => {
  const user = c.get('user');
  if (!['sales_rep', 'sales_manager'].includes(user.role)) {
    return c.json({ error: 'Forbidden', status: 403 }, 403);
  }

  const body = await c.req.json();
  const [account] = await db
    .insert(accounts)
    .values({
      name: body.name,
      domain: body.domain ?? null,
      address: body.address ?? null,
      vatId: body.vat_id ?? null,
      industry: body.industry ?? null,
      ownerUserId: body.owner_user_id ?? user.id,
    })
    .returning();

  if (!account) {
    return c.json({ error: 'Failed to create account', status: 500 }, 500);
  }

  await writeActivity({
    accountId: account.id,
    actorUserId: user.id,
    entityType: 'account',
    entityId: account.id,
    eventType: 'account_created',
    payload: { name: account.name },
  });

  return c.json(account, 201);
});

/** GET /:id — get account detail */
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);

  if (!account) {
    return c.json({ error: 'Account not found', status: 404 }, 404);
  }

  return c.json(account);
});

/** PATCH /:id — update account */
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.domain !== undefined) updates.domain = body.domain;
  if (body.address !== undefined) updates.address = body.address;
  if (body.vat_id !== undefined) updates.vatId = body.vat_id;
  if (body.industry !== undefined) updates.industry = body.industry;
  if (body.owner_user_id !== undefined) updates.ownerUserId = body.owner_user_id;
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(accounts)
    .set(updates)
    .where(eq(accounts.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Account not found', status: 404 }, 404);
  }

  return c.json(updated);
});

export default app;
