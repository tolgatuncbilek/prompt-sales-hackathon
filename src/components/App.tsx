import { useEffect, useId, useReducer, useRef, useState, type FormEvent } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { marked } from "marked";

const mdRenderer = new marked.Renderer();
mdRenderer.html = () => "";

function md(text: string): string {
  return marked.parse(text, { renderer: mdRenderer, async: false }) as string;
}
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
  activities,
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
  activityForDeal,
  recordActivity,
  insightsForAccount,
  insightsForDeal,
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
  offerLinesNetTotal,
  offerGrandNet,
  lineNet,
  offerLineKind,
  offerBuilderProducts,
  offerBuilderServices,
  offerProductNetTotal,
  offerServiceNetTotal,
  dealGrossMargin,
  setDealRevenue,
  setDealNextQuarterRevenue,
  syncDealFromMadeOffer,
  madeOfferForDeal,
  fmtExpectedClose,
  unitPriceForLineNet,
  catalogUnitPrice,
  catalogLineLabel,
  createOfferRecord,
  persistOfferToApi,
  persistOfferUpdateToApi,
  offerWorkflowSteps,
  approvalStepActionLabel,
  approvalTimestamp,
  APPROVAL_ROLE_LABEL,
  demoPersonaIds,
  loginAsUser,
  defaultOfferWorkflow,
  competitorsForDeal,
  dealCompetitors,
  dynamicForecast,
  industryStatsList,
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
  ownerSeries,
  forecastTotal,
  weightedForecast,
  securedForecast,
  defaultStageProbs,
  dealProbability,
  dealWeighted,
  dealWeightedInPeriod,
  weightedForecastP,
  committedForecast,
  atRiskForecast,
  stageLadder,
  weightedStream,
  RESELLER_TEST_PROB,
  deviceMeasureInPeriod,
  serviceMeasureInPeriod,
  initCrmFromApi,
  STAGE_TO_API,
  offersForDeal,
  casesForDeal,
} from "../lib/crm.ts";
import type {
  Account,
  ActivityKind,
  ApiStage,
  AiInsight,
  Channel,
  CasePriority,
  CaseRecord,
  CaseStatus,
  CaseNote,
  Deal,
  Granularity,
  Measure,
  Offer,
  OfferLine,
  Role,
  Series,
  Stage,
  StageProbs,
  LadderRung,
  User,
} from "../lib/crm.ts";
import type { Screen, Toast, PendingStageChange, EditKind, AppCtx } from "./types.ts";

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
  expand: (<><path d="M14 4h6v6" /><path d="M10 20H4v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></>),
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
  settings: (<><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>),
  userPlus: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  attach: <path d="M16 5v11a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v11a1.5 1.5 0 0 1-3 0V7" />,
  remove: <path d="M7 7l10 10M17 7l-10 10" />,
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>),
  copy: (<><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>),
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

function UserSwitcher({ userId, onChange }: { userId: string; onChange: (id: string) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const user = userById(userId)!;
  const personas = demoPersonaIds().map((id) => userById(id)!);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div className="role-switch" ref={rootRef}>
      <button
        className="role-btn"
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={user.name} />
        <span className="role-btn-text">
          <span className="role-name">{user.name}</span>
          <span className="role-title">{ROLE_LABEL[user.role]}</span>
        </span>
        <Icon name="chevronDown" />
      </button>
      {open && (
        <ul className="role-menu" role="listbox" aria-label="Switch user">
          {personas.map((u) => (
            <li key={u.id}>
              <button
                className={cx("role-menu-item", u.id === userId && "is-active")}
                type="button"
                role="option"
                aria-selected={u.id === userId}
                onClick={() => { void Promise.resolve(onChange(u.id)).then(() => setOpen(false)); }}
              >
                <Avatar name={u.name} size="xs" />
                <span className="role-menu-copy">
                  <strong>{u.name}</strong>
                  <small>{ROLE_LABEL[u.role]}</small>
                </span>
                {u.id === userId && <Icon name="check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusTag({ stage }: { stage: Stage }) {
  return (
    <span className={`status-tag status-tag--${stage}`} title={STAGE_META[stage].label}>
      <span className="status-dot" aria-hidden="true" />
      {STAGE_META[stage].short}
    </span>
  );
}

function ValidatedTag() {
  return <span className="validated-tag"><Icon name="check" />Lead validated</span>;
}

function ContactList({ contacts, note }: { contacts: ReturnType<typeof contactsForAccount>; note?: string }) {
  if (!contacts.length) return <Empty>No contacts on this account.</Empty>;
  return (
    <>
      {note && <p className="panel-note">{note}</p>}
      <ul className="contact-list">
        {contacts.map((c) => (
          <li key={c.id}>
            <Avatar name={c.name} />
            <div className="contact-main">
              <div className="contact-name-row">
                <strong>{c.name}</strong>
                {c.primary && <span className="mini-tag mini-tag--accent">Primary</span>}
              </div>
              <small className="contact-role">{CONTACT_ROLE_LABEL[c.roleType]}</small>
              <a className="contact-link" href={`mailto:${c.email}`}>
                <Icon name="mail" /><span>{c.email}</span>
              </a>
              <a className="contact-link" href={`tel:${c.phone}`}>
                <Icon name="phone" /><span>{c.phone}</span>
              </a>
              <a className="contact-link" href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Meeting with ${c.name}`)}&add=${encodeURIComponent(c.email)}`} target="_blank" rel="noreferrer">
                <Icon name="calendar" /><span>Meet with {c.name.split(" ")[0]}</span>
              </a>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" onClick={onCancel}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2 id="confirm-modal-title">{title}</h2></div>
        <div className="modal-body"><p>{body}</p></div>
        <div className="modal-actions">
          <button className="btn btn--ghost btn--sm" onClick={onCancel} type="button">Cancel</button>
          <button className="btn btn--primary btn--sm" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </div>
    </div>
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

function activityHint(deal: Deal): string {
  const days = daysSinceUpdate(deal);
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days >= 14) return `No activities for ${days} days`;
  return `Updated ${days} days ago`;
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
// Shared helper functions
// ===========================================================================

function stageChangeModalCopy(deal: Deal, from: Stage, to: Stage, validateLead: boolean): { title: string; body: string; confirmLabel: string } {
  if (validateLead) {
    return {
      title: "Are you validating this lead?",
      body: "Moving this deal to Offer confirms the lead is qualified. Do you want to validate the lead and advance the deal?",
      confirmLabel: "Yes, validate and move to Offer",
    };
  }
  return {
    title: "Change deal status?",
    body: `Move "${deal.title}" from ${STAGE_META[from].label} to ${STAGE_META[to].label}?`,
    confirmLabel: `Move to ${STAGE_META[to].label}`,
  };
}

function liveStage(ctx: AppCtx, deal: Deal): Deal {
  const s = ctx.dealStage[deal.id];
  return s ? { ...deal, stage: s } : deal;
}

function liveDeal(ctx: AppCtx, deal: Deal): Deal {
  const staged = liveStage(ctx, deal);
  const validated = ctx.dealLeadValidated[deal.id] ?? staged.leadValidated ?? false;
  return { ...staged, leadValidated: validated };
}

// ===========================================================================
// Inline-editable table cells. At rest a cell reads like text; on hover/focus
// it reveals a 1px field and commits on blur / change (Attio-style).
// ===========================================================================

type Opt = { value: string; label: string };

type CustomSelectProps = {
  value: string;
  options: Opt[];
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
};

function CustomSelect({
  value,
  options,
  onChange,
  className,
  id,
  required,
  disabled,
  placeholder,
  compact = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || "Select...");

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: "bottom" });

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(250, Math.max(44, options.length * 38 + 8));
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let placement = "bottom";
    let top = rect.bottom + 4;
    
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      placement = "top";
      top = Math.max(8, rect.top - dropdownHeight - 4);
    }
    
    setCoords({
      top,
      left: Math.min(rect.left, window.innerWidth - rect.width - 8),
      width: rect.width,
      placement,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, { passive: true });
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      const idx = options.findIndex((o) => o.value === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (isOpen) {
          if (activeIndex >= 0 && activeIndex < options.length) {
            onChange(options[activeIndex]!.value);
          }
          setIsOpen(false);
        } else {
          setIsOpen(true);
          const idx = options.findIndex((o) => o.value === value);
          setActiveIndex(idx >= 0 ? idx : 0);
        }
        break;
        
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const idx = options.findIndex((o) => o.value === value);
          setActiveIndex(idx >= 0 ? idx : 0);
        } else {
          setActiveIndex((prev) => (prev + 1) % options.length);
        }
        break;
        
      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const idx = options.findIndex((o) => o.value === value);
          setActiveIndex(idx >= 0 ? idx : 0);
        } else {
          setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
        }
        break;
        
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
        
      case "Tab":
        setIsOpen(false);
        break;
        
      case "Home":
        e.preventDefault();
        if (isOpen) setActiveIndex(0);
        break;
        
      case "End":
        e.preventDefault();
        if (isOpen) setActiveIndex(options.length - 1);
        break;
        
      default:
        if (e.key.length === 1) {
          const char = e.key.toLowerCase();
          const matchIdx = options.findIndex((o) =>
            o.label.toLowerCase().startsWith(char)
          );
          if (matchIdx >= 0) {
            setActiveIndex(matchIdx);
            if (!isOpen) {
              onChange(options[matchIdx]!.value);
            }
          }
        }
        break;
    }
  };

  useEffect(() => {
    if (isOpen && activeIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector(
        `[data-index="${activeIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, isOpen]);

  const listboxId = useId();
  const triggerId = useId();

  const dropdownStyle: CSSProperties = {
    position: "fixed",
    top: coords.top,
    left: coords.left,
    width: coords.width,
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={cx("custom-select-trigger", className)}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        disabled={disabled}
      >
        <span className="custom-select-value">{displayLabel}</span>
        {/* Only show the dropdown chevron if it's not a cell select or inline stage where it's overlayed by parents */}
        {!(className?.includes("cell-select") || className?.includes("inline-stage")) && (
          <Icon name="chevronDown" className="custom-select-arrow" />
        )}
      </button>
      
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cx(
              "custom-select-dropdown",
              compact && "custom-select-dropdown--compact"
            )}
            style={dropdownStyle}
          >
            <ul
              id={listboxId}
              role="listbox"
              aria-labelledby={triggerId}
              className="custom-select-listbox"
              tabIndex={-1}
            >
              {options.map((option, idx) => {
                const isSelected = option.value === value;
                const isActive = idx === activeIndex;
                const optionId = `${listboxId}-option-${idx}`;
                
                return (
                  <li
                    key={option.value}
                    id={optionId}
                    role="option"
                    aria-selected={isSelected}
                    data-index={idx}
                    className={cx(
                      "custom-select-option",
                      isActive && "custom-select-option--active",
                      isSelected && "custom-select-option--selected"
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Icon name="check" />}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}

function CellText({ value, onCommit, placeholder }: { value: string; onCommit: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="cell-input"
      defaultValue={value}
      key={value}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== value) onCommit(v); else e.target.value = value; }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") { e.currentTarget.value = value; e.currentTarget.blur(); }
      }}
    />
  );
}

function CellNumber({ value, onCommit, prefix, min, max, step, integer }: {
  value: number; onCommit: (v: number) => void; prefix?: string; min?: number; max?: number; step?: number; integer?: boolean;
}) {
  return (
    <span className="cell-num" onClick={(e) => e.stopPropagation()}>
      {prefix && <span className="cell-num-prefix">{prefix}</span>}
      <input
        type="number"
        className="cell-input cell-input--num"
        defaultValue={value}
        key={value}
        min={min ?? 0}
        max={max}
        step={step ?? (integer ? 1 : "any")}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          let v = Number(e.target.value);
          if (Number.isNaN(v)) { e.target.value = String(value); return; }
          if (integer) v = Math.round(v);
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          if (v !== value) onCommit(v);
          else e.target.value = String(value);
        }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      />
    </span>
  );
}

function CellDate({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  return (
    <input
      type="date"
      className="cell-input cell-input--date"
      defaultValue={value}
      key={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => { if (e.target.value) onCommit(e.target.value); }}
    />
  );
}

function CellSelect({ value, options, onCommit, className }: { value: string; options: Opt[]; onCommit: (v: string) => void; className?: string }) {
  return (
    <span className="cell-edit" onClick={(e) => e.stopPropagation()}>
      <CustomSelect
        className={cx("cell-select", className)}
        value={value}
        options={options}
        onChange={onCommit}
        compact
      />
      <Icon name="chevronDown" />
    </span>
  );
}

function OpenButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="row-open" aria-label={label} type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <Icon name="chevron" />
    </button>
  );
}

function repOptions(): Opt[] {
  return users.filter((u) => u.role === "sales_rep").map((u) => ({ value: u.id, label: u.name }));
}

function tamOptions(): Opt[] {
  return users.filter((u) => u.role === "tam").map((u) => ({ value: u.id, label: u.name }));
}

function serviceOptions(includeRetired = false): Opt[] {
  return services
    .filter((s) => includeRetired || !s.retired)
    .map((s) => ({ value: s.id, label: s.name }));
}

const PRIORITY_OPTIONS: Opt[] = (["critical", "high", "medium", "low"] as CasePriority[]).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }));
const CASE_STATUS_OPTIONS: Opt[] = (["open", "in_progress", "escalated", "resolved", "closed"] as CaseStatus[]).map((s) => ({ value: s, label: CASE_STATUS_LABEL[s] }));
const STATUS_OPTIONS: Opt[] = STATUSES.map((s) => ({ value: s, label: STAGE_META[s].label }));
const RETIRED_OPTIONS: Opt[] = [{ value: "active", label: "Active" }, { value: "retired", label: "Retired" }];
const SOURCE_OPTIONS: Opt[] = [{ value: "internal", label: "Internal" }, { value: "third", label: "Third party" }];
const CHANNEL_OPTIONS: Opt[] = [{ value: "direct", label: "Direct" }, { value: "reseller", label: "Reseller" }];
const INDUSTRY_OPTIONS: Opt[] = [
  { value: "", label: "Select industry" },
  { value: "Field logistics", label: "Field logistics" },
  { value: "Transport & haulage", label: "Transport & haulage" },
  { value: "Public safety", label: "Public safety" },
  { value: "Energy & utilities", label: "Energy & utilities" },
  { value: "Facilities management", label: "Facilities management" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Retail", label: "Retail" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Construction", label: "Construction" },
  { value: "Other", label: "Other" }
];

function replaceDealRevenue(deal: Deal, deviceValue: number, serviceValue: number) {
  setDealRevenue(deal, deviceValue, serviceValue);
}

const YEAR_OPTIONS: Opt[] = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} ${i === 0 ? "year" : "years"}` }));

function NewDealModal({ account, ctx, onClose }: { account?: Account; ctx: AppCtx; onClose: () => void }) {
  const [accountId, setAccountId] = useState(account?.id ?? accounts[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<Channel>("direct");
  const [device, setDevice] = useState("0");
  const [service, setService] = useState("0");
  const [total, setTotal] = useState("0");
  const [totalEdited, setTotalEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const selectedAccount = account ?? accountById(accountId);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const updateAmount = (kind: "device" | "service", value: string) => {
    if (kind === "device") setDevice(value);
    else setService(value);
    if (!totalEdited) {
      const nextDevice = Number(kind === "device" ? value : device) || 0;
      const nextService = Number(kind === "service" ? value : service) || 0;
      setTotal(String(nextDevice + nextService));
    }
  };

  const submit = async () => {
    const deviceValue = Number(device);
    const serviceValue = Number(service);
    const totalValue = Number(total);
    if (!selectedAccount || !title.trim()) return;
    if (![deviceValue, serviceValue, totalValue].every(Number.isFinite) || deviceValue < 0 || serviceValue < 0 || totalValue < 0) {
      setError("Enter non-negative numeric values for Device, Service, and Total.");
      return;
    }
    if (Math.abs(totalValue - deviceValue - serviceValue) > 0.01) {
      setError("Total must equal Device plus Service.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        account_id: selectedAccount.id,
        owner_user_id: ctx.user.id,
        title: title.trim(),
        stage: STAGE_TO_API.lead,
        channel,
        device: deviceValue,
        service: serviceValue,
        total: totalValue,
      };

      let response = await fetch("/api/deals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        await loginAsUser(ctx.user.id);
        response = await fetch("/api/deals", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.status === 401) {
        const now = new Date().toISOString();
        const periodLabel = `${now.slice(0, 4)}-Q${Math.floor((Number(now.slice(5, 7)) - 1) / 3) + 1}`;
        const deal: Deal = {
          id: crypto.randomUUID(),
          accountId: selectedAccount.id,
          parentDealId: null,
          ownerId: ctx.user.id,
          title: title.trim(),
          stage: "lead",
          leadValidated: false,
          apiStage: STAGE_TO_API.lead,
          channel,
          isPilot: false,
          expectedClose: "",
          updatedAt: now,
          createdAt: now,
          deviceUnitPrice: deviceValue,
          devicePhases: deviceValue > 0 ? [{ period: periodLabel, units: 1 }] : [],
        };
        ctx.addDeal(deal, serviceValue);
        ctx.notify(`${deal.title} created for ${selectedAccount.name}.`);
        onClose();
        return;
      }

      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || "Failed to create deal");

      const createdAt = saved.createdAt ?? new Date().toISOString();
      const deal: Deal = {
        id: saved.id,
        accountId: selectedAccount.id,
        parentDealId: null,
        ownerId: saved.ownerUserId ?? ctx.user.id,
        title: title.trim(),
        stage: "lead",
        leadValidated: false,
        apiStage: STAGE_TO_API.lead,
        channel,
        isPilot: false,
        expectedClose: saved.expectedClose ?? "",
        updatedAt: saved.updatedAt ?? createdAt,
        createdAt,
        deviceUnitPrice: deviceValue,
        devicePhases: deviceValue > 0 ? [{ period: saved.periodLabel, units: 1 }] : [],
      };
      ctx.addDeal(deal, serviceValue, saved.serviceContractId, saved.serviceId);
      ctx.notify(`${deal.title} created for ${selectedAccount.name}.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="new-deal-title" onClick={() => { if (!submitting) onClose(); }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 id="new-deal-title">New deal</h2>
            <p className="modal-context">{selectedAccount?.name ?? "Select an account"}</p>
          </div>
          <button className="icon-btn" aria-label="Close" onClick={onClose} disabled={submitting} type="button"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          {!account && (
            <div className="field">
              <span className="field-label">Account</span>
              <CustomSelect
                value={accountId}
                options={accounts.map((option) => ({ value: option.id, label: option.name }))}
                onChange={setAccountId}
              />
            </div>
          )}
          <label className="field">
            <span className="field-label">Deal text</span>
            <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={500} />
          </label>
          <p className="muted">New deals start in the <strong>Lead</strong> stage. Validate the lead before moving to Offer.</p>
          <div className="modal-grid">
            <div className="field">
              <span className="field-label">Channel</span>
              <CustomSelect
                value={channel}
                options={CHANNEL_OPTIONS}
                onChange={(v) => setChannel(v as Channel)}
              />
            </div>
            <label className="field">
              <span className="field-label">Device</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" value={device} onChange={(e) => updateAmount("device", e.target.value)} required />
            </label>
            <label className="field">
              <span className="field-label">Service</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" value={service} onChange={(e) => updateAmount("service", e.target.value)} required />
            </label>
            <label className="field modal-grid-span">
              <span className="field-label">Total</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" value={total}
                onChange={(e) => { setTotalEdited(true); setTotal(e.target.value); }} required />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-foot">
            <button className="btn btn--ghost" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="btn btn--primary" type="submit" disabled={submitting || !selectedAccount || !title.trim()}>
              {submitting ? "Creating…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  const pendingOffers = myOffers.filter((o) => o.status === "pending_manager");

  return (
    <>
      <div className="kpi-strip">
        <Kpi label="My open pipeline" value={fmtEur(openPipeline)} hint={`${myDeals.length} open deals`} />
        <Kpi label="Weighted, next quarter" value={fmtEur(weightedNext)} hint={periodLabel(NEXT_QUARTER)} />
        <Kpi label="Need attention" value={`${attention.length}`} tone={attention.length ? "warn" : undefined} hint="Stalled or overdue" />
        <Kpi label="Offers in approval" value={`${pendingOffers.length}`} hint="Awaiting sign-off" />
      </div>

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
              {pendingApprovals.map((o) => <ApprovalCard key={o.id} offer={o} ctx={ctx} />)}
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

  return (
    <>
      <div className="kpi-strip">
        <Kpi label="Weighted net sales" value={fmtEur(weightedForecast(live, "net_sales"))} hint="Tier-weighted, 3-year" />
        <Kpi label="Gross margin" value={fmtEur(gmTotal)} hint={`${Math.round((gmTotal / netTotal) * 100)}% blended GM`} />
        <Kpi label="Secured (final negotiation)" value={fmtEur(securedForecast(live, "net_sales"))} tone="good" hint="Deals in final negotiation" />
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
          <SectionHead title="Offers awaiting your approval" count={seedOffers.map((o) => ctx.offerState[o.id] ?? o).filter((o) => o.status === "pending_finance").length} />
          {seedOffers.map((o) => ctx.offerState[o.id] ?? o).filter((o) => o.status === "pending_finance").length ? (
            <div className="insight-stack">
              {seedOffers.map((o) => ctx.offerState[o.id] ?? o).filter((o) => o.status === "pending_finance").map((o) => (
                <ApprovalCard key={o.id} offer={o} ctx={ctx} />
              ))}
            </div>
          ) : <Empty>No discounted offers waiting on Finance approval.</Empty>}
        </section>
      </div>
    </>
  );
}

// ===========================================================================
// Offer approval card (shared by manager + finance dashboards and offers view)
// ===========================================================================

function ApprovalCard({ offer, ctx }: { offer: Offer; ctx: AppCtx }) {
  const deal = dealById(offer.dealId)!;
  const account = accountById(deal.accountId)!;
  const [note, setNote] = useState("");
  const repStep = offerWorkflowSteps(offer).find((a) => a.roleRequired === "sales_rep");

  return (
    <article className="insight insight--approval">
      <div className="insight-top">
        <span className="insight-kind"><Icon name="offers" />{offer.ref} · {account.name}</span>
        <span className="discount-flag">{offer.discountPct}% discount</span>
      </div>
      <h3 className="insight-headline">{deal.title}</h3>
      <div className="approval-figs">
        <div><span>List</span><strong className="numeric">{fmtEurExact(offerList(offer))}</strong></div>
        <div><span>Net</span><strong className="numeric">{fmtEurExact(offerGrandNet(offer))}</strong></div>
        <div><span>Created by</span><strong>{userName(offer.createdById)}</strong></div>
      </div>
      {offer.justification && (
        <div className="approval-just"><strong>Justification</strong><p>{offer.justification}</p></div>
      )}
      {smStep?.decision === "approved" && (
        <p className="approval-prior"><Icon name="check" />Approved by Sales Manager {userName(smStep.decidedById)} — {smStep.decidedAt}</p>
      )}
      {((ctx.user.role === "sales_manager" && offer.status === "pending_manager") ||
        (ctx.user.role === "finance" && offer.status === "pending_finance")) && (
        <>
          <label className="approval-note">
            <span className="sr-only">Decision note</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the rep" />
          </label>
          <div className="insight-actions">
            <button className="btn btn--primary btn--sm" type="button" onClick={() => ctx.approveOfferMade(offer.id)}>
              <Icon name="check" />Approve offer
            </button>
            <button className="btn btn--danger btn--sm" type="button" onClick={() => ctx.decideOffer(offer.id, "rejected", note)}>Reject</button>
          </div>
        </>
      )}
    </article>
  );
}

// ===========================================================================
// Accounts list
// ===========================================================================

function AccountsView({ ctx }: { ctx: AppCtx }) {
  const [q, setQ] = useState("");
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [naName, setNaName] = useState("");
  const [naIndustry, setNaIndustry] = useState("");
  const [naDomain, setNaDomain] = useState("");
  const query = q.trim().toLowerCase();
  const rows = accounts
    .map((a) => ctx.eff("account", a))
    .filter((a) => !query || [a.name, a.region, a.industry, userName(a.ownerId)].some((v) => v.toLowerCase().includes(query)));

  const submitNewAccount = () => {
    if (!naName.trim()) return;
    const id = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    const account: Account = {
      id,
      name: naName.trim(),
      industry: naIndustry.trim() || "Unknown",
      region: "Unknown",
      domain: naDomain.trim() || "",
      ownerId: ctx.user.id,
      lifecycle: "prospect",
      vatId: "",
      since: today,
      sites: 1,
      summary: "",
      address: "",
    };
    ctx.addAccount(account);
    fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: account.name, industry: account.industry, region: account.region, domain: account.domain }),
    }).catch(console.error);
    setNaName("");
    setNaIndustry("");
    setNaDomain("");
    setNewAccountOpen(false);
    ctx.notify(`Account "${account.name}" created.`);
  };

  return (
    <>
      <div className="toolbar toolbar--page-start">
        <label className="search">
          <Icon name="search" /><span className="sr-only">Search accounts</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts" type="search" />
        </label>
        <button className="btn btn--primary" onClick={() => setNewAccountOpen(true)} type="button"><Icon name="plus" />New account</button>
      </div>
      <div className="table-wrap card-edge">
        <table>
          <thead><tr>
            <th>Account</th>
            <th>Industry</th><th>Owner</th><th className="numeric">Open pipeline</th><th>Open cases</th><th>Signal</th><th aria-label="Open" />
          </tr></thead>
          <tbody>
            {rows.map((a) => {
              const ad = dealsForAccount(a.id).map((d) => liveStage(ctx, d)).filter(isOpen);
              const pipeline = ad.reduce((s, d) => s + dealTotal(d), 0);
              const openCases = casesForAccount(a.id).filter((c) => c.status !== "resolved" && c.status !== "closed").length;
              const worst = ad.find((d) => isOverdue(d)) ?? ad.find((d) => isStale(d));
              return (
                <tr key={a.id} className="row-click" onClick={() => ctx.openAccount(a.id)}>
                  <th scope="row">
                    <span className="account-cell">
                      <span className="account-logo" aria-hidden="true">{monogram(a.name)}</span>
                      <CellText value={a.name} onCommit={(v) => ctx.patch("account", a.id, "name", v)} />
                    </span>
                  </th>
                  <td><CellText value={a.industry} onCommit={(v) => ctx.patch("account", a.id, "industry", v)} /></td>
                  <td><CellSelect value={a.ownerId} options={repOptions()} onCommit={(v) => ctx.patch("account", a.id, "ownerId", v)} /></td>
                  <td className="numeric numeric--strong">{fmtEur(pipeline)}</td>
                  <td>{openCases > 0 ? <span className="t-warn">{openCases}</span> : "—"}</td>
                  <td>{worst ? <RiskTag deal={worst} /> : <span className="risk risk--on_track"><span className="risk-dot" />Healthy</span>}</td>
                  <td><OpenButton label={`Open ${a.name}`} onClick={() => ctx.openAccount(a.id)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {newAccountOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="New account"
          onKeyDown={(e) => { if (e.key === "Escape") setNewAccountOpen(false); }}>
          <div className="modal">
            <div className="modal-head">
              <h2>New account</h2>
              <button className="icon-btn" onClick={() => setNewAccountOpen(false)} aria-label="Close" type="button"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label htmlFor="na-name">Account name</label>
                <input id="na-name" type="text" value={naName} onChange={(e) => setNaName(e.target.value)}
                  placeholder="e.g. Acme Corp" autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") submitNewAccount(); }} />
              </div>
              <div className="modal-field">
                <span className="modal-field-label">Industry</span>
                <CustomSelect
                  id="na-industry"
                  value={naIndustry}
                  options={INDUSTRY_OPTIONS}
                  onChange={setNaIndustry}
                />
              </div>
              <div className="modal-field">
                <label htmlFor="na-domain">Domain</label>
                <input id="na-domain" type="text" value={naDomain} onChange={(e) => setNaDomain(e.target.value)} placeholder="e.g. acme.com" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn--ghost btn--sm" onClick={() => setNewAccountOpen(false)} type="button">Cancel</button>
              <button className="btn btn--primary btn--sm" onClick={submitNewAccount} disabled={!naName.trim()} type="button">Create account</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ===========================================================================
// Account record
// ===========================================================================

function AccountRecord({ account: accountInput, ctx, embedded }: { account: Account; ctx: AppCtx; embedded?: boolean }) {
  const account = ctx.eff("account", accountInput);
  const [dealModal, setDealModal] = useState(false);
  const [buildOfferModal, setBuildOfferModal] = useState(false);
  const owner = userById(account.ownerId);
  const accDeals = dealsForAccount(account.id).map((d) => liveDeal(ctx, d));
  const openDeals = accDeals.filter(isOpen);
  const accCases = casesForAccount(account.id);
  const openCases = accCases.filter((c) => c.status !== "resolved" && c.status !== "closed");
  const accOffers = offersForAccount(account.id).map((o) => ctx.offerState[o.id] ?? o);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const selectedOffer = accOffers.find((o) => o.id === selectedOfferId) ?? accOffers[0] ?? null;
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
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftKind, setDraftKind] = useState<"note" | "meeting" | "call" | "email">("note");
  const [draft, setDraft] = useState("");

  const submitLog = () => {
    if (!draft.trim()) return;
    ctx.logActivity({ accountId: account.id, kind: draftKind, summary: draft.trim() });
    setDraft(""); setComposerOpen(false); ctx.notify("Activity logged to the timeline.");
  };

  return (
    <section className="record">
      {!embedded && <button className="back" onClick={() => ctx.go("accounts")} type="button"><Icon name="back" />Accounts</button>}

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
          <button className="btn btn--primary" onClick={() => setDealModal(true)} type="button"><Icon name="plus" />New deal</button>
        </div>
      </header>

      <div className="kpi-strip kpi-strip--tight">
        <Kpi label="Open pipeline" value={fmtEur(openPipeline)} />
        <Kpi label="Weighted, next quarter" value={fmtEur(weightedNext)} />
        <Kpi label="3-year total" value={fmtEur(threeYear)} />
        <Kpi label="Active cases" value={`${openCases.length}`} tone={openCases.length ? "warn" : undefined} />
        <Kpi label="Open offers" value={`${accOffers.filter((o) => o.status !== "made" && o.status !== "locked" && o.status !== "rejected").length}`} />
      </div>

      <div className="record-body">
        <div className="record-col">
          <section>
            <SectionHead title="Deals" count={accDeals.length} />
            <div className="table-wrap card-edge">
              <table className="compact">
                <thead><tr><th>Deal</th><th>Status</th><th>Channel</th><th className="numeric">Device</th><th className="numeric">Service</th><th className="numeric">Total</th></tr></thead>
                <tbody>
                  {accDeals.map((base) => {
                    const d = liveDeal(ctx, ctx.eff("deal", base));
                    return (
                    <tr key={d.id} className="row-click" onClick={() => ctx.openDeal(d.id)}>
                      <th scope="row"><CellText value={d.title} onCommit={(v) => void ctx.updateDeal(d, { title: v })} />{d.parentDealId && <small className="muted"><Icon name="link" />follow-on</small>}{d.isPilot && <span className="mini-tag">Pilot</span>}{d.leadValidated && <ValidatedTag />}</th>
                      <td><InlineStage deal={d} ctx={ctx} /></td>
                      <td><CellSelect value={d.channel} options={CHANNEL_OPTIONS} onCommit={(v) => void ctx.updateDeal(d, { channel: v as Channel })} /></td>
                      <td className="numeric"><CellNumber value={deviceTotal(d)} prefix="€" onCommit={(v) => void ctx.updateDeal(d, { device: v })} /></td>
                      <td className="numeric"><CellNumber value={serviceTotal(d.id)} prefix="€" onCommit={(v) => void ctx.updateDeal(d, { service: v })} /></td>
                      <td className="numeric numeric--strong"><CellNumber value={dealTotal(d)} prefix="€" onCommit={(v) => void ctx.updateDeal(d, { total: v })} /></td>
                    </tr>
                    );
                  })}
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
              <div className="offers-layout offers-layout--account">
                <ul className="offers-list">
                  {accOffers.map((o) => (
                    <li key={o.id}>
                      <button
                        className={cx("offers-list-item", selectedOffer?.id === o.id && "is-active")}
                        onClick={() => setSelectedOfferId(o.id)}
                        type="button"
                      >
                        <div>
                          <strong>{o.ref}</strong>
                          <small>{dealById(o.dealId)!.title} · v{o.version}</small>
                        </div>
                        <div className="offers-list-side">
                          <span className="numeric">{fmtEur(offerGrandNet(o))}</span>
                          <OfferPill status={o.status} />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                {selectedOffer && (
                  <OfferDetailPanel
                    offer={selectedOffer}
                    ctx={ctx}
                    onBuildOffer={() => setBuildOfferModal(true)}
                  />
                )}
              </div>
            ) : <Empty>No offers prepared yet.</Empty>}
          </section>

          <section>
            <SectionHead title="Activity" count={baseActivity.length} />
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
            {baseActivity.length ? (
              <ol className="timeline">
                {baseActivity.map((e) => (
                  <li key={e.id} className={cx(`tl tl--${e.kind}`, e.isAi && "tl--ai")}><span className="tl-dot" /><div><strong>{e.isAi && <Icon name="spark" />}{e.summary}</strong><small>{e.isAi ? "AI agent" : userName(e.actorId)} · {e.when}</small></div></li>
                ))}
              </ol>
            ) : <Empty>No activity logged for this account yet.</Empty>}
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
            <ContactList contacts={contacts} />
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
      {dealModal && <NewDealModal account={account} ctx={ctx} onClose={() => setDealModal(false)} />}
      {buildOfferModal && (
        <BuildOfferModal
          deals={openDeals.length ? openDeals : accDeals}
          deal={selectedOffer ? dealById(selectedOffer.dealId) : openDeals[0] ?? accDeals[0]}
          ctx={ctx}
          onClose={() => setBuildOfferModal(false)}
          onCreated={(id) => setSelectedOfferId(id)}
        />
      )}
    </section>
  );
}

// ===========================================================================
// Offer builder + detail
// ===========================================================================

type OfferItemDraft = {
  key: string;
  kind: "product" | "service";
  catalogId: string;
  quantity: string;
  discountPct: string;
};

function emptyOfferItem(): OfferItemDraft {
  const productId = offerBuilderProducts()[0]?.id ?? "";
  return { key: crypto.randomUUID(), kind: "product", catalogId: productId, quantity: "1", discountPct: "0" };
}

function draftToLine(item: OfferItemDraft): OfferLine | null {
  if (!item.catalogId) return null;
  const productId = item.kind === "product" ? item.catalogId : null;
  const serviceId = item.kind === "service" ? item.catalogId : null;
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const discountPct = Math.min(100, Math.max(0, Number(item.discountPct) || 0));
  return {
    kind: item.kind,
    productId,
    serviceId,
    label: catalogLineLabel(productId, serviceId),
    unitPrice: catalogUnitPrice(productId, serviceId),
    quantity,
    discountPct,
  };
}

function BuildOfferModal({
  deal,
  deals,
  ctx,
  onClose,
  onCreated,
}: {
  deal?: Deal;
  deals?: Deal[];
  ctx: AppCtx;
  onClose: () => void;
  onCreated?: (offerId: string) => void;
}) {
  const dealOptions = deals ?? (deal ? [deal] : []);
  const [dealId, setDealId] = useState(deal?.id ?? dealOptions[0]?.id ?? "");
  const selectedDeal = dealById(dealId) ?? deal ?? dealOptions[0];
  const [items, setItems] = useState<OfferItemDraft[]>(() => [emptyOfferItem()]);
  const [headlineDiscount, setHeadlineDiscount] = useState("0");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsedLines = items.map(draftToLine).filter((l): l is OfferLine => l !== null);
  const previewOffer: Offer | null = selectedDeal && parsedLines.length
    ? {
        id: "preview",
        ref: "PREVIEW",
        dealId: selectedDeal.id,
        createdById: ctx.user.id,
        version: 1,
        status: "sales_rep",
        discountPct: Math.min(100, Math.max(0, Number(headlineDiscount) || 0)),
        justification: null,
        lockedAt: null,
        createdAt: "",
        lines: parsedLines,
        approvals: [],
      }
    : null;

  const updateItem = (key: string, patch: Partial<OfferItemDraft>) => {
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const submit = async () => {
    if (!selectedDeal || parsedLines.length !== items.length) return;
    setSubmitting(true);
    const disc = Math.min(100, Math.max(0, Number(headlineDiscount) || 0));
    const offer = createOfferRecord({
      dealId: selectedDeal.id,
      createdById: ctx.user.id,
      lines: parsedLines,
      discountPct: disc,
      justification: justification.trim() || null,
    });
    ctx.addOffer(offer);
    persistOfferToApi(selectedDeal.id, offer);
    ctx.notify(`${offer.ref} created for ${selectedDeal.title}.`);
    onCreated?.(offer.id);
    onClose();
  };

  const canSubmit = Boolean(selectedDeal) && parsedLines.length === items.length && items.every((i) => i.catalogId);

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="build-offer-title" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 id="build-offer-title">Build offer</h2>
            <p className="modal-context">{selectedDeal ? selectedDeal.title : "Select a deal"}</p>
          </div>
          <button className="icon-btn" aria-label="Close" onClick={onClose} type="button"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          {dealOptions.length > 1 && (
            <div className="field"><span className="field-label">Deal</span>
              <CustomSelect
                value={dealId}
                options={dealOptions.map((d) => ({ value: d.id, label: d.title }))}
                onChange={setDealId}
              />
            </div>
          )}

          <div className="offer-builder">
            <div className="offer-builder-head" aria-hidden="true">
              <span>Type</span><span>Item</span><span>Qty / Yrs</span><span>Disc. %</span><span>Unit</span><span>Net</span><span />
            </div>
            {items.map((item) => {
              const line = draftToLine(item);
              const catalogItems = item.kind === "product" ? offerBuilderProducts() : offerBuilderServices();
              return (
                <div key={item.key} className="offer-builder-row">
                  <div className="field">
                    <span className="field-label sr-only">Type</span>
                    <CustomSelect
                      value={item.kind}
                      options={[
                        { value: "product", label: "Product" },
                        { value: "service", label: "Service" },
                      ]}
                      onChange={(val) => {
                        const kind = val as "product" | "service";
                        const catalog = kind === "product" ? offerBuilderProducts() : offerBuilderServices();
                        updateItem(item.key, { kind, catalogId: catalog[0]?.id ?? "", quantity: "1" });
                      }}
                    />
                  </div>
                  <div className="field">
                    <span className="field-label sr-only">Catalog item</span>
                    <CustomSelect
                      value={item.catalogId}
                      options={catalogItems.map((entry) => ({
                        value: entry.id,
                        label: entry.name + (item.kind === "product" ? ` — ${fmtEurExact((entry as typeof products[0]).listPrice)}` : ""),
                      }))}
                      onChange={(val) => updateItem(item.key, { catalogId: val })}
                    />
                  </div>
                  {item.kind === "service" ? (
                    <div className="field">
                      <span className="field-label sr-only">Years</span>
                      <CustomSelect
                        value={item.quantity}
                        options={YEAR_OPTIONS}
                        onChange={(val) => updateItem(item.key, { quantity: val })}
                      />
                    </div>
                  ) : (
                    <label className="field">
                      <span className="field-label sr-only">Quantity</span>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.key, { quantity: e.target.value })} required />
                    </label>
                  )}
                  <label className="field">
                    <span className="field-label sr-only">Line discount %</span>
                    <input type="number" min="0" max="100" value={item.discountPct} onChange={(e) => updateItem(item.key, { discountPct: e.target.value })} />
                  </label>
                  <span className="offer-builder-read numeric">{line ? fmtEurExact(line.unitPrice) : "—"}</span>
                  <span className="offer-builder-read numeric numeric--strong">{line ? fmtEurExact(lineNet(line)) : "—"}</span>
                  <button
                    className="icon-btn offer-builder-remove"
                    type="button"
                    aria-label="Remove line"
                    disabled={items.length === 1}
                    onClick={() => setItems((rows) => rows.filter((r) => r.key !== item.key))}
                  >
                    <Icon name="close" />
                  </button>
                </div>
              );
            })}
            <button className="btn btn--secondary btn--sm offer-builder-add" type="button" onClick={() => setItems((rows) => [...rows, emptyOfferItem()])}>
              <Icon name="plus" />Add new item
            </button>
          </div>

          {previewOffer && (
            <div className="offer-builder-summary">
              <div><span>List total</span><strong className="numeric">{fmtEurExact(offerLinesNetTotal(previewOffer))}</strong></div>
              <div><span>Net total</span><strong className="numeric">{fmtEurExact(offerGrandNet(previewOffer))}</strong></div>
            </div>
          )}

          <div className="modal-grid">
            <label className="field"><span className="field-label">Headline discount %</span>
              <input type="number" min="0" max="100" value={headlineDiscount} onChange={(e) => setHeadlineDiscount(e.target.value)} />
            </label>
            <label className="field modal-grid-span"><span className="field-label">Justification</span>
              <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={2} placeholder="Required when headline discount is applied" />
            </label>
          </div>

          <div className="modal-foot">
            <button className="btn btn--ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" type="submit" disabled={submitting || !canSubmit}>Create offer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OfferEditText({ value, onCommit, placeholder }: { value: string; onCommit: (v: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return (
    <input
      type="text"
      className="cell-input offer-cell-input"
      value={draft}
      placeholder={placeholder}
      aria-label="Item name"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const v = draft.trim();
        if (v && v !== value) onCommit(v);
        else setDraft(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") { setDraft(value); e.currentTarget.blur(); }
      }}
    />
  );
}

function OfferEditNumber({
  value, onCommit, prefix, min, max, integer, ariaLabel,
}: {
  value: number; onCommit: (v: number) => void; prefix?: string; min?: number; max?: number; integer?: boolean; ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    let v = Number(draft);
    if (Number.isNaN(v)) { setDraft(String(value)); return; }
    if (integer) v = Math.round(v);
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    if (v !== value) onCommit(v);
    setDraft(String(v !== value ? v : value));
  };

  return (
    <span className="cell-num" onClick={(e) => e.stopPropagation()}>
      {prefix && <span className="cell-num-prefix">{prefix}</span>}
      <input
        type="number"
        className="cell-input cell-input--num offer-cell-input"
        value={draft}
        aria-label={ariaLabel}
        min={min}
        max={max}
        step={integer ? 1 : "any"}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setDraft(String(value)); e.currentTarget.blur(); }
        }}
      />
    </span>
  );
}

function OfferDetailPanel({
  offer,
  ctx,
  onBuildOffer,
}: {
  offer: Offer;
  ctx: AppCtx;
  onBuildOffer?: () => void;
}) {
  const deal = dealById(offer.dealId)!;
  const account = accountById(deal.accountId)!;
  const workflow = offerWorkflowSteps(offer);
  const canEdit = offer.status === "sales_rep" && ctx.user.role === "sales_rep";
  const canSubmit = offer.status === "sales_rep" && ctx.user.role === "sales_rep";
  const canManagerApprove = offer.status === "pending_manager" && ctx.user.role === "sales_manager";

  const listTotal = offerLinesNetTotal(offer);
  const netTotal = offerGrandNet(offer);

  const patchOffer = (updater: (current: Offer) => Offer) => {
    ctx.updateOffer(offer.id, updater);
  };

  const patchLine = (index: number, patch: Partial<OfferLine>) => {
    patchOffer((current) => ({
      ...current,
      lines: current.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  };

  return (
    <section className="offer-detail">
      <div className="offer-detail-head">
        <div>
          <span className="record-type">Offer {offer.ref} · v{offer.version}</span>
          <h2>{deal.title}</h2>
          <p className="muted">{account.name} · Created by {userName(offer.createdById)} · {offer.createdAt}</p>
        </div>
        <div className="offer-detail-head-side">
          {onBuildOffer && (
            <button className="btn btn--primary btn--sm" onClick={onBuildOffer} type="button"><Icon name="plus" />Build offer</button>
          )}
          <OfferPill status={offer.status} />
        </div>
      </div>

      <div className="offer-sheet">
        <table className="offer-table">
          <thead><tr><th>Item</th><th>Type</th><th className="numeric">Unit</th><th className="numeric">Qty / Yrs</th><th className="numeric">Disc.</th><th className="numeric">Net</th></tr></thead>
          <tbody>
            {offer.lines.map((l, i) => (
              <tr key={i}>
                <td>
                  {canEdit ? (
                    <OfferEditText value={l.label} onCommit={(v) => patchLine(i, { label: v })} />
                  ) : (
                    l.label
                  )}
                </td>
                <td><span className="mini-tag">{offerLineKind(l) === "product" ? "Product" : "Service"}</span></td>
                <td className="numeric">
                  {canEdit ? (
                    <OfferEditNumber value={l.unitPrice} prefix="€" min={0} ariaLabel="Unit price" onCommit={(v) => patchLine(i, { unitPrice: v })} />
                  ) : fmtEurExact(l.unitPrice)}
                </td>
                <td className="numeric">
                  {canEdit ? (
                    <OfferEditNumber value={l.quantity} min={1} integer ariaLabel="Quantity" onCommit={(v) => patchLine(i, { quantity: Math.max(1, Math.round(v)) })} />
                  ) : l.quantity.toLocaleString("en-IE")}
                </td>
                <td className="numeric">
                  {canEdit ? (
                    <OfferEditNumber value={l.discountPct} min={0} max={100} ariaLabel="Discount percent" onCommit={(v) => patchLine(i, { discountPct: v })} />
                  ) : l.discountPct > 0 ? `${l.discountPct}%` : "—"}
                </td>
                <td className="numeric numeric--strong">
                  {canEdit ? (
                    <OfferEditNumber
                      value={Math.round(lineNet(l) * 100) / 100}
                      prefix="€"
                      min={0}
                      ariaLabel="Net value"
                      onCommit={(v) => patchLine(i, { unitPrice: unitPriceForLineNet(l, v) })}
                    />
                  ) : fmtEurExact(lineNet(l))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={5}>List total</td><td className="numeric">{fmtEurExact(listTotal)}</td></tr>
            <tr>
              <td colSpan={5}>Headline discount</td>
              <td className="numeric">
                {canEdit ? (
                  <OfferEditNumber value={offer.discountPct} min={0} max={100} ariaLabel="Headline discount percent" onCommit={(v) => patchOffer((o) => ({ ...o, discountPct: v }))} />
                ) : `${offer.discountPct}%`}
              </td>
            </tr>
            <tr className="offer-net"><td colSpan={5}>Net total</td><td className="numeric numeric--strong">{fmtEurExact(netTotal)}</td></tr>
          </tfoot>
        </table>
      </div>

      {canEdit && (
        <p className="offer-edit-hint muted">Click any field to edit. Press Enter or click away to save.</p>
      )}

      {(canEdit || offer.justification) && (
        <div className="approval-just">
          <strong>Discount justification</strong>
          {canEdit ? (
            <textarea
              className="offer-just-input"
              defaultValue={offer.justification ?? ""}
              key={`${offer.id}-just-${offer.justification ?? ""}`}
              onBlur={(e) => {
                const v = e.target.value.trim() || null;
                if (v !== (offer.justification ?? null)) patchOffer((o) => ({ ...o, justification: v }));
              }}
              rows={2}
              placeholder="Required when headline discount is applied"
            />
          ) : (
            <p>{offer.justification}</p>
          )}
        </div>
      )}

      <SectionHead title="Approval workflow" />
      <p className="offer-stage-label">Current stage: <strong>{OFFER_STATUS_LABEL[offer.status]}</strong></p>
      <ol className="approval-steps">
        {workflow.map((step) => {
          const isActive =
            (offer.status === "pending_manager" && step.roleRequired === "sales_manager" && !step.decision)
            || (offer.status === "pending_finance" && step.roleRequired === "finance" && !step.decision);
          const showSubmit = canSubmit && step.stepOrder === 1 && !step.decision;
          const showApprove =
            (offer.status === "pending_manager" && ctx.user.role === "sales_manager" && step.roleRequired === "sales_manager" && !step.decision)
            || (offer.status === "pending_finance" && ctx.user.role === "finance" && step.roleRequired === "finance" && !step.decision);
          return (
            <li
              key={step.stepOrder}
              className={cx(
                "approval-step",
                step.decision === "approved" && "is-approved",
                step.decision === "rejected" && "is-rejected",
                isActive && "is-active",
              )}
            >
              <span className="approval-mark" aria-hidden="true">
                {step.decision === "approved" ? <Icon name="check" /> : step.decision === "rejected" ? <Icon name="close" /> : step.stepOrder}
              </span>
              <div className="approval-step-body">
                <div className="approval-step-row">
                  <strong>{step.stepOrder}. {APPROVAL_ROLE_LABEL[step.roleRequired]}</strong>
                  {showSubmit && (
                    <button className="btn btn--secondary btn--sm" type="button" onClick={() => ctx.submitOfferForApproval(offer.id)}>
                      Send for Sales Manager approval
                    </button>
                  )}
                  {showApprove && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn--primary btn--sm" type="button" onClick={() => ctx.approveOfferMade(offer.id)}>
                        <Icon name="check" />Approve offer
                      </button>
                      <button className="btn btn--danger btn--sm" type="button" onClick={() => {
                        const note = prompt("Enter rejection reason:");
                        if (note !== null) ctx.decideOffer(offer.id, "rejected", note);
                      }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
                {!step.decision && isActive && (
                  <small className="approval-step-status">In progress — action required</small>
                )}
                {!step.decision && !isActive && offer.status !== "rejected" && offer.status !== "locked" && (
                  <small className="approval-step-status">Waiting on prior step</small>
                )}
                {step.decision === "approved" && (
                  <p className="approval-step-meta">
                    {approvalStepActionLabel(step)} {userName(step.decidedById)} — {step.decidedAt}
                  </p>
                )}
                {step.decision === "rejected" && (
                  <p className="approval-step-meta approval-step-meta--rejected">
                    Rejected by {userName(step.decidedById)} — {step.decidedAt}{step.note ? ` — ${step.note}` : ""}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ===========================================================================
// Deal detail — pipeline hub for validation, offers, and cases
// ===========================================================================

function CreateCaseModal({ deal, ctx, onClose }: { deal: Deal; ctx: AppCtx; onClose: () => void }) {
  const account = accountById(deal.accountId)!;
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<CasePriority>("medium");
  const [serviceId, setServiceId] = useState(services.find((s) => !s.retired)?.id ?? "");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const id = crypto.randomUUID();
    const ref = `CASE-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().slice(0, 10);
    const caseRec: CaseRecord = {
      id,
      ref,
      accountId: deal.accountId,
      dealId: deal.id,
      serviceId: serviceId || null,
      ownerId: ctx.user.role === "tam" ? ctx.user.id : users.find((u) => u.role === "tam")?.id ?? ctx.user.id,
      contactId: contactsForAccount(deal.accountId).find((c) => c.primary)?.id ?? null,
      title: title.trim(),
      status: "open",
      priority,
      escalated: false,
      thirdPartyRef: null,
      slaDeadline: null,
      createdAt: today,
      updatedAt: today,
      notes: description.trim() ? [{ author: ctx.user.name, body: description.trim(), when: "Just now", internal: false }] : [],
    };
    ctx.addCase(caseRec);
    fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: deal.accountId, service_id: serviceId || null, priority, title: title.trim() }),
    }).catch(console.error);
    ctx.notify(`${ref} opened for ${deal.title}.`);
    onClose();
  };

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="create-case-title" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div><h2 id="create-case-title">Create case</h2><p className="modal-context">{deal.title} · {account.name}</p></div>
          <button className="icon-btn" aria-label="Close" onClick={onClose} type="button"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <label className="field"><span className="field-label">Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus /></label>
          <div className="modal-grid">
            <div className="field"><span className="field-label">Priority</span>
              <CustomSelect
                value={priority}
                options={PRIORITY_OPTIONS}
                onChange={(v) => setPriority(v as CasePriority)}
              />
            </div>
            <div className="field"><span className="field-label">Service</span>
              <CustomSelect
                value={serviceId}
                options={serviceOptions()}
                onChange={setServiceId}
                placeholder="Select service"
              />
            </div>
          </div>
          <label className="field"><span className="field-label">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What does the customer need during testing?" />
          </label>
          <div className="modal-foot">
            <button className="btn btn--ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" type="submit" disabled={submitting || !title.trim()}>Create case</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function DynamicForecastPanel({ deal, ctx }: { deal: Deal; ctx: AppCtx }) {
  const competitors = competitorsForDeal(deal.id);
  const resolveOffer = (id: string) => ctx.offerState[id] ?? seedOffers.find((o) => o.id === id);
  const forecast = dynamicForecast(deal, competitors, resolveOffer);
  const industryStats = industryStatsList().find((s) => s.industry === forecast.industry);

  return (
    <div className="dynamic-forecast">
      <div className="dynamic-forecast-head">
        <div>
          <span className="dynamic-forecast-label">Dynamic forecast</span>
          <strong className="dynamic-forecast-pct">{fmtPct(forecast.probability)}</strong>
          <span className="muted dynamic-forecast-fixed">Fixed ladder: {fmtPct(forecast.fixedProbability)}</span>
        </div>
        <div className="dynamic-forecast-value">
          <span className="muted">Weighted value</span>
          <strong className="numeric">{fmtEur(forecast.weightedValue)}</strong>
        </div>
      </div>
      <p className="dynamic-forecast-summary">{forecast.summary}</p>
      <ul className="dynamic-forecast-details">
        {forecast.detailLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {industryStats && (
        <p className="dynamic-forecast-benchmark muted">
          {forecast.industry}: {fmtPct(industryStats.dealWinRate)} deal win rate · {fmtPct(industryStats.serviceCaseWinRate)} service-case resolution
        </p>
      )}
    </div>
  );
}

function CompetitorsSection({ deal, ctx }: { deal: Deal; ctx: AppCtx }) {
  const competitors = competitorsForDeal(deal.id);
  const [name, setName] = useState("");
  const [netTotal, setNetTotal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const parsed = netTotal.trim() ? Number(netTotal) : null;
      if (parsed != null && (!Number.isFinite(parsed) || parsed < 0)) {
        ctx.notify("Net total must be a non-negative number.");
        return;
      }
      await ctx.addCompetitor(deal.id, name.trim(), parsed);
      setName("");
      setNetTotal("");
      ctx.notify("Competitor added.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <SectionHead title="Competitors" count={competitors.length} />
      {competitors.length ? (
        <ul className="stack-list competitor-list">
          {competitors.map((c) => (
            <li key={c.id}>
              <span className="row-main">
                <strong>{c.name}</strong>
                <small>{c.netTotal != null ? `Net offer ${fmtEurExact(c.netTotal)}` : "Net offer not recorded"}</small>
              </span>
              <span className="row-side">
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => void ctx.removeCompetitor(deal.id, c.id)}>Remove</button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No competitors recorded — add vendors bidding against this deal.</Empty>
      )}
      <form className="competitor-form" onSubmit={(e) => void submit(e)}>
        <div className="competitor-form-row">
          <label className="field field--grow">
            <span className="field-label">Competitor name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Motorola Solutions" required />
          </label>
          <label className="field">
            <span className="field-label">Net total (optional)</span>
            <input value={netTotal} onChange={(e) => setNetTotal(e.target.value)} placeholder="€" inputMode="decimal" />
          </label>
          <button className="btn btn--secondary" type="submit" disabled={submitting || !name.trim()}><Icon name="plus" />Add</button>
        </div>
      </form>
    </section>
  );
}

function IndustryBenchmarks() {
  const stats = industryStatsList().filter((s) => s.dealTotal > 0 || s.serviceCasesTotal > 0);
  if (!stats.length) return null;
  return (
    <details className="industry-benchmarks card-edge">
      <summary>Industry win benchmarks</summary>
      <div className="table-wrap">
        <table className="compact">
          <thead>
            <tr>
              <th>Industry</th>
              <th className="numeric">Deal win rate</th>
              <th className="numeric">Service case resolution</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.industry}>
                <th scope="row">{s.industry}</th>
                <td className="numeric">{fmtPct(s.dealWinRate)}<small className="muted"> ({s.dealWon}/{s.dealTotal})</small></td>
                <td className="numeric">{fmtPct(s.serviceCaseWinRate)}<small className="muted"> ({s.serviceCasesResolved}/{s.serviceCasesTotal})</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted industry-benchmarks-note">Deal win rate = closed deals ÷ all deals in the industry. Service resolution = resolved or closed cases ÷ all cases in the industry.</p>
    </details>
  );
}

function DealDetail({ deal: dealInput, ctx, embedded }: { deal: Deal; ctx: AppCtx; embedded?: boolean }) {
  const deal = liveDeal(ctx, ctx.eff("deal", dealInput));
  const account = accountById(deal.accountId)!;
  const contacts = contactsForAccount(deal.accountId);
  const dealInsights = insightsForDeal(deal.id);
  const baseActivity = activityForDeal(deal.id);
  const [offerModal, setOfferModal] = useState(false);
  const [caseModal, setCaseModal] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftKind, setDraftKind] = useState<"note" | "meeting" | "call" | "email">("note");
  const [draft, setDraft] = useState("");
  const dealOffers = offersForDeal(deal.id).map((o) => ctx.offerState[o.id] ?? o);
  const dealCases = casesForDeal(deal.id).map((c) => ctx.eff("case", c));
  const openDealCases = dealCases.filter((c) => c.status !== "resolved" && c.status !== "closed").length;
  const isLead = deal.stage === "lead";
  const madeOffer = madeOfferForDeal(deal.id, (id) => ctx.offerState[id] ?? seedOffers.find((o) => o.id === id));
  const economicsLocked = Boolean(madeOffer);
  const deviceVal = deviceTotal(deal);
  const serviceVal = serviceTotal(deal.id);
  const totalVal = dealTotal(deal);
  const gmVal = dealGrossMargin(deviceVal, serviceVal);

  const submitLog = () => {
    if (!draft.trim()) return;
    ctx.logActivity({ accountId: deal.accountId, dealId: deal.id, kind: draftKind, summary: draft.trim() });
    setDraft("");
    setComposerOpen(false);
    ctx.notify("Activity logged to the deal timeline.");
  };

  const contactNote = deal.stage === "lead" && !deal.leadValidated
    ? "Reach out to confirm need, budget holder, and timeline before validating this lead."
    : undefined;

  return (
    <section className="record">
      {!embedded && <button className="back" onClick={() => ctx.go("deals")} type="button"><Icon name="back" />Deals</button>}

      <header className="record-head">
        <div className="record-head-main">
          <div className="record-title-row">
            <h1>{deal.title}</h1>
            <StatusTag stage={deal.stage} />
            {deal.leadValidated && <ValidatedTag />}
          </div>
          <p className="record-sub">
            <button className="ghost-link" onClick={() => ctx.openAccount(deal.accountId)} type="button">{account.name}</button>
            {" · "}{deal.channel === "direct" ? "Direct" : "Reseller"}{deal.isPilot ? " · Pilot" : ""}
            {" · Owner "}<strong>{userName(deal.ownerId)}</strong>
          </p>
        </div>
        <div className="record-actions">
          {deal.stage === "lead" && !deal.leadValidated && (
            <button className="btn btn--secondary" onClick={() => ctx.validateLead(deal.id)} type="button"><Icon name="check" />Validate lead</button>
          )}
          {deal.stage === "offer" && (
            <button className="btn btn--primary" onClick={() => setOfferModal(true)} type="button"><Icon name="plus" />Create offer</button>
          )}
          {deal.stage === "customer_testing" && (
            <button className="btn btn--primary" onClick={() => setCaseModal(true)} type="button"><Icon name="plus" />Create case</button>
          )}
        </div>
      </header>

      <div className="kpi-strip kpi-strip--tight kpi-strip--deal">
        {isLead && !economicsLocked ? (
          <>
            <div className="kpi kpi--editable">
              <span className="kpi-label">Total value</span>
              <CellNumber value={totalVal} prefix="€" min={0} onCommit={(v) => void ctx.updateDeal(deal, { total: v })} />
            </div>
            <div className="kpi kpi--editable">
              <span className="kpi-label">Expected close</span>
              <input
                type="date"
                className="kpi-date-input"
                value={deal.expectedClose?.slice(0, 10) ?? ""}
                onChange={(e) => void ctx.updateDeal(deal, { expectedClose: e.target.value })}
              />
            </div>
            <Kpi label="Open cases" value={`${openDealCases}`} tone={openDealCases ? "warn" : undefined} />
          </>
        ) : (
          <>
            <Kpi label="Total value" value={fmtEur(totalVal)} />
            <Kpi label="Expected close" value={fmtExpectedClose(deal.expectedClose)} tone={isOverdue(deal) ? "warn" : undefined} />
            <Kpi label="Open cases" value={`${openDealCases}`} tone={openDealCases ? "warn" : undefined} />
          </>
        )}
      </div>

      <div className="record-body">
        <div className="record-col">
          <section>
            <SectionHead title="Pipeline status" />
            <div className="deal-status-row">
              <InlineStage deal={deal} ctx={ctx} />
              <RiskTag deal={deal} />
            </div>
            {(isOpen(deal) || deal.apiStage === "lost") && <DynamicForecastPanel deal={deal} ctx={ctx} />}
          </section>

          <CompetitorsSection deal={deal} ctx={ctx} />

          <section>
            <SectionHead title="Offers" count={dealOffers.length} />
            {dealOffers.length ? (
              <ul className="stack-list">
                {dealOffers.map((o) => (
                  <li key={o.id}>
                    <button className="row-main" onClick={() => ctx.openOffers(o.id)} type="button">
                      <span><strong>{o.ref}</strong><small>v{o.version} · {o.discountPct > 0 ? `${o.discountPct}% discount` : "list price"}</small></span>
                    </button>
                    <span className="row-side"><strong className="numeric">{fmtEur(offerGrandNet(o))}</strong><OfferPill status={o.status} /></span>
                  </li>
                ))}
              </ul>
            ) : <Empty>{deal.stage === "offer" ? "No offers yet — create one to send to the customer." : "Offers appear here once the deal reaches the Offer stage."}</Empty>}
          </section>

          <section>
            <SectionHead title="Cases" count={dealCases.length} />
            {dealCases.length ? (
              <ul className="stack-list">
                {dealCases.map((c) => (
                  <li key={c.id}>
                    <button className="row-main" onClick={() => ctx.openCase(c.id)} type="button">
                      <span><strong>{c.title}</strong><small>{c.ref} · {CASE_STATUS_LABEL[c.status]}</small></span>
                    </button>
                    <span className="row-side"><PriorityTag priority={c.priority} /></span>
                  </li>
                ))}
              </ul>
            ) : <Empty>{deal.stage === "customer_testing" ? "No cases yet — create one for customer testing support." : "Cases appear here once the deal reaches Customer testing."}</Empty>}
          </section>

          <section>
            <SectionHead title="Activity" count={baseActivity.length}>
              {!composerOpen && (
                <button className="btn btn--secondary btn--sm" onClick={() => setComposerOpen(true)} aria-expanded={composerOpen} type="button">Log activity</button>
              )}
            </SectionHead>
            {composerOpen && (
              <div className="composer">
                <div className="composer-kinds">
                  {(["note", "meeting", "call", "email"] as const).map((k) => (
                    <button key={k} className={cx("chip", draftKind === k && "chip--active")} onClick={() => setDraftKind(k)} type="button" aria-pressed={draftKind === k}>{k[0]!.toUpperCase() + k.slice(1)}</button>
                  ))}
                </div>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Log a ${draftKind} for ${deal.title}…`} rows={2}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitLog(); if (e.key === "Escape") setComposerOpen(false); }} />
                <div className="composer-actions">
                  <span className="muted">⌘↵ to save</span>
                  <button className="btn btn--ghost btn--sm" onClick={() => setComposerOpen(false)} type="button">Cancel</button>
                  <button className="btn btn--primary btn--sm" onClick={submitLog} disabled={!draft.trim()} type="button">Log activity</button>
                </div>
              </div>
            )}
            {baseActivity.length ? (
              <ol className="timeline">
                {baseActivity.map((e) => (
                  <li key={e.id} className={cx(`tl tl--${e.kind}`, e.isAi && "tl--ai")}><span className="tl-dot" /><div><strong>{e.isAi && <Icon name="spark" />}{e.summary}</strong><small>{e.isAi ? "AI agent" : userName(e.actorId)} · {e.when}</small></div></li>
                ))}
              </ol>
            ) : <Empty>No activity logged for this deal yet.</Empty>}
          </section>
        </div>

        <aside className="record-side">
          {embedded && dealOffers.length > 0 && (
            <section className="panel">
              <SectionHead title="Offers" count={dealOffers.length} />
              <ul className="stack-list stack-list--compact">
                {dealOffers.map((o) => (
                  <li key={o.id}>
                    <button className="row-main" type="button" onClick={() => ctx.openOffers(o.id)}>
                      <span><strong>{o.ref}</strong><small>{OFFER_STATUS_LABEL[o.status]}</small></span>
                    </button>
                    <span className="row-side"><OfferPill status={o.status} /></span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {embedded && dealCases.length > 0 && (
            <section className="panel">
              <SectionHead title="Cases" count={dealCases.length} />
              <ul className="stack-list stack-list--compact">
                {dealCases.map((c) => (
                  <li key={c.id}>
                    <button className="row-main" type="button" onClick={() => ctx.openCase(c.id)}>
                      <span><strong>{c.title}</strong><small>{CASE_STATUS_LABEL[c.status]}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="panel">
            <SectionHead title="Account contacts" count={contacts.length} />
            <ContactList contacts={contacts} note={contactNote} />
          </section>

          <section className="panel">
            <SectionHead title="Deal economics" />
            {madeOffer && <p className="muted economics-note">Values from offer {madeOffer.ref} (made).</p>}
            <dl className="meta-dl">
              <div>
                <dt>Device</dt>
                <dd className="numeric">
                  {isLead && !economicsLocked ? (
                    <CellNumber value={deviceVal} prefix="€" min={0} onCommit={(v) => void ctx.updateDeal(deal, { device: v })} />
                  ) : fmtEurExact(deviceVal)}
                </dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd className="numeric">
                  {isLead && !economicsLocked ? (
                    <CellNumber value={serviceVal} prefix="€" min={0} onCommit={(v) => void ctx.updateDeal(deal, { service: v })} />
                  ) : fmtEurExact(serviceVal)}
                </dd>
              </div>
              <div><dt>Gross margin</dt><dd className="numeric">{fmtEurExact(gmVal)}</dd></div>
            </dl>
          </section>

          <section>
            <SectionHead title="AI deal review" count={dealInsights.length} />
            {dealInsights.length ? (
              <div className="insight-stack">
                {dealInsights.map((i) => (
                  <InsightCard key={i.id} insight={i} status={ctx.insightStatus[i.id] ?? i.status}
                    onAccept={() => { ctx.setInsight(i.id, "accepted"); ctx.notify("Accepted. No CRM data changed automatically."); }}
                    onDismiss={() => { ctx.setInsight(i.id, "dismissed"); ctx.notify("Dismissed."); }} />
                ))}
              </div>
            ) : (
              <Empty>No AI suggestions for this deal yet.</Empty>
            )}
          </section>
        </aside>
      </div>

      {offerModal && (
        <BuildOfferModal deal={deal} ctx={ctx} onClose={() => setOfferModal(false)} />
      )}
      {caseModal && <CreateCaseModal deal={deal} ctx={ctx} onClose={() => setCaseModal(false)} />}
    </section>
  );
}

// ===========================================================================
// Deals (table + kanban)
// ===========================================================================

function DealsView({ ctx }: { ctx: AppCtx }) {
  const [mode, setMode] = useState<"table" | "board">("table");
  const [dealModal, setDealModal] = useState(false);
  const [q, setQ] = useState("");
  const [onlyRisk, setOnlyRisk] = useState(false);
  const [channel, setChannel] = useState<"all" | "direct" | "reseller">("all");

  const query = q.trim().toLowerCase();
  const filtered = seedDeals.map((d) => liveDeal(ctx, d)).filter((d) => {
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
      <PageHead title="Deals" actions={
        <button className="btn btn--primary" onClick={() => setDealModal(true)} type="button"><Icon name="plus" />New deal</button>
      } />

      <div className="toolbar">
        <div className="saved-views" role="tablist" aria-label="Saved views">
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

      <IndustryBenchmarks />

      {mode === "table"
        ? <DealTable deals={open} ctx={ctx} />
        : <DealBoard deals={filtered} ctx={ctx} />}
      {dealModal && <NewDealModal ctx={ctx} onClose={() => setDealModal(false)} />}
    </>
  );
}

function InlineStage({ deal, ctx }: { deal: Deal; ctx: AppCtx }) {
  const options = pipelineStages(deal.channel).map((s) => ({ value: s, label: STAGE_META[s].label }));
  const current = options.find((o) => o.value === deal.stage) ? deal.stage : (options[0]?.value ?? deal.stage);
  return (
    <span className="inline-edit" onClick={(e) => e.stopPropagation()}>
      <span className="sr-only">Stage for {deal.title}</span>
      <CustomSelect
        className="inline-stage"
        value={current}
        options={options}
        onChange={(v) => ctx.requestMoveDeal(deal.id, v as Stage)}
        compact
      />
      <Icon name="chevronDown" />
    </span>
  );
}

function DealTable({ deals, ctx }: { deals: Deal[]; ctx: AppCtx }) {
  if (!deals.length) return <Empty>No deals match this view.</Empty>;
  return (
    <div className="table-wrap card-edge">
      <table>
        <thead><tr><th>Deal</th><th>Status</th><th>Signal</th><th>Owner</th><th>Expected close</th><th className="numeric">Dynamic</th><th className="numeric">Next qtr</th><th className="numeric">3-yr total</th><th className="numeric">GM</th><th aria-label="Open" /></tr></thead>
        <tbody>
          {deals.map((base) => {
            const d = liveDeal(ctx, ctx.eff("deal", base));
            const acc = accountById(d.accountId)!;
            const dyn = dynamicForecast(d, competitorsForDeal(d.id), (id) => ctx.offerState[id] ?? seedOffers.find((o) => o.id === id));
            return (
              <tr key={d.id} className="row-click" onClick={() => ctx.openDeal(d.id)}>
                <th scope="row">
                  <span className="account-cell"><span className="account-logo sm" aria-hidden="true">{monogram(acc.name)}</span>
                    <span><CellText value={d.title} onCommit={(v) => ctx.patch("deal", d.id, "title", v)} /><small>{acc.name} · {d.channel === "direct" ? "Direct" : "Reseller"}{d.isPilot ? " · Pilot" : ""}{d.leadValidated ? " · Validated" : ""}</small></span></span>
                </th>
                <td className="cell-edit"><InlineStage deal={d} ctx={ctx} /></td>
                <td><span className="signal-cell"><RiskTag deal={d} /><small className="activity-hint">{activityHint(d)}</small></span></td>
                <td><CellSelect value={d.ownerId} options={repOptions()} onCommit={(v) => ctx.patch("deal", d.id, "ownerId", v)} /></td>
                <td className={isOverdue(d) ? "t-danger" : ""}><CellDate value={d.expectedClose} onCommit={(v) => ctx.patch("deal", d.id, "expectedClose", v)} /></td>
                <td className="numeric">{d.stage === "closed" && d.apiStage !== "lost" ? "100%" : d.apiStage === "lost" ? "0%" : fmtPct(dyn.probability)}</td>
                <td className="numeric">{fmtEur(nextQuarterValue(d))}</td>
                <td className="numeric numeric--strong">{fmtEur(dealTotal(d))}</td>
                <td className="numeric">{fmtEur(dealMeasureTotal(d, "gm"))}</td>
                <td><OpenButton label={`Open ${d.title}`} onClick={() => ctx.openDeal(d.id)} /></td>
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
  const competitors = competitorsForDeal(deal.id);
  const resolveOffer = (id: string) => ctx.offerState[id] ?? seedOffers.find((o) => o.id === id);
  const dyn = dynamicForecast(deal, competitors, resolveOffer);
  return (
    <article
      className={cx("deal-card", !draggable && "deal-card--static", dragId === deal.id && "deal-card--drag")}
      draggable={draggable}
      onDragStart={draggable ? (e) => { e.dataTransfer.setData("text/plain", deal.id); setDragId(deal.id); } : undefined}
      onDragEnd={draggable ? () => { setDragId(null); setOver(null); } : undefined}
    >
      <div className="deal-card-top">
        {draggable && <span className="grip" aria-hidden="true"><Icon name="grip" /></span>}
        <button className="deal-card-open" onClick={() => ctx.openDeal(deal.id)} type="button"><strong>{deal.title}</strong><small>{acc.name} · {deal.channel === "direct" ? "Direct" : "Reseller"}{deal.leadValidated ? " · Validated" : ""}</small></button>
      </div>
      <div className="deal-card-figs"><span className="numeric numeric--strong">{fmtEur(dealTotal(deal))}</span><RiskTag deal={deal} /></div>
      {deal.stage !== "closed" && (
        <div className="deal-card-forecast">
          <span className="deal-card-forecast-fixed">{STAGE_META[deal.stage].csv}</span>
          <span className="deal-card-forecast-dynamic" title={dyn.summary}>Dynamic {fmtPct(dyn.probability)}</span>
        </div>
      )}
      <div className="deal-card-foot">
        <span className="board-owner"><Avatar name={userName(deal.ownerId)} size="xs" />{userName(deal.ownerId)}</span>
        <span className="board-close"><Icon name="clock" />{fmtExpectedClose(deal.expectedClose)}</span>
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
              onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); ctx.requestMoveDeal(id, status); setDragId(null); setOver(null); }}
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
        <thead><tr><th>Case</th><th>Priority</th><th>Status</th>{!compact && <th>Service</th>}<th>Owner</th><th>Age</th><th aria-label="Open" /></tr></thead>
        <tbody>
          {cases.map((base) => {
            const c = ctx.eff("case", base);
            return (
              <tr key={c.id} className="row-click" onClick={() => ctx.openCase(c.id)}>
                <th scope="row"><CellText value={c.title} onCommit={(v) => ctx.patch("case", c.id, "title", v)} /><small className="muted">{c.ref} · {accountById(c.accountId)!.name}{c.escalated ? " · escalated" : ""}</small></th>
                <td><CellSelect value={c.priority} options={PRIORITY_OPTIONS} onCommit={(v) => ctx.patch("case", c.id, "priority", v)} /></td>
                <td><CellSelect value={c.status} options={CASE_STATUS_OPTIONS} onCommit={(v) => ctx.patch("case", c.id, "status", v)} /></td>
                {!compact && <td><CellSelect value={c.serviceId ?? ""} options={serviceOptions()} onCommit={(v) => ctx.patch("case", c.id, "serviceId", v)} /></td>}
                <td><CellSelect value={c.ownerId} options={tamOptions()} onCommit={(v) => ctx.patch("case", c.id, "ownerId", v)} /></td>
                <td>{caseAgeDays(c)}d</td>
                <td><OpenButton label={`Open ${c.ref}`} onClick={() => ctx.openCase(c.id)} /></td>
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
      <PageHead title="Cases" actions={
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

function CaseDetail({ caseRec: caseInput, ctx, embedded }: { caseRec: CaseRecord; ctx: AppCtx; embedded?: boolean }) {
  const caseRec = ctx.eff("case", caseInput);
  const account = accountById(caseRec.accountId)!;
  const svc = serviceById(caseRec.serviceId);
  const contact = contactById(caseRec.contactId);
  const extraNotes = ctx.caseNotes[caseRec.id] ?? [];
  const notes = [...extraNotes, ...caseRec.notes];
  const [draft, setDraft] = useState("");
  const [internal, setInternal] = useState(false);

  const add = () => {
    if (!draft.trim()) return;
    ctx.logActivity({
      accountId: caseRec.accountId,
      kind: "note",
      summary: `${ctx.user.name} added a note: ${draft.trim()}`,
      entityType: "case",
      entityId: caseRec.id,
      eventType: "note_added",
      payload: { text: draft.trim(), author_name: ctx.user.name, internal }
    });
    ctx.addNote(caseRec.id, { author: ctx.user.name, body: draft.trim(), when: "Just now", internal });
    setDraft(""); ctx.notify("Note added to the case log.");
  };

  return (
    <section className="record">
      {!embedded && <button className="back" onClick={() => ctx.go("cases")} type="button"><Icon name="back" />Cases</button>}
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
  const [buildOfferModal, setBuildOfferModal] = useState(false);
  useEffect(() => { if (focus) setSelected(focus); }, [focus]);
  const offer = list.find((o) => o.id === selected) ?? list[0]!;

  return (
    <>
      <PageHead title="Offers" />
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

        <OfferDetailPanel offer={offer} ctx={ctx} onBuildOffer={() => setBuildOfferModal(true)} />
      </div>
      {buildOfferModal && (
        <BuildOfferModal
          deal={dealById(offer.dealId)!}
          ctx={ctx}
          onClose={() => setBuildOfferModal(false)}
          onCreated={(id) => setSelected(id)}
        />
      )}
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

function roundTo(n: number, step: number): number {
  return Math.ceil(n / step) * step;
}

// What threatens (or holds up) a deal's contribution to the forecast — the same
// deterministic signals the explainability panel itemises.
type AttentionReason = { code: string; label: string; tone: "danger" | "warn" };

function attentionReasons(deal: Deal, openInsights: AiInsight[]): AttentionReason[] {
  const out: AttentionReason[] = [];
  if (isOverdue(deal)) out.push({ code: "overdue", label: "Past close date", tone: "danger" });
  if (isStale(deal)) out.push({ code: "stale", label: `Stalled ${daysSinceUpdate(deal)}d`, tone: "warn" });
  if (deal.devicePhases.length === 0) out.push({ code: "no_forecast", label: "No forecast entered", tone: "warn" });
  for (const ins of openInsights.filter((i) => i.type === "risk_flag")) {
    out.push({ code: "ai_risk", label: "AI risk flag", tone: ins.severity === "high" ? "danger" : "warn" });
  }
  return out;
}

function ForecastView({ ctx }: { ctx: AppCtx }) {
  const [lens, setLens] = useState<"commitment" | "streams" | "region" | "owner">("commitment");
  const [measure, setMeasure] = useState<Measure>("net_sales");
  const [gran, setGran] = useState<Granularity>("year");
  const [cumulative, setCumulative] = useState(false);
  const [probs, setProbs] = useState<StageProbs>(() => defaultStageProbs());
  const [explainId, setExplainId] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [narrativeOpen, setNarrativeOpen] = useState(true);

  const isFinance = ctx.user.role === "finance";
  const live = seedDeals.map((d) => liveStage(ctx, d));
  const buckets = periodBuckets(gran);

  const regionRows = lens === "region" ? regionSeries(live, measure) : null;
  const series: Series[] =
    lens === "commitment" ? tierSeries(live, measure)
      : lens === "streams" ? streamSeries(live, measure)
        : lens === "owner" ? ownerSeries(live, measure, userName)
          : regionRows!;

  const colorClass = (key: string, i: number) =>
    lens === "commitment" ? `fseg fseg--tier-${key}` : lens === "streams" ? `fseg fseg--${key}` : `fseg fseg--r${i % 6}`;
  const swatchClass = (key: string, i: number) => colorClass(key, i).replace("fseg ", "");

  // Bucket value, with optional rolling-cumulative view (forecasts are cumulative).
  const seriesBucket = (se: Series, bi: number) =>
    cumulative
      ? buckets.slice(0, bi + 1).reduce((s, b) => s + bucketSum(se.values, b.idx), 0)
      : bucketSum(se.values, buckets[bi]!.idx);
  const colTotal = (bi: number) => series.reduce((s, se) => s + seriesBucket(se, bi), 0);

  const grand = forecastTotal(live, measure);
  const colMax = Math.max(1, ...buckets.map((_, bi) => colTotal(bi)));

  // Headline metrics are always net-sales money, device vs service kept apart,
  // never summed into one blended figure (FORECAST.md §1, §4.1).
  const wDevice = weightedStream(live, "device", "net_sales", probs);
  const wService = weightedStream(live, "service", "net_sales", probs);
  const weighted = wDevice + wService;
  const committed = committedForecast(live, "net_sales");
  const atRisk = atRiskForecast(live, "net_sales", probs);
  const targetVal = target ?? roundTo(Math.max(weighted * 1.2, weighted + 500_000), 500_000);
  const gap = targetVal - weighted;

  const ladder = stageLadder(live, measure, probs);
  const hasReseller = live.some((d) => inForecast(d) && d.channel === "reseller" && d.stage === "customer_testing");

  // Needs-attention: open deals where acting de-risks or unlocks counted value.
  const attention = live
    .filter(inForecast)
    .map((d) => {
      const inss = insightsForDeal(d.id).filter((i) => (ctx.insightStatus[i.id] ?? i.status) === "pending_review");
      const reasons = attentionReasons(d, inss);
      const next = inss.find((i) => i.type === "next_action");
      const weight = dealWeighted(d, "net_sales", probs);
      const score = reasons.reduce((s, r) => s + (r.tone === "danger" ? 2 : 1), 0) * 1_000_000 + weight;
      return { deal: d, reasons, next, weight, score };
    })
    .filter((r) => r.reasons.length > 0)
    .sort((a, b) => b.score - a.score);

  // Deterministic AI narrative — built from the numbers above, not a chat model.
  const topRisk = attention[0];
  const stalledCount = attention.filter((a) => a.reasons.some((r) => r.code === "overdue" || r.code === "stale")).length;
  const narrative =
    `Weighted 3-year net sales stands at ${fmtEur(weighted)} across ${live.filter(inForecast).length} open deals — ` +
    `${fmtEur(wDevice)} device and ${fmtEur(wService)} service, kept separate. ` +
    `${fmtEur(committed)} sits in Final negotiation (most committed). ` +
    (atRisk > 0
      ? `${fmtEur(atRisk)} is at risk across ${stalledCount} stalled or overdue ${stalledCount === 1 ? "deal" : "deals"}` +
        (topRisk ? `, led by ${accountById(topRisk.deal.accountId)?.name ?? topRisk.deal.title}. ` : ". ")
      : "No deals are currently flagged stale or overdue. ") +
    `Gap to the ${fmtEur(targetVal)} target is ${gap > 0 ? fmtEur(gap) + " short" : fmtEur(-gap) + " ahead"}.`;

  const exportCsv = () => {
    const header = ["Category", ...buckets.map((b) => b.label), "Total"];
    const rows = series.map((se) => [se.label, ...buckets.map((_, bi) => Math.round(seriesBucket(se, bi))), Math.round(se.total)].join(","));
    rows.push(["Total", ...buckets.map((_, bi) => Math.round(colTotal(bi))), Math.round(grand)].join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `hmd-forecast-${lens}-${measure}-${gran}${cumulative ? "-cumulative" : ""}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    ctx.notify("Forecast exported to CSV.");
  };

  const lensLabel = lens === "commitment" ? "Commitment tier" : lens === "streams" ? "Revenue stream" : lens === "owner" ? "Owner" : "Country";

  return (
    <>
      <PageHead title="Forecast" actions={
        <button className="btn btn--secondary" onClick={exportCsv} type="button"><Icon name="download" />Export CSV</button>
      } />

      <div className="kpi-strip kpi-strip--tight">
        <Kpi label="Weighted forecast" value={fmtEur(weighted)} hint="Tier-weighted · 3-year net sales" />
        <SplitKpi label="Device vs service" device={wDevice} service={wService} />
        <Kpi label="Committed" value={fmtEur(committed)} tone="good" hint="Final negotiation · very high win" />
        <Kpi label="At risk" value={fmtEur(atRisk)} tone={atRisk > 0 ? "danger" : undefined} hint="Stalled or past close date" />
        <Kpi label="Gap to target" value={gap > 0 ? fmtEur(gap) : `+${fmtEur(-gap)}`} tone={gap > 0 ? "warn" : "good"} hint={`Target ${fmtEur(targetVal)}`} />
      </div>

      {narrativeOpen && (
        <div className="ai-narrative">
          <div className="ai-narrative-head">
            <span className="ai-badge"><Icon name="spark" />AI forecast narrative</span>
            <button className="icon-btn" aria-label="Dismiss narrative" type="button" onClick={() => setNarrativeOpen(false)}><Icon name="close" /></button>
          </div>
          <p>{narrative}</p>
          <small className="ai-narrative-foot">Generated from the figures on this page. Review before quoting in a forecast meeting.</small>
        </div>
      )}

      <div className="toolbar">
        <div className="saved-views" role="tablist" aria-label="Forecast lens">
          {([["commitment", "Commitment"], ["streams", "Device vs service"], ["region", "By region"], ["owner", "By owner"]] as const).map(([k, label]) => (
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
          <button className={cx("chip-toggle", cumulative && "chip-toggle--on")} aria-pressed={cumulative} onClick={() => setCumulative((v) => !v)} type="button">Cumulative</button>
        </div>
      </div>

      <p className="forecast-caption">
        {lens === "commitment" ? "Net value by deal status — Lead → Offer → Customer testing → Final negotiation (Closed excluded from the forward forecast)."
          : lens === "streams" ? "Device and service revenue kept separate, never flattened into one number."
            : lens === "owner" ? "The same pipeline split by deal owner — switching lens never duplicates a deal."
              : "Regional split with gross-margin percentage, the way the forecast sheet reads."}
        {" Showing "}<strong>{MEASURE_LABEL[measure]}</strong>{cumulative ? ", cumulative" : ", per period"}.
      </p>

      <WinProbabilityLadder ladder={ladder} measure={measure} probs={probs} setProbs={isFinance ? setProbs : undefined} hasReseller={hasReseller} />

      <SectionHead title="Time-phased forecast" />
      <div className="forecast-sheet">
        <table className="forecast-table">
          <thead>
            <tr><th>{lensLabel}</th>{buckets.map((b) => <th key={b.label} className="numeric">{b.label}</th>)}<th className="numeric">Total</th>{lens === "region" && <th className="numeric">GM %</th>}</tr>
          </thead>
          <tbody>
            {series.map((se, i) => (
              <tr key={se.key}>
                <th scope="row"><span className={`swatch ${swatchClass(se.key, i)}`} />{se.label}{lens === "commitment" && <span className="mini-tag">{STAGE_META[se.key as Stage].csv}</span>}</th>
                {buckets.map((b, bi) => <td key={b.label} className="numeric">{fmtMeasure(seriesBucket(se, bi), measure)}</td>)}
                <td className="numeric numeric--strong">{fmtMeasure(cumulative ? seriesBucket(se, buckets.length - 1) : se.total, measure)}</td>
                {lens === "region" && regionRows && <td className="numeric">{Math.round((regionRows[i]?.gmPct ?? 0) * 100)}%</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row">Total</th>{buckets.map((b, bi) => <td key={b.label} className="numeric numeric--strong">{fmtMeasure(colTotal(bi), measure)}</td>)}<td className="numeric numeric--strong">{fmtMeasure(cumulative ? colTotal(buckets.length - 1) : grand, measure)}</td>{lens === "region" && <td className="numeric">{Math.round((forecastTotal(live, "gm") / forecastTotal(live, "net_sales")) * 100)}%</td>}</tr>
          </tfoot>
        </table>
      </div>

      <div className="forecast-bars">
        {buckets.map((b, bi) => (
          <div className="fbar" key={b.label}>
            <span className="fbar-track" aria-hidden="true">
              {series.map((se, i) => {
                const v = seriesBucket(se, bi);
                return v > 0 ? <span key={se.key} className={colorClass(se.key, i)} style={{ height: `${(v / colMax) * 100}%` }} /> : null;
              })}
            </span>
            <strong>{fmtMeasure(colTotal(bi), measure)}</strong>
            <small>{b.label}</small>
          </div>
        ))}
      </div>
      <div className="phasing-legend phasing-legend--center">
        {series.map((se, i) => <span key={se.key}><i className={`swatch ${swatchClass(se.key, i)}`} />{se.label}</span>)}
      </div>

      <div className="forecast-lower">
        <section>
          <SectionHead title="Needs attention" count={attention.length} />
          <p className="forecast-caption forecast-caption--tight">Deals where acting de-risks the forecast or unlocks counted value. Ranked by risk, then weighted contribution.</p>
          {attention.length === 0 ? <Empty>No open deals are stalled, overdue, or missing a forecast.</Empty> : (
            <ul className="attn-list">
              {attention.map(({ deal, reasons, next, weight }) => (
                <li key={deal.id}>
                  <button className="attn-row" type="button" onClick={() => setExplainId(deal.id)}>
                    <span className="attn-main">
                      <span className="attn-title">{deal.title}</span>
                      <span className="attn-sub">{accountById(deal.accountId)?.name} · {STAGE_META[deal.stage].label}</span>
                      <span className="attn-reasons">
                        {reasons.map((r) => <span key={r.code} className={`reason reason--${r.tone}`}>{r.label}</span>)}
                      </span>
                      {next && <span className="attn-next"><Icon name="spark" />{next.headline}</span>}
                    </span>
                    <span className="attn-weight">
                      <strong>{fmtEur(weight)}</strong>
                      <small>weighted</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionHead title="Forecast controls" />
          {isFinance ? (
            <div className="fc-controls">
              <label className="fc-target">
                <span>Revenue target (3-year)</span>
                <input
                  type="number" inputMode="numeric" step={100_000} value={Math.round(targetVal)}
                  onChange={(e) => setTarget(Number(e.target.value) || 0)}
                />
              </label>
              <p className="forecast-caption forecast-caption--tight">Stage win-probabilities are editable on the ladder above. Changes re-price the weighted forecast, at-risk, and gap in real time. Reseller deals use a {Math.round(RESELLER_TEST_PROB * 100)}% Customer-testing gate.</p>
              <button className="btn btn--secondary" type="button" onClick={() => { setProbs(defaultStageProbs()); setTarget(null); ctx.notify("Forecast weighting reset to defaults."); }}>Reset to defaults</button>
            </div>
          ) : (
            <div className="fc-controls">
              <p className="forecast-caption forecast-caption--tight">Win-probability weighting and the revenue target are maintained by Finance. You are seeing the live weighted picture they configured.</p>
              <dl className="fc-readout">
                {OPEN_STATUSES.map((s) => <div key={s}><dt>{STAGE_META[s].label}</dt><dd>{Math.round((probs[s] ?? 0) * 100)}%</dd></div>)}
              </dl>
            </div>
          )}
        </section>
      </div>

      {explainId && (
        <ForecastExplainDrawer
          deal={live.find((d) => d.id === explainId)!}
          measure={measure}
          probs={probs}
          ctx={ctx}
          onClose={() => setExplainId(null)}
        />
      )}
    </>
  );
}

// Device/service split KPI — two labelled segments, never summed.
function SplitKpi({ label, device, service }: { label: string; device: number; service: number }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value kpi-value--split">
        <span><i className="swatch swatch--device" />{fmtEur(device)}</span>
        <span><i className="swatch swatch--service" />{fmtEur(service)}</span>
      </strong>
      <small className="kpi-hint">Device · Service (weighted)</small>
    </div>
  );
}

// Win-probability ladder — the visible bridge from gross pipeline to weighted.
function WinProbabilityLadder({
  ladder, measure, probs, setProbs, hasReseller,
}: {
  ladder: LadderRung[];
  measure: Measure;
  probs: StageProbs;
  setProbs?: (updater: (p: StageProbs) => StageProbs) => void;
  hasReseller: boolean;
}) {
  const max = Math.max(1, ...ladder.map((r) => r.gross));
  return (
    <div className="ladder">
      <div className="ladder-head">
        <h2>Win-probability ladder</h2>
        <span className="ladder-hint">{setProbs ? "Probabilities are editable — they drive the weighted forecast." : "Gross pipeline × stage win-probability = weighted value."}</span>
      </div>
      <div className="ladder-rungs">
        {ladder.map((r) => (
          <div className="rung" key={r.stage}>
            <div className="rung-label">
              <span className={`swatch fseg--tier-${r.stage}`} />
              <span>{STAGE_META[r.stage].label}</span>
              <small>{r.count} {r.count === 1 ? "deal" : "deals"}</small>
            </div>
            <div className="rung-bar" aria-hidden="true">
              <span className="rung-gross" style={{ width: `${(r.gross / max) * 100}%` }}>
                <span className="rung-weighted" style={{ width: `${r.gross > 0 ? (r.weighted / r.gross) * 100 : 0}%` }} />
              </span>
            </div>
            <div className="rung-prob">
              {setProbs ? (
                <label>
                  <input
                    type="number" min={0} max={100} step={5}
                    value={Math.round((probs[r.stage] ?? 0) * 100)}
                    onChange={(e) => {
                      const pct = Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100;
                      setProbs((p) => ({ ...p, [r.stage]: pct }));
                    }}
                    aria-label={`${STAGE_META[r.stage].label} win probability percent`}
                  />
                  <span>%</span>
                </label>
              ) : (
                <span className="rung-prob-static">{Math.round((probs[r.stage] ?? 0) * 100)}%</span>
              )}
            </div>
            <div className="rung-values">
              <strong>{fmtMeasure(r.weighted, measure)}</strong>
              <small>of {fmtMeasure(r.gross, measure)}</small>
            </div>
          </div>
        ))}
      </div>
      {hasReseller && (
        <p className="ladder-note">Reseller deals skip Final negotiation, so their Customer-testing weight is lifted to {Math.round(RESELLER_TEST_PROB * 100)}% as the last gate before Won.</p>
      )}
    </div>
  );
}

// Explainability — what supports or threatens one deal's contribution.
function ForecastExplainDrawer({
  deal, measure, probs, ctx, onClose,
}: {
  deal: Deal;
  measure: Measure;
  probs: StageProbs;
  ctx: AppCtx;
  onClose: () => void;
}) {
  const account = accountById(deal.accountId);
  const prob = dealProbability(deal, probs);
  const gross = dealMeasureTotal(deal, measure);
  const weighted = dealWeighted(deal, measure, probs);
  const nq = dealWeightedInPeriod(deal, NEXT_QUARTER, "net_sales", probs);
  const total3y = dealWeighted(deal, "net_sales", probs);
  const insights = insightsForDeal(deal.id).filter((i) => (ctx.insightStatus[i.id] ?? i.status) === "pending_review");
  const risks = insights.filter((i) => i.type === "risk_flag");
  const enrich = insights.filter((i) => i.type === "enrichment" || i.type === "next_action");
  const overdue = isOverdue(deal);
  const stale = isStale(deal);
  const resellerGate = deal.channel === "reseller" && deal.stage === "customer_testing";

  return (
    <>
      <button className="drawer-scrim" aria-label="Close panel" type="button" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Forecast contribution detail">
        <div className="drawer-bar">
          <div className="drawer-bar-actions">
            <button className="btn btn--secondary" type="button" onClick={() => { onClose(); ctx.openDeal(deal.id); }}><Icon name="deals" />Open deal</button>
            <button className="icon-btn" aria-label="Close" type="button" onClick={onClose}><Icon name="close" /></button>
          </div>
        </div>
        <div className="drawer-body">
          <div className="explain">
            <div className="explain-head">
              <h2>{deal.title}</h2>
              <p>{account?.name} · {deal.channel === "reseller" ? "Reseller" : "Direct"}</p>
              <div className="explain-tags"><RiskTag deal={deal} /><span className="mini-tag"><span className={`swatch fseg--tier-${deal.stage}`} />{STAGE_META[deal.stage].label}</span></div>
            </div>

            <div className="explain-figure">
              <div><span className="kpi-label">Weighted contribution</span><strong>{fmtMeasure(weighted, measure)}</strong></div>
              <div className="explain-math">{fmtMeasure(gross, measure)} gross × {Math.round(prob * 100)}% = {fmtMeasure(weighted, measure)}</div>
            </div>

            <SectionHead title="Why this number" />
            <ul className="explain-list">
              <li>
                <span className="explain-k">Stage probability</span>
                <span className="explain-v">{STAGE_META[deal.stage].label} → {Math.round(prob * 100)}%{resellerGate && <em> (reseller last-gate rule)</em>}</span>
              </li>
              <li>
                <span className="explain-k">Recency</span>
                <span className={cx("explain-v", stale && "t-warn")}>{activityHint(deal)}{stale && " — stalled"}</span>
              </li>
              <li>
                <span className="explain-k">Timing</span>
                <span className={cx("explain-v", overdue && "t-danger")}>Expected close {fmtExpectedClose(deal.expectedClose)}{overdue && " — overdue"}</span>
              </li>
              <li>
                <span className="explain-k">Phasing</span>
                <span className="explain-v">{fmtEur(nq)} next quarter · {fmtEur(total3y)} over 3 years (weighted)</span>
              </li>
            </ul>

            <SectionHead title="AI risk & competitor signals" count={risks.length + enrich.length} />
            {risks.length + enrich.length === 0 ? (
              <Empty>No open AI signals for this deal.</Empty>
            ) : (
              <div className="explain-signals">
                {[...risks, ...enrich].map((ins) => (
                  <article key={ins.id} className={cx("signal", ins.type === "risk_flag" && "signal--risk")}>
                    <div className="signal-top">
                      <span className="signal-kind">{ins.type === "risk_flag" ? "Risk flag" : ins.type === "next_action" ? "Next action" : "Enrichment"}{ins.severity ? ` · ${ins.severity}` : ""}</span>
                      <span className="signal-conf">{confidenceLabel(ins.confidence)}</span>
                    </div>
                    <p className="signal-headline">{ins.headline}</p>
                    {ins.body && <p className="signal-body">{ins.body}</p>}
                    {ins.sources.length > 0 && (
                      <ul className="signal-sources">
                        {ins.sources.map((s, i) => <li key={i}><Icon name="link" /><strong>{s.title}</strong> — {s.detail}</li>)}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            )}
            <p className="explain-disclaimer">The weighted number is deterministic: stage maps to probability. AI signals above are reviewable evidence of risk to that number — they never auto-adjust the forecast.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

// ===========================================================================
// Catalog (Finance maintains)
// ===========================================================================

function NewCatalogEntryModal({
  kind,
  ctx,
  onCreated,
  onClose,
}: {
  kind: "product" | "service";
  ctx: AppCtx;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [source, setSource] = useState<"internal" | "third">("internal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const submit = async () => {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const listPrice = Number(price);
    if (!trimmedName || !trimmedCategory) return;
    if (kind === "product" && (!Number.isFinite(listPrice) || listPrice < 0)) {
      setError("List price must be a non-negative number.");
      return;
    }

    const path = kind === "product" ? "products" : "services";
    const payload = kind === "product"
      ? { name: trimmedName, category: trimmedCategory, list_price: listPrice }
      : { name: trimmedName, service_type: trimmedCategory, is_third_party: source === "third" };

    setSubmitting(true);
    setError("");
    try {
      const request = () => fetch(`/api/catalogs/${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let response = await request();
      if (response.status === 401) {
        await loginAsUser(ctx.user.id);
        response = await request();
      }
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || `Failed to create ${kind}.`);

      if (kind === "product") {
        products.push({
          id: saved.id,
          name: saved.name,
          category: saved.category,
          listPrice: Number(saved.listPrice),
          retired: saved.retired,
        });
      } else {
        services.push({
          id: saved.id,
          name: saved.name,
          serviceType: saved.serviceType,
          isThirdParty: saved.isThirdParty,
          retired: saved.retired,
        });
      }
      onCreated();
      ctx.notify(`${trimmedName} added to the ${kind === "product" ? "product" : "service"} catalog.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to create ${kind}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="new-catalog-entry-title" onClick={() => { if (!submitting) onClose(); }}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 id="new-catalog-entry-title">New {kind}</h2>
            <p className="modal-context">Add an active entry to the shared catalog.</p>
          </div>
          <button className="icon-btn" aria-label="Close" onClick={onClose} disabled={submitting} type="button"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <label className="field">
            <span className="field-label">{kind === "product" ? "Product" : "Service"} name</span>
            <input ref={nameRef} value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} />
          </label>
          <label className="field">
            <span className="field-label">{kind === "product" ? "Category" : "Service type"}</span>
            <input value={category} onChange={(event) => setCategory(event.target.value)} required maxLength={255} />
          </label>
          {kind === "product" ? (
            <label className="field">
              <span className="field-label">List price</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required />
            </label>
          ) : (
            <div className="field">
              <span className="field-label">Source</span>
              <CustomSelect value={source} options={SOURCE_OPTIONS} onChange={(value) => setSource(value as "internal" | "third")} />
            </div>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-foot">
            <button className="btn btn--ghost" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="btn btn--primary" type="submit" disabled={submitting || !name.trim() || !category.trim() || (kind === "product" && price === "")}>
              {submitting ? "Adding…" : `Add ${kind}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CatalogView({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<"products" | "services">("products");
  const [creating, setCreating] = useState(false);
  const [, refresh] = useState(0);
  const canEdit = ctx.user.role === "finance";

  return (
    <>
      <PageHead title="Catalog" actions={
        canEdit ? <button className="btn btn--primary" onClick={() => setCreating(true)} type="button"><Icon name="plus" />New {tab === "products" ? "product" : "service"}</button> : undefined
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
            <thead><tr><th>Product</th><th>Category</th><th className="numeric">List price</th><th>Status</th></tr></thead>
            <tbody>
              {products.map((base) => {
                const p = ctx.eff("product", base);
                return (
                  <tr key={p.id} className={p.retired ? "is-retired" : ""}>
                    <th scope="row">{canEdit ? <CellText value={p.name} onCommit={(v) => ctx.patch("product", p.id, "name", v)} /> : p.name}</th>
                    <td>{canEdit ? <CellText value={p.category} onCommit={(v) => ctx.patch("product", p.id, "category", v)} /> : p.category}</td>
                    <td className="numeric numeric--strong">{canEdit ? <CellNumber value={p.listPrice} prefix="€" onCommit={(v) => ctx.patch("product", p.id, "listPrice", v)} /> : fmtEurExact(p.listPrice)}</td>
                    <td>{canEdit
                      ? <CellSelect value={p.retired ? "retired" : "active"} options={RETIRED_OPTIONS} onCommit={(v) => ctx.patch("product", p.id, "retired", v === "retired")} />
                      : p.retired ? <span className="pill pill--closed">Retired</span> : <span className="pill pill--resolved">Active</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap card-edge">
          <table>
            <thead><tr><th>Service</th><th>Type</th><th>Source</th><th>Status</th></tr></thead>
            <tbody>
              {services.map((base) => {
                const s = ctx.eff("service", base);
                return (
                  <tr key={s.id} className={s.retired ? "is-retired" : ""}>
                    <th scope="row">{canEdit ? <CellText value={s.name} onCommit={(v) => ctx.patch("service", s.id, "name", v)} /> : s.name}</th>
                    <td>{canEdit ? <CellText value={s.serviceType} onCommit={(v) => ctx.patch("service", s.id, "serviceType", v)} /> : s.serviceType}</td>
                    <td>{canEdit
                      ? <CellSelect value={s.isThirdParty ? "third" : "internal"} options={SOURCE_OPTIONS} onCommit={(v) => ctx.patch("service", s.id, "isThirdParty", v === "third")} />
                      : s.isThirdParty ? <span className="mini-tag">Third party</span> : <span className="mini-tag mini-tag--accent">Internal</span>}</td>
                    <td>{canEdit
                      ? <CellSelect value={s.retired ? "retired" : "active"} options={RETIRED_OPTIONS} onCommit={(v) => ctx.patch("service", s.id, "retired", v === "retired")} />
                      : s.retired ? <span className="pill pill--closed">Retired</span> : <span className="pill pill--resolved">Active</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {creating && (
        <NewCatalogEntryModal
          kind={tab === "products" ? "product" : "service"}
          ctx={ctx}
          onCreated={() => refresh((value) => value + 1)}
          onClose={() => setCreating(false)}
        />
      )}
    </>
  );
}

// ===========================================================================
// Page header
// ===========================================================================

function PageHead({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {actions && <div className="page-head-actions">{actions}</div>}
    </div>
  );
}

function McpSetupModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const binaryPath = "/absolute/path/to/hmd-secure-crm-mcp-linux-x64";
  const claudeConfig = `{
  "mcpServers": {
    "hmd-secure-crm": {
      "command": "${binaryPath}",
      "env": {
        "DATABASE_URL": "provided-by-your-CRM-admin"
      }
    }
  }
}`;
  const codexConfig = `[mcp_servers.hmd_secure_crm]
command = "${binaryPath}"
env = { DATABASE_URL = "provided-by-your-CRM-admin" }`;

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied((current) => current === label ? null : current), 1800);
  };

  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="mcp-setup-title" onClick={onClose}>
      <section className="modal mcp-setup-modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h2 id="mcp-setup-title">Connect your AI client to the CRM</h2>
            <p className="modal-context">Linux x64 MCP server · stdio transport</p>
          </div>
          <button className="icon-btn" type="button" aria-label="Close MCP setup" onClick={onClose}><Icon name="close" /></button>
        </header>
        <div className="modal-body mcp-setup-body">
          <p className="modal-intro">The MCP server lets compatible AI clients search and update CRM records with the tools exposed by this prototype.</p>

          <ol className="mcp-steps">
            <li><strong>Download the executable</strong><span>Save it somewhere permanent on the computer running your AI client.</span></li>
            <li><strong>Make it executable</strong><code>chmod +x hmd-secure-crm-mcp-linux-x64</code></li>
            <li><strong>Request database access</strong><span>Ask the CRM administrator for a PostgreSQL <code>DATABASE_URL</code>. It is not embedded in the download.</span></li>
            <li><strong>Add one client configuration</strong><span>Replace the example path and database URL below, then restart the client.</span></li>
          </ol>

          <a className="btn btn--primary mcp-download" href="/api/downloads/mcp" download>
            <Icon name="download" />Download MCP server
          </a>

          <div className="mcp-config">
            <div className="mcp-config-head">
              <strong>Claude Desktop</strong>
              <button className="ghost-link" type="button" onClick={() => { void copy("Claude", claudeConfig); }}><Icon name="copy" />{copied === "Claude" ? "Copied" : "Copy"}</button>
            </div>
            <p>Add to <code>claude_desktop_config.json</code>.</p>
            <pre><code>{claudeConfig}</code></pre>
          </div>

          <div className="mcp-config">
            <div className="mcp-config-head">
              <strong>Codex</strong>
              <button className="ghost-link" type="button" onClick={() => { void copy("Codex", codexConfig); }}><Icon name="copy" />{copied === "Codex" ? "Copied" : "Copy"}</button>
            </div>
            <p>Add to <code>~/.codex/config.toml</code>.</p>
            <pre><code>{codexConfig}</code></pre>
          </div>

          <p className="modal-note">This executable has direct database access. Use a restricted database account and do not share its connection string.</p>
        </div>
      </section>
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
  { screen: "assistant", label: "AI Assistant", icon: "spark" },
];

type AssistantEvidence = { type: string; id?: string; label: string; url?: string };
type AssistantMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; evidence: AssistantEvidence[]; uncertainty?: string }
  | { id: string; role: "status"; content: string; startedAt: number; attachmentCount: number }
  | { id: string; role: "error"; content: string };
type AssistantThread = { id: string; title: string; createdAt: string; updatedAt: string };

const ASSISTANT_RUN_STEPS = [
  { after: 0, label: "Preparing CRM context", detail: "Collecting accounts, contacts, deals, cases, offers, and recent activity." },
  { after: 3, label: "Assessing the request", detail: "Identifying the records, time range, and evidence needed for a useful answer." },
  { after: 9, label: "Checking evidence", detail: "Comparing CRM facts and relevant external sources when the question requires research." },
  { after: 20, label: "Forming the answer", detail: "Resolving conflicts, noting uncertainty, and attaching the supporting evidence." },
] as const;

function AssistantRunStatus({
  startedAt,
  attachmentCount,
}: {
  startedAt: number;
  attachmentCount: number;
}) {
  const [elapsed, setElapsed] = useState(() => Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const activeIndex = ASSISTANT_RUN_STEPS.reduce(
    (latest, step, index) => elapsed >= step.after ? index : latest,
    0,
  );

  return (
    <div className="assistant-run" role="status" aria-live="polite">
      <div className="assistant-run-head">
        <span className="assistant-run-pulse" aria-hidden="true" />
        <strong>Working on your answer</strong>
        <time>{elapsed}s</time>
      </div>
      <ol className="assistant-run-steps">
        {ASSISTANT_RUN_STEPS.map((step, index) => {
          const state = index < activeIndex ? "complete" : index === activeIndex ? "active" : "pending";
          return (
            <li className={`assistant-run-step assistant-run-step--${state}`} key={step.label}>
              <span className="assistant-run-marker" aria-hidden="true">{state === "complete" ? "✓" : index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                {state === "active" && <p>{step.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="assistant-run-scope">
        <span>CRM snapshot</span>
        {attachmentCount > 0 && <span>{attachmentCount} attachment{attachmentCount === 1 ? "" : "s"}</span>}
      </div>
      <p className="assistant-run-note">Progress summaries show what the assistant is doing, not private reasoning.</p>
    </div>
  );
}

function CrmAssistant({
  open,
  onClose,
  fullPage = false,
  onOpenFullPage,
}: {
  open: boolean;
  onClose: () => void;
  fullPage?: boolean;
  onOpenFullPage?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [answer, setAnswer] = useState<{
    answer: string;
    evidence: Array<{ type: string; id?: string; label: string; url?: string }>;
    uncertainty?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; size: number; dataUrl: string }>>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const readers = Array.from(files).map((file) => new Promise<{ name: string; size: number; dataUrl: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, size: file.size, dataUrl: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then((results) => {
      setAttachedFiles((prev) => [...prev, ...results]);
    });
    event.target.value = "";
  };

  const removeFile = (name: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const loadThread = async (id: string) => {
    setHistoryLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/assistant/threads/${id}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load chat.");
      setThreadId(id);
      setMessages((payload.messages ?? []).map((entry: {
        id: string;
        role: "user" | "assistant";
        content: string;
        evidence?: AssistantEvidence[];
        uncertainty?: string;
      }) => entry.role === "assistant"
        ? { ...entry, evidence: entry.evidence ?? [] }
        : entry));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load chat.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetch("/api/assistant/threads")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load chat history.");
        if (cancelled) return;
        setThreads(payload);
        if (!threadId && payload[0]?.id) await loadThread(payload[0].id);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load chat history.");
      });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, answer, loading]);

  const newThread = () => {
    setThreadId(null);
    setMessages([]);
    setDraft("");
    setAnswer(null);
    setError(null);
    setAttachedFiles([]);
    setLoading(false);
  };

  const deleteThread = async (id: string) => {
    const response = await fetch(`/api/assistant/threads/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    const remaining = threads.filter((thread) => thread.id !== id);
    setThreads(remaining);
    if (threadId === id) {
      if (remaining[0]) await loadThread(remaining[0].id);
      else newThread();
    }
  };

  const ask = async (value: string) => {
    const next = value.trim();
    if (!next || loading) return;
    const files = attachedFiles.map((f) => ({ name: f.name, dataUrl: f.dataUrl }));
    const userMsgContent = files.length > 0 ? `${next}\n\n[Attached: ${files.map((f) => f.name).join(", ")}]` : next;
    const nextMessages = [
      ...messages,
      { id: `msg_${crypto.randomUUID()}`, role: "user" as const, content: userMsgContent },
    ];
    setDraft("");
    setAttachedFiles([]);
    setAnswer(null);
    setError(null);
    setLoading(true);
    if (streamRef.current) clearInterval(streamRef.current);
    setMessages((current) => [
      ...current,
      { id: `msg_${crypto.randomUUID()}`, role: "user", content: userMsgContent },
      {
        id: `msg_${crypto.randomUUID()}`,
        role: "status",
        content: "Working on your answer",
        startedAt: Date.now(),
        attachmentCount: files.length,
      },
    ]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: next,
          threadId,
          messages: nextMessages.map((entry) => ({ role: entry.role, content: entry.content })),
          files: files.length > 0 ? files : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The assistant could not answer.");
      setThreadId(payload.threadId);
      setThreads((current) => {
        const existing = current.find((thread) => thread.id === payload.threadId);
        const now = new Date().toISOString();
        const updated = existing
          ? { ...existing, updatedAt: now }
          : { id: payload.threadId, title: next.replace(/\s+/g, " ").slice(0, 72), createdAt: now, updatedAt: now };
        return [updated, ...current.filter((thread) => thread.id !== payload.threadId)];
      });

      const words = (payload.answer || "").split(" ");
      const msgId = `msg_${crypto.randomUUID()}`;

      setMessages((current) => {
        const withoutStatus = current.filter((entry) => entry.role !== "status");
        return [
          ...withoutStatus,
          {
            id: msgId,
            role: "assistant",
            content: "",
            evidence: payload.evidence ?? [],
            uncertainty: payload.uncertainty,
          },
        ];
      });
      setStreamingId(msgId);

      let idx = 0;
      streamRef.current = setInterval(() => {
        idx++;
        if (idx >= words.length) {
          if (streamRef.current) clearInterval(streamRef.current);
          streamRef.current = null;
          setMessages((current) =>
            current.map((m) => (m.id === msgId ? { ...m, content: words.join(" ") } : m))
          );
          setStreamingId(null);
          setAnswer(payload);
          setLoading(false);
          return;
        }
        setMessages((current) =>
          current.map((m) => (m.id === msgId ? { ...m, content: words.slice(0, idx).join(" ") } : m))
        );
      }, 25);
    } catch (requestError) {
      if (streamRef.current) { clearInterval(streamRef.current); streamRef.current = null; }
      setStreamingId(null);
      const message = requestError instanceof Error ? requestError.message : "The assistant could not answer.";
      setError(message);
      setMessages((current) => [
        ...current.filter((entry) => entry.role !== "status"),
        { id: `msg_${crypto.randomUUID()}`, role: "error", content: message },
      ]);
      setLoading(false);
    }
  };

  if (!open) return null;

  const conversation = (
    <>
      <header className="crm-assistant-head">
        <div>
          <h2 id="crm-assistant-title">{fullPage ? "AI Assistant" : "Ask about your workspace"}</h2>
          {fullPage && <p>Answers are grounded in the CRM snapshot and retain visible evidence.</p>}
        </div>
        <div className="crm-assistant-head-actions">
          <button className="btn btn--secondary" type="button" onClick={newThread}><Icon name="plus" /> New chat</button>
          {!fullPage && (
            <>
              <button className="icon-btn" type="button" aria-label="Open AI Assistant full screen" title="Open full screen" onClick={onOpenFullPage}><Icon name="expand" /></button>
              <button className="icon-btn" type="button" aria-label="Close CRM assistant" onClick={onClose}><Icon name="close" /></button>
            </>
          )}
        </div>
      </header>

      <div className="crm-assistant-body">
        {historyLoading ? (
          <div className="crm-assistant-empty crm-assistant-loading" role="status">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="crm-assistant-empty">
            <Icon name="spark" />
            <h3>{fullPage ? "What can I help you understand?" : "Start with a CRM question"}</h3>
            <p>Ask about pipeline risk, account history, open cases, offers, or forecast changes. Answers include the CRM evidence used.</p>
          </div>
        ) : (
          <div className="crm-conversation" ref={scrollRef} aria-live="polite">
            {messages.map((entry) => entry.role === "user" ? (
              <div className="crm-message crm-message--user" key={entry.id}>{entry.content}</div>
            ) : entry.role === "assistant" ? (
              <div className="crm-message crm-message--assistant" key={entry.id}>
                <div className={entry.id === streamingId ? "crm-markdown crm-streaming" : "crm-markdown"} dangerouslySetInnerHTML={{ __html: md(entry.content) }} />
                {entry.evidence.length > 0 && entry.id !== streamingId && (
                  <div className="crm-evidence">
                    <strong>Evidence</strong>
                    {entry.evidence.map((item, index) => item.url ? (
                      <a key={`${item.label}-${index}`} href={item.url} target="_blank" rel="noreferrer">{item.label}</a>
                    ) : (
                      <span key={`${item.label}-${index}`}>{item.label}</span>
                    ))}
                  </div>
                )}

                {entry.uncertainty && entry.id !== streamingId && <small>{entry.uncertainty}</small>}
              </div>
            ) : entry.role === "status" ? (
              <div className="crm-message crm-message--assistant crm-message--loading" key={entry.id}>
                <AssistantRunStatus startedAt={entry.startedAt} attachmentCount={entry.attachmentCount} />
              </div>
            ) : (
              <div className="crm-message crm-message--error" key={entry.id} role="alert">{entry.content}</div>
            ))}
          </div>
        )}
      </div>

      <form className="crm-composer" onSubmit={(event) => { event.preventDefault(); void ask(draft); }}>
        <label className="sr-only" htmlFor="crm-question">Ask CRM</label>
        <textarea
          id="crm-question"
          ref={inputRef}
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void ask(draft);
            }
          }}
          placeholder="Ask about accounts, deals, cases, or forecasts"
        />
        {attachedFiles.length > 0 && (
          <div className="crm-attachments">
            {attachedFiles.map((f) => (
              <span className="crm-attachment-chip" key={f.name}>
                <Icon name="attach" />
                <span className="crm-attachment-name">{f.name}</span>
                <button type="button" className="crm-attachment-remove" aria-label={`Remove ${f.name}`} onClick={() => removeFile(f.name)}>
                  <Icon name="remove" />
                </button>
              </span>
            ))}
          </div>
        )}
        <input type="file" ref={fileInputRef} multiple className="crm-file-input" onChange={handleAttach} aria-label="Attach files" />
        <button type="button" className="crm-attach-btn" aria-label="Attach files" onClick={() => fileInputRef.current?.click()}>
          <Icon name="attach" />
        </button>
        <button className="crm-send" type="submit" aria-label="Send question" disabled={!draft.trim() || loading}>
          <Icon name="arrowRight" />
        </button>
      </form>
    </>
  );

  if (fullPage) {
    return (
      <section className="assistant-page" aria-labelledby="crm-assistant-title">
        <aside className="assistant-history" aria-label="Chat history">
          <div className="assistant-history-head">
            <strong>Previous chats</strong>
            <span>{threads.length}</span>
          </div>
          <div className="assistant-thread-list">
            {threads.map((thread) => (
              <div className={cx("assistant-thread", thread.id === threadId && "assistant-thread--active")} key={thread.id}>
                <button type="button" onClick={() => { void loadThread(thread.id); }}>
                  <span>{thread.title}</span>
                  <small>{new Date(thread.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small>
                </button>
                <button className="icon-btn" type="button" aria-label={`Delete ${thread.title}`} onClick={() => { void deleteThread(thread.id); }}><Icon name="remove" /></button>
              </div>
            ))}
            {!threads.length && <p className="assistant-history-empty">Your conversations will appear here.</p>}
          </div>
        </aside>
        <div className="assistant-page-chat">{conversation}</div>
      </section>
    );
  }

  return (
    <aside className="crm-assistant" role="dialog" aria-modal="false" aria-labelledby="crm-assistant-title">
      {conversation}
    </aside>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState("");
  const [initialUserId, setInitialUserId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"original" | "metro" | "light">("original");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "light" ? "#f7f7f5" : theme === "metro" ? "#000000" : "#070a10";
  }, [theme]);

  useEffect(() => {
    const themes = ["original", "metro", "light"] as const;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey || event.key.toLowerCase() !== "y") return;
      event.preventDefault();
      setTheme((current) => themes[(themes.indexOf(current) + 1) % themes.length]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const loadCrm = async () => {
    setLoading(true);
    setStartupError("");
    const result = await initCrmFromApi();
    setInitialUserId(result.userId);
    if (!result.ok || !result.userId) {
      setStartupError(result.error ?? "Could not load CRM data from PostgreSQL.");
    }
    setLoading(false);
  };

  useEffect(() => { void loadCrm(); }, []);

  if (loading) {
    return (
      <main className="startup-spinner" role="status" aria-label="Loading">
        <div className="orbit">
          <div className="orbit-ring" aria-hidden="true" />
          <img src="/nokia-3310.svg" alt="" />
        </div>
      </main>
    );
  }

  if (startupError || !initialUserId) {
    return (
      <main className="startup-error">
        <section className="startup-error-panel" role="alert">
          <Icon name="alert" />
          <h1>CRM database unavailable</h1>
          <p>{startupError || "No database-backed user is available."}</p>
          <p className="muted">For local development, run <code>bun run db:setup</code>, then retry.</p>
          <button className="btn btn--primary" type="button" onClick={() => { void loadCrm(); }}>Retry connection</button>
        </section>
      </main>
    );
  }

  return <MainApp initialUserId={initialUserId} theme={theme} onThemeChange={setTheme} />;
}

function MainApp({
  initialUserId,
  theme,
  onThemeChange,
}: {
  initialUserId: string;
  theme: "original" | "metro" | "light";
  onThemeChange: (theme: "original" | "metro" | "light") => void;
}) {
  const [userId, setUserId] = useState<string>(initialUserId);
  const [screen, setScreen] = useState<Screen>("home");
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || "");
  const [caseId, setCaseId] = useState<string>(seedCases[0]?.id || "");
  const [dealId, setDealId] = useState<string>(seedDeals[0]?.id || "");
  const [offerFocus, setOfferFocus] = useState<string | undefined>(undefined);
  const [drawer, setDrawer] = useState<{ kind: "account" | "case" | "deal"; id: string } | null>(null);
  const [stageChangePrompt, setStageChangePrompt] = useState<PendingStageChange>(null);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const user = userById(userId)!;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mcpSetupOpen, setMcpSetupOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastSeq = useRef(0);

  useEffect(() => {
    if (!assistantOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setAssistantOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assistantOpen]);

  // mutable domain state
  const [dealStage, setDealStage] = useState<Record<string, Stage>>({});
  const [dealLeadValidated, setDealLeadValidated] = useState<Record<string, boolean>>({});
  const [offerState, setOfferState] = useState<Record<string, Offer>>({});
  const [insightStatus, setInsightStatus] = useState<Record<string, AiInsight["status"]>>({});
  const [caseNotes, setCaseNotes] = useState<Record<string, CaseNote[]>>({});
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set(seedNotifications.filter((n) => n.read).map((n) => n.id)));
  const [edits, setEdits] = useState<Record<string, Record<string, unknown>>>({});
  const [, bumpAccounts] = useReducer((c) => c + 1, 0);
  const [, bumpCompetitors] = useReducer((c) => c + 1, 0);

  const patch = (kind: EditKind, id: string, field: string, value: unknown) => {
    setEdits((m) => ({ ...m, [`${kind}:${id}`]: { ...(m[`${kind}:${id}`] ?? {}), [field]: value } }));

    // Update in-memory arrays if they are direct-mutated locally to ensure immediate responsiveness
    if (kind === "case") {
      const idx = seedCases.findIndex((c) => c.id === id);
      if (idx >= 0) {
        seedCases[idx] = { ...seedCases[idx]!, [field]: value } as CaseRecord;
        bumpAccounts();
      }
    } else if (kind === "account") {
      const idx = accounts.findIndex((a) => a.id === id);
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx]!, [field]: value } as Account;
        bumpAccounts();
      }
    } else if (kind === "deal") {
      const idx = seedDeals.findIndex((d) => d.id === id);
      if (idx >= 0) {
        seedDeals[idx] = { ...seedDeals[idx]!, [field]: value } as Deal;
        bumpAccounts();
      }
    }

    let url = "";
    let backendField = field;
    if (field === "vatId" || field === "vat_id") backendField = "vat_id";
    else if (field === "ownerId" || field === "ownerUserId" || field === "owner_user_id") backendField = "owner_user_id";
    else if (field === "isPilot") backendField = "is_pilot";
    else if (field === "expectedClose") backendField = "expected_close";
    else if (field === "parentDealId") backendField = "parent_deal_id";
    else if (field === "thirdPartyRef") backendField = "third_party_ref";
    else if (field === "slaDeadline") backendField = "sla_deadline";
    else if (field === "listPrice") backendField = "list_price";
    else if (field === "serviceType") backendField = "service_type";
    else if (field === "isThirdParty") backendField = "is_third_party";
    else if (field === "serviceId") backendField = "service_id";

    const body = { [backendField]: value };

    if (kind === "account") {
      url = `/api/accounts/${id}`;
    } else if (kind === "deal") {
      url = `/api/deals/${id}`;
    } else if (kind === "case") {
      url = `/api/cases/${id}`;
    } else if (kind === "product") {
      url = `/api/catalogs/products/${id}`;
    } else if (kind === "service") {
      url = `/api/catalogs/services/${id}`;
    }

    if (url) {
      fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            console.error(`Autosave failed: ${err.error || res.statusText}`);
            notify(`Autosave failed: ${err.error || res.statusText}`);
          } else {
            const result = await initCrmFromApi();
            if (result.ok) {
              bumpAccounts();
            }
          }
        })
        .catch((err) => {
          console.error("Network error during autosave", err);
          notify("Autosave failed: check network connection.");
        });
    }
  };

  function eff<T extends { id: string }>(kind: EditKind, base: T): T {
    const e = edits[`${kind}:${base.id}`];
    return e ? ({ ...base, ...e } as T) : base;
  }
  const addAccount = (account: Account) => {
    accounts.push(account);
    activities.unshift({
      id: `act_${Date.now().toString(36)}`,
      accountId: account.id,
      actorId: user.id,
      kind: 'note',
      summary: 'account_created',
      when: 'Just now',
      isAi: false,
    });
    bumpAccounts();
  };
  const addDeal = (deal: Deal, serviceValue: number, serviceContractId?: string | null, serviceId?: string | null) => {
    seedDeals.unshift(deal);
    recordActivity({ accountId: deal.accountId, dealId: deal.id, actorId: user.id, kind: "stage", summary: `Deal created: ${deal.title}.` });
    if (serviceValue > 0 && serviceContractId && serviceId) {
      serviceContracts.unshift({
        id: serviceContractId,
        dealId: deal.id,
        serviceId,
        invoiceModel: "one_off",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: null,
        fixedValue: serviceValue,
        monthlyRate: null,
        expectedDevices: null,
        phases: [{ period: deal.devicePhases[0]?.period ?? "2026-Q2", value: serviceValue }],
      });
    }
    bumpAccounts();
  };
  const addCompetitor = async (dealId: string, name: string, netTotal: number | null) => {
    const payload = { name, net_total: netTotal };
    let response = await fetch(`/api/deals/${dealId}/competitors`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.status === 401) {
      await loginAsUser(user.id);
      response = await fetch(`/api/deals/${dealId}/competitors`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    if (response.ok) {
      const row = await response.json();
      dealCompetitors.unshift({
        id: row.id,
        dealId,
        name: row.name,
        netTotal: row.netTotal != null ? Number(row.netTotal) : null,
        createdAt: row.createdAt ?? new Date().toISOString(),
      });
    } else {
      dealCompetitors.unshift({
        id: crypto.randomUUID(),
        dealId,
        name,
        netTotal,
        createdAt: new Date().toISOString(),
      });
    }
    bumpCompetitors();
  };
  const removeCompetitor = async (dealId: string, competitorId: string) => {
    let response = await fetch(`/api/deals/${dealId}/competitors/${competitorId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.status === 401) {
      await loginAsUser(user.id);
      response = await fetch(`/api/deals/${dealId}/competitors/${competitorId}`, {
        method: "DELETE",
        credentials: "include",
      });
    }
    const idx = dealCompetitors.findIndex((c) => c.id === competitorId);
    if (idx >= 0) dealCompetitors.splice(idx, 1);
    bumpCompetitors();
  };
  const updateDeal = async (
    deal: Deal,
    updates: Partial<Pick<Deal, "title" | "stage" | "apiStage" | "channel" | "leadValidated" | "expectedClose">> & {
      device?: number;
      service?: number;
      total?: number;
      nextQuarter?: number;
      weighted?: number;
    },
  ) => {
    const previous = {
      title: deal.title,
      stage: deal.stage,
      apiStage: deal.apiStage,
      channel: deal.channel,
      leadValidated: deal.leadValidated,
      expectedClose: deal.expectedClose,
      device: deviceTotal(deal),
      service: serviceTotal(deal.id),
    };

    if (updates.expectedClose !== undefined) {
      deal.expectedClose = updates.expectedClose;
    }

    let device = updates.device ?? previous.device;
    let service = updates.service ?? previous.service;

    if (updates.total !== undefined) {
      device = Math.max(0, updates.total - service);
    } else if (updates.weighted !== undefined) {
      const total = updates.weighted / probability(deal.stage);
      device = Math.max(0, total - service);
    }

    if (updates.device !== undefined) device = updates.device;
    if (updates.service !== undefined) service = updates.service;

    if (updates.nextQuarter !== undefined) {
      setDealNextQuarterRevenue(deal, updates.nextQuarter);
      bumpAccounts();
      return;
    }

    const total = updates.total ?? updates.weighted !== undefined
      ? device + service
      : device + service;
    const nextStage = updates.stage ?? deal.stage;

    Object.assign(deal, {
      title: updates.title ?? deal.title,
      stage: nextStage,
      apiStage: updates.stage ? STAGE_TO_API[updates.stage] as ApiStage : deal.apiStage,
      channel: updates.channel ?? deal.channel,
      leadValidated: updates.leadValidated ?? deal.leadValidated,
    });
    replaceDealRevenue(deal, device, service);
    if (updates.stage && nextStage !== previous.stage) {
      recordActivity({ accountId: deal.accountId, dealId: deal.id, actorId: user.id, kind: "stage", summary: `Moved ${deal.title} to ${STAGE_META[nextStage].short}.` });
    }
    bumpAccounts();

    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updates.title,
          stage: updates.stage ? STAGE_TO_API[updates.stage] : undefined,
          channel: updates.channel,
          device,
          service,
          total,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save deal");
      notify(`${deal.title} updated.`);
    } catch (error) {
      Object.assign(deal, { title: previous.title, stage: previous.stage, apiStage: previous.apiStage, channel: previous.channel, leadValidated: previous.leadValidated });
      replaceDealRevenue(deal, previous.device, previous.service);
      bumpAccounts();
      notify(error instanceof Error ? error.message : "Failed to save deal.");
    }
  };

  const notify = (msg: string) => {
    const id = ++toastSeq.current;
    setToast({ id, msg });
    window.setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 3000);
  };

  const logActivity: AppCtx["logActivity"] = (input) => {
    recordActivity({ ...input, actorId: user.id, persist: true });
    bumpAccounts();
  };

  const moveDeal = (id: string, stage: Stage) => {
    const deal = dealById(id);
    if (!deal) return;
    const current = dealStage[id] ?? deal.stage;
    if (current === stage) return;
    if (deal.channel === "reseller" && stage === "final_negotiation") {
      notify("Reseller deals cannot move to Final negotiation.");
      return;
    }
    setDealStage((m) => ({ ...m, [id]: stage }));
    Object.assign(deal, { stage, apiStage: STAGE_TO_API[stage] });
    fetch(`/api/deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: STAGE_TO_API[stage] }) }).catch(console.error);
    recordActivity({ accountId: deal.accountId, dealId: deal.id, actorId: user.id, kind: "stage", summary: `Moved ${deal.title} to ${STAGE_META[stage].short}.` });
    notify(`Moved ${deal.title} to ${STAGE_META[stage].short}.`);
  };

  const validateLead = (id: string) => {
    const deal = dealById(id);
    if (!deal) return;
    setDealLeadValidated((m) => ({ ...m, [id]: true }));
    Object.assign(deal, { leadValidated: true, apiStage: "rfi_answered" });
    fetch(`/api/deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: "rfi_answered" }) }).catch(console.error);
    recordActivity({ accountId: deal.accountId, dealId: deal.id, actorId: user.id, kind: "stage", summary: `${deal.title} — lead validated.` });
    notify(`${deal.title} — lead validated.`);
  };

  const requestMoveDeal = (id: string, stage: Stage) => {
    const deal = dealById(id);
    if (!deal) return;
    const current = dealStage[id] ?? deal.stage;
    if (current === stage) return;
    if (deal.channel === "reseller" && stage === "final_negotiation") {
      notify("Reseller deals cannot move to Final negotiation.");
      return;
    }
    const validated = dealLeadValidated[id] ?? deal.leadValidated ?? false;
    setStageChangePrompt({
      dealId: id,
      fromStage: current,
      targetStage: stage,
      validateLead: current === "lead" && stage === "offer" && !validated,
    });
  };

  const addOffer = (offer: Offer) => {
    seedOffers.unshift(offer);
    const offerDeal = dealById(offer.dealId);
    if (offerDeal) recordActivity({ accountId: offerDeal.accountId, dealId: offerDeal.id, actorId: user.id, kind: "offer", summary: `Offer ${offer.ref} created.` });
    bumpAccounts();
  };

  const updateOffer = (offerId: string, updater: (offer: Offer) => Offer) => {
    const base = offerState[offerId] ?? seedOffers.find((o) => o.id === offerId);
    if (!base) return;
    const updated = updater({ ...base });
    setOfferState((m) => ({ ...m, [offerId]: updated }));
    const idx = seedOffers.findIndex((o) => o.id === offerId);
    if (idx >= 0) seedOffers[idx] = updated;
    bumpAccounts();
    if (updated.status !== "rejected") persistOfferUpdateToApi(updated);
  };

  const addCase = (caseRec: CaseRecord) => {
    seedCases.unshift(caseRec);
    recordActivity({ accountId: caseRec.accountId, dealId: caseRec.dealId ?? null, actorId: user.id, kind: "case", summary: `${caseRec.ref} opened: ${caseRec.title}.` });
    bumpAccounts();
  };

  const submitOfferForApproval = (offerId: string) => {
    if (user.role !== "sales_rep") return;
    const base = offerState[offerId] ?? seedOffers.find((o) => o.id === offerId);
    if (!base || base.status !== "sales_rep") return;
    
    fetch(`/api/offers/${offerId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to submit offer");
        return r.json();
      })
      .then(() => {
        void loadCrm();
        notify(`${base.ref} sent for Sales Manager approval.`);
      })
      .catch((err) => {
        console.error(err);
        notify("Failed to submit offer.");
      });

    // Optimistic local state change
    const updated: Offer = { ...base, status: "pending_manager" };
    setOfferState((m) => ({ ...m, [offerId]: updated }));
    const idx = seedOffers.findIndex((o) => o.id === offerId);
    if (idx >= 0) seedOffers[idx] = updated;
    bumpAccounts();
    const decisionDeal = dealById(base.dealId);
    if (decisionDeal) {
      recordActivity({
        accountId: decisionDeal.accountId,
        dealId: decisionDeal.id,
        actorId: user.id,
        kind: "offer",
        summary: `${base.ref} submitted for Sales Manager approval.`,
      });
    }
  };

  const approveOfferMade = (offerId: string) => {
    const base = offerState[offerId] ?? seedOffers.find((o) => o.id === offerId);
    if (!base) return;

    // Find active step matching role
    const activeStep = offerWorkflowSteps(base).find(
      (a) =>
        (base.status === "pending_manager" && a.roleRequired === "sales_manager" && !a.decision) ||
        (base.status === "pending_finance" && a.roleRequired === "finance" && !a.decision)
    );

    if (!activeStep || !activeStep.id) {
      notify("No active approval step found.");
      return;
    }

    fetch(`/api/offers/approval-steps/${activeStep.id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approved" }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to approve offer");
        return r.json();
      })
      .then(() => {
        void loadCrm();
        notify(`${base.ref} approved.`);
      })
      .catch((err) => {
        console.error(err);
        notify("Failed to approve offer.");
      });

    const stamp = approvalTimestamp();
    const approvals = offerWorkflowSteps(base).map((a) =>
      a.id === activeStep.id ? { ...a, decision: "approved" as const, decidedById: user.id, decidedAt: stamp } : a
    );
    const nextStatus = base.status === "pending_manager" ? ("pending_finance" as const) : ("locked" as const);
    const updated: Offer = { ...base, status: nextStatus, approvals };
    setOfferState((m) => ({ ...m, [offerId]: updated }));
    const idx = seedOffers.findIndex((o) => o.id === offerId);
    if (idx >= 0) seedOffers[idx] = updated;
    bumpAccounts();

    const decisionDeal = dealById(base.dealId);
    if (decisionDeal && nextStatus === "locked") {
      syncDealFromMadeOffer(decisionDeal, updated);
    }
  };

  const decideOffer = (offerId: string, decision: "approved" | "rejected", note?: string) => {
    const base = offerState[offerId] ?? seedOffers.find((o) => o.id === offerId);
    if (!base) return;
    if (decision === "approved") {
      approveOfferMade(offerId);
      return;
    }
    
    // Rejection
    const activeStep = offerWorkflowSteps(base).find(
      (a) =>
        (base.status === "pending_manager" && a.roleRequired === "sales_manager" && !a.decision) ||
        (base.status === "pending_finance" && a.roleRequired === "finance" && !a.decision)
    );

    if (!activeStep || !activeStep.id) {
      notify("No active approval step found to reject.");
      return;
    }

    fetch(`/api/offers/approval-steps/${activeStep.id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "rejected", note: note?.trim() || "Rejected." }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to reject offer");
        return r.json();
      })
      .then(() => {
        void loadCrm();
        notify(`${base.ref} rejected.`);
      })
      .catch((err) => {
        console.error(err);
        notify("Failed to record decision.");
      });

    const stamp = approvalTimestamp();
    const approvals = offerWorkflowSteps(base).map((a) =>
      a.id === activeStep.id
        ? { ...a, decision: "rejected" as const, decidedById: user.id, note: note?.trim() || "Rejected.", decidedAt: stamp }
        : a
    );
    const updated: Offer = { ...base, status: "rejected" as const, approvals };
    setOfferState((m) => ({ ...m, [offerId]: updated }));
    const idx = seedOffers.findIndex((o) => o.id === offerId);
    if (idx >= 0) seedOffers[idx] = updated;
    bumpAccounts();
  };

  const expandDrawer = () => {
    if (!drawer) return;
    setScreen(drawer.kind === "account" ? "account" : drawer.kind === "deal" ? "deal" : ("case" as Screen));
    setDrawer(null);
  };

  const switchUser = async (id: string) => {
    await loginAsUser(id);
    setUserId(id);
  };

  const ctx: AppCtx = {
    user,
    go: (s) => { setScreen(s); setDrawer(null); setMenuOpen(false); },
    openAccount: (id) => { setAccountId(id); setDrawer({ kind: "account", id }); setMenuOpen(false); },
    openDeal: (id) => { setDealId(id); setDrawer({ kind: "deal", id }); setMenuOpen(false); },
    openOffers: (id) => {
      setOfferFocus(id);
      setScreen("offers");
      setDrawer(null);
      setMenuOpen(false);
    },
    openCase: (id) => { setCaseId(id); setDrawer({ kind: "case", id }); setMenuOpen(false); },
    notify,
    dealStage, dealLeadValidated, requestMoveDeal, validateLead, moveDeal,
    offerState, decideOffer, submitOfferForApproval, approveOfferMade, addOffer, updateOffer, addCase,
    insightStatus, setInsight: (id, s) => {
      setInsightStatus((m) => ({ ...m, [id]: s }));
      fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      })
        .then(() => void loadCrm())
        .catch(console.error);
    },
    caseNotes, addNote: (cid, n) => setCaseNotes((m) => ({ ...m, [cid]: [n, ...(m[cid] ?? [])] })),
    patch, eff, addAccount, addDeal, addCompetitor, removeCompetitor, updateDeal, logActivity,
  };

  const myNotifs = seedNotifications.filter((n) => n.userId === userId);
  const unread = myNotifs.filter((n) => !readNotifs.has(n.id)).length;

  const dashboards: Record<Role, ReactNode> = {
    sales_rep: <RepDashboard ctx={ctx} />,
    tam: <TamDashboard ctx={ctx} />,
    sales_manager: <ManagerDashboard ctx={ctx} />,
    finance: <FinanceDashboard ctx={ctx} />,
    admin: <ManagerDashboard ctx={ctx} />,
  };

  let content: ReactNode;
  if (screen === "home") content = <><PageHead title={`Good morning, ${user.name.split(" ")[0]}`} />{dashboards[user.role]}</>;
  else if (screen === "accounts") content = <AccountsView ctx={ctx} />;
  else if (screen === "account") content = <AccountRecord account={accountById(accountId)!} ctx={ctx} />;
  else if (screen === "deals") content = <DealsView ctx={ctx} />;
  else if (screen === "deal") content = <DealDetail deal={dealById(dealId)!} ctx={ctx} />;
  else if (screen === "cases") content = <CasesView ctx={ctx} />;
  else if ((screen as string) === "case") content = <CaseDetail caseRec={seedCases.find((c) => c.id === caseId)!} ctx={ctx} />;
  else if (screen === "offers") content = <OffersView ctx={ctx} focus={offerFocus} />;
  else if (screen === "forecast") content = <ForecastView ctx={ctx} />;
  else if (screen === "catalog") content = <CatalogView ctx={ctx} />;
  else content = <CrmAssistant open fullPage onClose={() => undefined} />;

  const activeNav = screen === "account" ? "accounts" : screen === "deal" ? "deals" : (screen as string) === "case" ? "cases" : screen;

  const pendingStageDeal = stageChangePrompt ? dealById(stageChangePrompt.dealId) : undefined;
  const stageChangeCopy = stageChangePrompt && pendingStageDeal
    ? stageChangeModalCopy(pendingStageDeal, stageChangePrompt.fromStage, stageChangePrompt.targetStage, stageChangePrompt.validateLead)
    : null;

  return (
    <div className="shell">
      <header className="mobilebar">
        <button className="icon-btn" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} type="button"><Icon name={menuOpen ? "close" : "menu"} /></button>
        <span className="mobilebar-brand">HMD Secure CRM</span>
        <button className="icon-btn notif-btn" aria-label="Notifications" onClick={() => setNotifOpen((v) => !v)} type="button"><Icon name="bell" />{unread > 0 && <span className="notif-dot" />}</button>
      </header>

      <aside className={cx("sidebar", menuOpen && "sidebar--open")}>
        <UserSwitcher userId={userId} onChange={switchUser} />

        <nav aria-label="Primary" className="sidebar-nav">
          {NAV.map((item) => {
            const count = item.screen === "cases" ? seedCases.filter((c) => (c.status !== "resolved" && c.status !== "closed") && (user.role !== "tam" || c.ownerId === user.id)).length
              : item.screen === "offers" ? seedOffers.map((o) => offerState[o.id] ?? o).filter((o) => user.role === "sales_manager" && o.status === "pending_manager").length
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
          <button className="notif-row mcp-tip-row" onClick={() => { setMcpSetupOpen(true); setMenuOpen(false); }} type="button">
            <Icon name="info" /><span>Connect AI client</span><span className="mcp-tip">MCP</span>
          </button>
          <button className="notif-row" onClick={() => setNotifOpen((v) => !v)} aria-expanded={notifOpen} type="button">
            <Icon name="bell" /><span>Notifications</span>{unread > 0 && <span className="nav-count nav-count--alert">{unread}</span>}
          </button>
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

      {mcpSetupOpen && <McpSetupModal onClose={() => setMcpSetupOpen(false)} />}

      <main className={cx("workspace", screen === "assistant" && "workspace--assistant")}>{content}</main>

      {drawer && (
        <>
          <button className="drawer-scrim" aria-label="Close panel" type="button" onClick={() => setDrawer(null)} />
          <aside className="drawer" role="dialog" aria-label={drawer.kind === "account" ? "Account record" : drawer.kind === "deal" ? "Deal detail" : "Case detail"}>
            <div className="drawer-bar">
              <div className="drawer-bar-actions">
                <button className="icon-btn" type="button" aria-label="Open full page" title="Open as full page" onClick={expandDrawer}><Icon name="expand" /></button>
                <button className="icon-btn" type="button" aria-label="Close panel" onClick={() => setDrawer(null)}><Icon name="close" /></button>
              </div>
            </div>
            <div className="drawer-body">
              {drawer.kind === "account"
                ? <AccountRecord account={accountById(drawer.id)!} ctx={ctx} embedded />
                : drawer.kind === "deal"
                  ? <DealDetail deal={dealById(drawer.id)!} ctx={ctx} embedded />
                  : <CaseDetail caseRec={seedCases.find((c) => c.id === drawer.id)!} ctx={ctx} embedded />}
            </div>
          </aside>
        </>
      )}

      <CrmAssistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onOpenFullPage={() => {
          setAssistantOpen(false);
          setScreen("assistant");
          setDrawer(null);
          setMenuOpen(false);
        }}
      />
      {screen !== "assistant" && <footer className="assistant-footer">
        <div className="theme-switcher" role="group" aria-label="Color scheme">
          {([
            ["original", "Secure"],
            ["metro", "Metro"],
            ["light", "Light"],
          ] as const).map(([value, label]) => (
            <button
              className={cx("theme-option", theme === value && "theme-option--active")}
              type="button"
              aria-pressed={theme === value}
              onClick={() => onThemeChange(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className={cx("ask-crm-trigger", assistantOpen && "ask-crm-trigger--active")}
          type="button"
          aria-expanded={assistantOpen}
          aria-controls="crm-assistant-title"
          onClick={() => setAssistantOpen((value) => !value)}
        >
          <Icon name="spark" /><span>Ask CRM</span>
        </button>
      </footer>}

      {toast && <div className="toast" role="status">{toast.msg}</div>}
      {stageChangePrompt && stageChangeCopy && (
        <ConfirmModal
          title={stageChangeCopy.title}
          body={stageChangeCopy.body}
          confirmLabel={stageChangeCopy.confirmLabel}
          onConfirm={() => {
            if (stageChangePrompt.validateLead) validateLead(stageChangePrompt.dealId);
            moveDeal(stageChangePrompt.dealId, stageChangePrompt.targetStage);
            setStageChangePrompt(null);
          }}
          onCancel={() => setStageChangePrompt(null)}
        />
      )}
      {menuOpen && <button className="scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} type="button" />}
    </div>
  );
}
