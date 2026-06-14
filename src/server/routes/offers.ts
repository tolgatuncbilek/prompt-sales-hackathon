import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  offers,
  offerLines,
  approvalSteps,
  deals,
  users,
} from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';
import { writeActivity, createNotification } from '../lib/helpers.js';

const app = new Hono<{ Variables: AuthVariables }>();

function lineRequiresManagerApproval(lines: { discountPct: string | number }[]): boolean {
  return lines.some((l) => Number(l.discountPct) >= 10);
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** GET /deals/:dealId/offers — list offers for a deal */
app.get('/deals/:dealId/offers', async (c) => {
  const dealId = c.req.param('dealId');
  const rows = await db
    .select()
    .from(offers)
    .where(eq(offers.dealId, dealId))
    .orderBy(desc(offers.createdAt));
  return c.json(rows);
});

/** POST /deals/:dealId/offers — create offer (draft) */
app.post('/deals/:dealId/offers', async (c) => {
  const dealId = c.req.param('dealId');
  const user = c.get('user');
  const body = await c.req.json();

  // Verify deal exists
  const [deal] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, dealId))
    .limit(1);

  if (!deal) {
    return c.json({ error: 'Deal not found', status: 404 }, 404);
  }

  const [offer] = await db
    .insert(offers)
    .values({
      ...(isUuid(body.id) ? { id: body.id } : {}),
      dealId,
      createdBy: user.id,
      version: body.version ?? 1,
      status: 'draft',
      discountPct: body.discount_pct ? String(body.discount_pct) : '0',
      justification: body.justification ?? null,
    })
    .returning();

  if (!offer) {
    return c.json({ error: 'Failed to create offer', status: 500 }, 500);
  }

  return c.json(offer, 201);
});

/** GET /:id — get offer detail with lines and approval steps */
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const [offer] = await db
    .select()
    .from(offers)
    .where(eq(offers.id, id))
    .limit(1);

  if (!offer) {
    return c.json({ error: 'Offer not found', status: 404 }, 404);
  }

  const lines = await db
    .select()
    .from(offerLines)
    .where(eq(offerLines.offerId, id));

  const steps = await db
    .select()
    .from(approvalSteps)
    .where(eq(approvalSteps.offerId, id))
    .orderBy(approvalSteps.stepOrder);

  return c.json({ ...offer, lines, approval_steps: steps });
});

/** PATCH /:id — update offer (only when draft) */
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const [existing] = await db
    .select()
    .from(offers)
    .where(eq(offers.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: 'Offer not found', status: 404 }, 404);
  }

  if (existing.status !== 'draft') {
    return c.json(
      { error: 'Only draft offers can be edited', status: 400 },
      400,
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.version !== undefined) updates.version = body.version;
  if (body.discount_pct !== undefined) updates.discountPct = String(body.discount_pct);
  if (body.justification !== undefined) updates.justification = body.justification;

  const [updated] = await db
    .update(offers)
    .set(updates)
    .where(eq(offers.id, id))
    .returning();

  return c.json(updated);
});

/** PUT /:id/lines — batch upsert offer lines */
app.put('/:id/lines', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<Array<{
    product_id?: string | null;
    service_id?: string | null;
    unit_price: number;
    quantity: number;
    discount_pct?: number;
  }>>();

  if (!Array.isArray(body)) {
    return c.json({ error: 'Body must be an array of line items', status: 400 }, 400);
  }

  const [offer] = await db
    .select()
    .from(offers)
    .where(eq(offers.id, id))
    .limit(1);

  if (!offer) {
    return c.json({ error: 'Offer not found', status: 404 }, 404);
  }

  if (offer.status !== 'draft') {
    return c.json({ error: 'Only draft offers can have lines edited', status: 400 }, 400);
  }

  // Delete existing lines
  await db.delete(offerLines).where(eq(offerLines.offerId, id));

  if (body.length === 0) {
    return c.json([]);
  }

  // Insert new lines
  const rows = await db
    .insert(offerLines)
    .values(
      body.map((line) => ({
        offerId: id,
        productId: line.product_id ?? null,
        serviceId: line.service_id ?? null,
        unitPrice: String(line.unit_price),
        quantity: line.quantity,
        discountPct: line.discount_pct ? String(line.discount_pct) : '0',
      })),
    )
    .returning();

  return c.json(rows);
});

/** POST /:id/submit — submit for approval (3-stage workflow) */
app.post('/:id/submit', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const [offer] = await db
    .select()
    .from(offers)
    .where(eq(offers.id, id))
    .limit(1);

  if (!offer) {
    return c.json({ error: 'Offer not found', status: 404 }, 404);
  }

  if (offer.status !== 'draft') {
    return c.json({ error: 'Only draft offers can be submitted', status: 400 }, 400);
  }

  const lines = await db
    .select()
    .from(offerLines)
    .where(eq(offerLines.offerId, id));

  const requiresManager = lineRequiresManagerApproval(lines);
  const now = new Date();
  const nextStatus = requiresManager ? 'pending_manager' : 'pending_finance';

  await db
    .update(offers)
    .set({ status: nextStatus })
    .where(eq(offers.id, id));

  await db.insert(approvalSteps).values([
    {
      offerId: id,
      stepOrder: 1,
      roleRequired: 'sales_rep',
      decidedBy: user.id,
      decision: 'approved',
      note: null,
      decidedAt: now,
    },
    {
      offerId: id,
      stepOrder: 2,
      roleRequired: 'sales_manager',
      decidedBy: requiresManager ? null : user.id,
      decision: requiresManager ? null : 'approved',
      note: requiresManager ? null : 'Auto-approved — all line discounts below 10%.',
      decidedAt: requiresManager ? null : now,
    },
    {
      offerId: id,
      stepOrder: 3,
      roleRequired: 'finance',
    },
  ]);

  const [deal] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, offer.dealId))
    .limit(1);

  if (deal) {
    await writeActivity({
      accountId: deal.accountId,
      actorUserId: user.id,
      entityType: 'offer',
      entityId: id,
      eventType: 'offer_submitted',
      payload: {
        deal_title: deal.title,
        version: offer.version,
        skip_manager: !requiresManager,
      },
    });

    if (requiresManager) {
      const managers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'sales_manager'));

      for (const mgr of managers) {
        await createNotification({
          userId: mgr.id,
          entityType: 'offer',
          entityId: id,
          body: `Offer v${offer.version} for "${deal.title}" needs your approval`,
        });
      }
    } else {
      const financeUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'finance'));

      for (const fin of financeUsers) {
        await createNotification({
          userId: fin.id,
          entityType: 'offer',
          entityId: id,
          body: `Offer v${offer.version} for "${deal.title}" needs finance approval`,
        });
      }
    }
  }

  return c.json({ status: nextStatus, skip_manager: !requiresManager });
});

/** POST /approval-steps/:stepId/decide — approve or reject */
app.post('/approval-steps/:stepId/decide', async (c) => {
  const stepId = c.req.param('stepId');
  const user = c.get('user');
  const body = await c.req.json<{
    decision: 'approved' | 'rejected';
    note?: string;
  }>();

  if (!body.decision || !['approved', 'rejected'].includes(body.decision)) {
    return c.json(
      { error: 'decision must be "approved" or "rejected"', status: 400 },
      400,
    );
  }

  const [step] = await db
    .select()
    .from(approvalSteps)
    .where(eq(approvalSteps.id, stepId))
    .limit(1);

  if (!step) {
    return c.json({ error: 'Approval step not found', status: 404 }, 404);
  }

  if (step.decision) {
    return c.json({ error: 'Step already decided', status: 409 }, 409);
  }

  if (user.role !== step.roleRequired) {
    return c.json(
      { error: `Requires ${step.roleRequired} role`, status: 403 },
      403,
    );
  }

  await db
    .update(approvalSteps)
    .set({
      decidedBy: user.id,
      decision: body.decision,
      note: body.note ?? null,
      decidedAt: new Date(),
    })
    .where(eq(approvalSteps.id, stepId));

  const [offer] = await db
    .select()
    .from(offers)
    .where(eq(offers.id, step.offerId))
    .limit(1);

  const [deal] = offer
    ? await db.select().from(deals).where(eq(deals.id, offer.dealId)).limit(1)
    : [null];

  const accountId = deal?.accountId;

  if (body.decision === 'rejected') {
    await db
      .update(offers)
      .set({ status: 'draft' })
      .where(eq(offers.id, step.offerId));

    await db.delete(approvalSteps).where(eq(approvalSteps.offerId, step.offerId));

    if (accountId) {
      await writeActivity({
        accountId,
        actorUserId: user.id,
        entityType: 'offer',
        entityId: step.offerId,
        eventType: 'offer_rejected',
        payload: { step_order: step.stepOrder, note: body.note },
      });

      if (offer) {
        await createNotification({
          userId: offer.createdBy,
          entityType: 'offer',
          entityId: step.offerId,
          body: `Your offer was rejected by ${user.name}: ${body.note ?? 'No reason provided'}. Revise and resubmit.`,
        });
      }
    }
  } else if (body.decision === 'approved') {
    if (step.roleRequired === 'sales_manager') {
      await db
        .update(offers)
        .set({ status: 'pending_finance' })
        .where(eq(offers.id, step.offerId));

      const financeUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'finance'));

      for (const fin of financeUsers) {
        await createNotification({
          userId: fin.id,
          entityType: 'offer',
          entityId: step.offerId,
          body: `Offer needs finance approval${deal ? ` for "${deal.title}"` : ''}`,
        });
      }

      if (accountId) {
        await writeActivity({
          accountId,
          actorUserId: user.id,
          entityType: 'offer',
          entityId: step.offerId,
          eventType: 'offer_manager_approved',
          payload: { step_order: step.stepOrder },
        });
      }
    } else if (step.roleRequired === 'finance') {
      const now = new Date();
      await db
        .update(offers)
        .set({ status: 'approved', lockedAt: now })
        .where(eq(offers.id, step.offerId));

      if (accountId) {
        await writeActivity({
          accountId,
          actorUserId: user.id,
          entityType: 'offer',
          entityId: step.offerId,
          eventType: 'offer_approved',
          payload: { step_order: step.stepOrder, locked_at: now.toISOString() },
        });
      }

      if (offer) {
        await createNotification({
          userId: offer.createdBy,
          entityType: 'offer',
          entityId: step.offerId,
          body: 'Your offer has been fully approved and locked',
        });
      }
    }
  }

  return c.json({ decision: body.decision, step_order: step.stepOrder });
});

export default app;
