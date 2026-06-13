import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  agentRuns,
  aiInsights,
  activities,
  accounts,
} from '../../db/schema/index.js';
import { writeActivity, createNotification } from '../lib/helpers.js';

const app = new Hono();

/** POST /openclaw — webhook receiver for OpenClaw */
app.post('/openclaw', async (c) => {
  const body = await c.req.json<{
    task_id: string;
    result?: {
      enrichment?: {
        summary: string;
        recent_news?: string[];
        key_facts?: string[];
        confidence: number;
      };
      next_action?: {
        recommendation: string;
        rationale?: string;
        suggested_email_draft?: string | null;
        confidence: number;
      };
      risk_flags?: Array<{
        flag: string;
        severity: string;
        confidence: number;
      }>;
      sources?: Array<{ url: string; title: string; snippet: string }>;
    };
    error?: string;
  }>();

  if (!body.task_id) {
    return c.json({ error: 'task_id is required', status: 400 }, 400);
  }

  // Find the agent run by OpenClaw task ID
  const [run] = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.openclawTaskId, body.task_id))
    .limit(1);

  if (!run) {
    return c.json({ error: 'Agent run not found', status: 404 }, 404);
  }

  // Handle error
  if (body.error) {
    await db
      .update(agentRuns)
      .set({
        status: 'failed',
        errorMessage: body.error,
        finishedAt: new Date(),
      })
      .where(eq(agentRuns.id, run.id));

    return c.json({ status: 'failed' });
  }

  const result = body.result;
  const sources = result?.sources ?? [];

  // Write enrichment insight
  if (result?.enrichment) {
    await writeInsight(
      run.id,
      run.accountId,
      'enrichment',
      result.enrichment.summary,
      result.enrichment.confidence,
      sources,
    );
  }

  // Write next action
  if (result?.next_action) {
    await writeInsight(
      run.id,
      run.accountId,
      'next_action',
      result.next_action.recommendation,
      result.next_action.confidence,
      sources,
    );
  }

  // Write risk flags
  for (const flag of result?.risk_flags ?? []) {
    await writeInsight(
      run.id,
      run.accountId,
      'risk_flag',
      flag.flag,
      flag.confidence,
      sources,
    );
  }

  // Mark run completed
  await db
    .update(agentRuns)
    .set({ status: 'completed', finishedAt: new Date() })
    .where(eq(agentRuns.id, run.id));

  // Notify account owner
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, run.accountId))
    .limit(1);

  if (account?.ownerUserId) {
    await createNotification({
      userId: account.ownerUserId,
      entityType: 'account',
      entityId: run.accountId,
      body: `AI insights updated for ${account.name}`,
    });
  }

  return c.json({ status: 'completed' });
});

/** Helper to write a single insight + activity row */
async function writeInsight(
  agentRunId: string,
  accountId: string,
  insightType: string,
  body: string,
  confidence: number,
  sources: Array<{ url: string; title: string; snippet: string }>,
) {
  const [insight] = await db
    .insert(aiInsights)
    .values({
      agentRunId,
      accountId,
      insightType,
      body,
      confidence: String(confidence),
      sources,
      status: 'pending_review',
    })
    .returning();

  if (insight) {
    await writeActivity({
      accountId,
      actorUserId: null,
      entityType: 'ai_insight',
      entityId: insight.id,
      eventType: 'ai_insight_generated',
      payload: { insight_type: insightType, confidence },
      isAiGenerated: true,
    });
  }
}

export default app;
