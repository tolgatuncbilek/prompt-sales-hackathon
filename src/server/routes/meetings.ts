import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth.js';
import type { MeetingSummary } from '../../lib/meeting-types.js';

const app = new Hono<{ Variables: AuthVariables }>();
const astroEnv = import.meta.env as Record<string, string | undefined>;

// DeepSeek is OpenAI-compatible. The key stays server-side; the browser only
// ever sends the (locally produced) transcript text.
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const MAX_TRANSCRIPT_CHARS = 24000;

const SYSTEM_PROMPT = `You are an analyst for HMD Secure's commercial team. You are given a raw
transcript of a sales or account meeting. Produce a concise, factual briefing.

Rules:
- Use only information present in the transcript. Never invent names, numbers, commitments, or dates.
- "decisions": concrete decisions or agreements actually reached in the meeting.
- "followUps": action items or things to follow up on after the meeting. Add an "owner" only when the
  transcript clearly attributes the action to a named person; otherwise omit it.
- Keep every item to a single short, operational line.
- If there are no clear decisions or follow-ups, return empty arrays.

Return ONLY valid JSON in exactly this shape:
{
  "summary": "2-4 sentence plain-language summary of the meeting",
  "decisions": ["..."],
  "followUps": [{ "text": "...", "owner": "optional name" }]
}`;

function parseSummary(content: string): MeetingSummary {
  const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(cleaned) as Partial<MeetingSummary>;
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    decisions: Array.isArray(parsed.decisions)
      ? parsed.decisions.filter((d): d is string => typeof d === 'string' && d.trim().length > 0).slice(0, 25)
      : [],
    followUps: Array.isArray(parsed.followUps)
      ? parsed.followUps
          .filter((f) => !!f && typeof f.text === 'string' && f.text.trim().length > 0)
          .map((f) => ({
            text: f.text.trim(),
            owner: typeof f.owner === 'string' && f.owner.trim().length > 0 ? f.owner.trim() : undefined,
          }))
          .slice(0, 25)
      : [],
  };
}

app.post('/summarize', async (c) => {
  const body = await c.req.json<{ transcript?: string }>().catch(() => ({} as { transcript?: string }));
  const transcript = body.transcript?.trim();
  if (!transcript) {
    return c.json({ error: 'transcript is required' }, 400);
  }

  const apiKey = process.env.DEEPSEEK_API || astroEnv.DEEPSEEK_API;
  if (!apiKey) {
    return c.json({ error: 'DeepSeek API is not configured' }, 503);
  }

  const clipped = transcript.length > MAX_TRANSCRIPT_CHARS ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) : transcript;

  let response: Response;
  try {
    response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Meeting transcript:\n\n${clipped}` },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    console.error('DeepSeek request failed', error);
    return c.json({ error: 'Summarization request failed' }, 502);
  }

  if (!response.ok) {
    const providerError = await response.text();
    console.error('DeepSeek error', response.status, providerError.slice(0, 500));
    return c.json({ error: 'Summarization request failed' }, 502);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return c.json({ error: 'Summarizer returned no content' }, 502);
  }

  try {
    return c.json(parseSummary(content));
  } catch (error) {
    console.error('Invalid summary response', error, content.slice(0, 500));
    return c.json({ error: 'Summarizer returned an invalid response' }, 502);
  }
});

export default app;
