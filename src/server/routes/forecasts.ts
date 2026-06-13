import { Hono } from 'hono';
import { eq, sql, desc, asc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { deviceForecasts, deals } from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';
import { writeActivity } from '../lib/helpers.js';

/** Win probability weights by stage */
const STAGE_WEIGHTS: Record<string, number> = {
  interest_shown: 0.1,
  rfi_answered: 0.2,
  rfp_given: 0.4,
  customer_test: 0.6,
  contract_negotiation: 0.8,
  won: 1.0,
  lost: 0.0,
};

const app = new Hono<{ Variables: AuthVariables }>();

/** GET /deals/:dealId/forecasts — list forecast periods for a deal */
app.get('/deals/:dealId/forecasts', async (c) => {
  const dealId = c.req.param('dealId');

  const rows = await db
    .select()
    .from(deviceForecasts)
    .where(eq(deviceForecasts.dealId, dealId))
    .orderBy(asc(deviceForecasts.periodStart));

  return c.json(rows);
});

/** PUT /deals/:dealId/forecasts — upsert forecast rows */
app.put('/deals/:dealId/forecasts', async (c) => {
  const dealId = c.req.param('dealId');
  const user = c.get('user');
  const body = await c.req.json<Array<{
    period_label: string;
    period_start: string;
    period_end: string;
    units: number;
    unit_price: number;
  }>>();

  if (!Array.isArray(body) || body.length === 0) {
    return c.json({ error: 'Body must be a non-empty array of forecast rows', status: 400 }, 400);
  }

  // Verify deal exists and get accountId
  const [deal] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, dealId))
    .limit(1);

  if (!deal) {
    return c.json({ error: 'Deal not found', status: 404 }, 404);
  }

  // Delete existing forecasts for this deal
  await db.delete(deviceForecasts).where(eq(deviceForecasts.dealId, dealId));

  // Insert new forecasts
  const rows = await db
    .insert(deviceForecasts)
    .values(
      body.map((row) => ({
        dealId,
        periodLabel: row.period_label,
        periodStart: new Date(row.period_start),
        periodEnd: new Date(row.period_end),
        units: row.units,
        unitPrice: String(row.unit_price),
      })),
    )
    .returning();

  await writeActivity({
    accountId: deal.accountId,
    actorUserId: user.id,
    entityType: 'deal',
    entityId: dealId,
    eventType: 'forecast_updated',
    payload: { periods: rows.length },
  });

  return c.json(rows);
});

/** GET /pipeline — aggregated weighted pipeline summary */
app.get('/pipeline', async (c) => {
  const allDeals = await db
    .select({
      id: deals.id,
      stage: deals.stage,
      title: deals.title,
    })
    .from(deals);

  // For each deal, get total forecast value
  const pipeline: Record<string, { count: number; raw_value: number; weighted_value: number }> = {};

  for (const deal of allDeals) {
    const weight = STAGE_WEIGHTS[deal.stage] ?? 0;

    const forecasts = await db
      .select({
        total: sql<string>`COALESCE(SUM(${deviceForecasts.units} * ${deviceForecasts.unitPrice}), 0)`,
      })
      .from(deviceForecasts)
      .where(eq(deviceForecasts.dealId, deal.id));

    const rawValue = parseFloat(forecasts[0]?.total ?? '0');

    if (!pipeline[deal.stage]) {
      pipeline[deal.stage] = { count: 0, raw_value: 0, weighted_value: 0 };
    }
    const entry = pipeline[deal.stage]!;
    entry.count += 1;
    entry.raw_value += rawValue;
    entry.weighted_value += rawValue * weight;
  }

  return c.json(pipeline);
});

/** GET /time-phased — aggregate forecasts across all deals by period */
app.get('/time-phased', async (c) => {
  const rows = await db
    .select({
      period_label: deviceForecasts.periodLabel,
      period_start: deviceForecasts.periodStart,
      total_units: sql<string>`SUM(${deviceForecasts.units})`,
      total_device_value: sql<string>`SUM(${deviceForecasts.units} * ${deviceForecasts.unitPrice})`,
    })
    .from(deviceForecasts)
    .groupBy(deviceForecasts.periodLabel, deviceForecasts.periodStart)
    .orderBy(asc(deviceForecasts.periodStart));

  return c.json(rows);
});

export default app;
