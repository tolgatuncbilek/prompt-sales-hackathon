// HMD Secure AI-Native CRM — in-memory domain model and seed data.
//
// Mirrors crm_schema.md (Schema B). Entities are kept as flat arrays with FK
// ids so the relational shape stays visible; embedded `phases` carry the
// time-phased forecast that the schema stores in DEVICE_FORECAST / the MRR
// trajectory. Nothing here talks to a backend — it is a faithful prototype of
// the shared operating picture described in PRODUCT.md.

export type Role = "sales_rep" | "tam" | "sales_manager" | "finance" | "admin";

// Deal pipeline — Lead → Offer → Customer testing → Final negotiation → Closed.
export type Stage =
  | "lead"
  | "offer"
  | "customer_testing"
  | "final_negotiation"
  | "closed";

export type Channel = "direct" | "reseller";
export type ApiStage =
  | "interest_shown"
  | "rfi_answered"
  | "rfp_given"
  | "customer_test"
  | "contract_negotiation"
  | "won"
  | "lost";

export type ContactRole =
  | "financial_decision_maker"
  | "budget_holder"
  | "tech_decision_maker"
  | "influencer";

export type CaseStatus = "open" | "in_progress" | "escalated" | "resolved" | "closed";
export type CasePriority = "low" | "medium" | "high" | "critical";

export type InvoiceModel = "one_off" | "fixed_term" | "monthly_recurring";

export type OfferStatus =
  | "sales_rep"
  | "pending_manager"
  | "made"
  | "rejected";

export type ApprovalRole = "sales_rep" | "sales_manager";

export type InsightType =
  | "enrichment"
  | "next_action"
  | "risk_flag"
  | "pipeline_summary"
  | "offer_draft";

export type InsightStatus = "pending_review" | "accepted" | "dismissed";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  title: string;
};

export type Account = {
  id: string;
  name: string;
  domain: string;
  address: string;
  vatId: string;
  industry: string;
  region: string;
  ownerId: string;
  lifecycle: string;
  sites: number;
  summary: string;
  since: string;
};

export type Contact = {
  id: string;
  accountId: string;
  name: string;
  email: string;
  phone: string;
  roleType: ContactRole;
  primary?: boolean;
};

export type DevicePhase = { period: string; units: number };

export type Deal = {
  id: string;
  accountId: string;
  parentDealId: string | null;
  ownerId: string;
  title: string;
  stage: Stage;
  apiStage?: ApiStage;
  /** True once the rep has confirmed the lead is qualified. */
  leadValidated?: boolean;
  channel: Channel;
  isPilot: boolean;
  expectedClose: string; // ISO date
  updatedAt: string; // ISO date
  createdAt: string;
  deviceUnitPrice: number;
  devicePhases: DevicePhase[];
};

export type ServiceContract = {
  id: string;
  dealId: string;
  serviceId: string;
  invoiceModel: InvoiceModel;
  startDate: string;
  endDate: string | null;
  fixedValue: number | null;
  monthlyRate: number | null;
  expectedDevices: number | null; // for monthly_recurring display
  phases: { period: string; value: number }[]; // recognized revenue by quarter
};

export type ServiceCatalogItem = {
  id: string;
  name: string;
  serviceType: string;
  isThirdParty: boolean;
  retired: boolean;
};

export type ProductCatalogItem = {
  id: string;
  name: string;
  category: string;
  listPrice: number;
  retired: boolean;
};

export type CaseNote = {
  author: string;
  body: string;
  when: string;
  internal: boolean;
};

export type CaseRecord = {
  id: string;
  ref: string;
  accountId: string;
  dealId?: string | null;
  serviceId: string | null;
  ownerId: string;
  contactId: string | null;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  escalated: boolean;
  thirdPartyRef: string | null;
  slaDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  notes: CaseNote[];
};

export type OfferLine = {
  kind: "product" | "service";
  productId: string | null;
  serviceId: string | null;
  label: string;
  unitPrice: number;
  quantity: number;
  discountPct: number;
};

export type ApprovalStep = {
  stepOrder: number;
  roleRequired: ApprovalRole;
  decidedById: string | null;
  decision: "approved" | "rejected" | null;
  note: string | null;
  decidedAt: string | null;
};

export type Offer = {
  id: string;
  ref: string;
  dealId: string;
  createdById: string;
  version: number;
  status: OfferStatus;
  discountPct: number;
  justification: string | null;
  lockedAt: string | null;
  createdAt: string;
  lines: OfferLine[];
  approvals: ApprovalStep[];
};

export type ActivityKind =
  | "stage"
  | "note"
  | "meeting"
  | "email"
  | "call"
  | "case"
  | "offer"
  | "ai";

export type Activity = {
  id: string;
  accountId: string;
  dealId?: string | null;
  actorId: string | null; // null when written by OpenClaw
  kind: ActivityKind;
  summary: string;
  when: string;
  isAi: boolean;
};

export type AiInsight = {
  id: string;
  accountId: string;
  dealId: string | null;
  caseId: string | null;
  type: InsightType;
  headline: string;
  body: string;
  confidence: number; // 0..1
  evidence: string[];
  sources: { title: string; detail: string }[];
  status: InsightStatus;
  draftEmail?: string;
  severity?: "low" | "medium" | "high";
};

export type Notification = {
  id: string;
  userId: string;
  kind: ActivityKind;
  body: string;
  read: boolean;
  when: string;
  link?: { screen: string; id?: string };
};

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

/** App "today". The README demo scenario is dated June 2026. */
export const TODAY = new Date("2026-06-13T09:00:00Z");

export const STAGE_META: Record<Stage, { label: string; short: string; csv: string; probability: number; order: number }> = {
  lead: { label: "Lead", short: "Lead", csv: "Discovery · 10%", probability: 0.1, order: 0 },
  offer: { label: "Offer", short: "Offer", csv: "Offer sent · 30%", probability: 0.3, order: 1 },
  customer_testing: { label: "Customer testing", short: "Customer testing", csv: "Device trial · 50%", probability: 0.5, order: 2 },
  final_negotiation: { label: "Final negotiation", short: "Final negotiation", csv: "Contract redlining · 80%", probability: 0.8, order: 3 },
  closed: { label: "Closed", short: "Closed", csv: "Contract signed", probability: 1, order: 4 },
};

/** Every selectable deal status, in ladder order. */
export const STATUSES: Stage[] = ["lead", "offer", "customer_testing", "final_negotiation", "closed"];

/** Open statuses (everything before Closed) — the forecast-bearing tiers. */
export const OPEN_STATUSES: Stage[] = ["lead", "offer", "customer_testing", "final_negotiation"];

/** Map UI stages to the DB/API enum values. */
export const STAGE_TO_API: Record<Stage, ApiStage> = {
  lead: "interest_shown",
  offer: "rfp_given",
  customer_testing: "customer_test",
  final_negotiation: "contract_negotiation",
  closed: "won",
};

export function stageFromApi(apiStage: ApiStage): Stage {
  if (apiStage === "interest_shown" || apiStage === "rfi_answered") return "lead";
  if (apiStage === "rfp_given") return "offer";
  if (apiStage === "customer_test") return "customer_testing";
  if (apiStage === "contract_negotiation") return "final_negotiation";
  return "closed";
}

export function leadValidatedFromApi(apiStage: ApiStage): boolean {
  return apiStage !== "interest_shown";
}

export function pipelineStages(_channel?: Channel): Stage[] {
  return STATUSES;
}

// ---------------------------------------------------------------------------
// Forecast commitment — the deal status IS the commitment tier (the CSV ladder).
// The four open statuses carry forecast value, weighted by STAGE_META; Closed
// (delivered) drops out of the forward forecast.
// ---------------------------------------------------------------------------

export const TIERS: Stage[] = OPEN_STATUSES;

export function inForecast(deal: Deal): boolean {
  return deal.stage !== "closed";
}

export type Measure = "net_sales" | "volume" | "gm";

export const MEASURE_LABEL: Record<Measure, string> = {
  net_sales: "Net sales",
  volume: "Volume (units)",
  gm: "Gross margin",
};

/** Gross margin per device unit. Seeded to the example sheet's ratio
 *  (XR-21: €466 list, €211 GM ≈ 45%). */
const GM_PER_UNIT: Record<number, number> = { 466: 211, 612: 268, 312: 138 };
export function deviceGmPerUnit(deal: Deal): number {
  return GM_PER_UNIT[deal.deviceUnitPrice] ?? Math.round(deal.deviceUnitPrice * 0.45);
}

/** Service gross-margin rate. Internal services carry higher margin than
 *  third-party pass-through services. */
const SERVICE_GM: Record<string, number> = { s_mdm: 0.65, s_lifecycle: 0.6, s_warranty: 0.55, s_repair: 0.45, s_sim: 0.4 };
export function serviceGmRate(serviceId: string): number {
  return SERVICE_GM[serviceId] ?? 0.5;
}

/** Country rollup for the regional forecast (mirrors the CSV's region table). */
const COUNTRY: Record<string, string> = {
  a_nordcom: "Germany",
  a_vektor: "Sweden",
  a_lumen: "United Kingdom",
  a_arctic: "Sweden",
  a_halcyon: "Belgium",
};
export function accountCountry(accountId: string): string {
  return COUNTRY[accountId] ?? "Other";
}

export const CONTACT_ROLE_LABEL: Record<ContactRole, string> = {
  financial_decision_maker: "Financial decision maker",
  budget_holder: "Budget holder",
  tech_decision_maker: "Tech decision maker",
  influencer: "Influencer",
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABEL: Record<CasePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITY_RANK: Record<CasePriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const INVOICE_MODEL_LABEL: Record<InvoiceModel, string> = {
  one_off: "One-off at delivery",
  fixed_term: "Fixed-term package",
  monthly_recurring: "Monthly recurring",
};

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  sales_rep: "With Sales Representative",
  pending_manager: "Pending — Sales Manager",
  made: "Offer made",
  rejected: "Rejected",
};

export const APPROVAL_ROLE_LABEL: Record<ApprovalRole, string> = {
  sales_rep: "Sales Representative",
  sales_manager: "Sales Manager",
};

export const ROLE_LABEL: Record<Role, string> = {
  sales_rep: "Sales Representative",
  tam: "Technical Account Manager",
  sales_manager: "Sales Manager",
  finance: "Finance",
  admin: "Administrator",
};

/** One demo persona per role — resolved from the current user list after sync. */
export function demoPersonaIds(): string[] {
  const pick = (role: Role) => users.find((u) => u.role === role)?.id;
  const ids = [
    pick("sales_rep"),
    pick("sales_manager"),
    pick("tam"),
    pick("finance") ?? pick("admin"),
  ].filter((id): id is string => Boolean(id));
  return ids.length > 0 ? ids : users.slice(0, 4).map((u) => u.id);
}

export function defaultDemoUserId(): string {
  return users.find((u) => u.role === "sales_rep")?.id ?? users[0]?.id ?? "";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function loginAsUser(userId: string): Promise<boolean> {
  // In-memory fallback personas use readable IDs such as "u_veera".
  // They can switch locally, but must never reach UUID-backed API routes.
  if (!isUuid(userId)) return false;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 3-year time-phased horizon, by quarter, starting next quarter from TODAY. */
export const PERIODS: string[] = [
  "2026-Q3", "2026-Q4",
  "2027-Q1", "2027-Q2", "2027-Q3", "2027-Q4",
  "2028-Q1", "2028-Q2", "2028-Q3", "2028-Q4",
];

export function periodLabel(period: string): string {
  const [year, q] = period.split("-");
  return `${q} ${year}`;
}

export function periodYear(period: string): string {
  return period.split("-")[0] ?? period;
}

// ---------------------------------------------------------------------------
// Runtime data
// ---------------------------------------------------------------------------

export let users: User[] = [];
export let accounts: Account[] = [];
export let contacts: Contact[] = [];
export let products: ProductCatalogItem[] = [];
export let services: ServiceCatalogItem[] = [];
export let deals: Deal[] = [];
export let serviceContracts: ServiceContract[] = [];
export let cases: CaseRecord[] = [];

export function defaultOfferWorkflow(): ApprovalStep[] {
  return [
    { stepOrder: 1, roleRequired: "sales_rep", decidedById: null, decision: null, note: null, decidedAt: null },
    { stepOrder: 2, roleRequired: "sales_manager", decidedById: null, decision: null, note: null, decidedAt: null },
  ];
}

export function approvalTimestamp(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function offerWorkflowSteps(offer: Offer): ApprovalStep[] {
  const steps = offer.approvals.filter((a) => a.roleRequired === "sales_rep" || a.roleRequired === "sales_manager");
  return steps.length >= 2 ? steps.sort((a, b) => a.stepOrder - b.stepOrder).slice(0, 2) : defaultOfferWorkflow();
}

export function approvalStepActionLabel(step: ApprovalStep): string {
  if (step.decision !== "approved") return "";
  return step.roleRequired === "sales_rep" ? "Submitted by" : "Approved by";
}

export let offers: Offer[] = [];
export let activities: Activity[] = [];
export let aiInsights: AiInsight[] = [];
export let notifications: Notification[] = [];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function userById(id: string | null): User | undefined {
  if (!id) return undefined;
  return users.find((u) => u.id === id);
}
export function userName(id: string | null): string {
  return userById(id)?.name ?? "—";
}
export function accountById(id: string): Account | undefined {
  return accounts.find((a) => a.id === id);
}
export function dealById(id: string): Deal | undefined {
  return deals.find((d) => d.id === id);
}
export function serviceById(id: string | null): ServiceCatalogItem | undefined {
  if (!id) return undefined;
  return services.find((s) => s.id === id);
}
export function contactById(id: string | null): Contact | undefined {
  if (!id) return undefined;
  return contacts.find((c) => c.id === id);
}
export function contactsForAccount(accountId: string): Contact[] {
  return contacts.filter((c) => c.accountId === accountId);
}
export function dealsForAccount(accountId: string): Deal[] {
  return deals.filter((d) => d.accountId === accountId);
}
export function casesForAccount(accountId: string): CaseRecord[] {
  return cases.filter((c) => c.accountId === accountId);
}
export function offersForAccount(accountId: string): Offer[] {
  const ids = new Set(dealsForAccount(accountId).map((d) => d.id));
  return offers.filter((o) => ids.has(o.dealId));
}
export function activityForAccount(accountId: string): Activity[] {
  return activities.filter((a) => a.accountId === accountId);
}
export function activityForDeal(dealId: string): Activity[] {
  return activities.filter((a) => a.dealId === dealId);
}

let localActivitySeq = 0;

/**
 * Append an activity to the shared timeline so it shows on the account and,
 * when `dealId` is set, the deal timeline. Pass `persist: true` for manual
 * entries (notes, meetings, calls, emails) that have no other backend write so
 * they round-trip through the activities API. Domain actions that already
 * persist through their own endpoint (stage change, deal/case/offer creation)
 * leave `persist` unset to avoid writing the row twice.
 */
export function recordActivity(input: {
  accountId: string;
  dealId?: string | null;
  actorId: string | null;
  kind: ActivityKind;
  summary: string;
  isAi?: boolean;
  persist?: boolean;
}): Activity {
  const activity: Activity = {
    id: `act_local_${Date.now().toString(36)}_${localActivitySeq++}`,
    accountId: input.accountId,
    dealId: input.dealId ?? null,
    actorId: input.actorId,
    kind: input.kind,
    summary: input.summary,
    when: "Just now",
    isAi: input.isAi ?? false,
  };
  activities.unshift(activity);
  if (input.persist) {
    void fetch(`/api/accounts/${activity.accountId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity_type: activity.dealId ? "deal" : "account",
        entity_id: activity.dealId ?? activity.accountId,
        event_type: activity.kind,
        payload: { summary: activity.summary, kind: activity.kind },
      }),
    }).catch((e) => console.error("Failed to persist activity", e));
  }
  return activity;
}
export function insightsForAccount(accountId: string): AiInsight[] {
  return aiInsights.filter((i) => i.accountId === accountId);
}
export function insightsForDeal(dealId: string): AiInsight[] {
  return aiInsights.filter((i) => i.dealId === dealId);
}
export function serviceContractsForDeal(dealId: string): ServiceContract[] {
  return serviceContracts.filter((sc) => sc.dealId === dealId);
}
export function offersForDeal(dealId: string): Offer[] {
  return offers.filter((o) => o.dealId === dealId);
}
export function casesForDeal(dealId: string): CaseRecord[] {
  return cases.filter((c) => c.dealId === dealId);
}
export function offerForDeal(dealId: string): Offer | undefined {
  return offers.find((o) => o.dealId === dealId);
}

// ---------------------------------------------------------------------------
// Derived metrics
// ---------------------------------------------------------------------------

export function isOpen(deal: Deal): boolean {
  return OPEN_STATUSES.includes(deal.stage);
}

export function fmtEur(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const n = Math.abs(amount);
  if (n >= 1_000_000) return `${sign}€${(n / 1_000_000).toFixed(2)}m`;
  if (n >= 1_000) return `${sign}€${Math.round(n / 1_000)}k`;
  return `${sign}€${Math.round(n)}`;
}

export function fmtEurExact(amount: number): string {
  return `€${Math.round(amount).toLocaleString("en-IE")}`;
}

export function deviceTotal(deal: Deal): number {
  return deal.devicePhases.reduce((sum, p) => sum + p.units * deal.deviceUnitPrice, 0);
}

export function deviceUnits(deal: Deal): number {
  return deal.devicePhases.reduce((sum, p) => sum + p.units, 0);
}

export function serviceTotal(dealId: string): number {
  return serviceContractsForDeal(dealId).reduce(
    (sum, sc) => sum + sc.phases.reduce((s, p) => s + p.value, 0),
    0,
  );
}

export function dealTotal(deal: Deal): number {
  return deviceTotal(deal) + serviceTotal(deal.id);
}

export function probability(stage: Stage): number {
  return STAGE_META[stage].probability;
}

export function weightedTotal(deal: Deal): number {
  return dealTotal(deal) * probability(deal.stage);
}

export function deviceInPeriod(deal: Deal, period: string): number {
  return deal.devicePhases
    .filter((p) => p.period === period)
    .reduce((sum, p) => sum + p.units * deal.deviceUnitPrice, 0);
}

export function serviceInPeriod(dealId: string, period: string): number {
  return serviceContractsForDeal(dealId)
    .flatMap((sc) => sc.phases)
    .filter((p) => p.period === period)
    .reduce((sum, p) => sum + p.value, 0);
}

/** Next quarter relative to TODAY is the first horizon period. */
export const NEXT_QUARTER = PERIODS[0]!;

export function nextQuarterValue(deal: Deal): number {
  return deviceInPeriod(deal, NEXT_QUARTER) + serviceInPeriod(deal.id, NEXT_QUARTER);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function daysSinceUpdate(deal: Deal): number {
  return daysBetween(TODAY, new Date(deal.updatedAt));
}

/** Stale: no update for 14+ days and not won/lost (crm_schema rule 2). */
export function isStale(deal: Deal): boolean {
  return isOpen(deal) && daysSinceUpdate(deal) >= 14;
}

export function isOverdue(deal: Deal): boolean {
  if (!deal.expectedClose?.trim()) return false;
  return isOpen(deal) && daysBetween(TODAY, new Date(deal.expectedClose)) > 0;
}

export type RiskLevel = "overdue" | "stale" | "watch" | "on_track" | "early";

export function dealRisk(deal: Deal): { level: RiskLevel; label: string; detail: string } {
  if (deal.stage === "closed") {
    return { level: "on_track", label: "Closed", detail: "Delivered / realised" };
  }
  if (isOverdue(deal)) {
    const d = daysBetween(TODAY, new Date(deal.expectedClose));
    return { level: "overdue", label: "Overdue", detail: `Close date passed ${d}d ago` };
  }
  if (isStale(deal)) {
    return { level: "stale", label: "Stalled", detail: `No update for ${daysSinceUpdate(deal)}d` };
  }
  if (deal.stage === "lead") {
    return { level: "early", label: "Early", detail: "Lead in discovery" };
  }
  const toClose = -daysBetween(TODAY, new Date(deal.expectedClose));
  if (toClose <= 30) return { level: "watch", label: "Closing soon", detail: `Closes in ${toClose}d` };
  return { level: "on_track", label: "On track", detail: `Updated ${daysSinceUpdate(deal)}d ago` };
}

export function confidenceLabel(c: number): string {
  if (c >= 0.8) return "High confidence";
  if (c >= 0.6) return "Medium confidence";
  return "Low confidence";
}

// SLA helpers --------------------------------------------------------------

export type SlaState = "breached" | "due_soon" | "on_track" | "none";

export function slaState(c: CaseRecord): { state: SlaState; label: string } {
  if (c.status === "resolved" || c.status === "closed") return { state: "none", label: "Closed on time" };
  if (!c.slaDeadline) return { state: "none", label: "No SLA" };
  const days = daysBetween(new Date(c.slaDeadline), TODAY);
  if (days < 0) return { state: "breached", label: `SLA breached ${-days}d ago` };
  if (days === 0) return { state: "due_soon", label: "SLA due today" };
  if (days <= 2) return { state: "due_soon", label: `SLA due in ${days}d` };
  return { state: "on_track", label: `SLA due in ${days}d` };
}

export function caseAgeDays(c: CaseRecord): number {
  return daysBetween(TODAY, new Date(c.createdAt));
}

/** Services selectable when building an offer. */
export const OFFER_BUILDER_SERVICE_IDS = ["s_fota", "s_emm"] as const;

export function offerBuilderProducts(): ProductCatalogItem[] {
  return products.filter((p) => !p.retired);
}

export function offerBuilderServices(): ServiceCatalogItem[] {
  return services.filter((s) => OFFER_BUILDER_SERVICE_IDS.includes(s.id as (typeof OFFER_BUILDER_SERVICE_IDS)[number]));
}

export function offerLineKind(line: OfferLine): "product" | "service" {
  return line.kind ?? (line.productId ? "product" : "service");
}

export function offerProductNetTotal(offer: Offer): number {
  const linesNet = offer.lines
    .filter((l) => offerLineKind(l) === "product")
    .reduce((s, l) => s + lineNet(l), 0);
  const totalLines = offerLinesNetTotal(offer);
  if (totalLines <= 0) return 0;
  return linesNet * (1 - offer.discountPct / 100);
}

export function offerServiceNetTotal(offer: Offer): number {
  const linesNet = offer.lines
    .filter((l) => offerLineKind(l) === "service")
    .reduce((s, l) => s + lineNet(l), 0);
  const totalLines = offerLinesNetTotal(offer);
  if (totalLines <= 0) return 0;
  return linesNet * (1 - offer.discountPct / 100);
}

export function dealGrossMargin(device: number, service: number): number {
  return (device + service) * 0.5;
}

export function setDealRevenue(deal: Deal, deviceValue: number, serviceValue: number) {
  const period = deal.devicePhases[0]?.period ?? NEXT_QUARTER;
  deal.deviceUnitPrice = deviceValue;
  deal.devicePhases = deviceValue > 0 ? [{ period, units: 1 }] : [];

  for (let index = serviceContracts.length - 1; index >= 0; index -= 1) {
    if (serviceContracts[index]?.dealId === deal.id) serviceContracts.splice(index, 1);
  }
  if (serviceValue > 0) {
    serviceContracts.unshift({
      id: `sc_${deal.id}_${Date.now()}`,
      dealId: deal.id,
      serviceId: services[0]?.id ?? "",
      invoiceModel: "one_off",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      fixedValue: serviceValue,
      monthlyRate: null,
      expectedDevices: null,
      phases: [{ period, value: serviceValue }],
    });
  }
}

export function setDealNextQuarterRevenue(deal: Deal, nextQuarterValue: number) {
  const period = NEXT_QUARTER;
  const svcNq = serviceInPeriod(deal.id, period);
  const deviceVal = Math.max(0, nextQuarterValue - svcNq);
  const otherPhases = deal.devicePhases.filter((p) => p.period !== period);
  if (deviceVal > 0) {
    deal.deviceUnitPrice = deviceVal;
    deal.devicePhases = [...otherPhases, { period, units: 1 }];
  } else {
    deal.devicePhases = otherPhases;
    if (!otherPhases.length) deal.deviceUnitPrice = 0;
  }
}

export function syncDealFromMadeOffer(deal: Deal, offer: Offer) {
  const device = offerProductNetTotal(offer);
  const service = offerServiceNetTotal(offer);
  const period = NEXT_QUARTER;
  deal.deviceUnitPrice = device;
  deal.devicePhases = device > 0 ? [{ period, units: 1 }] : [];
  for (let index = serviceContracts.length - 1; index >= 0; index -= 1) {
    if (serviceContracts[index]?.dealId === deal.id) serviceContracts.splice(index, 1);
  }
  if (service > 0) {
    serviceContracts.unshift({
      id: `sc_${deal.id}_${Date.now()}`,
      dealId: deal.id,
      serviceId: offer.lines.find((l) => offerLineKind(l) === "service")?.serviceId ?? services[0]?.id ?? "",
      invoiceModel: "one_off",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      fixedValue: service,
      monthlyRate: null,
      expectedDevices: null,
      phases: [{ period, value: service }],
    });
  }
}

export function madeOfferForDeal(dealId: string, offerLookup?: (id: string) => Offer | undefined): Offer | undefined {
  return offers
    .map((o) => offerLookup?.(o.id) ?? o)
    .filter((o) => o.dealId === dealId && o.status === "made")
    .sort((a, b) => b.version - a.version)[0];
}

export function fmtExpectedClose(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" });
}

export function lineListSubtotal(line: OfferLine): number {
  return line.unitPrice * line.quantity;
}

export function lineNet(line: OfferLine): number {
  return lineListSubtotal(line) * (1 - line.discountPct / 100);
}

/** Sum of list prices before any line discount. */
export function offerList(offer: Offer): number {
  return offer.lines.reduce((s, l) => s + lineListSubtotal(l), 0);
}

/** Sum of line net values (after line-level discounts, before headline discount). */
export function offerLinesNetTotal(offer: Offer): number {
  return offer.lines.reduce((s, l) => s + lineNet(l), 0);
}

/** @deprecated alias — use offerLinesNetTotal for line nets or offerGrandNet for final total */
export function offerNet(offer: Offer): number {
  return offerLinesNetTotal(offer);
}

/** Final offer total after headline discount is applied to the line net sum. */
export function offerGrandNet(offer: Offer): number {
  const linesNet = offerLinesNetTotal(offer);
  return linesNet * (1 - offer.discountPct / 100);
}

export function unitPriceForLineNet(line: OfferLine, net: number): number {
  const qty = Math.max(1, line.quantity);
  const factor = 1 - line.discountPct / 100;
  if (factor <= 0) return line.unitPrice;
  return net / (qty * factor);
}

/** Default list prices for services (products use catalog listPrice). */
export const SERVICE_LIST_PRICES: Record<string, number> = {
  s_mdm: 14,
  s_lifecycle: 234_000,
  s_warranty: 96_000,
  s_repair: 72_000,
  s_sim: 6,
  s_fota: 18_000,
  s_emm: 12_000,
  s_tech_compat: 0,
};

export function catalogUnitPrice(productId: string | null, serviceId: string | null): number {
  if (productId) return products.find((p) => p.id === productId)?.listPrice ?? 0;
  if (serviceId) return SERVICE_LIST_PRICES[serviceId] ?? 0;
  return 0;
}

export function catalogLineLabel(productId: string | null, serviceId: string | null): string {
  if (productId) return products.find((p) => p.id === productId)?.name ?? "Product";
  if (serviceId) {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return "Service";
    if (svc.id === "s_mdm" || svc.id === "s_sim") return `${svc.name} (monthly, per device)`;
    if (svc.id === "s_fota") return `${svc.name} (per year)`;
    if (svc.id === "s_emm") return `${svc.name} (per year)`;
    return svc.name;
  }
  return "Item";
}

export function approvalStepsForOffer(_discountPct: number): ApprovalStep[] {
  return defaultOfferWorkflow();
}

export function offerStatusForDiscount(_discountPct: number): OfferStatus {
  return "sales_rep";
}

export function nextOfferVersion(dealId: string): number {
  const existing = offersForDeal(dealId);
  return existing.length ? Math.max(...existing.map((o) => o.version)) + 1 : 1;
}

export function createOfferRecord(params: {
  dealId: string;
  createdById: string;
  lines: OfferLine[];
  discountPct: number;
  justification: string | null;
}): Offer {
  const discountPct = Math.min(100, Math.max(0, params.discountPct));
  return {
    id: crypto.randomUUID(),
    ref: `OFF-${Date.now().toString().slice(-4)}`,
    dealId: params.dealId,
    createdById: params.createdById,
    version: nextOfferVersion(params.dealId),
    status: offerStatusForDiscount(discountPct),
    discountPct,
    justification: params.justification?.trim() || null,
    lockedAt: null,
    createdAt: new Date().toISOString().slice(0, 10),
    lines: params.lines,
    approvals: approvalStepsForOffer(discountPct),
  };
}

export function persistOfferUpdateToApi(offer: Offer): void {
  fetch(`/api/offers/${offer.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      discount_pct: offer.discountPct,
      justification: offer.justification,
    }),
  }).catch(console.error);

  fetch(`/api/offers/${offer.id}/lines`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      offer.lines.map((l) => ({
        product_id: l.productId,
        service_id: l.serviceId,
        unit_price: l.unitPrice,
        quantity: l.quantity,
        discount_pct: l.discountPct,
      })),
    ),
  }).catch(console.error);
}

export function persistOfferToApi(dealId: string, offer: Offer): void {
  fetch(`/api/offers/deals/${dealId}/offers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      version: offer.version,
      discount_pct: offer.discountPct,
      justification: offer.justification,
    }),
  })
    .then((r) => r.json())
    .then((created) => {
      const offerId = created.id ?? offer.id;
      return fetch(`/api/offers/${offerId}/lines`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          offer.lines.map((l) => ({
            product_id: l.productId,
            service_id: l.serviceId,
            unit_price: l.unitPrice,
            quantity: l.quantity,
            discount_pct: l.discountPct,
          })),
        ),
      }).then(() => {
        if (offer.discountPct > 0) {
          return fetch(`/api/offers/${offerId}/submit`, { method: "POST" });
        }
      });
    })
    .catch(console.error);
}

// Forecast aggregation -----------------------------------------------------

export type ForecastRow = {
  period: string;
  device: number;
  service: number;
  weightedDevice: number;
  weightedService: number;
};

export {
  forecastByPeriod,
  rollUp,
  sumRows,
  deviceMeasureInPeriod,
  serviceMeasureInPeriod,
  dealMeasureInPeriod,
  dealMeasureTotal,
  periodBuckets,
  bucketSum,
  tierSeries,
  streamSeries,
  regionSeries,
  forecastTotal,
  weightedForecast,
  securedForecast,
} from "./crm-forecast.ts";
export type { Granularity, Series, RegionSeries } from "./crm-forecast.ts";


export async function initCrmFromApi(): Promise<{ ok: boolean; userId: string | null; error?: string }> {
  console.log("Loading CRM data from API...");
  try {
    const authRes = await fetch("/api/auth/users", { credentials: "include" });
    if (!authRes.ok) throw new Error("Could not load users from PostgreSQL.");
    const apiUsers: { id: string; role: Role }[] = await authRes.json();
    if (apiUsers.length === 0) throw new Error("PostgreSQL is connected, but the CRM has no users.");

    let sessionUserId: string | null = null;
    const sessionRes = await fetch("/api/auth/session", { credentials: "include" });
    if (sessionRes.ok) {
      const session = await sessionRes.json();
      sessionUserId = session.id ?? null;
    }

    const preferredId = apiUsers.find((u) => u.role === "sales_rep")?.id ?? apiUsers[0]?.id ?? null;
    if (!sessionUserId && preferredId) {
      const loggedIn = await loginAsUser(preferredId);
      if (loggedIn) sessionUserId = preferredId;
    }

    const res = await fetch("/api/sync", { credentials: "include" });
    if (!res.ok) throw new Error("Could not synchronize CRM data from PostgreSQL.");
    const data = await res.json();

    users = data.users;
    accounts = data.accounts;
    contacts = data.contacts;
    products = data.products;
    services = data.services;
    deals = data.deals;
    serviceContracts = data.serviceContracts;
    cases = data.cases;
    offers = data.offers;
    aiInsights = data.aiInsights;
    activities = data.activities;
    notifications = data.notifications;

    const personas = demoPersonaIds();
    const activeId = personas.includes(sessionUserId ?? "")
      ? sessionUserId!
      : (defaultDemoUserId() || personas[0] || null);
    if (activeId) await loginAsUser(activeId);

    return { ok: true, userId: activeId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load CRM data from PostgreSQL.";
    console.error("Failed to load from API", e);
    return { ok: false, userId: null, error: message };
  }
}
