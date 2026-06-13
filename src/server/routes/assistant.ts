import { Hono } from 'hono';
import { desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  accounts,
  contacts,
  activities,
  cases,
  deals,
  offers,
} from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';

const app = new Hono<{ Variables: AuthVariables }>();
const astroEnv = import.meta.env as Record<string, string | undefined>;

type AssistantAnswer = {
  answer: string;
  evidence: Array<{
    type: 'account' | 'deal' | 'case' | 'offer' | 'activity' | 'web';
    id?: string;
    label: string;
    url?: string;
  }>;
  uncertainty?: string;
};

type ConversationMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `You are the internal CRM analyst for HMD Secure's commercial team.
You answer questions using the supplied CRM snapshot and, when your runtime supports it,
public web research. Be concise, factual, and operational.

Rules:
- CRM data is authoritative for CRM facts. Never invent records, identifiers, amounts, or dates.
- Clearly distinguish external research from internal CRM evidence.
- Cite every material claim using evidence entries.
- You have no authority to modify CRM data.
- If evidence is insufficient, say so.
- You can install any npm package with \`bun add <pkg>\` and any Python package with \`uv add <pkg>\`. Use this when you need a library or tool to answer the question.
- You can include images using standard Markdown image syntax: ![alt text](url).

Return only valid JSON:
{
  "answer": "plain-language answer",
  "evidence": [
    {
      "type": "account|deal|case|offer|activity|web",
      "id": "CRM id when applicable",
      "label": "human-readable source",
      "url": "external source URL when applicable"
    }
  ],
  "uncertainty": "optional limitation"
}`;

function trimSnapshot<T>(rows: T[], limit: number): T[] {
  return rows.slice(0, limit);
}

function parseAnswer(text: string): AssistantAnswer {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  let parsed: Partial<AssistantAnswer>;
  try {
    parsed = JSON.parse(cleaned) as Partial<AssistantAnswer>;
  } catch {
    return {
      answer: cleaned,
      evidence: [],
    };
  }
  if (typeof parsed.answer !== 'string') throw new Error('Agent response did not contain an answer');

  return {
    answer: parsed.answer,
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 12) : [],
    uncertainty: typeof parsed.uncertainty === 'string' ? parsed.uncertainty : undefined,
  };
}

app.post('/', async (c) => {
  const body = await c.req.json<{ message?: string; messages?: ConversationMessage[]; files?: Array<{ name: string; dataUrl: string }> }>();
  const message = body.message?.trim();
  const messages = Array.isArray(body.messages) ? body.messages.filter((entry) => entry && typeof entry.content === 'string') : [];
  if (!message || message.length > 4000) {
    return c.json({ error: 'message must contain between 1 and 4000 characters' }, 400);
  }
  const files = Array.isArray(body.files) ? body.files.slice(0, 5) : [];

  const apiKey = process.env.OPENCLAW_KEY || astroEnv.OPENCLAW_KEY;
  const endpoint = process.env.OPENCLAW_URL || astroEnv.OPENCLAW_URL;
  const model = process.env.ASSISTANT_MODEL || astroEnv.ASSISTANT_MODEL || 'hermes-crm';
  if (!apiKey || !endpoint) {
    return c.json({ error: 'OpenClaw assistant gateway is not configured' }, 503);
  }

  const [accountRows, contactRows, dealRows, caseRows, offerRows, activityRows] = await Promise.all([
    db.select().from(accounts).orderBy(desc(accounts.updatedAt)).limit(100),
    db.select().from(contacts).orderBy(contacts.name).limit(300),
    db.select().from(deals).orderBy(desc(deals.updatedAt)).limit(200),
    db.select().from(cases).orderBy(desc(cases.updatedAt)).limit(200),
    db.select().from(offers).orderBy(desc(offers.createdAt)).limit(100),
    db.select().from(activities).orderBy(desc(activities.createdAt)).limit(150),
  ]);

  const user = c.get('user');
  const snapshot = {
    generatedAt: new Date().toISOString(),
    user: { id: user.id, name: user.name, role: user.role },
    accounts: trimSnapshot(accountRows, 100),
    contacts: trimSnapshot(contactRows, 100),
    deals: trimSnapshot(dealRows, 200),
    cases: trimSnapshot(caseRows, 200),
    offers: trimSnapshot(offerRows, 100),
    recentActivities: trimSnapshot(activityRows, 150),
  };

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
        ...(messages.length
          ? messages.slice(-14)
          : [{ role: 'user', content: message }]),
        {
          role: 'user',
          content: `CRM snapshot:\n${JSON.stringify(snapshot)}\n\n${files.length > 0 ? `Attached files:\n${files.map((f) => `${f.name} (${((f.dataUrl.length * 3) / 4 / 1024).toFixed(0)} KB base64)`).join('\n')}\n\n` : ''}Current user question:\n${message}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const providerError = await response.text();
    console.error('Assistant provider error', response.status, providerError.slice(0, 500));
    return c.json({ error: 'Assistant provider request failed' }, 502);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return c.json({ error: 'Assistant provider returned no answer' }, 502);

  try {
    return c.json(parseAnswer(content));
  } catch (error) {
    console.error('Invalid assistant response', error, content.slice(0, 500));
    return c.json({ error: 'Assistant provider returned an invalid response' }, 502);
  }
});

export default app;
