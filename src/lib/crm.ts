// HMD Secure AI-Native CRM — in-memory domain model and seed data.
//
// Mirrors crm_schema.md (Schema B). Entities are kept as flat arrays with FK
// ids so the relational shape stays visible; embedded `phases` carry the
// time-phased forecast that the schema stores in DEVICE_FORECAST / the MRR
// trajectory. Nothing here talks to a backend — it is a faithful prototype of
// the shared operating picture described in PRODUCT.md.

export type Role = "sales_rep" | "tam" | "sales_manager" | "finance";

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
};

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
// Seed data
// ---------------------------------------------------------------------------

export let users: User[] = [
  { id: "u_aino", name: "Aino Lahti", email: "aino.lahti@hmd.example", role: "sales_rep", initials: "AL", title: "Sales Representative" },
  { id: "u_elias", name: "Elias Niemi", email: "elias.niemi@hmd.example", role: "sales_rep", initials: "EN", title: "Sales Representative" },
  { id: "u_sara", name: "Sara Miettinen", email: "sara.miettinen@hmd.example", role: "tam", initials: "SM", title: "Technical Account Manager" },
  { id: "u_oskari", name: "Oskari Lehto", email: "oskari.lehto@hmd.example", role: "tam", initials: "OL", title: "Technical Account Manager" },
  { id: "u_mikael", name: "Mikael Korhonen", email: "mikael.korhonen@hmd.example", role: "sales_manager", initials: "MK", title: "Sales Manager" },
  { id: "u_veera", name: "Veera Salonen", email: "veera.salonen@hmd.example", role: "finance", initials: "VS", title: "Finance" },
];

export let accounts: Account[] = [
  {
    id: "a_nordcom",
    name: "Nordcom Mobility",
    domain: "nordcom.example",
    address: "Speicherstadt 4, 20457 Hamburg, Germany",
    vatId: "DE 812 4471 90",
    industry: "Field logistics",
    region: "DACH",
    ownerId: "u_aino",
    lifecycle: "Customer · Expanding",
    sites: 6,
    summary: "Six-site logistics operator rolling rugged devices out to field crews after a successful first wave.",
    since: "Mar 2023",
  },
  {
    id: "a_vektor",
    name: "Vektor Logistics",
    domain: "vektor.example",
    address: "Hamnvägen 12, 211 19 Malmö, Sweden",
    vatId: "SE 556 921 0044",
    industry: "Transport & haulage",
    region: "Nordics",
    ownerId: "u_elias",
    lifecycle: "Customer · Stable",
    sites: 3,
    summary: "Reseller-led haulage account; pricing is approved and the offer is live with the end customer.",
    since: "Sep 2022",
  },
  {
    id: "a_lumen",
    name: "Lumen Public Safety",
    domain: "lumen.example",
    address: "2 Albert Square, Manchester M2 5PT, United Kingdom",
    vatId: "GB 422 118 06",
    industry: "Public safety",
    region: "UK & IE",
    ownerId: "u_aino",
    lifecycle: "Customer · At risk",
    sites: 11,
    summary: "Largest public-safety account; the frame renewal is in contract negotiation and the close date has slipped.",
    since: "Jan 2021",
  },
  {
    id: "a_arctic",
    name: "Arctic Grid",
    domain: "arcticgrid.example",
    address: "Kungsgatan 8, 111 43 Stockholm, Sweden",
    vatId: "SE 559 002 7781",
    industry: "Energy & utilities",
    region: "Nordics",
    ownerId: "u_elias",
    lifecycle: "Prospect · Early",
    sites: 3,
    summary: "New utilities prospect in discovery; the device trajectory is not yet captured across its three sites.",
    since: "May 2026",
  },
  {
    id: "a_halcyon",
    name: "Halcyon Facilities",
    domain: "halcyon.example",
    address: "Meir 24, 2000 Antwerp, Belgium",
    vatId: "BE 0712 994 331",
    industry: "Facilities management",
    region: "Benelux",
    ownerId: "u_elias",
    lifecycle: "Customer · Expanding",
    sites: 4,
    summary: "Facilities operator running a 120-device pilot with two follow-on markets identified in the account plan.",
    since: "Nov 2023",
  },
];

export let contacts: Contact[] = [
  { id: "c_nordcom_1", accountId: "a_nordcom", name: "Marit Brandt", email: "m.brandt@nordcom.example", phone: "+49 40 553 118", roleType: "tech_decision_maker", primary: true },
  { id: "c_nordcom_2", accountId: "a_nordcom", name: "Tobias Reiner", email: "t.reiner@nordcom.example", phone: "+49 40 553 207", roleType: "budget_holder" },
  { id: "c_nordcom_3", accountId: "a_nordcom", name: "Lena Vogt", email: "l.vogt@nordcom.example", phone: "+49 40 553 442", roleType: "influencer" },
  { id: "c_vektor_1", accountId: "a_vektor", name: "Henrik Sø", email: "h.so@vektor.example", phone: "+46 40 661 220", roleType: "budget_holder", primary: true },
  { id: "c_vektor_2", accountId: "a_vektor", name: "Paavo Rinne", email: "p.rinne@northbound.example", phone: "+358 9 477 010", roleType: "influencer" },
  { id: "c_lumen_1", accountId: "a_lumen", name: "DCI Rowan Hale", email: "r.hale@lumen.example", phone: "+44 161 200 7788", roleType: "budget_holder", primary: true },
  { id: "c_lumen_2", accountId: "a_lumen", name: "Priya Anand", email: "p.anand@lumen.example", phone: "+44 161 200 7790", roleType: "financial_decision_maker" },
  { id: "c_lumen_3", accountId: "a_lumen", name: "Gareth Pugh", email: "g.pugh@lumen.example", phone: "+44 161 200 7795", roleType: "influencer" },
  { id: "c_arctic_1", accountId: "a_arctic", name: "Sofia Lindqvist", email: "s.lindqvist@arcticgrid.example", phone: "+46 8 120 5530", roleType: "tech_decision_maker", primary: true },
  { id: "c_halcyon_1", accountId: "a_halcyon", name: "Bram de Vries", email: "b.devries@halcyon.example", phone: "+32 3 226 1140", roleType: "budget_holder", primary: true },
  { id: "c_halcyon_2", accountId: "a_halcyon", name: "Anouk Jansen", email: "a.jansen@halcyon.example", phone: "+32 3 226 1152", roleType: "tech_decision_maker" },
];

export let products: ProductCatalogItem[] = [
  { id: "p_xr21", name: "HMD XR-21 rugged 5G", category: "Device", listPrice: 466, retired: false },
  { id: "p_t30", name: "HMD T-30 field tablet", category: "Device", listPrice: 612, retired: false },
  { id: "p_pulse", name: "HMD Pulse handheld", category: "Device", listPrice: 312, retired: false },
  { id: "p_sled", name: "HMD Edge scanner sled", category: "Accessory", listPrice: 128, retired: false },
  { id: "p_xr11", name: "HMD XR-11 (previous gen)", category: "Device", listPrice: 388, retired: true },
];

export let services: ServiceCatalogItem[] = [
  { id: "s_mdm", name: "Secure MDM", serviceType: "Device management", isThirdParty: false, retired: false },
  { id: "s_lifecycle", name: "Device Lifecycle Management", serviceType: "Managed service", isThirdParty: false, retired: false },
  { id: "s_warranty", name: "Extended Warranty (3 yr)", serviceType: "Warranty", isThirdParty: false, retired: false },
  { id: "s_repair", name: "Onsite Repair & Swap", serviceType: "Field service", isThirdParty: true, retired: false },
  { id: "s_sim", name: "SIM Provisioning", serviceType: "Connectivity", isThirdParty: true, retired: false },
];

export let deals: Deal[] = [
  {
    id: "d_nordcom",
    accountId: "a_nordcom",
    parentDealId: "d_nordcom_pilot",
    ownerId: "u_aino",
    title: "Field crew rollout — wave 2",
    stage: "customer_testing",
    leadValidated: true,
    channel: "direct",
    isPilot: false,
    expectedClose: "2026-07-18",
    updatedAt: "2026-05-26",
    createdAt: "2026-03-02",
    deviceUnitPrice: 466,
    devicePhases: [
      { period: "2026-Q3", units: 380 },
      { period: "2026-Q4", units: 420 },
      { period: "2027-Q2", units: 560 },
      { period: "2027-Q4", units: 300 },
    ],
  },
  {
    id: "d_nordcom_pilot",
    accountId: "a_nordcom",
    parentDealId: null,
    ownerId: "u_aino",
    title: "Pilot — wave 1 (50 devices)",
    stage: "closed",
    channel: "direct",
    isPilot: true,
    expectedClose: "2026-02-12",
    updatedAt: "2026-02-12",
    createdAt: "2025-11-04",
    deviceUnitPrice: 466,
    devicePhases: [{ period: "2026-Q1", units: 50 } as DevicePhase],
  },
  {
    id: "d_vektor",
    accountId: "a_vektor",
    parentDealId: null,
    ownerId: "u_elias",
    title: "Driver terminal refresh",
    stage: "offer",
    leadValidated: true,
    channel: "reseller",
    isPilot: false,
    expectedClose: "2026-09-04",
    updatedAt: "2026-06-12",
    createdAt: "2026-04-19",
    deviceUnitPrice: 312,
    devicePhases: [
      { period: "2026-Q4", units: 300 },
      { period: "2027-Q1", units: 540 },
      { period: "2027-Q3", units: 420 },
    ],
  },
  {
    id: "d_lumen",
    accountId: "a_lumen",
    parentDealId: null,
    ownerId: "u_aino",
    title: "Frame renewal 2026–2029",
    stage: "final_negotiation",
    leadValidated: true,
    channel: "direct",
    isPilot: false,
    expectedClose: "2026-06-06",
    updatedAt: "2026-06-07",
    createdAt: "2026-01-22",
    deviceUnitPrice: 612,
    devicePhases: [
      { period: "2026-Q3", units: 360 },
      { period: "2027-Q1", units: 640 },
      { period: "2027-Q4", units: 520 },
      { period: "2028-Q2", units: 300 },
    ],
  },
  {
    id: "d_lumen_bodyworn",
    accountId: "a_lumen",
    parentDealId: null,
    ownerId: "u_aino",
    title: "Body-worn device program (contract signed)",
    stage: "closed",
    leadValidated: true,
    channel: "direct",
    isPilot: false,
    expectedClose: "2026-06-01",
    updatedAt: "2026-05-20",
    createdAt: "2025-12-10",
    deviceUnitPrice: 466,
    devicePhases: [
      { period: "2026-Q3", units: 300 },
      { period: "2026-Q4", units: 300 },
      { period: "2027-Q2", units: 240 },
    ],
  },
  {
    id: "d_arctic",
    accountId: "a_arctic",
    parentDealId: null,
    ownerId: "u_elias",
    title: "Site maintenance pilot",
    stage: "lead",
    leadValidated: false,
    channel: "direct",
    isPilot: true,
    expectedClose: "2026-11-20",
    updatedAt: "2026-06-10",
    createdAt: "2026-05-08",
    deviceUnitPrice: 466,
    devicePhases: [
      { period: "2027-Q1", units: 240 },
      { period: "2027-Q3", units: 360 },
      { period: "2028-Q1", units: 280 },
    ],
  },
  {
    id: "d_halcyon",
    accountId: "a_halcyon",
    parentDealId: null,
    ownerId: "u_elias",
    title: "Antwerp pilot — facilities crews",
    stage: "final_negotiation",
    leadValidated: true,
    channel: "reseller",
    isPilot: true,
    expectedClose: "2026-08-29",
    updatedAt: "2026-06-10",
    createdAt: "2026-03-30",
    deviceUnitPrice: 312,
    devicePhases: [
      { period: "2026-Q3", units: 120 },
      { period: "2027-Q1", units: 360 },
      { period: "2027-Q3", units: 280 },
    ],
  },
];

export let serviceContracts: ServiceContract[] = [
  {
    id: "sc_nordcom_mdm",
    dealId: "d_nordcom",
    serviceId: "s_mdm",
    invoiceModel: "monthly_recurring",
    startDate: "2026-08-01",
    endDate: null,
    fixedValue: null,
    monthlyRate: 14,
    expectedDevices: 1660,
    phases: [
      { period: "2026-Q3", value: 16000 },
      { period: "2026-Q4", value: 34000 },
      { period: "2027-Q2", value: 58000 },
      { period: "2027-Q4", value: 70000 },
      { period: "2028-Q2", value: 70000 },
    ],
  },
  {
    id: "sc_nordcom_warranty",
    dealId: "d_nordcom",
    serviceId: "s_warranty",
    invoiceModel: "fixed_term",
    startDate: "2026-09-01",
    endDate: "2029-09-01",
    fixedValue: 96000,
    monthlyRate: null,
    expectedDevices: null,
    phases: [
      { period: "2026-Q4", value: 24000 },
      { period: "2027-Q2", value: 24000 },
      { period: "2027-Q4", value: 24000 },
      { period: "2028-Q2", value: 24000 },
    ],
  },
  {
    id: "sc_lumen_lifecycle",
    dealId: "d_lumen",
    serviceId: "s_lifecycle",
    invoiceModel: "fixed_term",
    startDate: "2026-07-01",
    endDate: "2029-07-01",
    fixedValue: 234000,
    monthlyRate: null,
    expectedDevices: null,
    phases: [
      { period: "2026-Q3", value: 28000 },
      { period: "2027-Q1", value: 60000 },
      { period: "2027-Q4", value: 64000 },
      { period: "2028-Q2", value: 42000 },
    ],
  },
  {
    id: "sc_lumen_bw_mdm",
    dealId: "d_lumen_bodyworn",
    serviceId: "s_mdm",
    invoiceModel: "monthly_recurring",
    startDate: "2026-08-01",
    endDate: null,
    fixedValue: null,
    monthlyRate: 14,
    expectedDevices: 840,
    phases: [
      { period: "2026-Q4", value: 12000 },
      { period: "2027-Q2", value: 30000 },
    ],
  },
  {
    id: "sc_halcyon_repair",
    dealId: "d_halcyon",
    serviceId: "s_repair",
    invoiceModel: "fixed_term",
    startDate: "2026-09-01",
    endDate: "2028-09-01",
    fixedValue: 72000,
    monthlyRate: null,
    expectedDevices: null,
    phases: [
      { period: "2026-Q4", value: 14000 },
      { period: "2027-Q1", value: 20000 },
      { period: "2027-Q3", value: 22000 },
    ],
  },
  {
    id: "sc_vektor_sim",
    dealId: "d_vektor",
    serviceId: "s_sim",
    invoiceModel: "monthly_recurring",
    startDate: "2026-10-01",
    endDate: null,
    fixedValue: null,
    monthlyRate: 6,
    expectedDevices: 1260,
    phases: [
      { period: "2026-Q4", value: 8000 },
      { period: "2027-Q1", value: 18000 },
      { period: "2027-Q3", value: 24000 },
    ],
  },
];

export let cases: CaseRecord[] = [
  {
    id: "case_3041", ref: "CASE-3041", accountId: "a_nordcom", dealId: "d_nordcom", serviceId: "s_mdm", ownerId: "u_sara", contactId: "c_nordcom_1",
    title: "Battery policy clarification for cold-storage crews", status: "in_progress", priority: "high", escalated: false,
    thirdPartyRef: null, slaDeadline: "2026-06-15", createdAt: "2026-06-04", updatedAt: "2026-06-11",
    notes: [
      { author: "Sara Miettinen", body: "Customer asked for a written battery-retention policy for −20°C operation.", when: "04 Jun 2026", internal: false },
      { author: "Sara Miettinen", body: "Engineering confirmed the XR-21 holds spec to −20°C; drafting the customer-facing note.", when: "11 Jun 2026", internal: true },
    ],
  },
  {
    id: "case_2987", ref: "CASE-2987", accountId: "a_nordcom", dealId: "d_nordcom", serviceId: "s_mdm", ownerId: "u_oskari", contactId: "c_nordcom_2",
    title: "MDM enrolment failed on 4 devices", status: "open", priority: "medium", escalated: false,
    thirdPartyRef: null, slaDeadline: "2026-06-18", createdAt: "2026-06-09", updatedAt: "2026-06-09",
    notes: [
      { author: "Tobias Reiner", body: "Four units stuck at the enrolment screen after the depot reset.", when: "09 Jun 2026", internal: false },
    ],
  },
  {
    id: "case_2890", ref: "CASE-2890", accountId: "a_lumen", serviceId: "s_lifecycle", ownerId: "u_sara", contactId: "c_lumen_3",
    title: "Encryption attestation required for renewal", status: "escalated", priority: "critical", escalated: true,
    thirdPartyRef: "ATT-7741", slaDeadline: "2026-06-12", createdAt: "2026-06-02", updatedAt: "2026-06-12",
    notes: [
      { author: "Gareth Pugh", body: "Legal needs a signed encryption attestation before the frame can be renewed.", when: "02 Jun 2026", internal: false },
      { author: "Sara Miettinen", body: "Escalated to the security team for the signed attestation pack (ref ATT-7741).", when: "08 Jun 2026", internal: true },
      { author: "Sara Miettinen", body: "SLA breached today — chasing security for an ETA.", when: "12 Jun 2026", internal: true },
    ],
  },
  {
    id: "case_2855", ref: "CASE-2855", accountId: "a_lumen", serviceId: "s_lifecycle", ownerId: "u_oskari", contactId: "c_lumen_1",
    title: "Spare-pool replenishment for two divisions", status: "open", priority: "high", escalated: false,
    thirdPartyRef: null, slaDeadline: "2026-06-16", createdAt: "2026-06-05", updatedAt: "2026-06-09",
    notes: [
      { author: "DCI Rowan Hale", body: "Two divisions are below the agreed spare-pool floor.", when: "05 Jun 2026", internal: false },
    ],
  },
  {
    id: "case_3120", ref: "CASE-3120", accountId: "a_vektor", serviceId: "s_sim", ownerId: "u_oskari", contactId: "c_vektor_1",
    title: "SIM provisioning delay on reseller order", status: "escalated", priority: "medium", escalated: true,
    thirdPartyRef: "ARQ-5521", slaDeadline: "2026-06-19", createdAt: "2026-06-08", updatedAt: "2026-06-11",
    notes: [
      { author: "Henrik Sø", body: "120 SIMs not yet active; drivers can't go live.", when: "08 Jun 2026", internal: false },
      { author: "Oskari Lehto", body: "Raised with the connectivity provider, ticket ARQ-5521.", when: "11 Jun 2026", internal: true },
    ],
  },
  {
    id: "case_3066", ref: "CASE-3066", accountId: "a_halcyon", serviceId: "s_repair", ownerId: "u_oskari", contactId: "c_halcyon_2",
    title: "Replacement units for water-damaged batch", status: "resolved", priority: "medium", escalated: false,
    thirdPartyRef: null, slaDeadline: "2026-05-30", createdAt: "2026-05-20", updatedAt: "2026-05-29",
    notes: [
      { author: "Anouk Jansen", body: "Eight units water-damaged on a flooded site.", when: "20 May 2026", internal: false },
      { author: "Oskari Lehto", body: "Swap shipped and confirmed received. Closing.", when: "29 May 2026", internal: false },
    ],
  },
];

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

export let offers: Offer[] = [
  {
    id: "off_1188", ref: "OFF-1188", dealId: "d_nordcom", createdById: "u_aino", version: 3,
    status: "made", discountPct: 12,
    justification: "Wave-2 volume commitment of 1,660 devices and a 3-year MDM commitment; matching the wave-1 pilot pricing to keep the rollout on a single standard.",
    lockedAt: null, createdAt: "2026-06-11",
    lines: [
      { productId: "p_xr21", serviceId: null, label: "HMD XR-21 rugged 5G", unitPrice: 466, quantity: 1660, discountPct: 12 },
      { productId: "p_sled", serviceId: null, label: "HMD Edge scanner sled", unitPrice: 128, quantity: 400, discountPct: 10 },
      { productId: null, serviceId: "s_mdm", label: "Secure MDM (monthly, per device)", unitPrice: 14, quantity: 1660, discountPct: 0 },
      { productId: null, serviceId: "s_warranty", label: "Extended Warranty (3 yr)", unitPrice: 96000, quantity: 1, discountPct: 0 },
    ],
    approvals: [
      { stepOrder: 1, roleRequired: "sales_rep", decidedById: "u_aino", decision: "approved", note: null, decidedAt: "2026-06-11" },
      { stepOrder: 2, roleRequired: "sales_manager", decidedById: "u_mikael", decision: "approved", note: "Volume and term justify the discount.", decidedAt: "2026-06-12" },
    ],
  },
  {
    id: "off_1099", ref: "OFF-1099", dealId: "d_lumen", createdById: "u_aino", version: 1,
    status: "pending_manager", discountPct: 8,
    justification: "Public-sector frame renewal; the customer is holding to last frame's unit price and a competitor is in the RFP.",
    lockedAt: null, createdAt: "2026-06-09",
    lines: [
      { productId: "p_t30", serviceId: null, label: "HMD T-30 field tablet", unitPrice: 612, quantity: 1820, discountPct: 8 },
      { productId: null, serviceId: "s_lifecycle", label: "Device Lifecycle Management (3 yr)", unitPrice: 234000, quantity: 1, discountPct: 0 },
    ],
    approvals: [
      { stepOrder: 1, roleRequired: "sales_rep", decidedById: "u_aino", decision: "approved", note: null, decidedAt: "2026-06-09" },
      { stepOrder: 2, roleRequired: "sales_manager", decidedById: null, decision: null, note: null, decidedAt: null },
    ],
  },
  {
    id: "off_1175", ref: "OFF-1175", dealId: "d_halcyon", createdById: "u_elias", version: 2,
    status: "made", discountPct: 5,
    justification: "Pilot pricing for one market with two committed follow-on markets in the account plan.",
    lockedAt: null, createdAt: "2026-05-28",
    lines: [
      { productId: "p_pulse", serviceId: null, label: "HMD Pulse handheld", unitPrice: 312, quantity: 760, discountPct: 5 },
      { productId: null, serviceId: "s_repair", label: "Onsite Repair & Swap", unitPrice: 72000, quantity: 1, discountPct: 0 },
    ],
    approvals: [
      { stepOrder: 1, roleRequired: "sales_rep", decidedById: "u_elias", decision: "approved", note: null, decidedAt: "2026-05-28" },
      { stepOrder: 2, roleRequired: "sales_manager", decidedById: "u_mikael", decision: "approved", note: "Follow-on commitment recorded.", decidedAt: "2026-06-04" },
    ],
  },
  {
    id: "off_1204", ref: "OFF-1204", dealId: "d_vektor", createdById: "u_elias", version: 3,
    status: "sales_rep", discountPct: 0, justification: null, lockedAt: null, createdAt: "2026-06-12",
    lines: [
      { productId: "p_pulse", serviceId: null, label: "HMD Pulse handheld", unitPrice: 312, quantity: 1260, discountPct: 0 },
      { productId: null, serviceId: "s_sim", label: "SIM Provisioning (monthly, per device)", unitPrice: 6, quantity: 1260, discountPct: 0 },
    ],
    approvals: defaultOfferWorkflow(),
  },
];

export let activities: Activity[] = [
  { id: "act_1", accountId: "a_nordcom", dealId: "d_nordcom", actorId: null, kind: "ai", summary: "AI account review generated: confirm pilot acceptance criteria before Friday.", when: "13 Jun 2026", isAi: true },
  { id: "act_2", accountId: "a_nordcom", dealId: "d_nordcom", actorId: "u_aino", kind: "stage", summary: "Moved Field crew rollout — wave 2 to Customer testing.", when: "26 May 2026", isAi: false },
  { id: "act_3", accountId: "a_nordcom", dealId: "d_nordcom", actorId: "u_aino", kind: "meeting", summary: "Technical review with field operations.", when: "16 May 2026", isAi: false },
  { id: "act_4", accountId: "a_nordcom", dealId: "d_nordcom", actorId: "u_aino", kind: "offer", summary: "Offer OFF-1188 v3 sent to procurement.", when: "11 Jun 2026", isAi: false },
  { id: "act_5", accountId: "a_nordcom", dealId: "d_nordcom", actorId: "u_sara", kind: "case", summary: "CASE-3041 opened: battery policy clarification.", when: "04 Jun 2026", isAi: false },
  { id: "act_6", accountId: "a_vektor", dealId: "d_vektor", actorId: null, kind: "ai", summary: "AI next action: ask the reseller to confirm the customer-test window.", when: "13 Jun 2026", isAi: true },
  { id: "act_7", accountId: "a_vektor", dealId: "d_vektor", actorId: "u_elias", kind: "stage", summary: "Moved Driver terminal refresh to Offer.", when: "02 Jun 2026", isAi: false },
  { id: "act_8", accountId: "a_vektor", dealId: "d_vektor", actorId: "u_oskari", kind: "case", summary: "CASE-3120 escalated to connectivity provider.", when: "11 Jun 2026", isAi: false },
  { id: "act_9", accountId: "a_lumen", dealId: "d_lumen", actorId: "u_sara", kind: "case", summary: "CASE-2890 SLA breached on encryption attestation.", when: "12 Jun 2026", isAi: false },
  { id: "act_10", accountId: "a_lumen", dealId: "d_lumen", actorId: "u_aino", kind: "stage", summary: "Moved Frame renewal to Final negotiation.", when: "28 May 2026", isAi: false },
  { id: "act_11", accountId: "a_lumen", dealId: "d_lumen", actorId: null, kind: "ai", summary: "AI risk flag: close date passed; no revised procurement date recorded.", when: "13 Jun 2026", isAi: true },
  { id: "act_12", accountId: "a_arctic", dealId: "d_arctic", actorId: "u_elias", kind: "meeting", summary: "Discovery call booked for 17 June.", when: "10 Jun 2026", isAi: false },
  { id: "act_13", accountId: "a_arctic", dealId: "d_arctic", actorId: "u_elias", kind: "note", summary: "Account created from inbound enquiry.", when: "08 May 2026", isAi: false },
  { id: "act_14", accountId: "a_halcyon", dealId: "d_halcyon", actorId: "u_elias", kind: "offer", summary: "Offer OFF-1175 approved and locked.", when: "06 Jun 2026", isAi: false },
  { id: "act_15", accountId: "a_halcyon", dealId: "d_halcyon", actorId: "u_elias", kind: "stage", summary: "Moved Antwerp pilot to Customer testing.", when: "28 May 2026", isAi: false },
];

export let aiInsights: AiInsight[] = [
  {
    id: "ai_nordcom_next", accountId: "a_nordcom", dealId: "d_nordcom", caseId: null, type: "next_action",
    headline: "Confirm pilot acceptance criteria and book the technical review before Friday.",
    body: "Wave-2 has been in Customer test since 21 May with no outcome recorded and an expected close of 18 July. Locking acceptance criteria now keeps the close date credible.",
    confidence: 0.82,
    evidence: [
      "Customer test began 21 May; no outcome has been recorded.",
      "CASE-3041 asks for battery-policy confirmation, still in progress.",
      "Expected close is 35 days away.",
    ],
    sources: [
      { title: "Deal timeline", detail: "Stage entered Customer test 21 May" },
      { title: "CASE-3041", detail: "Open clarification blocking sign-off" },
    ],
    status: "pending_review",
    draftEmail: "Hi Marit,\n\nAhead of the wave-2 sign-off, could we lock the acceptance criteria and book a 30-minute technical review this week? I'll bring the written cold-storage battery policy your team asked for.\n\nBest,\nAino",
  },
  {
    id: "ai_nordcom_enrich", accountId: "a_nordcom", dealId: null, caseId: null, type: "enrichment",
    headline: "Nordcom is expanding field operations into Austria.",
    body: "Public sources indicate two new Austrian depots and an active move from consumer phones to managed rugged devices — consistent with the wave-2 expansion.",
    confidence: 0.74,
    evidence: [
      "Press: announced expansion into Austria with two new depots (3 weeks ago).",
      "Hiring: new Head of IT Operations from a logistics competitor.",
    ],
    sources: [
      { title: "nordcom.example", detail: "Company site — locations, news" },
      { title: "Trade press", detail: "Austria depot expansion" },
    ],
    status: "pending_review",
  },
  {
    id: "ai_lumen_risk", accountId: "a_lumen", dealId: "d_lumen", caseId: null, type: "risk_flag",
    headline: "Frame renewal is past its close date with legal review unresolved.",
    body: "Expected close was 6 June. Legal review is still open via CASE-2890 (SLA breached). Update the close date or record the procurement blocker before the forecast review.",
    confidence: 0.88, severity: "high",
    evidence: [
      "Expected close date was 6 June; today is 13 June.",
      "CASE-2890 encryption attestation SLA breached.",
      "No revised procurement date is recorded.",
    ],
    sources: [
      { title: "Deal record", detail: "expected_close = 2026-06-06" },
      { title: "CASE-2890", detail: "Escalated, SLA breached" },
    ],
    status: "pending_review",
  },
  {
    id: "ai_vektor_next", accountId: "a_vektor", dealId: "d_vektor", caseId: null, type: "next_action",
    headline: "Ask the reseller to confirm the customer-test window and decision owner.",
    body: "Reseller deals move from Customer test straight to Won. The offer is opened and pricing approved, so the next valid step is to set the test window.",
    confidence: 0.7,
    evidence: [
      "Offer OFF-1204 opened by the reseller yesterday.",
      "Customer test is the next valid reseller stage.",
      "Pricing approval is complete.",
    ],
    sources: [{ title: "Offer OFF-1204", detail: "Opened 12 Jun" }],
    status: "pending_review",
  },
  {
    id: "ai_arctic_enrich", accountId: "a_arctic", dealId: "d_arctic", caseId: null, type: "next_action",
    headline: "Capture the expected device rollout by site after the discovery call.",
    body: "Arctic Grid has three operating sites and fresh funding but no device trajectory entered. Capture per-site volumes before quoting.",
    confidence: 0.66,
    evidence: [
      "Three operating sites listed on the account.",
      "No device trajectory has been entered.",
      "Discovery call booked for 17 June.",
    ],
    sources: [{ title: "Account record", detail: "3 sites, trajectory empty" }],
    status: "pending_review",
  },
  {
    id: "ai_halcyon_next", accountId: "a_halcyon", dealId: "d_halcyon", caseId: null, type: "next_action",
    headline: "Prepare the follow-on order structure before the pilot review.",
    body: "The Antwerp pilot is in Customer test with two follow-on markets identified. Structuring follow-on orders linked to this opportunity keeps the forecast cumulative.",
    confidence: 0.71,
    evidence: [
      "Pilot includes 120 devices in one market.",
      "Account plan identifies two follow-on markets.",
      "Reseller margin approved through OFF-1175.",
    ],
    sources: [{ title: "Account plan", detail: "Two follow-on markets" }],
    status: "pending_review",
  },
];

export let notifications: Notification[] = [
  { id: "n_1", userId: "u_aino", kind: "ai", body: "AI insights updated for Nordcom Mobility.", read: false, when: "13 Jun, 09:42", link: { screen: "account", id: "a_nordcom" } },
  { id: "n_2", userId: "u_aino", kind: "stage", body: "Field crew rollout — wave 2 has not moved in 18 days.", read: false, when: "13 Jun, 08:00", link: { screen: "account", id: "a_nordcom" } },
  { id: "n_3", userId: "u_aino", kind: "offer", body: "OFF-1188 cleared Sales Manager approval — now with Finance.", read: true, when: "12 Jun, 16:20", link: { screen: "offers", id: "off_1188" } },
  { id: "n_4", userId: "u_mikael", kind: "offer", body: "OFF-1099 (Lumen, 8% discount) is awaiting your approval.", read: false, when: "12 Jun, 11:05", link: { screen: "offers", id: "off_1099" } },
  { id: "n_5", userId: "u_veera", kind: "offer", body: "OFF-1188 (Nordcom, 12% discount) is awaiting Finance approval.", read: false, when: "12 Jun, 16:20", link: { screen: "offers", id: "off_1188" } },
  { id: "n_6", userId: "u_sara", kind: "case", body: "CASE-2890 has breached its SLA.", read: false, when: "12 Jun, 09:00", link: { screen: "case", id: "case_2890" } },
  { id: "n_7", userId: "u_oskari", kind: "case", body: "CASE-3120 escalation acknowledged by the provider.", read: true, when: "11 Jun, 14:10", link: { screen: "case", id: "case_3120" } },
];

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

// Offer maths --------------------------------------------------------------

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
    if (svc.id === "s_lifecycle" || svc.id === "s_warranty" || svc.id === "s_repair") return `${svc.name} (3 yr)`;
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

export function forecastByPeriod(dealList: Deal[]): ForecastRow[] {
  const open = dealList.filter(inForecast);
  return PERIODS.map((period) => {
    let device = 0, service = 0, wDevice = 0, wService = 0;
    for (const deal of open) {
      const dev = deviceInPeriod(deal, period);
      const svc = serviceInPeriod(deal.id, period);
      const p = probability(deal.stage);
      device += dev;
      service += svc;
      wDevice += dev * p;
      wService += svc * p;
    }
    return { period, device, service, weightedDevice: wDevice, weightedService: wService };
  });
}

export type Granularity = "quarter" | "half" | "year";

export function rollUp(rows: ForecastRow[], granularity: Granularity): { label: string; rows: ForecastRow[] }[] {
  if (granularity === "quarter") return rows.map((r) => ({ label: periodLabel(r.period), rows: [r] }));
  const groups = new Map<string, ForecastRow[]>();
  for (const r of rows) {
    const year = periodYear(r.period);
    const q = Number(r.period.split("-Q")[1] ?? 1);
    const key = granularity === "year" ? year : `${year} ${q <= 2 ? "H1" : "H2"}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(r);
    groups.set(key, bucket);
  }
  return [...groups.entries()].map(([label, grp]) => ({ label, rows: grp }));
}

export function sumRows(rows: ForecastRow[]): ForecastRow {
  return rows.reduce<ForecastRow>(
    (acc, r) => ({
      period: acc.period,
      device: acc.device + r.device,
      service: acc.service + r.service,
      weightedDevice: acc.weightedDevice + r.weightedDevice,
      weightedService: acc.weightedService + r.weightedService,
    }),
    { period: "", device: 0, service: 0, weightedDevice: 0, weightedService: 0 },
  );
}

// ---------------------------------------------------------------------------
// Measure-aware forecast (mirrors example_columns.csv: Volume / Net Sales / GM,
// categorised by commitment tier, stream, or region, over the time horizon).
// ---------------------------------------------------------------------------

export function deviceMeasureInPeriod(deal: Deal, period: string, m: Measure): number {
  const units = deal.devicePhases.filter((p) => p.period === period).reduce((s, p) => s + p.units, 0);
  if (m === "volume") return units;
  if (m === "gm") return units * deviceGmPerUnit(deal);
  return units * deal.deviceUnitPrice;
}

export function serviceMeasureInPeriod(dealId: string, period: string, m: Measure): number {
  if (m === "volume") return 0; // services have no device-unit volume
  return serviceContractsForDeal(dealId).reduce(
    (s, sc) => s + sc.phases.filter((p) => p.period === period).reduce((t, p) => t + (m === "gm" ? p.value * serviceGmRate(sc.serviceId) : p.value), 0),
    0,
  );
}

export function dealMeasureInPeriod(deal: Deal, period: string, m: Measure): number {
  return deviceMeasureInPeriod(deal, period, m) + serviceMeasureInPeriod(deal.id, period, m);
}

export function dealMeasureTotal(deal: Deal, m: Measure): number {
  return PERIODS.reduce((s, p) => s + dealMeasureInPeriod(deal, p, m), 0);
}

/** Period buckets for a granularity, as index lists into PERIODS. */
export function periodBuckets(g: Granularity): { label: string; idx: number[] }[] {
  if (g === "quarter") return PERIODS.map((p, i) => ({ label: periodLabel(p), idx: [i] }));
  const map = new Map<string, number[]>();
  PERIODS.forEach((p, i) => {
    const year = periodYear(p);
    const q = Number(p.split("-Q")[1] ?? 1);
    const key = g === "year" ? year : `${year} ${q <= 2 ? "H1" : "H2"}`;
    const arr = map.get(key) ?? [];
    arr.push(i);
    map.set(key, arr);
  });
  return [...map.entries()].map(([label, idx]) => ({ label, idx }));
}

export function bucketSum(values: number[], idx: number[]): number {
  return idx.reduce((s, i) => s + (values[i] ?? 0), 0);
}

export type Series = { key: string; label: string; values: number[]; total: number };

export function tierSeries(dealList: Deal[], m: Measure): Series[] {
  const inc = dealList.filter(inForecast);
  return TIERS.map((tier) => {
    const ds = inc.filter((d) => d.stage === tier);
    const values = PERIODS.map((p) => ds.reduce((s, d) => s + dealMeasureInPeriod(d, p, m), 0));
    return { key: tier, label: STAGE_META[tier].short, values, total: values.reduce((a, b) => a + b, 0) };
  });
}

export function streamSeries(dealList: Deal[], m: Measure): Series[] {
  const inc = dealList.filter(inForecast);
  const device = PERIODS.map((p) => inc.reduce((s, d) => s + deviceMeasureInPeriod(d, p, m), 0));
  const service = PERIODS.map((p) => inc.reduce((s, d) => s + serviceMeasureInPeriod(d.id, p, m), 0));
  return [
    { key: "device", label: "Device", values: device, total: device.reduce((a, b) => a + b, 0) },
    { key: "service", label: "Service", values: service, total: service.reduce((a, b) => a + b, 0) },
  ];
}

export type RegionSeries = Series & { gmPct: number; netSales: number };

export function regionSeries(dealList: Deal[], m: Measure): RegionSeries[] {
  const inc = dealList.filter(inForecast);
  const countries = [...new Set(inc.map((d) => accountCountry(d.accountId)))].sort();
  return countries.map((country) => {
    const ds = inc.filter((d) => accountCountry(d.accountId) === country);
    const values = PERIODS.map((p) => ds.reduce((s, d) => s + dealMeasureInPeriod(d, p, m), 0));
    const netSales = ds.reduce((s, d) => s + dealMeasureTotal(d, "net_sales"), 0);
    const gm = ds.reduce((s, d) => s + dealMeasureTotal(d, "gm"), 0);
    return { key: country, label: country, values, total: values.reduce((a, b) => a + b, 0), netSales, gmPct: netSales ? gm / netSales : 0 };
  });
}

export function forecastTotal(dealList: Deal[], m: Measure): number {
  return dealList.filter(inForecast).reduce((s, d) => s + dealMeasureTotal(d, m), 0);
}

/** Status-weighted forecast — HMD's commitment ladder as the weighting scheme. */
export function weightedForecast(dealList: Deal[], m: Measure): number {
  return dealList.filter(inForecast).reduce((s, d) => s + STAGE_META[d.stage].probability * dealMeasureTotal(d, m), 0);
}

/** Value secured at Final negotiation and beyond. */
export function securedForecast(dealList: Deal[], m: Measure): number {
  return dealList
    .filter(inForecast)
    .filter((d) => d.stage === "final_negotiation")
    .reduce((s, d) => s + dealMeasureTotal(d, m), 0);
}


export async function initCrmFromApi() {
  console.log("Loading CRM data from API...");
  try {
    const authRes = await fetch('/api/auth/users');
    const apiUsers = await authRes.json();
    if (apiUsers.length > 0) {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: apiUsers[0].id })
      });
    }

    const res = await fetch('/api/sync');
    if (!res.ok) throw new Error("Sync failed");
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
    
    return true;
  } catch (e) {
    console.error("Failed to load from API", e);
    return false;
  }
}
