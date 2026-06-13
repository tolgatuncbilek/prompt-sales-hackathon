import { Hono } from 'hono';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  agentRuns,
  aiInsights,
  activities,
  accounts,
  contacts,
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
      result.next_action.suggested_email_draft,
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

/** POST /email — webhook receiver for inbound/outbound emails */
app.post('/email', async (c) => {
  // Validate EMAIL_WEBHOOK_ENABLED
  if (process.env.EMAIL_WEBHOOK_ENABLED === 'false') {
    return c.json({ error: 'Webhook disabled', status: 400 }, 400);
  }

  // Validate shared secret token (EMAIL_WEBHOOK_SECRET)
  const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;
  const requestSecret = c.req.header('x-email-webhook-secret') ||
                        c.req.header('authorization')?.replace('Bearer ', '') ||
                        c.req.query('secret') ||
                        c.req.query('token');

  if (webhookSecret && requestSecret !== webhookSecret) {
    return c.json({ error: 'Unauthorized', status: 401 }, 401);
  }

  // Handle Microsoft Graph validation request
  const validationToken = c.req.query('validationToken');
  if (validationToken) {
    c.status(200);
    return c.text(validationToken);
  }

  let bodyData: any;
  try {
    bodyData = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload', status: 400 }, 400);
  }

  let emailsToProcess: any[] = [];
  if (bodyData && Array.isArray(bodyData.value)) {
    // This is a Microsoft Graph notification payload structure
    for (const notification of bodyData.value) {
      if (notification.resourceData) {
        emailsToProcess.push({
          from: notification.resourceData.from || 'test@example.com',
          fromName: notification.resourceData.fromName || undefined,
          to: notification.resourceData.to || ['crm@hmdsecure.com'],
          cc: notification.resourceData.cc || [],
          subject: notification.resourceData.subject || 'Microsoft Graph Notification',
          snippet: notification.resourceData.snippet || 'Snippet content',
          messageId: notification.resourceData.id || notification.resourceData.messageId || `msg_${Date.now()}_${Math.random()}`,
        });
      }
    }
  } else if (bodyData) {
    emailsToProcess.push(bodyData);
  }

  if (emailsToProcess.length === 0) {
    return c.json({ error: 'No emails to process', status: 400 }, 400);
  }

  const results = [];

  for (const emailData of emailsToProcess) {
    const { from, fromName, to = [], cc = [], subject, snippet, messageId } = emailData;

    if (!from || !to || !subject || !messageId) {
      results.push({ error: 'Missing required fields: from, to, subject, messageId', status: 400 });
      continue;
    }

    // Deduplication check
    const [existing] = await db
      .select()
      .from(activities)
      .where(sql`${activities.payload}->>'messageId' = ${messageId}`)
      .limit(1);

    if (existing) {
      results.push({ status: 'success', message: 'Email already ingested', activityId: existing.id });
      continue;
    }

    // Match domain to an existing account
    const fromDomain = from.split('@')[1]?.toLowerCase();
    const toDomains = to.map((email: string) => email.split('@')[1]?.toLowerCase()).filter(Boolean);
    const domainsToSearch = [fromDomain, ...toDomains].filter((d: string): d is string => !!d);

    let matchedAccount = null;

    if (domainsToSearch.length > 0) {
      const matchedAccounts = await db
        .select()
        .from(accounts)
        .where(inArray(accounts.domain, domainsToSearch));
      if (matchedAccounts.length > 0) {
        matchedAccount = matchedAccounts[0];
      }
    }

    // Match contact directly if domain matching fails
    if (!matchedAccount) {
      const allEmails = [from, ...to].filter(Boolean);
      if (allEmails.length > 0) {
        const matchedContacts = await db
          .select()
          .from(contacts)
          .where(inArray(contacts.email, allEmails));
        if (matchedContacts.length > 0) {
          const contactAccountId = matchedContacts[0].accountId;
          const [account] = await db
            .select()
            .from(accounts)
            .where(eq(accounts.id, contactAccountId))
            .limit(1);
          if (account) {
            matchedAccount = account;
          }
        }
      }
    }

    if (!matchedAccount) {
      results.push({ error: 'No matching account found for domains/emails', status: 404 });
      continue;
    }

    // Determine eventType (email_received or email_sent)
    let eventType = emailData.eventType || emailData.event_type;
    if (!eventType) {
      const [matchedFromContact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.email, from))
        .limit(1);

      if (matchedFromContact) {
        eventType = 'email_received';
      } else if (matchedAccount && from.split('@')[1]?.toLowerCase() === matchedAccount.domain) {
        eventType = 'email_received';
      } else {
        eventType = 'email_sent';
      }
    }

    // Find contact email for UI linking
    let matchedContactEmail = null;
    const allEmails = [from, ...to].filter(Boolean);
    if (allEmails.length > 0) {
      const matchedContacts = await db
        .select()
        .from(contacts)
        .where(inArray(contacts.email, allEmails));
      if (matchedContacts.length > 0) {
        matchedContactEmail = matchedContacts[0].email;
      }
    }

    // Create unique entityId
    const entityId = crypto.randomUUID();

    const payload = {
      from,
      fromName: fromName || null,
      to,
      cc,
      subject,
      snippet,
      messageId,
      accountId: matchedAccount.id,
      contactEmail: matchedContactEmail,
    };

    const activity = await writeActivity({
      accountId: matchedAccount.id,
      actorUserId: null,
      entityType: 'email',
      entityId,
      eventType,
      payload,
      isAiGenerated: false,
    });

    results.push({ status: 'success', activityId: activity.id });
  }

  // If we only processed one item, return its status directly
  if (results.length === 1) {
    const res = results[0];
    if (res.error) {
      return c.json(res, res.status as any);
    }
    return c.json(res);
  }

  return c.json({ results });
});

/** Helper to write a single insight + activity row */
async function writeInsight(
  agentRunId: string,
  accountId: string,
  insightType: string,
  body: string,
  confidence: number,
  sources: Array<{ url: string; title: string; snippet: string }>,
  draftEmail?: string | null,
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
      draftEmail: draftEmail ?? null,
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
