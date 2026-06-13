import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  aiInsights,
  agentRuns,
  deals,
  cases,
  accounts,
  users,
} from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';
import { writeActivity, createNotification } from '../lib/helpers.js';
import { generateStubInsights } from '../../lib/ai-stub.js';

const app = new Hono<{ Variables: AuthVariables }>();

/** GET /accounts/:accountId/insights — list insights for account */
app.get('/accounts/:accountId/insights', async (c) => {
  const accountId = c.req.param('accountId');

  const rows = await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.accountId, accountId))
    .orderBy(desc(aiInsights.createdAt));

  return c.json(rows);
});

/** POST /accounts/:accountId/refresh — trigger manual AI enrichment (stub) */
app.post('/accounts/:accountId/refresh', async (c) => {
  const accountId = c.req.param('accountId');
  const user = c.get('user');

  // Load account
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) {
    return c.json({ error: 'Account not found', status: 404 }, 404);
  }

  // Load open deals for this account
  const accountDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.accountId, accountId));

  // Load open cases for this account
  const accountCases = await db
    .select()
    .from(cases)
    .where(eq(cases.accountId, accountId));

  // Create agent run
  const [run] = await db
    .insert(agentRuns)
    .values({
      accountId,
      triggerType: 'manual',
      openclawTaskId: `stub-${Date.now()}`,
      status: 'completed',
      startedAt: new Date(),
      finishedAt: new Date(),
    })
    .returning();

  if (!run) {
    return c.json({ error: 'Failed to create agent run', status: 500 }, 500);
  }

  // Generate stub insights
  const stubInsights = generateStubInsights(account, accountDeals, accountCases);

  // Write insights to DB
  const createdInsights = [];
  for (const stub of stubInsights) {
    const [insight] = await db
      .insert(aiInsights)
      .values({
        agentRunId: run.id,
        accountId,
        dealId: stub.deal_id,
        caseId: stub.case_id,
        insightType: stub.insight_type,
        body: stub.body,
        confidence: String(stub.confidence),
        sources: stub.sources,
        status: 'pending_review',
      })
      .returning();

    if (insight) {
      createdInsights.push(insight);

      // Write activity for each insight
      await writeActivity({
        accountId,
        actorUserId: null,
        entityType: 'ai_insight',
        entityId: insight.id,
        eventType: 'ai_insight_generated',
        payload: {
          insight_type: stub.insight_type,
          confidence: stub.confidence,
        },
        isAiGenerated: true,
      });
    }
  }

  // Notify account owner
  if (account.ownerUserId) {
    await createNotification({
      userId: account.ownerUserId,
      entityType: 'account',
      entityId: accountId,
      body: `AI insights refreshed for ${account.name} (${createdInsights.length} insights generated)`,
    });
  }

  return c.json({
    agent_run_id: run.id,
    insights_created: createdInsights.length,
    insights: createdInsights,
  });
});

/** PATCH /:id — accept or dismiss insight */
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json<{ status?: string }>();

  if (!body.status || !['accepted', 'dismissed'].includes(body.status)) {
    return c.json(
      { error: 'status must be "accepted" or "dismissed"', status: 400 },
      400,
    );
  }

  const [updated] = await db
    .update(aiInsights)
    .set({
      status: body.status,
      reviewedBy: user.id,
      reviewedAt: new Date(),
    })
    .where(eq(aiInsights.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Insight not found', status: 404 }, 404);
  }

  return c.json(updated);
});

export default app;
