# HMD Secure CRM — Schema B with OpenClaw/Hermes AI Integration

## Overview

Option B schema with explicit service contracts, central activity log, and OpenClaw/Hermes
as the AI backend. OpenClaw is treated as a black box: you POST a task to it, it does
web research and reasoning internally, and returns structured JSON. Your CRM app just
stores the result. No tool-loop plumbing needed on your side.

---

## Core entities (unchanged from Schema B)

### ACCOUNT
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | string | |
| domain | string | Primary seed for OpenClaw enrichment |
| address | string | |
| vat_id | string | |
| industry | string | |
| owner_user_id | uuid FK → USER | |
| created_at | timestamp | |
| updated_at | timestamp | |

### CONTACT
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → ACCOUNT | |
| name | string | |
| email | string | |
| phone | string | |
| role_type | enum | financial_decision_maker, budget_holder, tech_decision_maker, influencer |
| created_at | timestamp | |

### DEAL
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → ACCOUNT | |
| parent_deal_id | uuid FK → DEAL | Nullable — links follow-on to pilot |
| owner_user_id | uuid FK → USER | |
| title | string | |
| stage | enum | interest_shown, rfi_answered, rfp_given, customer_test, contract_negotiation, won, lost |
| channel | enum | direct, reseller |
| is_pilot | boolean | |
| expected_close | date | |
| stale_flagged_at | timestamp | Nullable — set when no update for 14+ days |
| created_at | timestamp | |
| updated_at | timestamp | |

Note: reseller deals skip contract_negotiation — enforce in application logic.

### DEVICE_FORECAST
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| deal_id | uuid FK → DEAL | |
| period_label | string | e.g. "2025-Q1", "2026-Q2" |
| period_start | date | |
| period_end | date | |
| units | integer | Forecasted device count |
| unit_price | decimal | Price at time of forecast |
| created_at | timestamp | |

One row per period per deal. Near-term and 3-year are both rows — filter by period_start range.

### SERVICE_CONTRACT
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| deal_id | uuid FK → DEAL | |
| service_id | uuid FK → SERVICE_CATALOG | |
| invoice_model | enum | one_off, fixed_term, monthly_recurring |
| start_date | date | |
| end_date | date | Nullable for monthly_recurring |
| fixed_value | decimal | For one_off and fixed_term |
| monthly_rate | decimal | For monthly_recurring |
| device_count_trajectory | jsonb | [{month, expected_devices}] for MRR projection |
| created_at | timestamp | |

Service revenue always separate from device revenue. Never aggregate across both without intent.

### SERVICE_CATALOG
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | string | |
| service_type | string | |
| is_third_party | boolean | |
| retired | boolean | Default false |
| created_at | timestamp | |

### PRODUCT_CATALOG
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | string | |
| category | string | |
| list_price | decimal | |
| retired | boolean | Default false |
| updated_at | timestamp | |

### CASE
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → ACCOUNT | |
| service_id | uuid FK → SERVICE_CATALOG | |
| owner_user_id | uuid FK → USER | TAM |
| contact_id | uuid FK → CONTACT | Nullable |
| status | enum | open, in_progress, escalated, resolved, closed |
| priority | enum | low, medium, high, critical |
| escalated | boolean | |
| third_party_ref | string | Nullable |
| sla_deadline | timestamp | Nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### OFFER
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| deal_id | uuid FK → DEAL | |
| created_by | uuid FK → USER | |
| version | integer | Increment on each revision |
| status | enum | draft, pending_manager, pending_finance, approved, rejected, locked |
| discount_pct | decimal | Triggers approval workflow when > 0 |
| justification | text | Required when discount_pct > 0 |
| locked_at | timestamp | Set on final approval — read-only after this |
| created_at | timestamp | |

### OFFER_LINE
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| offer_id | uuid FK → OFFER | |
| product_id | uuid FK → PRODUCT_CATALOG | Nullable |
| service_id | uuid FK → SERVICE_CATALOG | Nullable |
| unit_price | decimal | |
| quantity | integer | |
| discount_pct | decimal | Line-level discount |

### APPROVAL_STEP
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| offer_id | uuid FK → OFFER | |
| step_order | integer | 1 = Sales Manager, 2 = Finance |
| role_required | enum | sales_manager, finance |
| decided_by | uuid FK → USER | Nullable until decided |
| decision | enum | approved, rejected | Nullable until decided |
| note | text | Optional rejection reason |
| decided_at | timestamp | Nullable |

### ACTIVITY
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → ACCOUNT | Always set |
| actor_user_id | uuid FK → USER | Null when written by OpenClaw |
| entity_type | string | account, deal, case, offer, ai_insight |
| entity_id | uuid | FK to the relevant entity |
| event_type | string | stage_changed, note_added, case_opened, ai_insight_generated, offer_approved, etc. |
| payload | jsonb | Diff or summary |
| is_ai_generated | boolean | True when written by OpenClaw |
| created_at | timestamp | |

The account timeline. Every mutation writes one row. OpenClaw writes here too with is_ai_generated = true.

### USER
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| azure_oid | string | Azure AD / Entra ID object ID |
| name | string | |
| email | string | |
| role | enum | sales_rep, tam, sales_manager, finance |
| created_at | timestamp | |

### NOTIFICATION
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → USER | |
| entity_type | string | |
| entity_id | uuid | |
| body | string | Short message |
| read | boolean | Default false |
| created_at | timestamp | |

---

## AI integration — OpenClaw/Hermes as black box

### Design principle

Your CRM never manages the agent loop, tool calls, or web fetching.
That is all OpenClaw/Hermes's problem.
Your CRM does three things:
  1. Assembles context (account, deals, cases, recent activity) into a JSON payload
  2. POSTs it to OpenClaw with a task description
  3. Receives structured JSON back and writes it to AI_INSIGHT + ACTIVITY

OpenClaw handles: web search, reasoning, retries, tool orchestration.
Your CRM handles: triggering, storing results, surfacing them to the user.

### AGENT_RUN
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → ACCOUNT | |
| trigger_type | enum | account_created, domain_updated, stage_changed, stale_flagged, scheduled, manual |
| openclaw_task_id | string | ID returned by OpenClaw on job submission, for polling |
| status | enum | queued, running, completed, failed |
| error_message | text | Nullable |
| started_at | timestamp | |
| finished_at | timestamp | Nullable |

### AI_INSIGHT
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| agent_run_id | uuid FK → AGENT_RUN | |
| account_id | uuid FK → ACCOUNT | |
| deal_id | uuid FK → DEAL | Nullable |
| case_id | uuid FK → CASE | Nullable |
| insight_type | enum | enrichment, next_action, risk_flag, pipeline_summary, offer_draft |
| body | text | Plain language finding or recommendation |
| confidence | decimal | 0.0–1.0, shown as low/med/high in UI |
| sources | jsonb | [{url, title, snippet}] — OpenClaw passes these back |
| status | enum | pending_review, accepted, dismissed |
| reviewed_by | uuid FK → USER | Nullable until rep acts |
| reviewed_at | timestamp | Nullable |
| created_at | timestamp | |

---

## Integration flow

```
Trigger (event or cron)
        |
        v
CRM assembles context payload:
  {
    account: { id, name, domain, industry },
    deals: [ ...open deals with stages and forecast totals ],
    cases: [ ...open cases with priority and age ],
    recent_activity: [ ...last 30 ACTIVITY rows ],
    task: "Research this company and return enrichment, next action, and risk flags."
  }
        |
        v
POST to OpenClaw/Hermes endpoint
  (OpenClaw does: web search, news lookup, reasoning, synthesis)
        |
        v
OpenClaw returns:
  {
    enrichment: {
      summary: "string",
      recent_news: ["string"],
      key_facts: ["string"],
      confidence: 0.0–1.0
    },
    next_action: {
      recommendation: "string",
      rationale: "string",
      suggested_email_draft: "string or null",
      confidence: 0.0–1.0
    },
    risk_flags: [
      { flag: "string", severity: "low|medium|high", confidence: 0.0–1.0 }
    ],
    sources: [
      { url: "string", title: "string", snippet: "string" }
    ]
  }
        |
        v
CRM writes:
  - One AGENT_RUN row (status: completed)
  - One AI_INSIGHT row per insight_type (enrichment, next_action, each risk_flag)
  - One ACTIVITY row per AI_INSIGHT (event_type: ai_insight_generated, is_ai_generated: true)
  - One NOTIFICATION row for the account owner (sales rep)
        |
        v
Account page AI panel shows all AI_INSIGHT rows for this account
Rep reads, accepts, or dismisses each one
```

---

## Trigger types and when they fire

| Trigger | When | Who fires it |
|---|---|---|
| account_created | New account saved | App event hook |
| domain_updated | Domain field changed on account | App event hook |
| stage_changed | Deal moves to new stage | App event hook |
| stale_flagged | Deal hits 14-day no-update threshold | Stale-check cron |
| scheduled | Nightly 02:00 UTC | Cron job |
| manual | Rep clicks "refresh AI insights" button | API call from UI |

---

## Cron jobs (Bun)

### Stale deal checker — runs every 6 hours

```typescript
// jobs/stale-check.ts
const staleDeals = await db.query(`
  UPDATE deal
  SET stale_flagged_at = now()
  WHERE stale_flagged_at IS NULL
    AND updated_at < now() - interval '14 days'
    AND stage NOT IN ('won', 'lost')
  RETURNING id, account_id
`);

for (const deal of staleDeals) {
  await triggerOpenClaw(deal.account_id, "stale_flagged");
  await createNotification(deal.owner_user_id, "Deal stale — AI refreshing insights");
}
```

### Nightly enrichment — runs at 02:00 UTC

```typescript
// jobs/nightly-enrich.ts
const accounts = await db.query(`
  SELECT a.id FROM account a
  WHERE NOT EXISTS (
    SELECT 1 FROM agent_run ar
    WHERE ar.account_id = a.id
      AND ar.status = 'completed'
      AND ar.finished_at > now() - interval '20 hours'
  )
`);

for (const account of accounts) {
  await triggerOpenClaw(account.id, "scheduled");
}
```

### triggerOpenClaw helper

```typescript
// lib/openclaw.ts
export async function triggerOpenClaw(accountId: string, triggerType: string) {
  const context = await assembleContext(accountId); // pulls account, deals, cases, activity

  const run = await db.insertInto("agent_run").values({
    account_id: accountId,
    trigger_type: triggerType,
    status: "queued",
    started_at: new Date(),
  }).returning("id").executeTakeFirst();

  const response = await fetch(process.env.OPENCLAW_URL + "/task", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENCLAW_KEY}` },
    body: JSON.stringify({
      task_id: run.id,        // OpenClaw echoes this back so you can match the response
      context,
      output_schema: "crm_enrichment_v1",  // tells OpenClaw which output format to use
    }),
  });

  const { task_id } = await response.json();

  await db.updateTable("agent_run")
    .set({ openclaw_task_id: task_id, status: "running" })
    .where("id", "=", run.id)
    .execute();
}
```

### Webhook receiver — OpenClaw calls this when done

```typescript
// routes/webhooks/openclaw.ts
app.post("/webhooks/openclaw", async (req) => {
  const { task_id, result, error } = req.body;

  const run = await db.selectFrom("agent_run")
    .where("openclaw_task_id", "=", task_id)
    .selectAll().executeTakeFirst();

  if (error) {
    await db.updateTable("agent_run")
      .set({ status: "failed", error_message: error, finished_at: new Date() })
      .where("id", "=", run.id).execute();
    return;
  }

  // Write enrichment insight
  if (result.enrichment) {
    await writeInsight(run, "enrichment", result.enrichment.summary, result.enrichment.confidence, result.sources);
  }

  // Write next action
  if (result.next_action) {
    await writeInsight(run, "next_action", result.next_action.recommendation, result.next_action.confidence, result.sources);
  }

  // Write risk flags
  for (const flag of result.risk_flags ?? []) {
    await writeInsight(run, "risk_flag", flag.flag, flag.confidence, result.sources);
  }

  await db.updateTable("agent_run")
    .set({ status: "completed", finished_at: new Date() })
    .where("id", "=", run.id).execute();

  // Notify the account owner
  const account = await db.selectFrom("account").where("id", "=", run.account_id).selectAll().executeTakeFirst();
  await createNotification(account.owner_user_id, "account", run.account_id, "AI insights updated for " + account.name);
});

async function writeInsight(run, type, body, confidence, sources) {
  const insight = await db.insertInto("ai_insight").values({
    agent_run_id: run.id,
    account_id: run.account_id,
    insight_type: type,
    body,
    confidence,
    sources: JSON.stringify(sources),
    status: "pending_review",
    created_at: new Date(),
  }).returning("id").executeTakeFirst();

  // Mirror to activity timeline
  await db.insertInto("activity").values({
    account_id: run.account_id,
    actor_user_id: null,
    entity_type: "ai_insight",
    entity_id: insight.id,
    event_type: "ai_insight_generated",
    payload: JSON.stringify({ insight_type: type, confidence }),
    is_ai_generated: true,
    created_at: new Date(),
  }).execute();
}
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/accounts/:id/refresh-insights | Rep triggers manual enrichment |
| GET | /api/accounts/:id/insights | All AI_INSIGHT rows for account |
| PATCH | /api/insights/:id | Rep sets status to accepted or dismissed |
| POST | /webhooks/openclaw | OpenClaw calls this when a task finishes |

---

## Role-based access summary

| Role | Can see | Can edit |
|---|---|---|
| sales_rep | Own accounts, deals, cases, AI insights | Deals, notes, offers (own) |
| tam | Assigned cases, account timeline | Cases, notes |
| sales_manager | All accounts, deals, cases | Reassign, approve offers |
| finance | All deals (read), forecasts, catalogs | Pricing catalog, service catalog, offer approval |

---

## Key business rules

1. Reseller deals: reject stage = contract_negotiation when channel = reseller.
2. Stale deals: stale_flagged_at set when updated_at < now() - 14 days and stage not in (won, lost).
3. Offer locking: locked_at set on final APPROVAL_STEP approval. All OFFER fields read-only after.
4. Service revenue separation: DEVICE_FORECAST and SERVICE_CONTRACT never summed without explicit grouping.
5. AI insights are suggestions only: no AI_INSIGHT row modifies any other table. Reps act manually.
6. Activity log completeness: every state change writes an ACTIVITY row. Gaps break the timeline.
7. OpenClaw is fire-and-forget: CRM posts context, receives webhook, stores result. No polling loops.

