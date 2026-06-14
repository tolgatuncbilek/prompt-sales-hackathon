import { Hono } from 'hono';
import { eq, desc, inArray } from 'drizzle-orm';
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
  const mappedDeals = accountDeals.map(d => ({
    id: d.id,
    title: d.title,
    stage: d.stage,
    updated_at: (d as any).updatedAt || null,
    expected_close: (d as any).expectedClose || null
  }));
  const mappedCases = accountCases.map(c => ({
    id: c.id,
    status: c.status,
    priority: c.priority,
    sla_deadline: (c as any).slaDeadline || null
  }));
  const stubInsights = generateStubInsights(account, mappedDeals, mappedCases);

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

const astroEnv = import.meta.env as Record<string, string | undefined>;

const SYSTEM_PROMPT = `You are the AI commercial analyst for HMD Secure's CRM.
Analyze the provided Accounts, their active Deals, and open Cases.
Generate next best actions, enrichment summaries, or risk flags.
For each account, you should try to generate at least one "next_action" (next best action, e.g. email, call, follow-up).
If there is a next_action, you MUST provide:
- A short, actionable headline (1 sentence).
- A detailed body explanation.
- An evidence array with 2-3 specific evidence points.
- A draftEmail template if the action recommends emailing the contact.

Output ONLY a valid JSON object matching this schema:
{
  "insights": [
    {
      "accountId": "UUID of the account",
      "type": "enrichment" | "next_action" | "risk_flag",
      "headline": "headline text",
      "body": "body text",
      "confidence": 0.0..1.0,
      "evidence": ["point 1", "point 2"],
      "sources": [
        { "title": "source title", "detail": "source detail" }
      ],
      "draftEmail": "Hi [Name],\\n\\n..."
    }
  ]
}
`;

app.post('/generate', async (c) => {
  const user = c.get('user');

  // Find all accounts owned by the user
  const userAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.ownerUserId, user.id));

  if (userAccounts.length === 0) {
    return c.json({ insights: [] });
  }

  const accountIds = userAccounts.map(a => a.id);
  const allDeals = await db.select().from(deals).where(inArray(deals.accountId, accountIds));
  const allCases = await db.select().from(cases).where(inArray(cases.accountId, accountIds));

  const apiKey = process.env.OPENCLAW_KEY || astroEnv.OPENCLAW_KEY;
  const endpoint = process.env.OPENCLAW_URL || astroEnv.OPENCLAW_URL;
  const model = process.env.ASSISTANT_MODEL || astroEnv.ASSISTANT_MODEL || 'hermes-crm';

  if (!apiKey || !endpoint) {
    console.warn("OpenClaw credentials missing, falling back to stub generator.");
    const results = [];
    for (const acct of userAccounts) {
      const acctDeals = allDeals.filter(d => d.accountId === acct.id);
      const acctCases = allCases.filter(cs => cs.accountId === acct.id);
      const mappedDeals = acctDeals.map(d => ({
        id: d.id,
        title: d.title,
        stage: d.stage,
        updated_at: (d as any).updatedAt || null,
        expected_close: (d as any).expectedClose || null
      }));
      const mappedCases = acctCases.map(c => ({
        id: c.id,
        status: c.status,
        priority: c.priority,
        sla_deadline: (c as any).slaDeadline || null
      }));
      const stubs = generateStubInsights(acct, mappedDeals, mappedCases);
      for (const s of stubs) {
        const sentences = s.body.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
        const headline = sentences[0] || s.body;
        const evidence = sentences.slice(1);
        results.push({
          id: `local-${crypto.randomUUID()}`,
          accountId: acct.id,
          dealId: s.deal_id,
          caseId: s.case_id,
          type: s.insight_type,
          headline,
          body: s.body,
          confidence: s.confidence,
          evidence,
          sources: s.sources,
          status: 'pending_review'
        });
      }
    }
    return c.json({ insights: results });
  }

  const promptData = {
    accounts: userAccounts.map(a => ({ id: a.id, name: a.name, industry: a.industry, domain: a.domain })),
    deals: allDeals.map(d => ({ id: d.id, accountId: d.accountId, title: d.title, stage: d.stage })),
    cases: allCases.map(cs => ({ id: cs.id, accountId: cs.accountId, title: cs.title, status: cs.status, priority: cs.priority }))
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this CRM data and generate insights:\n${JSON.stringify(promptData)}` }
        ]
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) {
      throw new Error(`OpenClaw responded with status ${response.status}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content returned from OpenClaw");

    const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    const insights = (parsed.insights || []).map((i: any) => ({
      id: `local-${crypto.randomUUID()}`,
      accountId: i.accountId,
      dealId: i.dealId || null,
      caseId: i.caseId || null,
      type: i.type,
      headline: i.headline,
      body: i.body,
      confidence: Number(i.confidence || 0.8),
      evidence: i.evidence || [],
      sources: i.sources || [],
      draftEmail: i.draftEmail || undefined,
      status: 'pending_review'
    }));

    return c.json({ insights });
  } catch (error) {
    console.error("Failed to generate insights via OpenClaw, falling back to stubs:", error);
    const results = [];
    for (const acct of userAccounts) {
      const acctDeals = allDeals.filter(d => d.accountId === acct.id);
      const acctCases = allCases.filter(cs => cs.accountId === acct.id);
      const mappedDeals = acctDeals.map(d => ({
        id: d.id,
        title: d.title,
        stage: d.stage,
        updated_at: (d as any).updatedAt || null,
        expected_close: (d as any).expectedClose || null
      }));
      const mappedCases = acctCases.map(c => ({
        id: c.id,
        status: c.status,
        priority: c.priority,
        sla_deadline: (c as any).slaDeadline || null
      }));
      const stubs = generateStubInsights(acct, mappedDeals, mappedCases);
      for (const s of stubs) {
        const sentences = s.body.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
        const headline = sentences[0] || s.body;
        const evidence = sentences.slice(1);
        results.push({
          id: `local-${crypto.randomUUID()}`,
          accountId: acct.id,
          dealId: s.deal_id,
          caseId: s.case_id,
          type: s.insight_type,
          headline,
          body: s.body,
          confidence: s.confidence,
          evidence,
          sources: s.sources,
          status: 'pending_review'
        });
      }
    }
    return c.json({ insights: results });
  }
});

export default app;
