import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ROLE_LABEL,
  STAGE_META,
  CASE_STATUS_LABEL,
  PRIORITY_LABEL,
  PRIORITY_RANK,
  CONTACT_ROLE_LABEL,
  OFFER_STATUS_LABEL,
  INVOICE_MODEL_LABEL,
  PERIODS,
  NEXT_QUARTER,
  periodLabel,
  periodYear,
  pipelineStages,
  users,
  accounts,
  products,
  services,
  deals as seedDeals,
  cases as seedCases,
  offers as seedOffers,
  aiInsights as seedInsights,
  notifications as seedNotifications,
  serviceContracts,
  userById,
  userName,
  accountById,
  dealById,
  serviceById,
  contactById,
  contactsForAccount,
  dealsForAccount,
  casesForAccount,
  offersForAccount,
  activityForAccount,
  insightsForAccount,
  serviceContractsForDeal,
  offerForDeal,
  isOpen,
  inForecast,
  isStale,
  isOverdue,
  dealRisk,
  deviceTotal,
  deviceUnits,
  serviceTotal,
  dealTotal,
  weightedTotal,
  probability,
  nextQuarterValue,
  fmtEur,
  fmtEurExact,
  confidenceLabel,
  slaState,
  caseAgeDays,
  daysSinceUpdate,
  offerList,
  offerNet,
  lineNet,
  forecastByPeriod,
  rollUp,
  sumRows,
  TIERS,
  STATUSES,
  OPEN_STATUSES,
  MEASURE_LABEL,
  deviceGmPerUnit,
  accountCountry,
  periodBuckets,
  bucketSum,
  dealMeasureTotal,
  tierSeries,
  streamSeries,
  regionSeries,
  forecastTotal,
  weightedForecast,
  securedForecast,
  initCrmFromApi,
} from "../lib/crm.ts";
import type {
  Account,
  AiInsight,
  CaseRecord,
  CaseNote,
  Deal,
  Granularity,
  Measure,
  Offer,
  Role,
  Series,
  Stage,
  User,
} from "../lib/crm.ts";

// ===========================================================================
// Icons
// ===========================================================================

const ICONS: Record<string, ReactNode> = {
  home: <path d="M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5" />,
  accounts: (<><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.5M17 14a5 5 0 0 1 3.5 4.8V20" /></>),
  deals: (<><path d="M4 7h16v12H4zM8 7V4h8v3M4 12h16" /><path d="M10 12v2h4v-2" /></>),
  cases: (<><path d="M5 4h10l4 4v12H5z" /><path d="M14 4v5h5M8 13h8M8 17h5" /></>),
  offers: (<><path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h4" /></>),
  forecast: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  catalog: (<><path d="M4 7h16v13H4zM4 7l2-3h12l2 3M9 11h6" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  table: (<><path d="M4 5h16v14H4zM4 10h16M4 15h16M10 5v14" /></>),
  board: (<><path d="M4 5h6v14H4zM14 5h6v9h-6z" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  spark: (<><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4z" /><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" /></>),
  chevron: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  back: <path d="m14 6-6 6 6 6M8 12h12" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  mail: (<><path d="M3 6h18v12H3z" /><path d="m3 7 9 6 9-6" /></>),
  phone: <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5V18a2 2 0 0 1-2 2A14 14 0 0 1 4 6a2 2 0 0 1 1-2z" />,
  clock: (<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>),
  check: <path d="m5 12 4 4 10-10" />,
  bell: <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0" />,
  alert: (<><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></>),
  lock: (<><path d="M6 11h12v9H6z" /><path d="M9 11V8a3 3 0 0 1 6 0v3" /></>),
  download: <path d="M12 4v10m-4-3 4 4 4-4M5 20h14" />,
  arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
  grip: (<><circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" /></>),
  link: <path d="M9 15 15 9M10 7l1-1a4 4 0 0 1 6 6l-1 1M14 17l-1 1a4 4 0 0 1-6-6l1-1" />,
  swap: <path d="M7 7h11l-3-3m3 3-3 3M17 17H6l3-3m-3 3 3 3" />,
};

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={className ? `icon ${className}` : "icon"} viewBox="0 0 24 24">
      {ICONS[name]}
    </svg>
  );
}

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function monogram(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ===========================================================================
// Shared presentational components
// ===========================================================================

function Avatar({ name, size }: { name: string; size?: "xs" | "sm" }) {
  return <span className={cx("avatar", size === "xs" && "avatar--xs")} aria-hidden="true">{monogram(name)}</span>;
}

function StatusTag({ stage }: { stage: Stage }) {
  return (
    <span className={`status-tag status-tag--${stage}`} title={STAGE_META[stage].label}>
      <span className="status-dot" aria-hidden="true" />
      {STAGE_META[stage].short}
    </span>
  );
}

function RiskTag({ deal }: { deal: Deal }) {
  const risk = dealRisk(deal);
  return (
    <span className={`risk risk--${risk.level}`} title={risk.detail}>
      <span className="risk-dot" aria-hidden="true" />
      {risk.label}
    </span>
  );
}

function PriorityTag({ priority }: { priority: CaseRecord["priority"] }) {
  return <span className={`prio prio--${priority}`}>{PRIORITY_LABEL[priority]}</span>;
}

function StatusPill({ status }: { status: CaseRecord["status"] }) {
  return <span className={`pill pill--${status}`}>{CASE_STATUS_LABEL[status]}</span>;
}

function OfferPill({ status }: { status: Offer["status"] }) {
  return <span className={`pill pill--offer-${status}`}>{OFFER_STATUS_LABEL[status]}</span>;
}

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <span className="confidence" title={`${pct}% model confidence`}>
      <span className="confidence-track" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      {confidenceLabel(value)}
    </span>
  );
}

function Kpi({ label, value, tone, hint }: { label: string; value: ReactNode; tone?: "warn" | "danger" | "good"; hint?: string }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <strong className={cx("kpi-value", tone === "warn" && "t-warn", tone === "danger" && "t-danger", tone === "good" && "t-good")}>{value}</strong>
      {hint && <small className="kpi-hint">{hint}</small>}
    </div>
  );
}

function SectionHead({ title, count, children }: { title: string; count?: ReactNode; children?: ReactNode }) {
  return (
    <div className="section-head">
      <h2>{title}{count !== undefined && <span className="section-count">{count}</span>}</h2>
      {children && <div className="section-head-actions">{children}</div>}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

// Mini stacked device/service phasing bars ---------------------------------

function PhasingBars({ rows, max }: { rows: { label: string; device: number; service: number }[]; max: number }) {
  return (
    <div className="phasing" aria-label="Revenue phasing, device versus service">
      {rows.map((r) => (
        <div className="phasing-row" key={r.label}>
          <span className="phasing-label">{r.label}</span>
          <span className="phasing-bar" aria-hidden="true">
            <span className="phasing-device" style={{ width: `${(r.device / max) * 100}%` }} />
            <span className="phasing-service" style={{ width: `${(r.service / max) * 100}%` }} />
          </span>
          <strong className="phasing-value">{fmtEur(r.device + r.service)}</strong>
        </div>
      ))}
      <div className="phasing-legend">
        <span><i className="swatch swatch--device" />Device</span>
        <span><i className="swatch swatch--service" />Service</span>
      </div>
    </div>
  );
}

// ===========================================================================
// AI insight card (Clay-style: input → output, provenance, review)
// ===========================================================================

function InsightCard({
  insight,
  status,
  onAccept,
  onDismiss,
}: {
  insight: AiInsight;
  status: AiInsight["status"];
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const [showEmail, setShowEmail] = useState(false);
  const typeLabel =
    insight.type === "risk_flag" ? "AI risk flag"
    : insight.type === "enrichment" ? "AI enrichment"
    : insight.type === "next_action" ? "AI next best action"
    : insight.type === "pipeline_summary" ? "AI pipeline summary"
    : "AI offer draft";

  return (
    <article className={cx("insight", insight.type === "risk_flag" && "insight--risk", status !== "pending_review" && "insight--resolved")}>
      <div className="insight-top">
        <span className="insight-kind"><Icon name="spark" />{typeLabel}</span>
        <span className={cx("insight-state", status === "accepted" && "is-accepted", status === "dismissed" && "is-dismissed")}>
          {status === "pending_review" ? "Needs review" : status === "accepted" ? "Accepted" : "Dismissed"}
        </span>
      </div>
      <h3 className="insight-headline">{insight.headline}</h3>
      <p className="insight-body">{insight.body}</p>

      <details className="insight-evidence" open>
        <summary>Evidence used · {insight.evidence.length}</summary>
        <ul>{insight.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
        <div className="insight-sources">
          {insight.sources.map((s) => (
            <span className="source-chip" key={s.title}><Icon name="link" /><strong>{s.title}</strong> — {s.detail}</span>
          ))}
        </div>
      </details>

      <div className="insight-meta">
        <Confidence value={insight.confidence} />
        <span className="insight-note">AI-generated · no CRM data changes until you act</span>
      </div>

      {insight.draftEmail && (
        <div className="insight-draft">
          <button className="ghost-link" onClick={() => setShowEmail((v) => !v)} type="button" aria-expanded={showEmail}>
            <Icon name="mail" />{showEmail ? "Hide draft email" : "View draft email"}
          </button>
          {showEmail && <pre className="draft-email">{insight.draftEmail}</pre>}
        </div>
      )}

      {status === "pending_review" && (
        <div className="insight-actions">
          <button className="btn btn--primary btn--sm" onClick={onAccept} type="button">
            {insight.type === "next_action" ? "Accept as task" : "Accept"}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={onDismiss} type="button">Dismiss</button>
        </div>
      )}
    </article>
  );
}

// ===========================================================================
// Shared types for app state
// ===========================================================================

type Screen = "home" | "accounts" | "account" | "deals" | "cases" | "offers" | "forecast" | "catalog";
type Toast = { id: number; msg: string } | null;

type AppCtx = {
  user: User;
  go: (screen: Screen) => void;
  openAccount: (id: string) => void;
  openOffers: (id?: string) => void;
  openCase: (id: string) => void;
  notify: (msg: string) => void;
  // mutable state
  dealStage: Record<string, Stage>;
  moveDeal: (id: string, stage: Stage) => void;
  offerState: Record<string, Offer>;
  decideOffer: (offerId: string, decision: "approved" | "rejected", note?: string) => void;
  insightStatus: Record<string, AiInsight["status"]>;
  setInsight: (id: string, status: AiInsight["status"]) => void;
  caseNotes: Record<string, CaseNote[]>;
  addNote: (caseId: string, note: CaseNote) => void;
};

function liveStage(ctx: AppCtx, deal: Deal): Deal {
  const s = ctx.dealStage[deal.id];
  return s ? { ...deal, stage: s } : deal;
}

// ===========================================================================
// Dashboards (per role)
// ===========================================================================

function RepDashboard({ ctx }: { ctx: AppCtx }) {
  const myAccounts = accounts.filter((a) => a.ownerId === ctx.user.id);
  const myDeals = seedDeals.map((d) => liveStage(ctx, d)).filter((d) => d.ownerId === ctx.user.id && isOpen(d));
  const attention = myDeals.filter((d) => isStale(d) || isOverdue(d));
  const openPipeline = myDeals.reduce((s, d) => s + dealTotal(d), 0);
  const weightedNext = myDeals.reduce((s, d) => s + nextQuarterValue(d) * probability(d.stage), 0);
  const myOffers = seedOffers.map((o) => ctx.offerState[o.id] ?? o).filter((o) => o.createdById === ctx.user.id);
  const pendingOffers = myOffers.filter((o) => o.status === "pending_manager" || o.status === "pending_finance");
  const myInsights = seedInsights
    .filter((i) => myAccounts.some((a) => a.id === i.accountId) && i.type !== "enrichment")
    .filter((i) => (ctx.insightStatus[i.id] ?? i.status) === "pending_review");

  return (
    <>
      <div className="kpi-strip">
        <Kpi label="My open pipeline" value={fmtEur(openPipeline)} hint={`${myDeals.length} open deals`} />
        <Kpi label="Weighted, next quarter" value={fmtEur(weightedNext)} hint={periodLabel(NEXT_QUARTER)} />
        <Kpi label="Need attention" value={`${attention.length}`} tone={attention.length ? "warn" : undefined} hint="Stalled or overdue" />
        <Kpi label="Offers in approval" value={`${pendingOffers.length}`} hint="Awaiting sign-off" />
      </div>

      <div className="grid-2">
        <section>
          <SectionHead title="Deals needing attention" count={attention.length} />
          {attention.length ? (
            <ul className="stack-list">
              {attention.map((d) => {
                const acc = accountById(d.accountId)!;
                return (
                  <li key={d.id}>
                    <button className="row-main" onClick={() => ctx.openAccount(d.accountId)} type="button">
                      <span className="account-logo sm" aria-hidden="true">{monogram(acc.name)}</span>
                      <span>
                        <strong>{d.title}</strong>
                        <small>{acc.name} · {STAGE_META[d.stage].label}</small>
                      </span>
                    </button>
                    <span className="row-side"><strong className="numeric">{fmtEur(dealTotal(d))}</strong><RiskTag deal={d} /></span>
                  </li>
                );
              })}
            </ul>
          ) : <Empty>Nothing stalled or overdue. Good place to be.</Empty>}

          <div className="spacer" />
          <SectionHead title="My offers" count={myOffers.length} />
          <ul className="stack-list">
            {myOffers.map((o) => {
              const deal = dealById(o.dealId)!;
              return (
                <li key={o.id}>
                  <button className="row-main" onClick={() => ctx.openOffers(o.id)} type="button">
                    <span><strong>{o.ref} · {deal.title}</strong><small>v{o.version} · {o.discountPct > 0 ? `${o.discountPct}% discount` : "list price"}</small></span>
                  </button>
                  <span className="row-side"><strong className="numeric">{fmtEur(offerNet(o))}</strong><OfferPill status={o.status} /></span>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <SectionHead title="AI next best actions" count={myInsights.length}>
            <button className="ghost-link" onClick={() => ctx.notify("AI insights refreshed across your accounts.")} type="button"><Icon name="spark" />Refresh</button>
          </SectionHead>
          {myInsights.length ? (
            <div className="insight-stack">
              {myInsights.map((i) => (
                <InsightCard
                  key={i.id}
                  insight={i}
                  status={ctx.insightStatus[i.id] ?? i.status}
                  onAccept={() => { ctx.setInsight(i.id, "accepted"); ctx.notify("Accepted as a task. No CRM data changed automatically."); }}
                  onDismiss={() => { ctx.setInsight(i.id, "dismissed"); ctx.notify("Dismissed."); }}
                />
              ))}
            </div>
          ) : <Empty>All AI suggestions reviewed.</Empty>}
        </section>
      </div>
    </>
  );
}

function TamDashboard({ ctx }: { ctx: AppCtx }) {
  const myCases = seedCases.filter((c) => c.ownerId === ctx.user.id);
  const open = myCases.filter((c) => c.status !== "resolved" && c.status !== "closed");
  const sorted = [...open].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || caseAgeDays(b) - caseAgeDays(a));
  const breaching = open.filter((c) => slaState(c).state === "breached" || slaState(c).state === "due_soon");
  const escalated = open.filter((c) => c.escalated);

  return (
    <>
      <div className="kpi-strip">
        <Kpi label="My open cases" value={`${open.length}`} hint={`${myCases.length} total assigned`} />
        <Kpi label="Critical / high" value={`${open.filter((c) => c.priority === "critical" || c.priority === "high").length}`} tone="warn" />
        <Kpi label="SLA at risk" value={`${breaching.length}`} tone={breaching.length ? "danger" : undefined} hint="Breached or due ≤2d" />
        <Kpi label="Escalated to third party" value={`${escalated.length}`} hint="Awaiting provider" />
      </div>
      <SectionHead title="Cases by priority and age" count={open.length}>
        <button className="ghost-link" onClick={() => ctx.go("cases")} type="button">All cases<Icon name="chevron" /></button>
      </SectionHead>
      <CaseTable cases={sorted} ctx={ctx} />
    </>
  );
}

function ManagerDashboard({ ctx }: { ctx: AppCtx }) {
  const all = seedDeals.map((d) => liveStage(ctx, d)).filter(isOpen);
  const open = all.reduce((s, d) => s + dealTotal(d), 0);
  const weighted = all.reduce((s, d) => s + weightedTotal(d), 0);
  const atRisk = all.filter((d) => isStale(d) || isOverdue(d));
  const atRiskValue = atRisk.reduce((s, d) => s + dealTotal(d), 0);
  const target = 6_000_000;
  const stages = OPEN_STATUSES;
  const pendingApprovals = seedOffers.map((o) => ctx.offerState[o.id] ?? o).filter((o) => o.status === "pending_manager");

  return (
    <>
      <div className="kpi-strip">
        <Kpi label="Team open pipeline" value={fmtEur(open)} hint={`${all.length} open deals`} />
        <Kpi label="Weighted forecast" value={fmtEur(weighted)} hint="All stages, all owners" />
        <Kpi label="At-risk value" value={fmtEur(atRiskValue)} tone={atRisk.length ? "warn" : undefined} hint={`${atRisk.length} deals stalled / overdue`} />
        <Kpi label="Gap to target" value={fmtEur(Math.max(0, target - weighted))} tone="danger" hint={`Target ${fmtEur(target)}`} />
      </div>

      <SectionHead title="Pipeline by status">
        <button className="ghost-link" onClick={() => ctx.go("deals")} type="button">Open board<Icon name="chevron" /></button>
      </SectionHead>
      <div className="stage-strip">
        {stages.map((st) => {
          const ds = all.filter((d) => d.stage === st);
          const val = ds.reduce((s, d) => s + dealTotal(d), 0);
          return (
            <div className="stage-cell" key={st}>
              <span className="stage-cell-label">{STAGE_META[st].short}</span>
              <strong className="stage-cell-count">{ds.length}</strong>
              <small className="numeric">{fmtEur(val)}</small>
              <span className="stage-cell-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (val / open) * 100)}%` }} /></span>
            </div>
          );
        })}
      </div>

      <div className="grid-2">
        <section>
          <SectionHead title="Stalled & overdue deals" count={atRisk.length} />
          {atRisk.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Deal</th><th>Owner</th><th className="numeric">Value</th><th>Risk</th><th /></tr></thead>
                <tbody>
                  {atRisk.map((d) => (
                    <tr key={d.id}>
                      <th scope="row"><button className="linklike" onClick={() => ctx.openAccount(d.accountId)} type="button">{d.title}</button><small className="muted">{accountById(d.accountId)!.name}</small></th>
                      <td>{userName(d.ownerId)}</td>
                      <td className="numeric numeric--strong">{fmtEur(dealTotal(d))}</td>
                      <td><RiskTag deal={d} /></td>
                      <td><button className="ghost-link" onClick={() => ctx.notify(`Reassign ${d.title} — pick a new owner.`)} type="button"><Icon name="swap" />Reassign</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty>No stalled or overdue deals across the team.</Empty>}
        </section>

        <section>
          <SectionHead title="Offers awaiting your approval" count={pendingApprovals.length} />
          {pendingApprovals.length ? (
            <div className="insight-stack">
              {pendingApprovals.map((o) => <ApprovalCard key={o.id} offer={o} role="sales_manager" ctx={ctx} />)}
            </div>
          ) : <Empty>No discounted offers waiting on Sales Manager approval.</Empty>}
        </section>
      </div>
    </>
  );
}

function FinanceDashboard({ ctx }: { ctx: AppCtx }) {
  const live = seedDeals.map((d) => liveStage(ctx, d));
  const rows = forecastByPeriod(live);
  const totalService = rows.reduce((s, r) => s + r.weightedService, 0);
  const gmTotal = forecastTotal(live, "gm");
  const netTotal = forecastTotal(live, "net_sales");
  const pendingApprovals = seedOffers.map((o) => ctx.offerState[o.id] ?? o).filter((o) => o.status === "pending_finance");

  return (
    <>
      <div className="kpi-strip">
        <Kpi label="Weighted net sales" value={fmtEur(weightedForecast(live, "net_sales"))} hint="Tier-weighted, 3-year" />
        <Kpi label="Gross margin" value={fmtEur(gmTotal)} hint={`${Math.round((gmTotal / netTotal) * 100)}% blended GM`} />
        <Kpi label="Secured (LOI+)" value={fmtEur(securedForecast(live, "net_sales"))} tone="good" hint="Committed + Confirmed" />
        <Kpi label="Weighted service" value={fmtEur(totalService)} hint="Kept separate from device" />
      </div>

      <div className="grid-2">
        <section>
          <SectionHead title="Time-phased forecast">
            <button className="ghost-link" onClick={() => ctx.go("forecast")} type="button">Full forecast<Icon name="chevron" /></button>
          </SectionHead>
          <PhasingBars
            rows={["2026", "2027", "2028"].map((y) => {
              const yr = rows.filter((r) => periodYear(r.period) === y);
              return { label: y, device: yr.reduce((s, r) => s + r.weightedDevice, 0), service: yr.reduce((s, r) => s + r.weightedService, 0) };
            })}
            max={Math.max(...["2026", "2027", "2028"].map((y) => rows.filter((r) => periodYear(r.period) === y).reduce((s, r) => s + r.weightedDevice + r.weightedService, 0)))}
          />
          <div className="spacer" />
          <button className="btn btn--secondary" onClick={() => ctx.go("catalog")} type="button"><Icon name="catalog" />Maintain pricing catalog</button>
        </section>

        <section>
          <SectionHead title="Offers awaiting Finance approval" count={pendingApprovals.length} />
          {pendingApprovals.length ? (
            <div className="insight-stack">
              {pendingApprovals.map((o) => <ApprovalCard key={o.id} offer={o} role="finance" ctx={ctx} />)}
            </div>
          ) : <Empty>No offers waiting on the second (Finance) approval.</Empty>}
        </section>
      </div>
    </>
  );
}

// ===========================================================================
// Offer approval card (shared by manager + finance dashboards and offers view)
// ===========================================================================

function ApprovalCard({ offer, role, ctx }: { offer: Offer; role: "sales_manager" | "finance"; ctx: AppCtx }) {
  const deal = dealById(offer.dealId)!;
  const account = accountById(deal.accountId)!;
  const [note, setNote] = useState("");
  const step1 = offer.approvals.find((a) => a.roleRequired === "sales_manager");

  return (
    <article className="insight insight--approval">
      <div className="insight-top">
        <span className="insight-kind"><Icon name="offers" />{offer.ref} · {account.name}</span>
        <span className="discount-flag">{offer.discountPct}% discount</span>
      </div>
      <h3 className="insight-headline">{deal.title}</h3>
      <div className="approval-figs">
        <div><span>List</span><strong className="numeric">{fmtEurExact(offerList(offer))}</strong></div>
        <div><span>Net</span><strong className="numeric">{fmtEurExact(offerNet(offer))}</strong></div>
        <div><span>Created by</span><strong>{userName(offer.createdById)}</strong></div>
      </div>
      {offer.justification && (
        <div className="approval-just"><strong>Justification</strong><p>{offer.justification}</p></div>
      )}
      {role === "finance" && step1?.decision === "approved" && (
        <p className="approval-prior"><Icon name="check" />Sales Manager approved {step1.decidedAt} — {step1.note}</p>
      )}
      <label className="approval-note">
        <span className="sr-only">Decision note</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the rep" />
      </label>
      <div className="insight-actions">
        <button className="btn btn--primary btn--sm" type="button" onClick={() => ctx.decideOffer(offer.id, "approved", note)}>
          <Icon name="check" />Approve
        </button>
        <button className="btn btn--danger btn--sm" type="button" onClick={() => ctx.decideOffer(offer.id, "rejected", note)}>Reject</button>
      </div>
    </article>
  );
}

// ===========================================================================
// Accounts list
// ===========================================================================

function AccountsView({ ctx }: { ctx: AppCtx }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const rows = accounts.filter((a) => !query || [a.name, a.region, a.industry, userName(a.ownerId)].some((v) => v.toLowerCase().includes(query)));

  return (
    <>
      <PageHead title="Accounts" crumb="Customers" actions={
        <button className="btn btn--primary" onClick={() => ctx.notify("New account workflow — AI research drafts the brief before you save.")} type="button"><Icon name="plus" />New account</button>
      } />
      <div className="toolbar">
        <label className="search">
          <Icon name="search" /><span className="sr-only">Search accounts</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts" type="search" />
        </label>
      </div>
      <div className="table-wrap card-edge">
        <table>
          <thead><tr><th>Account</th><th>Industry</th><th>Owner</th><th className="numeric">Open pipeline</th><th>Open cases</th><th>Signal</th></tr></thead>
          <tbody>
            {rows.map((a) => {
              const ad = dealsForAccount(a.id).map((d) => liveStage(ctx, d)).filter(isOpen);
              const pipeline = ad.reduce((s, d) => s + dealTotal(d), 0);
              const openCases = casesForAccount(a.id).filter((c) => c.status !== "resolved" && c.status !== "closed").length;
              const worst = ad.find((d) => isOverdue(d)) ?? ad.find((d) => isStale(d));
              return (
                <tr key={a.id} onClick={() => ctx.openAccount(a.id)}>
                  <th scope="row">
                    <span className="account-cell"><span className="account-logo" aria-hidden="true">{monogram(a.name)}</span><span><strong>{a.name}</strong><small>{a.region} · {a.lifecycle}</small></span></span>
                  </th>
                  <td>{a.industry}</td>
                  <td>{userName(a.ownerId)}</td>
                  <td className="numeric numeric--strong">{fmtEur(pipeline)}</td>
                  <td>{openCases > 0 ? <span className="t-warn">{openCases}</span> : "—"}</td>
                  <td>{worst ? <RiskTag deal={worst} /> : <span className="risk risk--on_track"><span className="risk-dot" />Healthy</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ===========================================================================
// Account record
// ===========================================================================

function AccountRecord({ account, ctx }: { account: Account; ctx: AppCtx }) {
  const owner = userById(account.ownerId);
  const accDeals = dealsForAccount(account.id).map((d) => liveStage(ctx, d));
  const openDeals = accDeals.filter(isOpen);
  const accCases = casesForAccount(account.id);
  const openCases = accCases.filter((c) => c.status !== "resolved" && c.status !== "closed");
  const accOffers = offersForAccount(account.id).map((o) => ctx.offerState[o.id] ?? o);
  const accInsights = insightsForAccount(account.id);
  const contacts = contactsForAccount(account.id);

  const openPipeline = openDeals.reduce((s, d) => s + dealTotal(d), 0);
  const weightedNext = openDeals.reduce((s, d) => s + nextQuarterValue(d) * probability(d.stage), 0);
  const threeYear = openDeals.reduce((s, d) => s + dealTotal(d), 0);

  const phasingRows = ["2026", "2027", "2028"].map((y) => {
    let device = 0, service = 0;
    for (const d of openDeals) {
      for (const p of d.devicePhases) if (periodYear(p.period) === y) device += p.units * d.deviceUnitPrice;
      for (const sc of serviceContractsForDeal(d.id)) for (const ph of sc.phases) if (periodYear(ph.period) === y) service += ph.value;
    }
    return { label: y, device, service };
  });
  const phasingMax = Math.max(1, ...phasingRows.map((r) => r.device + r.service));

  const baseActivity = activityForAccount(account.id);
  const [logged, setLogged] = useState<{ kind: "note" | "meeting" | "call" | "email"; summary: string; when: string; actor: string }[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftKind, setDraftKind] = useState<"note" | "meeting" | "call" | "email">("note");
  const [draft, setDraft] = useState("");

  const submitLog = () => {
    if (!draft.trim()) return;
    setLogged((l) => [{ kind: draftKind, summary: draft.trim(), when: "Just now", actor: ctx.user.name }, ...l]);
    setDraft(""); setComposerOpen(false); ctx.notify("Activity logged to the timeline.");
  };

  return (
    <section className="record">
      <button className="back" onClick={() => ctx.go("accounts")} type="button"><Icon name="back" />Accounts</button>

      <header className="record-head">
        <span className="account-logo lg" aria-hidden="true">{monogram(account.name)}</span>
        <div className="record-head-main">
          <div className="record-title-row">
            <h1>{account.name}</h1>
            <span className="lifecycle">{account.lifecycle}</span>
          </div>
          <p className="record-sub">{account.industry} · {account.region} · {account.sites} sites · <a href={`https://${account.domain}`} target="_blank" rel="noreferrer">{account.domain}</a></p>
          <p className="record-summary">{account.summary}</p>
          <div className="record-meta">
            <span>Owner <strong>{owner?.name}</strong></span>
            <span>VAT <strong>{account.vatId}</strong></span>
            <span>Customer since <strong>{account.since}</strong></span>
          </div>
        </div>
        <div className="record-actions">
          <button className="btn btn--secondary" onClick={() => setComposerOpen((v) => !v)} aria-expanded={composerOpen} type="button">Log activity</button>
          <button className="btn btn--primary" onClick={() => ctx.notify("New deal workflow opened for this account.")} type="button"><Icon name="plus" />New deal</button>
        </div>
      </header>

      <div className="kpi-strip kpi-strip--tight">
        <Kpi label="Open pipeline" value={fmtEur(openPipeline)} />
        <Kpi label="Weighted, next quarter" value={fmtEur(weightedNext)} />
        <Kpi label="3-year total" value={fmtEur(threeYear)} />
        <Kpi label="Active cases" value={`${openCases.length}`} tone={openCases.length ? "warn" : undefined} />
        <Kpi label="Open offers" value={`${accOffers.filter((o) => o.status !== "locked" && o.status !== "rejected").length}`} />
      </div>

      <div className="record-body">
        <div className="record-col">
          <section>
            <SectionHead title="Deals" count={accDeals.length} />
            <div className="table-wrap card-edge">
              <table className="compact">
                <thead><tr><th>Deal</th><th>Stage</th><th>Channel</th><th className="numeric">Device</th><th className="numeric">Service</th><th className="numeric">Total</th></tr></thead>
                <tbody>
                  {accDeals.map((d) => (
                    <tr key={d.id}>
                      <th scope="row">{d.title}{d.parentDealId && <small className="muted"><Icon name="link" />follow-on</small>}{d.isPilot && <span className="mini-tag">Pilot</span>}</th>
                      <td><StatusTag stage={d.stage} /></td>
                      <td><span className="chan">{d.channel === "direct" ? "Direct" : "Reseller"}</span></td>
                      <td className="numeric">{fmtEur(deviceTotal(d))}</td>
                      <td className="numeric">{fmtEur(serviceTotal(d.id))}</td>
                      <td className="numeric numeric--strong">{fmtEur(dealTotal(d))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionHead title="Service cases" count={accCases.length} />
            {accCases.length ? <CaseTable cases={accCases} ctx={ctx} compact /> : <Empty>No service cases for this account.</Empty>}
          </section>

          <section>
            <SectionHead title="Offers" count={accOffers.length} />
            {accOffers.length ? (
              <ul className="stack-list">
                {accOffers.map((o) => (
                  <li key={o.id}>
                    <button className="row-main" onClick={() => ctx.openOffers(o.id)} type="button">
                      <span><strong>{o.ref} · {dealById(o.dealId)!.title}</strong><small>v{o.version} · {o.discountPct > 0 ? `${o.discountPct}% discount` : "list price"}{o.lockedAt ? " · locked" : ""}</small></span>
                    </button>
                    <span className="row-side"><strong className="numeric">{fmtEur(offerNet(o))}</strong><OfferPill status={o.status} /></span>
                  </li>
                ))}
              </ul>
            ) : <Empty>No offers prepared yet.</Empty>}
          </section>

          <section>
            <SectionHead title="Activity" count={baseActivity.length + logged.length} />
            {composerOpen && (
              <div className="composer">
                <div className="composer-kinds">
                  {(["note", "meeting", "call", "email"] as const).map((k) => (
                    <button key={k} className={cx("chip", draftKind === k && "chip--active")} onClick={() => setDraftKind(k)} type="button" aria-pressed={draftKind === k}>{k[0]!.toUpperCase() + k.slice(1)}</button>
                  ))}
                </div>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Log a ${draftKind} with ${account.name}…`} rows={2}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitLog(); if (e.key === "Escape") setComposerOpen(false); }} />
                <div className="composer-actions">
                  <span className="muted">⌘↵ to save</span>
                  <button className="btn btn--ghost btn--sm" onClick={() => setComposerOpen(false)} type="button">Cancel</button>
                  <button className="btn btn--primary btn--sm" onClick={submitLog} disabled={!draft.trim()} type="button">Log activity</button>
                </div>
              </div>
            )}
            <ol className="timeline">
              {logged.map((e, i) => (
                <li key={`l${i}`} className={`tl tl--${e.kind}`}><span className="tl-dot" /><div><strong>{e.summary}</strong><small>{e.actor} · {e.when}</small></div></li>
              ))}
              {baseActivity.map((e) => (
                <li key={e.id} className={cx(`tl tl--${e.kind}`, e.isAi && "tl--ai")}><span className="tl-dot" /><div><strong>{e.isAi && <Icon name="spark" />}{e.summary}</strong><small>{e.isAi ? "AI agent" : userName(e.actorId)} · {e.when}</small></div></li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="record-side">
          <section className="panel">
            <SectionHead title="Revenue phasing" />
            <p className="panel-note">Device and service kept separate — open deals, by year.</p>
            <PhasingBars rows={phasingRows} max={phasingMax} />
          </section>

          <section className="panel">
            <SectionHead title="Contacts" count={contacts.length} />
            <ul className="contact-list">
              {contacts.map((c) => (
                <li key={c.id}>
                  <Avatar name={c.name} />
                  <div className="contact-main">
                    <strong>{c.name}{c.primary && <span className="mini-tag mini-tag--accent">Primary</span>}</strong>
                    <small>{CONTACT_ROLE_LABEL[c.roleType]}</small>
                  </div>
                  <a className="icon-btn" href={`mailto:${c.email}`} aria-label={`Email ${c.name}`}><Icon name="mail" /></a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHead title="AI account review" count={accInsights.length} />
            <div className="insight-stack">
              {accInsights.map((i) => (
                <InsightCard key={i.id} insight={i} status={ctx.insightStatus[i.id] ?? i.status}
                  onAccept={() => { ctx.setInsight(i.id, "accepted"); ctx.notify("Accepted. No CRM data changed automatically."); }}
                  onDismiss={() => { ctx.setInsight(i.id, "dismissed"); ctx.notify("Dismissed."); }} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

// ===========================================================================
// Deals (table + kanban)
// ===========================================================================

function DealsView({ ctx }: { ctx: AppCtx }) {
  const [mode, setMode] = useState<"table" | "board">("table");
  const [q, setQ] = useState("");
  const [onlyRisk, setOnlyRisk] = useState(false);
  const [channel, setChannel] = useState<"all" | "direct" | "reseller">("all");

  const query = q.trim().toLowerCase();
  const filtered = seedDeals.map((d) => liveStage(ctx, d)).filter((d) => {
    const acc = accountById(d.accountId)!;
    const matchesQ = !query || [d.title, acc.name, acc.region, userName(d.ownerId), STAGE_META[d.stage].label].some((v) => v.toLowerCase().includes(query));
    const matchesRisk = !onlyRisk || isStale(d) || isOverdue(d);
    const matchesChan = channel === "all" || d.channel === channel;
    return matchesQ && matchesRisk && matchesChan;
  });
  // The table lists open deals (everything before Closed); the board shows all
  // statuses, including the Closed column.
  const open = filtered.filter(isOpen);

  return (
    <>
      <PageHead title="Pipeline" crumb="Commercial" actions={
        <button className="btn btn--primary" onClick={() => ctx.notify("New deal workflow opened.")} type="button"><Icon name="plus" />New deal</button>
      } />

      <div className="toolbar">
        <div className="saved-views" role="tablist" aria-label="Saved views">
          <button className="saved-view saved-view--active" role="tab" aria-selected="true" type="button">All open</button>
          <button className="saved-view" role="tab" aria-selected={onlyRisk} onClick={() => setOnlyRisk((v) => !v)} type="button">At risk</button>
          <button className="saved-view" role="tab" aria-selected={channel === "direct"} onClick={() => setChannel((c) => c === "direct" ? "all" : "direct")} type="button">Direct only</button>
        </div>
        <div className="toolbar-right">
          <label className="search">
            <Icon name="search" /><span className="sr-only">Search deals</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pipeline" type="search" />
          </label>
          <div className="seg" role="group" aria-label="View mode">
            <button aria-label="Table view" aria-pressed={mode === "table"} onClick={() => setMode("table")} type="button"><Icon name="table" /></button>
            <button aria-label="Board view" aria-pressed={mode === "board"} onClick={() => setMode("board")} type="button"><Icon name="board" /></button>
          </div>
        </div>
      </div>

      {mode === "table"
        ? <DealTable deals={open} ctx={ctx} />
        : <DealBoard deals={filtered} ctx={ctx} />}
    </>
  );
}

function InlineStage({ deal, ctx }: { deal: Deal; ctx: AppCtx }) {
  // Spreadsheet-speed inline edit (DESIGN.md / Attio): the stage reads as a tag
  // but is a live control — changing it moves the deal, re-deriving tier, risk,
  // and forecast. Reseller→Contract negotiation is rejected in moveDeal.
  const options = pipelineStages(deal.channel);
  const current = options.includes(deal.stage) ? deal.stage : options[0]!;
  return (
    <label className="inline-edit" onClick={(e) => e.stopPropagation()}>
      <span className="sr-only">Stage for {deal.title}</span>
      <select className="inline-stage" value={current} onChange={(e) => ctx.moveDeal(deal.id, e.target.value as Stage)}>
        {options.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
      </select>
      <Icon name="chevronDown" />
    </label>
  );
}

function DealTable({ deals, ctx }: { deals: Deal[]; ctx: AppCtx }) {
  if (!deals.length) return <Empty>No deals match this view.</Empty>;
  return (
    <div className="table-wrap card-edge">
      <table>
        <thead><tr><th>Deal</th><th>Status</th><th>Owner</th><th>Close</th><th className="numeric">Next qtr</th><th className="numeric">3-yr total</th><th className="numeric">GM</th><th>Signal</th></tr></thead>
        <tbody>
          {deals.map((d) => {
            const acc = accountById(d.accountId)!;
            return (
              <tr key={d.id} onClick={() => ctx.openAccount(d.accountId)}>
                <th scope="row">
                  <span className="account-cell"><span className="account-logo sm" aria-hidden="true">{monogram(acc.name)}</span>
                    <span><strong>{d.title}</strong><small>{acc.name} · {d.channel === "direct" ? "Direct" : "Reseller"}{d.isPilot ? " · Pilot" : ""}</small></span></span>
                </th>
                <td className="cell-edit"><InlineStage deal={d} ctx={ctx} /></td>
                <td>{userName(d.ownerId)}</td>
                <td className={isOverdue(d) ? "t-danger" : ""}>{new Date(d.expectedClose).toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="numeric">{fmtEur(nextQuarterValue(d))}</td>
                <td className="numeric numeric--strong">{fmtEur(dealTotal(d))}</td>
                <td className="numeric">{fmtEur(dealMeasureTotal(d, "gm"))}</td>
                <td><RiskTag deal={d} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DealCard({ deal, ctx, dragId, setDragId, setOver, draggable }: {
  deal: Deal; ctx: AppCtx; dragId: string | null; setDragId: (v: string | null) => void; setOver: (v: string | null) => void; draggable: boolean;
}) {
  const acc = accountById(deal.accountId)!;
  return (
    <article
      className={cx("deal-card", !draggable && "deal-card--static", dragId === deal.id && "deal-card--drag")}
      draggable={draggable}
      onDragStart={draggable ? (e) => { e.dataTransfer.setData("text/plain", deal.id); setDragId(deal.id); } : undefined}
      onDragEnd={draggable ? () => { setDragId(null); setOver(null); } : undefined}
    >
      <div className="deal-card-top">
        {draggable && <span className="grip" aria-hidden="true"><Icon name="grip" /></span>}
        <button className="deal-card-open" onClick={() => ctx.openAccount(deal.accountId)} type="button"><strong>{deal.title}</strong><small>{acc.name} · {deal.channel === "direct" ? "Direct" : "Reseller"}</small></button>
      </div>
      <div className="deal-card-figs"><span className="numeric numeric--strong">{fmtEur(dealTotal(deal))}</span><RiskTag deal={deal} /></div>
      <div className="deal-card-foot">
        <span className="board-owner"><Avatar name={userName(deal.ownerId)} size="xs" />{userName(deal.ownerId)}</span>
        <span className="board-close"><Icon name="clock" />{new Date(deal.expectedClose).toLocaleDateString("en-IE", { day: "2-digit", month: "short" })}</span>
      </div>
    </article>
  );
}

function DealBoard({ deals, ctx }: { deals: Deal[]; ctx: AppCtx }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  // Columns are the CSV status ladder; drag a card to change a deal's status.
  return (
    <div className="board-wrap">
      <div className="board board--five">
        {STATUSES.map((status) => {
          const col = deals.filter((d) => d.stage === status);
          const value = col.reduce((s, d) => s + dealTotal(d), 0);
          return (
            <section
              key={status}
              className={cx("board-col", `board-col--${status}`, over === status && "board-col--over")}
              onDragOver={(e) => { if (!dragId) return; e.preventDefault(); setOver(status); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
              onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); ctx.moveDeal(id, status); setDragId(null); setOver(null); }}
            >
              <header className="board-col-head">
                <span className="board-col-title"><strong>{STAGE_META[status].short}</strong><small>{STAGE_META[status].csv}</small></span>
                <span className="board-count">{col.length}</span>
              </header>
              <div className="board-col-body">
                {col.map((d) => <DealCard key={d.id} deal={d} ctx={ctx} dragId={dragId} setDragId={setDragId} setOver={setOver} draggable />)}
                {!col.length && <p className="board-empty">Drop a deal here</p>}
              </div>
              <footer className="board-col-foot"><span>{status === "closed" ? "Realised" : "Net value"}</span><strong className="numeric">{value ? fmtEur(value) : "—"}</strong></footer>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// Cases
// ===========================================================================

function CaseTable({ cases, ctx, compact }: { cases: CaseRecord[]; ctx: AppCtx; compact?: boolean }) {
  if (!cases.length) return <Empty>No cases.</Empty>;
  return (
    <div className="table-wrap card-edge">
      <table className={compact ? "compact" : ""}>
        <thead><tr><th>Case</th><th>Priority</th><th>Status</th>{!compact && <th>Service</th>}<th>Owner</th><th>Age</th><th>SLA</th></tr></thead>
        <tbody>
          {cases.map((c) => {
            const sla = slaState(c);
            const svc = serviceById(c.serviceId);
            return (
              <tr key={c.id} onClick={() => ctx.openCase(c.id)}>
                <th scope="row"><strong>{c.title}</strong><small className="muted">{c.ref} · {accountById(c.accountId)!.name}{c.escalated ? " · escalated" : ""}</small></th>
                <td><PriorityTag priority={c.priority} /></td>
                <td><StatusPill status={c.status} /></td>
                {!compact && <td>{svc ? <span>{svc.name}{svc.isThirdParty && <span className="mini-tag">3rd party</span>}</span> : "—"}</td>}
                <td>{userName(c.ownerId)}</td>
                <td>{caseAgeDays(c)}d</td>
                <td><span className={cx("sla", `sla--${sla.state}`)}>{sla.state === "breached" && <Icon name="alert" />}{sla.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CasesView({ ctx }: { ctx: AppCtx }) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"mine" | "all" | "open">(ctx.user.role === "tam" ? "mine" : "open");
  const query = q.trim().toLowerCase();
  let list = seedCases.slice();
  if (scope === "mine") list = list.filter((c) => c.ownerId === ctx.user.id);
  if (scope === "open") list = list.filter((c) => c.status !== "resolved" && c.status !== "closed");
  list = list.filter((c) => !query || [c.title, c.ref, accountById(c.accountId)!.name].some((v) => v.toLowerCase().includes(query)));
  list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || caseAgeDays(b) - caseAgeDays(a));

  return (
    <>
      <PageHead title="Cases" crumb="Service" actions={
        <button className="btn btn--primary" onClick={() => ctx.notify("New case workflow — link it to an account and a service.")} type="button"><Icon name="plus" />New case</button>
      } />
      <div className="toolbar">
        <div className="saved-views" role="tablist" aria-label="Case scope">
          <button className="saved-view" role="tab" aria-selected={scope === "mine"} onClick={() => setScope("mine")} type="button">Assigned to me</button>
          <button className="saved-view" role="tab" aria-selected={scope === "open"} onClick={() => setScope("open")} type="button">All open</button>
          <button className="saved-view" role="tab" aria-selected={scope === "all"} onClick={() => setScope("all")} type="button">Everything</button>
        </div>
        <div className="toolbar-right">
          <label className="search"><Icon name="search" /><span className="sr-only">Search cases</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases" type="search" /></label>
        </div>
      </div>
      <CaseTable cases={list} ctx={ctx} />
    </>
  );
}

function CaseDetail({ caseRec, ctx }: { caseRec: CaseRecord; ctx: AppCtx }) {
  const account = accountById(caseRec.accountId)!;
  const svc = serviceById(caseRec.serviceId);
  const contact = contactById(caseRec.contactId);
  const sla = slaState(caseRec);
  const extraNotes = ctx.caseNotes[caseRec.id] ?? [];
  const notes = [...extraNotes, ...caseRec.notes];
  const [draft, setDraft] = useState("");
  const [internal, setInternal] = useState(false);

  const add = () => {
    if (!draft.trim()) return;
    ctx.addNote(caseRec.id, { author: ctx.user.name, body: draft.trim(), when: "Just now", internal });
    setDraft(""); ctx.notify("Note added to the case log.");
  };

  return (
    <section className="record">
      <button className="back" onClick={() => ctx.go("cases")} type="button"><Icon name="back" />Cases</button>
      <header className="record-head record-head--case">
        <div className="record-head-main">
          <div className="record-title-row">
            <h1>{caseRec.title}</h1>
            <PriorityTag priority={caseRec.priority} />
            <StatusPill status={caseRec.status} />
          </div>
          <p className="record-sub">{caseRec.ref} · <button className="linklike" onClick={() => ctx.openAccount(account.id)} type="button">{account.name}</button>{svc && <> · {svc.name}{svc.isThirdParty && <span className="mini-tag">3rd party</span>}</>}</p>
          <div className="record-meta">
            <span>Owner (TAM) <strong>{userName(caseRec.ownerId)}</strong></span>
            {contact && <span>Customer contact <strong>{contact.name}</strong></span>}
            <span>Opened <strong>{caseRec.createdAt}</strong> · <strong>{caseAgeDays(caseRec)}d old</strong></span>
            {caseRec.thirdPartyRef && <span>Third-party ref <strong>{caseRec.thirdPartyRef}</strong></span>}
          </div>
        </div>
        <div className="record-actions">
          <span className={cx("sla sla--big", `sla--${sla.state}`)}>{sla.state === "breached" && <Icon name="alert" />}{sla.label}</span>
          {caseRec.status !== "resolved" && caseRec.status !== "closed"
            ? <button className="btn btn--primary" onClick={() => ctx.notify(`${caseRec.ref} marked resolved.`)} type="button"><Icon name="check" />Resolve</button>
            : <button className="btn btn--secondary" onClick={() => ctx.notify(`${caseRec.ref} reopened.`)} type="button">Reopen</button>}
        </div>
      </header>

      <div className="case-body">
        <section className="case-thread">
          <SectionHead title="Case log" count={notes.length} />
          <div className="composer">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note — visible to everyone with access…" rows={2}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") add(); }} />
            <div className="composer-actions">
              <label className="check"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />Internal note (sales/technical only)</label>
              <button className="btn btn--primary btn--sm" onClick={add} disabled={!draft.trim()} type="button">Add note</button>
            </div>
          </div>
          <ol className="timeline">
            {notes.map((n, i) => (
              <li key={i} className={cx("tl tl--note", n.internal && "tl--internal")}>
                <span className="tl-dot" />
                <div><strong>{n.body}</strong><small>{n.author} · {n.when}{n.internal && <span className="mini-tag">Internal</span>}</small></div>
              </li>
            ))}
          </ol>
        </section>
        <aside className="panel">
          <SectionHead title="Case detail" />
          <dl className="kv">
            <div><dt>Status</dt><dd><StatusPill status={caseRec.status} /></dd></div>
            <div><dt>Priority</dt><dd><PriorityTag priority={caseRec.priority} /></dd></div>
            <div><dt>Service</dt><dd>{svc?.name ?? "—"}</dd></div>
            <div><dt>Escalated</dt><dd>{caseRec.escalated ? "Yes — third party" : "No"}</dd></div>
            <div><dt>SLA deadline</dt><dd>{caseRec.slaDeadline ?? "—"}</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

// ===========================================================================
// Offers + approval workflow
// ===========================================================================

function OffersView({ ctx, focus }: { ctx: AppCtx; focus?: string }) {
  const list = seedOffers.map((o) => ctx.offerState[o.id] ?? o);
  const [selected, setSelected] = useState<string>(focus ?? list[0]?.id ?? "");
  useEffect(() => { if (focus) setSelected(focus); }, [focus]);
  const offer = list.find((o) => o.id === selected) ?? list[0]!;
  const deal = dealById(offer.dealId)!;
  const account = accountById(deal.accountId)!;

  const canManager = ctx.user.role === "sales_manager" && offer.status === "pending_manager";
  const canFinance = ctx.user.role === "finance" && offer.status === "pending_finance";

  return (
    <>
      <PageHead title="Offers" crumb="Commercial" actions={
        <button className="btn btn--primary" onClick={() => ctx.notify("Offer builder opened — start from the catalog.")} type="button"><Icon name="plus" />Build offer</button>
      } />
      <div className="offers-layout">
        <ul className="offers-list">
          {list.map((o) => {
            const d = dealById(o.dealId)!;
            return (
              <li key={o.id}>
                <button className={cx("offers-list-item", o.id === selected && "is-active")} onClick={() => setSelected(o.id)} type="button">
                  <div><strong>{o.ref}</strong><small>{accountById(d.accountId)!.name}</small></div>
                  <div className="offers-list-side"><span className="numeric">{fmtEur(offerNet(o))}</span><OfferPill status={o.status} /></div>
                </button>
              </li>
            );
          })}
        </ul>

        <section className="offer-detail">
          <div className="offer-detail-head">
            <div>
              <span className="record-type">Offer {offer.ref} · v{offer.version}</span>
              <h2>{deal.title}</h2>
              <p className="muted">{account.name} · created by {userName(offer.createdById)} · {offer.createdAt}</p>
            </div>
            <div className="offer-detail-head-side">
              <OfferPill status={offer.status} />
              {offer.lockedAt && <span className="locked-flag"><Icon name="lock" />Locked {offer.lockedAt}</span>}
            </div>
          </div>

          {/* Offer is rendered on a light "document" surface per DESIGN.md */}
          <div className="offer-sheet">
            <table className="offer-table">
              <thead><tr><th>Item</th><th className="numeric">Unit</th><th className="numeric">Qty</th><th className="numeric">Disc.</th><th className="numeric">Net</th></tr></thead>
              <tbody>
                {offer.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{l.label}{l.serviceId && <span className="mini-tag">Service</span>}</td>
                    <td className="numeric">{fmtEurExact(l.unitPrice)}</td>
                    <td className="numeric">{l.quantity.toLocaleString("en-IE")}</td>
                    <td className="numeric">{l.discountPct > 0 ? `${l.discountPct}%` : "—"}</td>
                    <td className="numeric numeric--strong">{fmtEurExact(lineNet(l))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={4}>List total</td><td className="numeric">{fmtEurExact(offerList(offer))}</td></tr>
                <tr><td colSpan={4}>Headline discount</td><td className="numeric">{offer.discountPct}%</td></tr>
                <tr className="offer-net"><td colSpan={4}>Net total</td><td className="numeric numeric--strong">{fmtEurExact(offerNet(offer))}</td></tr>
              </tfoot>
            </table>
          </div>

          {offer.justification && (
            <div className="approval-just"><strong>Discount justification</strong><p>{offer.justification}</p></div>
          )}

          <SectionHead title="Approval workflow" />
          <ol className="approval-steps">
            {offer.approvals.length ? offer.approvals.map((a) => (
              <li key={a.stepOrder} className={cx("approval-step", a.decision === "approved" && "is-approved", a.decision === "rejected" && "is-rejected")}>
                <span className="approval-mark" aria-hidden="true">{a.decision === "approved" ? <Icon name="check" /> : a.decision === "rejected" ? <Icon name="close" /> : a.stepOrder}</span>
                <div>
                  <strong>{a.stepOrder}. {a.roleRequired === "sales_manager" ? "Sales Manager" : "Finance"}</strong>
                  <small>{a.decision ? `${a.decision === "approved" ? "Approved" : "Rejected"} by ${userName(a.decidedById)} · ${a.decidedAt}${a.note ? ` — ${a.note}` : ""}` : "Awaiting decision"}</small>
                </div>
              </li>
            )) : <li className="approval-step"><span className="approval-mark">—</span><div><strong>No approval required</strong><small>List-price offer; no discount to approve.</small></div></li>}
          </ol>

          {(canManager || canFinance) && (
            <div className="offer-decide">
              <p className="muted">{canManager ? "First approval — Sales Manager." : "Second approval — Finance. Approving locks the offer."}</p>
              <div className="insight-actions">
                <button className="btn btn--primary" onClick={() => ctx.decideOffer(offer.id, "approved")} type="button"><Icon name="check" />Approve</button>
                <button className="btn btn--danger" onClick={() => ctx.decideOffer(offer.id, "rejected")} type="button">Reject</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ===========================================================================
// Forecast (Finance) — weighted, time-phased, device vs service, export
// ===========================================================================

function fmtMeasure(n: number, m: Measure): string {
  if (m === "volume") return Math.round(n).toLocaleString("en-IE");
  return fmtEur(n);
}

function ForecastView({ ctx }: { ctx: AppCtx }) {
  const [lens, setLens] = useState<"commitment" | "streams" | "region">("commitment");
  const [measure, setMeasure] = useState<Measure>("net_sales");
  const [gran, setGran] = useState<Granularity>("year");
  const live = seedDeals.map((d) => liveStage(ctx, d));
  const buckets = periodBuckets(gran);

  const regionRows = lens === "region" ? regionSeries(live, measure) : null;
  const series: Series[] = lens === "commitment" ? tierSeries(live, measure) : lens === "streams" ? streamSeries(live, measure) : regionRows!;

  const colorClass = (key: string, i: number) =>
    lens === "commitment" ? `fseg fseg--tier-${key}` : lens === "streams" ? `fseg fseg--${key}` : `fseg fseg--r${i % 6}`;
  const swatchClass = (key: string, i: number) => colorClass(key, i).replace("fseg ", "");

  const grand = forecastTotal(live, measure);
  const colMax = Math.max(1, ...buckets.map((b) => series.reduce((s, se) => s + bucketSum(se.values, b.idx), 0)));
  const netTotal = forecastTotal(live, "net_sales");
  const gmTotal = forecastTotal(live, "gm");

  const exportCsv = () => {
    const header = ["Category", ...buckets.map((b) => b.label), "Total"];
    const rows = series.map((se) => [se.label, ...buckets.map((b) => Math.round(bucketSum(se.values, b.idx))), Math.round(se.total)].join(","));
    rows.push(["Total", ...buckets.map((b) => Math.round(series.reduce((s, se) => s + bucketSum(se.values, b.idx), 0))), Math.round(grand)].join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `hmd-forecast-${lens}-${measure}-${gran}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    ctx.notify("Forecast exported to CSV.");
  };

  return (
    <>
      <PageHead title="Forecast" crumb="Finance" actions={
        <button className="btn btn--secondary" onClick={exportCsv} type="button"><Icon name="download" />Export CSV</button>
      } />

      <div className="kpi-strip kpi-strip--tight">
        <Kpi label="Weighted net sales" value={fmtEur(weightedForecast(live, "net_sales"))} hint="Tier-weighted, 3-year" />
        <Kpi label="Gross pipeline" value={fmtEur(netTotal)} hint="All tiers, unweighted" />
        <Kpi label="Gross margin" value={fmtEur(gmTotal)} hint={`${Math.round((gmTotal / netTotal) * 100)}% blended GM`} />
        <Kpi label="Secured (LOI+)" value={fmtEur(securedForecast(live, "net_sales"))} tone="good" hint="Committed + Confirmed" />
      </div>

      <div className="toolbar">
        <div className="saved-views" role="tablist" aria-label="Forecast lens">
          {([["commitment", "Commitment"], ["streams", "Device vs service"], ["region", "By region"]] as const).map(([k, label]) => (
            <button key={k} className="saved-view" role="tab" aria-selected={lens === k} onClick={() => setLens(k)} type="button">{label}</button>
          ))}
        </div>
        <div className="toolbar-right">
          <div className="seg seg--wide" role="group" aria-label="Measure">
            {(["net_sales", "volume", "gm"] as Measure[]).map((m) => (
              <button key={m} aria-pressed={measure === m} onClick={() => setMeasure(m)} type="button">{m === "net_sales" ? "Net sales" : m === "volume" ? "Volume" : "Gross margin"}</button>
            ))}
          </div>
          <div className="seg seg--wide" role="group" aria-label="Granularity">
            {(["quarter", "half", "year"] as Granularity[]).map((g) => (
              <button key={g} aria-pressed={gran === g} onClick={() => setGran(g)} type="button">{g === "quarter" ? "Qtr" : g === "half" ? "Half" : "Year"}</button>
            ))}
          </div>
        </div>
      </div>

      <p className="forecast-caption">
        {lens === "commitment" ? "Net value by deal status — Opportunity → Pipeline → Committed → Confirmed (Closed excluded from the forward forecast)."
          : lens === "streams" ? "Device and service revenue kept separate, never flattened into one number."
          : "Regional split with gross-margin percentage, the way the forecast sheet reads."}
        {" Showing "}<strong>{MEASURE_LABEL[measure]}</strong>.
      </p>

      <div className="forecast-sheet">
        <table className="forecast-table">
          <thead>
            <tr><th>{lens === "commitment" ? "Commitment tier" : lens === "streams" ? "Revenue stream" : "Country"}</th>{buckets.map((b) => <th key={b.label} className="numeric">{b.label}</th>)}<th className="numeric">Total</th>{lens === "region" && <th className="numeric">GM %</th>}</tr>
          </thead>
          <tbody>
            {series.map((se, i) => (
              <tr key={se.key}>
                <th scope="row"><span className={`swatch ${swatchClass(se.key, i)}`} />{se.label}{lens === "commitment" && <span className="mini-tag">{STAGE_META[se.key as Stage].csv}</span>}</th>
                {buckets.map((b) => <td key={b.label} className="numeric">{fmtMeasure(bucketSum(se.values, b.idx), measure)}</td>)}
                <td className="numeric numeric--strong">{fmtMeasure(se.total, measure)}</td>
                {lens === "region" && regionRows && <td className="numeric">{Math.round((regionRows[i]?.gmPct ?? 0) * 100)}%</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row">Total</th>{buckets.map((b) => <td key={b.label} className="numeric numeric--strong">{fmtMeasure(series.reduce((s, se) => s + bucketSum(se.values, b.idx), 0), measure)}</td>)}<td className="numeric numeric--strong">{fmtMeasure(grand, measure)}</td>{lens === "region" && <td className="numeric">{Math.round((gmTotal / netTotal) * 100)}%</td>}</tr>
          </tfoot>
        </table>
      </div>

      <SectionHead title="Phasing" />
      <div className="forecast-bars">
        {buckets.map((b) => (
          <div className="fbar" key={b.label}>
            <span className="fbar-track" aria-hidden="true">
              {series.map((se, i) => {
                const v = bucketSum(se.values, b.idx);
                return v > 0 ? <span key={se.key} className={colorClass(se.key, i)} style={{ height: `${(v / colMax) * 100}%` }} /> : null;
              })}
            </span>
            <strong>{fmtMeasure(series.reduce((s, se) => s + bucketSum(se.values, b.idx), 0), measure)}</strong>
            <small>{b.label}</small>
          </div>
        ))}
      </div>
      <div className="phasing-legend phasing-legend--center">
        {series.map((se, i) => <span key={se.key}><i className={`swatch ${swatchClass(se.key, i)}`} />{se.label}</span>)}
      </div>
    </>
  );
}

// ===========================================================================
// Catalog (Finance maintains)
// ===========================================================================

function CatalogView({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<"products" | "services">("products");
  const canEdit = ctx.user.role === "finance";

  return (
    <>
      <PageHead title="Catalog" crumb="Finance" actions={
        canEdit ? <button className="btn btn--primary" onClick={() => ctx.notify(`Add a new ${tab === "products" ? "product" : "service"} — no developer needed.`)} type="button"><Icon name="plus" />New {tab === "products" ? "product" : "service"}</button> : undefined
      } />
      {!canEdit && <p className="ro-banner"><Icon name="lock" />Read-only. Only Finance can add, update, or retire catalog entries.</p>}
      <div className="toolbar">
        <div className="saved-views" role="tablist" aria-label="Catalog">
          <button className="saved-view" role="tab" aria-selected={tab === "products"} onClick={() => setTab("products")} type="button">Product & pricing</button>
          <button className="saved-view" role="tab" aria-selected={tab === "services"} onClick={() => setTab("services")} type="button">Services</button>
        </div>
      </div>

      {tab === "products" ? (
        <div className="table-wrap card-edge">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th className="numeric">List price</th><th>Status</th>{canEdit && <th />}</tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.retired ? "is-retired" : ""}>
                  <th scope="row">{p.name}</th>
                  <td>{p.category}</td>
                  <td className="numeric numeric--strong">{fmtEurExact(p.listPrice)}</td>
                  <td>{p.retired ? <span className="pill pill--closed">Retired</span> : <span className="pill pill--resolved">Active</span>}</td>
                  {canEdit && <td><button className="ghost-link" onClick={() => ctx.notify(`Editing ${p.name}.`)} type="button">Edit</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap card-edge">
          <table>
            <thead><tr><th>Service</th><th>Type</th><th>Source</th><th>Status</th>{canEdit && <th />}</tr></thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className={s.retired ? "is-retired" : ""}>
                  <th scope="row">{s.name}</th>
                  <td>{s.serviceType}</td>
                  <td>{s.isThirdParty ? <span className="mini-tag">Third party</span> : <span className="mini-tag mini-tag--accent">Internal</span>}</td>
                  <td>{s.retired ? <span className="pill pill--closed">Retired</span> : <span className="pill pill--resolved">Active</span>}</td>
                  {canEdit && <td><button className="ghost-link" onClick={() => ctx.notify(`Editing ${s.name}.`)} type="button">Edit</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ===========================================================================
// Page header
// ===========================================================================

function PageHead({ title, crumb, actions }: { title: string; crumb: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <div className="crumb"><span>{crumb}</span><span aria-hidden="true">/</span><span>{title}</span></div>
        <h1>{title}</h1>
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </div>
  );
}

// ===========================================================================
// App shell
// ===========================================================================

const NAV: { screen: Screen; label: string; icon: string }[] = [
  { screen: "home", label: "Home", icon: "home" },
  { screen: "accounts", label: "Accounts", icon: "accounts" },
  { screen: "deals", label: "Deals", icon: "deals" },
  { screen: "cases", label: "Cases", icon: "cases" },
  { screen: "offers", label: "Offers", icon: "offers" },
  { screen: "forecast", label: "Forecast", icon: "forecast" },
  { screen: "catalog", label: "Catalog", icon: "catalog" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initCrmFromApi().then(() => setReady(true));
  }, []);
  if (!ready) return <div style={{ padding: "2rem", color: "white" }}>Syncing with backend...</div>;
  return <MainApp />;
}

function MainApp() {
  const [userId, setUserId] = useState<string>(users[0]?.id || "");
  const [screen, setScreen] = useState<Screen>("home");
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || "");
  const [caseId, setCaseId] = useState<string>(seedCases[0]?.id || "");
  const [offerFocus, setOfferFocus] = useState<string | undefined>(undefined);

  const user = userById(userId)!;
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastSeq = useRef(0);

  // mutable domain state
  const [dealStage, setDealStage] = useState<Record<string, Stage>>({});
  const [offerState, setOfferState] = useState<Record<string, Offer>>({});
  const [insightStatus, setInsightStatus] = useState<Record<string, AiInsight["status"]>>({});
  const [caseNotes, setCaseNotes] = useState<Record<string, CaseNote[]>>({});
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set(seedNotifications.filter((n) => n.read).map((n) => n.id)));

  const notify = (msg: string) => {
    const id = ++toastSeq.current;
    setToast({ id, msg });
    window.setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 3000);
  };

  const moveDeal = (id: string, stage: Stage) => {
    const deal = dealById(id);
    if (!deal) return;
    if ((dealStage[id] ?? deal.stage) === stage) return;
    setDealStage((m) => ({ ...m, [id]: stage }));
    fetch(`/api/deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) }).catch(console.error);
    notify(`Moved ${deal.title} to ${STAGE_META[stage].short}.`);
  };

  const decideOffer = (offerId: string, decision: "approved" | "rejected", note?: string) => {
    const base = offerState[offerId] ?? seedOffers.find((o) => o.id === offerId);
    if (!base) return;
    const step = base.approvals.find((a) => !a.decision);
    if (!step) return;
    const approvals = base.approvals.map((a) =>
      a.stepOrder === step.stepOrder ? { ...a, decision, decidedById: user.id, note: note?.trim() || (decision === "approved" ? "Approved." : "Rejected."), decidedAt: "Just now" } : a,
    );
    let status: Offer["status"] = base.status;
    if (decision === "rejected") status = "rejected";
    else if (step.roleRequired === "sales_manager") status = "pending_finance";
    else status = "locked";
    const locked = status === "locked" ? "Just now" : base.lockedAt;
    setOfferState((m) => ({ ...m, [offerId]: { ...base, approvals, status, lockedAt: locked } }));
    fetch(`/api/offers/${offerId}/decide`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, note }) }).catch(console.error);
    notify(decision === "approved"
      ? status === "locked" ? `${base.ref} fully approved and locked.` : `${base.ref} approved — routed to Finance.`
      : `${base.ref} rejected. The rep has been notified.`);
  };

  const ctx: AppCtx = {
    user,
    go: (s) => { setScreen(s); setMenuOpen(false); },
    openAccount: (id) => { setAccountId(id); setScreen("account"); setMenuOpen(false); },
    openOffers: (id) => { setOfferFocus(id); setScreen("offers"); setMenuOpen(false); },
    openCase: (id) => { setCaseId(id); setScreen("case" as Screen); setMenuOpen(false); },
    notify,
    dealStage, moveDeal,
    offerState, decideOffer,
    insightStatus, setInsight: (id, s) => setInsightStatus((m) => ({ ...m, [id]: s })),
    caseNotes, addNote: (cid, n) => setCaseNotes((m) => ({ ...m, [cid]: [n, ...(m[cid] ?? [])] })),
  };

  const myNotifs = seedNotifications.filter((n) => n.userId === userId);
  const unread = myNotifs.filter((n) => !readNotifs.has(n.id)).length;

  const dashboards: Record<Role, ReactNode> = {
    sales_rep: <RepDashboard ctx={ctx} />,
    tam: <TamDashboard ctx={ctx} />,
    sales_manager: <ManagerDashboard ctx={ctx} />,
    finance: <FinanceDashboard ctx={ctx} />,
  };

  let content: ReactNode;
  if (screen === "home") content = <><PageHead title={`Good morning, ${user.name.split(" ")[0]}`} crumb={ROLE_LABEL[user.role]} />{dashboards[user.role]}</>;
  else if (screen === "accounts") content = <AccountsView ctx={ctx} />;
  else if (screen === "account") content = <AccountRecord account={accountById(accountId)!} ctx={ctx} />;
  else if (screen === "deals") content = <DealsView ctx={ctx} />;
  else if (screen === "cases") content = <CasesView ctx={ctx} />;
  else if ((screen as string) === "case") content = <CaseDetail caseRec={seedCases.find((c) => c.id === caseId)!} ctx={ctx} />;
  else if (screen === "offers") content = <OffersView ctx={ctx} focus={offerFocus} />;
  else if (screen === "forecast") content = <ForecastView ctx={ctx} />;
  else content = <CatalogView ctx={ctx} />;

  const activeNav = screen === "account" ? "accounts" : (screen as string) === "case" ? "cases" : screen;

  return (
    <div className="shell">
      <header className="mobilebar">
        <button className="icon-btn" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} type="button"><Icon name={menuOpen ? "close" : "menu"} /></button>
        <span className="mobilebar-brand">HMD Secure CRM</span>
        <button className="icon-btn notif-btn" aria-label="Notifications" onClick={() => setNotifOpen((v) => !v)} type="button"><Icon name="bell" />{unread > 0 && <span className="notif-dot" />}</button>
      </header>

      <aside className={cx("sidebar", menuOpen && "sidebar--open")}>
        <div className="brand"><span className="brand-mark" aria-hidden="true">H</span><span><strong>HMD Secure</strong><small>Commercial workspace</small></span></div>

        <div className="role-switch">
          <button className="role-btn" onClick={() => setRoleMenu((v) => !v)} aria-expanded={roleMenu} type="button">
            <Avatar name={user.name} />
            <span><strong>{user.name}</strong><small>{ROLE_LABEL[user.role]}</small></span>
            <Icon name="chevronDown" />
          </button>
          {roleMenu && (
            <ul className="role-menu" role="menu">
              {users.filter((u, i, arr) => arr.findIndex((x) => x.role === u.role) === i).map((u) => (
                <li key={u.id} role="none">
                  <button role="menuitemradio" aria-checked={u.role === user.role} className={cx("role-option", u.role === user.role && "is-active")}
                    onClick={() => { setUserId(u.id); setRoleMenu(false); setScreen("home"); notify(`Viewing as ${ROLE_LABEL[u.role]} — ${u.name}.`); }} type="button">
                    <Avatar name={u.name} size="xs" /><span><strong>{u.name}</strong><small>{ROLE_LABEL[u.role]}</small></span>
                    {u.role === user.role && <Icon name="check" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Primary">
          {NAV.map((item) => {
            const count = item.screen === "cases" ? seedCases.filter((c) => (c.status !== "resolved" && c.status !== "closed") && (user.role !== "tam" || c.ownerId === user.id)).length
              : item.screen === "offers" ? seedOffers.map((o) => offerState[o.id] ?? o).filter((o) => (user.role === "sales_manager" && o.status === "pending_manager") || (user.role === "finance" && o.status === "pending_finance")).length
              : 0;
            return (
              <button key={item.screen} className={cx("nav", activeNav === item.screen && "nav--active")} onClick={() => ctx.go(item.screen)} type="button">
                <Icon name={item.icon} /><span>{item.label}</span>
                {count > 0 && <span className={cx("nav-count", (item.screen === "offers") && "nav-count--alert")}>{count}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <button className="notif-row" onClick={() => setNotifOpen((v) => !v)} aria-expanded={notifOpen} type="button">
            <Icon name="bell" /><span>Notifications</span>{unread > 0 && <span className="nav-count nav-count--alert">{unread}</span>}
          </button>
          <span className="proto-tag">Hackathon prototype</span>
        </div>
      </aside>

      {notifOpen && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-panel-head"><strong>Notifications</strong>
            <div>
              <button className="ghost-link" onClick={() => setReadNotifs(new Set(seedNotifications.map((n) => n.id)))} type="button">Mark all read</button>
              <button className="icon-btn" aria-label="Close" onClick={() => setNotifOpen(false)} type="button"><Icon name="close" /></button>
            </div>
          </div>
          <ul className="notif-list">
            {myNotifs.length ? myNotifs.map((n) => (
              <li key={n.id}>
                <button className={cx("notif-item", !readNotifs.has(n.id) && "is-unread")} type="button"
                  onClick={() => {
                    setReadNotifs((s) => new Set(s).add(n.id)); setNotifOpen(false);
                    if (n.link?.screen === "account" && n.link.id) ctx.openAccount(n.link.id);
                    else if (n.link?.screen === "offers") ctx.openOffers(n.link.id);
                    else if (n.link?.screen === "case" && n.link.id) ctx.openCase(n.link.id);
                  }}>
                  <span className={cx("notif-kind", `notif-kind--${n.kind}`)} aria-hidden="true"><Icon name={n.kind === "ai" ? "spark" : n.kind === "offer" ? "offers" : n.kind === "case" ? "cases" : "deals"} /></span>
                  <span className="notif-text"><span>{n.body}</span><small>{n.when}</small></span>
                  {!readNotifs.has(n.id) && <span className="notif-unread-dot" aria-label="Unread" />}
                </button>
              </li>
            )) : <li><Empty>No notifications.</Empty></li>}
          </ul>
        </div>
      )}

      <main className="workspace">{content}</main>

      {toast && <div className="toast" role="status">{toast.msg}</div>}
      {menuOpen && <button className="scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} type="button" />}
    </div>
  );
}
