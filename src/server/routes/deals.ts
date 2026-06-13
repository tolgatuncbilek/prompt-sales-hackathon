import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  deals,
  deviceForecasts,
  serviceContracts,
  offers,
} from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';
import { writeActivity } from '../lib/helpers.js';

const app = new Hono<{ Variables: AuthVariables }>();

/** GET / — list deals with filters */
app.get('/', async (c) => {
  const stage = c.req.query('stage');
  const channel = c.req.query('channel');
  const ownerUserId = c.req.query('owner_user_id');
  const accountId = c.req.query('account_id');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10);

  const conditions = [];
  if (stage) conditions.push(eq(deals.stage, stage));
  if (channel) conditions.push(eq(deals.channel, channel));
  if (ownerUserId) conditions.push(eq(deals.ownerUserId, ownerUserId));
  if (accountId) conditions.push(eq(deals.accountId, accountId));

  let query = db.select().from(deals);

  if (conditions.length > 0) {
    query = query.where(
      conditions.length === 1 ? conditions[0]! : and(...conditions),
    );
  }

  const rows = await query
    .orderBy(desc(deals.updatedAt))
    .limit(limit)
    .offset(offset);

  return c.json(rows);
});

/** POST / — create deal */
app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const [deal] = await db
    .insert(deals)
    .values({
      accountId: body.account_id,
      parentDealId: body.parent_deal_id ?? null,
      ownerUserId: body.owner_user_id ?? user.id,
      title: body.title,
      stage: body.stage ?? 'interest_shown',
      channel: body.channel ?? 'direct',
      isPilot: body.is_pilot ?? false,
      expectedClose: body.expected_close ? new Date(body.expected_close) : null,
    })
    .returning();

  if (!deal) {
    return c.json({ error: 'Failed to create deal', status: 500 }, 500);
  }

  await writeActivity({
    accountId: deal.accountId,
    actorUserId: user.id,
    entityType: 'deal',
    entityId: deal.id,
    eventType: 'deal_created',
    payload: { title: deal.title, stage: deal.stage },
  });

  return c.json(deal, 201);
});

/** GET /:id — get deal detail with forecasts, service contracts, offers */
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [deal] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, id))
    .limit(1);

  if (!deal) {
    return c.json({ error: 'Deal not found', status: 404 }, 404);
  }

  const forecasts = await db
    .select()
    .from(deviceForecasts)
    .where(eq(deviceForecasts.dealId, id));

  const contracts = await db
    .select()
    .from(serviceContracts)
    .where(eq(serviceContracts.dealId, id));

  const dealOffers = await db
    .select()
    .from(offers)
    .where(eq(offers.dealId, id))
    .orderBy(desc(offers.createdAt));

  return c.json({
    ...deal,
    forecasts,
    service_contracts: contracts,
    offers: dealOffers,
  });
});

/** PATCH /:id — update deal with business rules */
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json();

  // Fetch current deal
  const [existing] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: 'Deal not found', status: 404 }, 404);
  }

  // Build updates
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.stage !== undefined) updates.stage = body.stage;
  if (body.channel !== undefined) updates.channel = body.channel;
  if (body.is_pilot !== undefined) updates.isPilot = body.is_pilot;
  if (body.expected_close !== undefined)
    updates.expectedClose = body.expected_close
      ? new Date(body.expected_close)
      : null;
  if (body.owner_user_id !== undefined)
    updates.ownerUserId = body.owner_user_id;
  if (body.parent_deal_id !== undefined)
    updates.parentDealId = body.parent_deal_id;

  // Business rule: reseller deals cannot use contract_negotiation
  const newChannel = (updates.channel as string) ?? existing.channel;
  const newStage = (updates.stage as string) ?? existing.stage;
  if (newChannel === 'reseller' && newStage === 'contract_negotiation') {
    return c.json(
      {
        error: 'Reseller deals cannot use contract_negotiation stage',
        status: 400,
      },
      400,
    );
  }

  updates.updatedAt = new Date();

  // Stale flag logic: if updated, clear stale flag
  updates.staleFlaggedAt = null;

  const [updated] = await db
    .update(deals)
    .set(updates)
    .where(eq(deals.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Deal not found', status: 404 }, 404);
  }

  // Write activity on stage change
  if (body.stage !== undefined && body.stage !== existing.stage) {
    await writeActivity({
      accountId: updated.accountId,
      actorUserId: user.id,
      entityType: 'deal',
      entityId: updated.id,
      eventType: 'stage_changed',
      payload: {
        from: existing.stage,
        to: updated.stage,
        title: updated.title,
      },
    });
  }

  return c.json(updated);
});

export default app;
