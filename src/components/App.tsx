import { useEffect, useMemo, useRef, useState } from "react";

type Deal = {
  id: string;
  account: string;
  region: string;
  channel: "Direct" | "Reseller";
  stage: string;
  owner: string;
  closeDate: string;
  nextQuarter: string;
  deviceRevenue: string;
  serviceRevenue: string;
  total: string;
  amount: number;
  risk: "At risk" | "On track" | "Overdue" | "Early";
  riskDetail: string;
  suggestion: string;
  evidence: string[];
  confidence: string;
};

const deals: Deal[] = [
  {
    id: "nordcom",
    account: "Nordcom Mobility",
    region: "DACH",
    channel: "Direct",
    stage: "Customer test",
    owner: "Aino Lahti",
    closeDate: "18 Jul 2026",
    nextQuarter: "EUR 184k",
    deviceRevenue: "EUR 980k",
    serviceRevenue: "EUR 264k",
    total: "EUR 1.24m",
    amount: 1_240_000,
    risk: "At risk",
    riskDetail: "No activity for 18 days",
    suggestion: "Confirm pilot acceptance criteria and book the technical review before Friday.",
    evidence: [
      "Customer test began 21 May; no outcome has been recorded.",
      "Last meeting note asks for battery-policy confirmation.",
      "Expected close is 35 days away.",
    ],
    confidence: "High confidence",
  },
  {
    id: "vektor",
    account: "Vektor Logistics",
    region: "Nordics",
    channel: "Reseller",
    stage: "RFP / offer given",
    owner: "Elias Niemi",
    closeDate: "04 Sep 2026",
    nextQuarter: "EUR 96k",
    deviceRevenue: "EUR 610k",
    serviceRevenue: "EUR 218k",
    total: "EUR 828k",
    amount: 828_000,
    risk: "On track",
    riskDetail: "Updated yesterday",
    suggestion: "Ask the reseller to confirm the customer test window and decision owner.",
    evidence: [
      "Offer v3 was opened by the reseller yesterday.",
      "Customer test is the next valid reseller stage.",
      "Pricing approval is complete.",
    ],
    confidence: "Medium confidence",
  },
  {
    id: "lumen",
    account: "Lumen Public Safety",
    region: "UK & IE",
    channel: "Direct",
    stage: "Contract negotiation",
    owner: "Sara Miettinen",
    closeDate: "06 Jun 2026",
    nextQuarter: "EUR 420k",
    deviceRevenue: "EUR 1.42m",
    serviceRevenue: "EUR 398k",
    total: "EUR 1.82m",
    amount: 1_820_000,
    risk: "Overdue",
    riskDetail: "Close date passed 7 days ago",
    suggestion: "Update the close date or record the procurement blocker before forecast review.",
    evidence: [
      "Expected close date was 6 June.",
      "Legal review is still marked in progress.",
      "No revised procurement date is recorded.",
    ],
    confidence: "High confidence",
  },
  {
    id: "arctic",
    account: "Arctic Grid",
    region: "Nordics",
    channel: "Direct",
    stage: "Interest shown",
    owner: "Aino Lahti",
    closeDate: "20 Nov 2026",
    nextQuarter: "EUR 0",
    deviceRevenue: "EUR 520k",
    serviceRevenue: "EUR 122k",
    total: "EUR 642k",
    amount: 642_000,
    risk: "Early",
    riskDetail: "Discovery call booked",
    suggestion: "Capture the expected device rollout by site after the discovery call.",
    evidence: [
      "Three operating sites are listed on the account.",
      "No device trajectory has been entered.",
      "Discovery call is booked for 17 June.",
    ],
    confidence: "Medium confidence",
  },
  {
    id: "halcyon",
    account: "Halcyon Facilities",
    region: "Benelux",
    channel: "Reseller",
    stage: "Customer test",
    owner: "Oskari Lehto",
    closeDate: "29 Aug 2026",
    nextQuarter: "EUR 152k",
    deviceRevenue: "EUR 760k",
    serviceRevenue: "EUR 186k",
    total: "EUR 946k",
    amount: 946_000,
    risk: "On track",
    riskDetail: "Updated 3 days ago",
    suggestion: "Prepare the follow-on order structure before the pilot review.",
    evidence: [
      "Pilot includes 120 devices in one market.",
      "Account plan identifies two follow-on markets.",
      "Reseller margin is approved through offer v2.",
    ],
    confidence: "Medium confidence",
  },
];

type Contact = { name: string; role: string; email: string; primary?: boolean };
type RelatedDeal = { name: string; stage: string; value: string; status: "Open" | "Won" | "Lost"; close: string };
type CaseRow = { ref: string; title: string; priority: "P1" | "P2" | "P3"; status: "Open" | "In progress" | "Resolved"; sla: string; owner: string };
type OfferRow = { ref: string; name: string; value: string; status: "Draft" | "Sent" | "Accepted" | "Expired"; updated: string };
type ActivityKind = "meeting" | "email" | "note" | "call" | "stage" | "case" | "offer";
type ActivityEntry = { kind: ActivityKind; summary: string; actor: string; when: string };
type Phase = { year: string; value: string; pct: number };

type Company = {
  id: string;
  name: string;
  region: string;
  channel: "Direct" | "Reseller";
  owner: string;
  lifecycle: string;
  industry: string;
  accountSince: string;
  sites: number;
  openPipeline: string;
  weightedNextQuarter: string;
  threeYearTotal: string;
  summary: string;
  aiHeadline: string;
  aiEvidence: string[];
  aiConfidence: string;
  aiSources: number;
  phasing: Phase[];
  contacts: Contact[];
  relatedDeals: RelatedDeal[];
  cases: CaseRow[];
  offers: OfferRow[];
  activity: ActivityEntry[];
};

const companies: Record<string, Company> = {
  nordcom: {
    id: "nordcom",
    name: "Nordcom Mobility",
    region: "DACH",
    channel: "Direct",
    owner: "Aino Lahti",
    lifecycle: "Customer · Expanding",
    industry: "Field logistics",
    accountSince: "Mar 2023",
    sites: 6,
    openPipeline: "EUR 1.24m",
    weightedNextQuarter: "EUR 184k",
    threeYearTotal: "EUR 1.24m",
    summary: "Six-site logistics operator rolling out rugged devices to field crews after a successful first wave.",
    aiHeadline: "Confirm pilot acceptance criteria and book the technical review before Friday.",
    aiEvidence: [
      "Customer test began 21 May; no outcome has been recorded.",
      "Last meeting note asks for battery-policy confirmation.",
      "Expected close is 35 days away.",
    ],
    aiConfidence: "High confidence",
    aiSources: 3,
    phasing: [
      { year: "2026", value: "EUR 340k", pct: 38 },
      { year: "2027", value: "EUR 612k", pct: 78 },
      { year: "2028", value: "EUR 292k", pct: 43 },
    ],
    contacts: [
      { name: "Marit Brandt", role: "Head of Field Operations", email: "m.brandt@nordcom.example", primary: true },
      { name: "Tobias Reiner", role: "IT Procurement Lead", email: "t.reiner@nordcom.example" },
      { name: "Lena Vogt", role: "Fleet Safety Manager", email: "l.vogt@nordcom.example" },
    ],
    relatedDeals: [
      { name: "Field crew rollout — wave 2", stage: "Customer test", value: "EUR 1.24m", status: "Open", close: "18 Jul 2026" },
      { name: "Pilot — wave 1 (50 devices)", stage: "Closed", value: "EUR 286k", status: "Won", close: "12 Feb 2026" },
    ],
    cases: [
      { ref: "CASE-3041", title: "Battery policy clarification for cold storage", priority: "P2", status: "In progress", sla: "Due in 2 days", owner: "Sara Miettinen" },
      { ref: "CASE-2987", title: "MDM enrolment failed on 4 devices", priority: "P3", status: "Open", sla: "Due in 5 days", owner: "Oskari Lehto" },
    ],
    offers: [
      { ref: "OFF-1188", name: "Wave 2 device + 24m service", value: "EUR 1.24m", status: "Sent", updated: "2 days ago" },
    ],
    activity: [
      { kind: "stage", summary: "Moved to Customer test", actor: "Aino Lahti", when: "21 May 2026" },
      { kind: "meeting", summary: "Technical review with field operations", actor: "Aino Lahti", when: "16 May 2026" },
      { kind: "offer", summary: "Offer v3 sent to procurement", actor: "Aino Lahti", when: "14 May 2026" },
      { kind: "note", summary: "Customer asked for battery-policy confirmation", actor: "Sara Miettinen", when: "09 May 2026" },
    ],
  },
  vektor: {
    id: "vektor",
    name: "Vektor Logistics",
    region: "Nordics",
    channel: "Reseller",
    owner: "Elias Niemi",
    lifecycle: "Customer · Stable",
    industry: "Transport & haulage",
    accountSince: "Sep 2022",
    sites: 3,
    openPipeline: "EUR 828k",
    weightedNextQuarter: "EUR 96k",
    threeYearTotal: "EUR 828k",
    summary: "Reseller-led haulage account; pricing is approved and the offer is live with the end customer.",
    aiHeadline: "Ask the reseller to confirm the customer test window and decision owner.",
    aiEvidence: [
      "Offer v3 was opened by the reseller yesterday.",
      "Customer test is the next valid reseller stage.",
      "Pricing approval is complete.",
    ],
    aiConfidence: "Medium confidence",
    aiSources: 3,
    phasing: [
      { year: "2026", value: "EUR 208k", pct: 30 },
      { year: "2027", value: "EUR 392k", pct: 64 },
      { year: "2028", value: "EUR 228k", pct: 37 },
    ],
    contacts: [
      { name: "Henrik Sø", role: "Operations Director", email: "h.so@vektor.example", primary: true },
      { name: "Paavo Rinne", role: "Reseller Account Manager", email: "p.rinne@northbound.example" },
    ],
    relatedDeals: [
      { name: "Driver terminal refresh", stage: "RFP / offer given", value: "EUR 828k", status: "Open", close: "04 Sep 2026" },
    ],
    cases: [
      { ref: "CASE-3120", title: "SIM provisioning delay on reseller order", priority: "P3", status: "Open", sla: "Due in 6 days", owner: "Elias Niemi" },
    ],
    offers: [
      { ref: "OFF-1204", name: "Driver terminal refresh — v3", value: "EUR 828k", status: "Sent", updated: "Yesterday" },
      { ref: "OFF-1133", name: "Driver terminal refresh — v2", value: "EUR 805k", status: "Expired", updated: "6 weeks ago" },
    ],
    activity: [
      { kind: "offer", summary: "Reseller opened offer v3", actor: "System", when: "12 Jun 2026" },
      { kind: "email", summary: "Sent pricing confirmation to reseller", actor: "Elias Niemi", when: "11 Jun 2026" },
      { kind: "stage", summary: "Moved to RFP / offer given", actor: "Elias Niemi", when: "02 Jun 2026" },
    ],
  },
  lumen: {
    id: "lumen",
    name: "Lumen Public Safety",
    region: "UK & IE",
    channel: "Direct",
    owner: "Sara Miettinen",
    lifecycle: "Customer · At risk",
    industry: "Public safety",
    accountSince: "Jan 2021",
    sites: 11,
    openPipeline: "EUR 1.82m",
    weightedNextQuarter: "EUR 420k",
    threeYearTotal: "EUR 1.82m",
    summary: "Largest public-safety account; renewal is in contract negotiation and the close date has slipped.",
    aiHeadline: "Update the close date or record the procurement blocker before forecast review.",
    aiEvidence: [
      "Expected close date was 6 June.",
      "Legal review is still marked in progress.",
      "No revised procurement date is recorded.",
    ],
    aiConfidence: "High confidence",
    aiSources: 4,
    phasing: [
      { year: "2026", value: "EUR 520k", pct: 60 },
      { year: "2027", value: "EUR 880k", pct: 95 },
      { year: "2028", value: "EUR 420k", pct: 52 },
    ],
    contacts: [
      { name: "DCI Rowan Hale", role: "Programme Sponsor", email: "r.hale@lumen.example", primary: true },
      { name: "Priya Anand", role: "Procurement Lead", email: "p.anand@lumen.example" },
      { name: "Gareth Pugh", role: "Legal Counsel", email: "g.pugh@lumen.example" },
    ],
    relatedDeals: [
      { name: "Frame renewal 2026–2029", stage: "Contract negotiation", value: "EUR 1.82m", status: "Open", close: "06 Jun 2026" },
      { name: "Body-worn device top-up", stage: "Closed", value: "EUR 410k", status: "Won", close: "30 Nov 2025" },
      { name: "Control-room tablets", stage: "Closed", value: "EUR 240k", status: "Lost", close: "18 Aug 2025" },
    ],
    cases: [
      { ref: "CASE-2890", title: "Escalation: encryption attestation for renewal", priority: "P1", status: "In progress", sla: "Overdue 1 day", owner: "Sara Miettinen" },
      { ref: "CASE-2855", title: "Spare-pool replenishment for two divisions", priority: "P2", status: "Open", sla: "Due in 3 days", owner: "Oskari Lehto" },
    ],
    offers: [
      { ref: "OFF-1099", name: "Frame renewal — final", value: "EUR 1.82m", status: "Sent", updated: "5 days ago" },
    ],
    activity: [
      { kind: "case", summary: "P1 escalation opened on encryption attestation", actor: "Sara Miettinen", when: "12 Jun 2026" },
      { kind: "note", summary: "Procurement flagged legal review still open", actor: "Priya Anand", when: "07 Jun 2026" },
      { kind: "stage", summary: "Moved to Contract negotiation", actor: "Sara Miettinen", when: "28 May 2026" },
      { kind: "meeting", summary: "Renewal scope workshop", actor: "Sara Miettinen", when: "21 May 2026" },
    ],
  },
  arctic: {
    id: "arctic",
    name: "Arctic Grid",
    region: "Nordics",
    channel: "Direct",
    owner: "Aino Lahti",
    lifecycle: "Prospect · Early",
    industry: "Energy & utilities",
    accountSince: "May 2026",
    sites: 3,
    openPipeline: "EUR 642k",
    weightedNextQuarter: "EUR 0",
    threeYearTotal: "EUR 642k",
    summary: "New utilities prospect in discovery; device trajectory is not yet captured across its three sites.",
    aiHeadline: "Capture the expected device rollout by site after the discovery call.",
    aiEvidence: [
      "Three operating sites are listed on the account.",
      "No device trajectory has been entered.",
      "Discovery call is booked for 17 June.",
    ],
    aiConfidence: "Medium confidence",
    aiSources: 2,
    phasing: [
      { year: "2026", value: "EUR 0", pct: 4 },
      { year: "2027", value: "EUR 360k", pct: 58 },
      { year: "2028", value: "EUR 282k", pct: 44 },
    ],
    contacts: [
      { name: "Sofia Lindqvist", role: "Head of Field Maintenance", email: "s.lindqvist@arcticgrid.example", primary: true },
    ],
    relatedDeals: [
      { name: "Site maintenance pilot", stage: "Interest shown", value: "EUR 642k", status: "Open", close: "20 Nov 2026" },
    ],
    cases: [],
    offers: [],
    activity: [
      { kind: "meeting", summary: "Discovery call booked", actor: "Aino Lahti", when: "10 Jun 2026" },
      { kind: "note", summary: "Account created from inbound enquiry", actor: "Aino Lahti", when: "08 May 2026" },
    ],
  },
  halcyon: {
    id: "halcyon",
    name: "Halcyon Facilities",
    region: "Benelux",
    channel: "Reseller",
    owner: "Oskari Lehto",
    lifecycle: "Customer · Expanding",
    industry: "Facilities management",
    accountSince: "Nov 2023",
    sites: 4,
    openPipeline: "EUR 946k",
    weightedNextQuarter: "EUR 152k",
    threeYearTotal: "EUR 946k",
    summary: "Facilities operator running a 120-device pilot with two follow-on markets identified in the account plan.",
    aiHeadline: "Prepare the follow-on order structure before the pilot review.",
    aiEvidence: [
      "Pilot includes 120 devices in one market.",
      "Account plan identifies two follow-on markets.",
      "Reseller margin is approved through offer v2.",
    ],
    aiConfidence: "Medium confidence",
    aiSources: 3,
    phasing: [
      { year: "2026", value: "EUR 248k", pct: 34 },
      { year: "2027", value: "EUR 458k", pct: 70 },
      { year: "2028", value: "EUR 240k", pct: 38 },
    ],
    contacts: [
      { name: "Bram de Vries", role: "Regional Facilities Director", email: "b.devries@halcyon.example", primary: true },
      { name: "Anouk Jansen", role: "Site Operations Manager", email: "a.jansen@halcyon.example" },
    ],
    relatedDeals: [
      { name: "Pilot — Antwerp market", stage: "Customer test", value: "EUR 946k", status: "Open", close: "29 Aug 2026" },
      { name: "Service contract — year 1", stage: "Closed", value: "EUR 132k", status: "Won", close: "04 Jan 2026" },
    ],
    cases: [
      { ref: "CASE-3066", title: "Replacement units for water-damaged batch", priority: "P2", status: "Resolved", sla: "Closed on time", owner: "Oskari Lehto" },
    ],
    offers: [
      { ref: "OFF-1175", name: "Antwerp pilot — device + service", value: "EUR 946k", status: "Accepted", updated: "3 days ago" },
    ],
    activity: [
      { kind: "offer", summary: "Pilot offer accepted by reseller", actor: "Oskari Lehto", when: "10 Jun 2026" },
      { kind: "meeting", summary: "Follow-on market planning", actor: "Oskari Lehto", when: "04 Jun 2026" },
      { kind: "stage", summary: "Moved to Customer test", actor: "Oskari Lehto", when: "28 May 2026" },
    ],
  },
};

const navigation = ["Overview", "Accounts", "Deals", "Cases", "Offers", "Forecast"];
const stages = ["Interest shown", "RFI answered", "RFP / offer given", "Customer test", "Contract negotiation"];

function formatEur(amount: number): string {
  if (amount >= 1_000_000) return `EUR ${(amount / 1_000_000).toFixed(2)}m`;
  if (amount >= 1000) return `EUR ${Math.round(amount / 1000)}k`;
  return `EUR ${amount}`;
}

function monogram(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    Overview: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    Accounts: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.5M17 14a5 5 0 0 1 3.5 4.8V20" /></>,
    Deals: <><path d="M4 7h16v12H4zM8 7V4h8v3M4 12h16" /><path d="M10 12v2h4v-2" /></>,
    Cases: <><path d="M5 4h10l4 4v12H5z" /><path d="M14 4v5h5M8 13h8M8 17h5" /></>,
    Offers: <><path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h4" /></>,
    Forecast: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    Search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    Filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    Table: <><path d="M4 5h16v14H4zM4 10h16M4 15h16M10 5v14" /></>,
    Board: <><path d="M4 5h6v14H4zM14 5h6v9h-6z" /></>,
    Plus: <path d="M12 5v14M5 12h14" />,
    Spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" /></>,
    Chevron: <path d="m9 18 6-6-6-6" />,
    Back: <path d="m14 6-6 6 6 6M8 12h12" />,
    Menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    Close: <path d="m6 6 12 12M18 6 6 18" />,
    Mail: <><path d="M3 6h18v12H3z" /><path d="m3 7 9 6 9-6" /></>,
    Grip: <><circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" /></>,
    Clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  };

  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

function RiskLabel({ risk }: { risk: Deal["risk"] }) {
  return (
    <span className={`risk risk--${risk.toLowerCase().replace(" ", "-")}`}>
      <span aria-hidden="true" />
      {risk}
    </span>
  );
}

const composerKinds: { value: ActivityKind; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
];

function CompanyRecord({
  company,
  liveStage,
  logged,
  onLog,
  onBack,
  onNotify,
}: {
  company: Company;
  liveStage: string;
  logged: ActivityEntry[];
  onLog: (entry: ActivityEntry) => void;
  onBack: () => void;
  onNotify: (message: string) => void;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftKind, setDraftKind] = useState<ActivityKind>("note");
  const [draft, setDraft] = useState("");
  const draftRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (composerOpen) draftRef.current?.focus();
  }, [composerOpen]);

  const submitActivity = () => {
    const summary = draft.trim();
    if (!summary) return;
    onLog({ kind: draftKind, summary, actor: "Aino Lahti", when: "Just now" });
    setDraft("");
    setDraftKind("note");
    setComposerOpen(false);
    onNotify("Activity logged.");
  };

  const openCases = company.cases.filter((item) => item.status !== "Resolved").length;
  const openOffers = company.offers.filter((item) => item.status === "Sent" || item.status === "Draft").length;
  const relatedDeals = company.relatedDeals.map((deal, index) =>
    index === 0 && deal.status === "Open" ? { ...deal, stage: liveStage } : deal,
  );
  const activity = [...logged, ...company.activity];

  return (
    <section className="company" aria-label={`${company.name} account record`}>
      <div className="company-bar">
        <button className="back-link" onClick={onBack} type="button">
          <Icon name="Back" />
          Back to pipeline
        </button>
        <span className="prototype-label desktop-only">Account record</span>
      </div>

      <header className="company-header">
        <span className="company-logo" aria-hidden="true">{monogram(company.name)}</span>
        <div className="company-headline">
          <div className="company-titles">
            <h1>{company.name}</h1>
            <span className="lifecycle-pill">{company.lifecycle}</span>
          </div>
          <p className="company-sub">
            {company.industry} · {company.region} · {company.channel} · {company.sites} sites
          </p>
          <p className="company-summary">{company.summary}</p>
          <div className="company-meta">
            <span>Owner <strong>{company.owner}</strong></span>
            <span>Account since <strong>{company.accountSince}</strong></span>
          </div>
        </div>
        <div className="company-actions">
          <button
            className="button button--secondary"
            aria-expanded={composerOpen}
            onClick={() => setComposerOpen((open) => !open)}
            type="button"
          >
            Log activity
          </button>
          <button className="button button--primary" onClick={() => onNotify("New deal workflow opened for this account.")} type="button">
            <Icon name="Plus" />
            New deal
          </button>
        </div>
      </header>

      <section className="kpi-strip" aria-label="Account summary">
        <div>
          <span>Open pipeline</span>
          <strong>{company.openPipeline}</strong>
        </div>
        <div>
          <span>Weighted, next quarter</span>
          <strong>{company.weightedNextQuarter}</strong>
        </div>
        <div>
          <span>3-year total</span>
          <strong>{company.threeYearTotal}</strong>
        </div>
        <div>
          <span>Active cases</span>
          <strong className={openCases > 0 ? "text-warning" : undefined}>{openCases}</strong>
        </div>
        <div>
          <span>Open offers</span>
          <strong>{openOffers}</strong>
        </div>
      </section>

      <div className="company-body">
        <div className="company-col">
          <section className="record-block">
            <div className="block-head">
              <h2>Deals</h2>
              <span>{relatedDeals.length}</span>
            </div>
            <div className="table-wrap">
              <table className="mini-table">
                <thead>
                  <tr>
                    <th scope="col">Deal</th>
                    <th scope="col">Stage</th>
                    <th scope="col" className="numeric">Value</th>
                    <th scope="col">Status</th>
                    <th scope="col">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedDeals.map((deal) => (
                    <tr key={deal.name}>
                      <th scope="row">{deal.name}</th>
                      <td>{deal.stage}</td>
                      <td className="numeric numeric--strong">{deal.value}</td>
                      <td>
                        <span className={`pill pill--${deal.status.toLowerCase()}`}>{deal.status}</span>
                      </td>
                      <td>{deal.close}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="record-block">
            <div className="block-head">
              <h2>Service cases</h2>
              <span>{company.cases.length}</span>
            </div>
            {company.cases.length > 0 ? (
              <ul className="case-list">
                {company.cases.map((item) => (
                  <li key={item.ref}>
                    <span className={`priority priority--${item.priority.toLowerCase()}`}>{item.priority}</span>
                    <div className="case-main">
                      <strong>{item.title}</strong>
                      <small>{item.ref} · {item.owner}</small>
                    </div>
                    <div className="case-meta">
                      <span className={`pill pill--${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span>
                      <small>{item.sla}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-block">No open service cases for this account.</p>
            )}
          </section>

          <section className="record-block">
            <div className="block-head">
              <h2>Offers</h2>
              <span>{company.offers.length}</span>
            </div>
            {company.offers.length > 0 ? (
              <ul className="offer-list">
                {company.offers.map((item) => (
                  <li key={item.ref}>
                    <div className="offer-main">
                      <strong>{item.name}</strong>
                      <small>{item.ref} · updated {item.updated}</small>
                    </div>
                    <span className="offer-value numeric">{item.value}</span>
                    <span className={`pill pill--${item.status.toLowerCase()}`}>{item.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-block">No offers prepared yet. Build one from a deal.</p>
            )}
          </section>
        </div>

        <div className="company-col company-col--side">
          <section className="record-block">
            <div className="block-head">
              <h2>Revenue phasing</h2>
              <span>36 months</span>
            </div>
            <div className="phase-bars" aria-label="Revenue forecast by year">
              {company.phasing.map((phase) => (
                <div key={phase.year}>
                  <span>{phase.year}</span>
                  <i style={{ "--bar": `${phase.pct}%` } as React.CSSProperties} />
                  <strong>{phase.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="record-block">
            <div className="block-head">
              <h2>Contacts</h2>
              <span>{company.contacts.length}</span>
            </div>
            <ul className="contact-list">
              {company.contacts.map((contact) => (
                <li key={contact.email}>
                  <span className="avatar" aria-hidden="true">{monogram(contact.name)}</span>
                  <div className="contact-main">
                    <strong>
                      {contact.name}
                      {contact.primary && <span className="primary-tag">Primary</span>}
                    </strong>
                    <small>{contact.role}</small>
                  </div>
                  <a className="contact-mail" href={`mailto:${contact.email}`} aria-label={`Email ${contact.name}`}>
                    <Icon name="Mail" />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="ai-review" aria-labelledby="account-ai-title">
            <div className="ai-review-label">
              <Icon name="Spark" />
              <span>AI account review · Needs review</span>
            </div>
            <h3 id="account-ai-title">{company.aiHeadline}</h3>
            <div className="evidence">
              <strong>Evidence used</strong>
              <ul>
                {company.aiEvidence.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="ai-meta">
              <span>{company.aiConfidence}</span>
              <span>{company.aiSources} source records</span>
            </div>
            <div className="ai-actions">
              <button className="button button--primary" onClick={() => onNotify("Suggestion accepted as a draft task.")} type="button">
                Accept as task
              </button>
              <button className="button button--ghost" onClick={() => onNotify("Suggestion dismissed. No CRM data changed.")} type="button">
                Dismiss
              </button>
            </div>
          </section>
        </div>
      </div>

      <section className="record-block">
        <div className="block-head">
          <h2>Activity</h2>
          <span>{activity.length}</span>
        </div>

        {composerOpen && (
          <div className="activity-composer">
            <div className="composer-kinds" role="group" aria-label="Activity type">
              {composerKinds.map((option) => (
                <button
                  key={option.value}
                  className={draftKind === option.value ? "composer-kind composer-kind--active" : "composer-kind"}
                  aria-pressed={draftKind === option.value}
                  onClick={() => setDraftKind(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="composer-field">
              <span className="sr-only">Activity summary</span>
              <textarea
                ref={draftRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submitActivity();
                  if (event.key === "Escape") setComposerOpen(false);
                }}
                placeholder={`Log a ${draftKind} with ${company.name}…`}
                rows={2}
              />
            </label>
            <div className="composer-actions">
              <span className="composer-hint">⌘↵ to save</span>
              <button className="button button--ghost" onClick={() => setComposerOpen(false)} type="button">
                Cancel
              </button>
              <button className="button button--primary" onClick={submitActivity} disabled={!draft.trim()} type="button">
                Log activity
              </button>
            </div>
          </div>
        )}

        {activity.length > 0 ? (
          <ol className="timeline">
            {activity.map((entry, index) => (
              <li key={`${entry.when}-${index}`} className={`timeline-item timeline-item--${entry.kind}`}>
                <span className="timeline-dot" aria-hidden="true" />
                <div className="timeline-main">
                  <strong>{entry.summary}</strong>
                  <small>{entry.actor} · {entry.when}</small>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-block">No activity logged yet for this account.</p>
        )}
      </section>
    </section>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState("Deals");
  const [screen, setScreen] = useState<"pipeline" | "company">("pipeline");
  const [companyId, setCompanyId] = useState("nordcom");
  const [selectedId, setSelectedId] = useState("nordcom");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [search, setSearch] = useState("");
  const [onlyRisk, setOnlyRisk] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dealStage, setDealStage] = useState<Record<string, string>>(
    () => Object.fromEntries(deals.map((deal) => [deal.id, deal.stage])),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const [loggedActivity, setLoggedActivity] = useState<Record<string, ActivityEntry[]>>({});

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2800);
  };

  const selectedDeal = deals.find((deal) => deal.id === selectedId) ?? deals[0]!;
  const liveDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return deals
      .map((deal) => ({ ...deal, stage: dealStage[deal.id] ?? deal.stage }))
      .filter((deal) => {
        const matchesQuery = !query || [deal.account, deal.region, deal.owner, deal.stage]
          .some((value) => value.toLowerCase().includes(query));
        const matchesRisk = !onlyRisk || deal.risk === "At risk" || deal.risk === "Overdue";
        return matchesQuery && matchesRisk;
      });
  }, [search, onlyRisk, dealStage]);

  const moveDeal = (id: string, stage: string) => {
    const deal = deals.find((item) => item.id === id);
    if (!deal || dealStage[id] === stage) return;
    setDealStage((current) => ({ ...current, [id]: stage }));
    showNotice(`Moved ${deal.account} to ${stage}.`);
  };

  const openCompany = (id: string) => {
    setCompanyId(id);
    setSelectedId(id);
    setScreen("company");
    setActiveNav("Accounts");
    setMenuOpen(false);
  };

  const backToPipeline = () => {
    setScreen("pipeline");
    setActiveNav("Deals");
  };

  return (
    <div className="app-shell">
      <header className="mobile-bar">
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="icon-button"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <Icon name={menuOpen ? "Close" : "Menu"} />
        </button>
        <span className="mobile-brand">HMD Secure CRM</span>
        <span className="prototype-label">Prototype</span>
      </header>

      <aside className={menuOpen ? "sidebar sidebar--open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">H</span>
          <span>
            <strong>HMD Secure</strong>
            <small>Commercial workspace</small>
          </span>
        </div>

        <nav aria-label="Primary navigation">
          {navigation.map((item) => (
            <button
              className={activeNav === item ? "nav-item nav-item--active" : "nav-item"}
              key={item}
              onClick={() => {
                setActiveNav(item);
                setMenuOpen(false);
                if (item === "Deals") {
                  setScreen("pipeline");
                } else if (item === "Accounts") {
                  setScreen("company");
                } else {
                  showNotice(`${item} view is ready for the next build step.`);
                }
              }}
              type="button"
            >
              <Icon name={item} />
              <span>{item}</span>
              {item === "Cases" && <span className="nav-count">8</span>}
              {item === "Offers" && <span className="nav-count nav-count--alert">2</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-summary">
          <p>Quarter target</p>
          <strong>EUR 2.40m</strong>
          <div className="target-track" aria-label="68 percent of quarterly target covered">
            <span />
          </div>
          <small>68% covered by weighted pipeline</small>
        </div>

        <button className="profile" type="button">
          <span className="avatar">AL</span>
          <span>
            <strong>Aino Lahti</strong>
            <small>Sales Manager</small>
          </span>
          <Icon name="Chevron" />
        </button>
      </aside>

      <main className="workspace">
        {screen === "company" ? (
          <CompanyRecord
            key={companyId}
            company={companies[companyId]!}
            liveStage={dealStage[companyId] ?? companies[companyId]!.relatedDeals[0]!.stage}
            logged={loggedActivity[companyId] ?? []}
            onLog={(entry) =>
              setLoggedActivity((current) => ({
                ...current,
                [companyId]: [entry, ...(current[companyId] ?? [])],
              }))
            }
            onBack={backToPipeline}
            onNotify={showNotice}
          />
        ) : (
          <>
            <div className="topbar">
              <div>
                <div className="breadcrumb">
                  <span>Commercial</span>
                  <span aria-hidden="true">/</span>
                  <span>Pipeline</span>
                </div>
                <h1>Pipeline</h1>
              </div>
              <div className="topbar-actions">
                <span className="prototype-label desktop-only">Hackathon prototype</span>
                <button className="button button--secondary" onClick={() => showNotice("View configuration saved locally.")} type="button">
                  Save view
                </button>
                <button className="button button--primary" onClick={() => showNotice("New deal workflow opened.")} type="button">
                  <Icon name="Plus" />
                  New deal
                </button>
              </div>
            </div>

            <section className="status-strip" aria-label="Pipeline summary">
              <div>
                <span>Open pipeline</span>
                <strong>EUR 5.48m</strong>
              </div>
              <div>
                <span>Weighted, next quarter</span>
                <strong>EUR 852k</strong>
              </div>
              <div>
                <span>Needs attention</span>
                <strong className="text-warning">3 deals</strong>
              </div>
              <div>
                <span>Forecast updated</span>
                <strong>Today, 09:42</strong>
              </div>
            </section>

            <div className="view-toolbar">
              <div className="saved-views" role="tablist" aria-label="Saved views">
                <button className="saved-view saved-view--active" role="tab" aria-selected="true" type="button">
                  Team pipeline
                </button>
                <button className="saved-view" role="tab" aria-selected="false" onClick={() => setOnlyRisk(true)} type="button">
                  At risk
                  <span>3</span>
                </button>
                <button className="saved-view" role="tab" aria-selected="false" onClick={() => showNotice("Closing this quarter view selected.")} type="button">
                  Closing this quarter
                </button>
              </div>

              <div className="toolbar-controls">
                <label className="search-field">
                  <span className="sr-only">Search deals</span>
                  <Icon name="Search" />
                  <input
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search pipeline"
                    type="search"
                    value={search}
                  />
                </label>
                <button
                  aria-pressed={onlyRisk}
                  className={onlyRisk ? "control-button control-button--active" : "control-button"}
                  onClick={() => setOnlyRisk((active) => !active)}
                  type="button"
                >
                  <Icon name="Filter" />
                  Risk
                </button>
                <div className="view-switch" aria-label="Pipeline layout">
                  <button aria-label="Table view" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")} type="button">
                    <Icon name="Table" />
                  </button>
                  <button aria-label="Board view" aria-pressed={viewMode === "board"} onClick={() => setViewMode("board")} type="button">
                    <Icon name="Board" />
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <div className="workbench">
                <section className="records" aria-label="Deal pipeline">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Account</th>
                          <th scope="col">Stage</th>
                          <th scope="col">Owner</th>
                          <th scope="col">Expected close</th>
                          <th scope="col">Next quarter</th>
                          <th scope="col">3-year total</th>
                          <th scope="col">Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveDeals.map((deal) => (
                          <tr
                            className={selectedId === deal.id ? "selected-row" : ""}
                            key={deal.id}
                            onClick={() => setSelectedId(deal.id)}
                          >
                            <th scope="row">
                              <button className="account-cell" onClick={() => openCompany(deal.id)} type="button">
                                <span className="account-logo" aria-hidden="true">{deal.account.slice(0, 1)}</span>
                                <span>
                                  <strong>{deal.account}</strong>
                                  <small>{deal.region} · {deal.channel}</small>
                                </span>
                              </button>
                            </th>
                            <td><span className="stage-label">{deal.stage}</span></td>
                            <td>{deal.owner}</td>
                            <td>{deal.closeDate}</td>
                            <td className="numeric">{deal.nextQuarter}</td>
                            <td className="numeric numeric--strong">{deal.total}</td>
                            <td>
                              <RiskLabel risk={deal.risk} />
                              <small className="risk-detail">{deal.riskDetail}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {liveDeals.length === 0 && (
                      <div className="no-results">
                        <strong>No deals match this view.</strong>
                        <button onClick={() => { setSearch(""); setOnlyRisk(false); }} type="button">Clear filters</button>
                      </div>
                    )}
                  </div>
                </section>

                <aside className="record-panel" aria-label={`${selectedDeal.account} deal details`}>
                  <div className="record-panel-header">
                    <div>
                      <span className="record-type">Selected deal</span>
                      <h2>{selectedDeal.account}</h2>
                      <p>{dealStage[selectedDeal.id]} · {selectedDeal.channel}</p>
                    </div>
                    <button aria-label="Open full account record" className="icon-button" onClick={() => openCompany(selectedDeal.id)} type="button">
                      <Icon name="Chevron" />
                    </button>
                  </div>

                  <dl className="record-facts">
                    <div>
                      <dt>Device revenue</dt>
                      <dd>{selectedDeal.deviceRevenue}</dd>
                    </div>
                    <div>
                      <dt>Service revenue</dt>
                      <dd>{selectedDeal.serviceRevenue}</dd>
                    </div>
                    <div>
                      <dt>Next quarter</dt>
                      <dd>{selectedDeal.nextQuarter}</dd>
                    </div>
                    <div>
                      <dt>Expected close</dt>
                      <dd>{selectedDeal.closeDate}</dd>
                    </div>
                  </dl>

                  <div className="forecast-phasing">
                    <div className="section-heading">
                      <h3>Revenue phasing</h3>
                      <span>36 months</span>
                    </div>
                    <div className="phase-bars" aria-label="Revenue forecast by year">
                      <div><span>2026</span><i style={{ "--bar": "38%" } as React.CSSProperties} /><strong>EUR 340k</strong></div>
                      <div><span>2027</span><i style={{ "--bar": "78%" } as React.CSSProperties} /><strong>EUR 612k</strong></div>
                      <div><span>2028</span><i style={{ "--bar": "43%" } as React.CSSProperties} /><strong>EUR 292k</strong></div>
                    </div>
                  </div>

                  <section className="ai-review" aria-labelledby="ai-review-title">
                    <div className="ai-review-label">
                      <Icon name="Spark" />
                      <span>AI suggestion · Needs review</span>
                    </div>
                    <h3 id="ai-review-title">{selectedDeal.suggestion}</h3>
                    <div className="evidence">
                      <strong>Evidence used</strong>
                      <ul>
                        {selectedDeal.evidence.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                    <div className="ai-meta">
                      <span>{selectedDeal.confidence}</span>
                      <span>3 source records</span>
                    </div>
                    <div className="ai-actions">
                      <button className="button button--primary" onClick={() => showNotice("Suggestion accepted as a draft task.")} type="button">
                        Accept as task
                      </button>
                      <button className="button button--ghost" onClick={() => showNotice("Suggestion dismissed. No CRM data changed.")} type="button">
                        Dismiss
                      </button>
                    </div>
                  </section>
                </aside>
              </div>
            ) : (
              <div className="board-wrap">
                <div className="board" aria-label="Deal pipeline board">
                  {stages.map((stage) => {
                    const stageDeals = liveDeals.filter((deal) => deal.stage === stage);
                    const stageValue = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);
                    return (
                      <section
                        className={dropStage === stage ? "board-column board-column--drop" : "board-column"}
                        key={stage}
                        onDragOver={(event) => {
                          if (!draggingId) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDropStage(stage);
                        }}
                        onDragLeave={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropStage(null);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const id = event.dataTransfer.getData("text/plain");
                          moveDeal(id, stage);
                          setDraggingId(null);
                          setDropStage(null);
                        }}
                      >
                        <header className="board-column-head">
                          <strong>{stage}</strong>
                          <span className="board-column-count">{stageDeals.length}</span>
                        </header>
                        <div className="board-column-body">
                          {stageDeals.map((deal) => (
                            <article
                              className={draggingId === deal.id ? "board-record board-record--dragging" : "board-record"}
                              key={deal.id}
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/plain", deal.id);
                                event.dataTransfer.effectAllowed = "move";
                                setDraggingId(deal.id);
                              }}
                              onDragEnd={() => {
                                setDraggingId(null);
                                setDropStage(null);
                              }}
                            >
                              <div className="board-record-top">
                                <span className="board-grip" aria-hidden="true"><Icon name="Grip" /></span>
                                <button className="board-record-open" onClick={() => openCompany(deal.id)} type="button">
                                  <strong>{deal.account}</strong>
                                  <small>{deal.channel} · {deal.region}</small>
                                </button>
                              </div>
                              <div className="board-record-figures">
                                <span className="board-record-value">{deal.total}</span>
                                <RiskLabel risk={deal.risk} />
                              </div>
                              <div className="board-record-foot">
                                <span className="board-owner">
                                  <span className="avatar avatar--xs" aria-hidden="true">{monogram(deal.owner)}</span>
                                  {deal.owner}
                                </span>
                                <span className="board-close"><Icon name="Clock" />{deal.closeDate}</span>
                              </div>
                              <label className="board-move">
                                <span className="sr-only">Move {deal.account} to stage</span>
                                <select
                                  value={deal.stage}
                                  onChange={(event) => moveDeal(deal.id, event.target.value)}
                                >
                                  {stages.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              </label>
                            </article>
                          ))}
                          {stageDeals.length === 0 && (
                            <p className="board-empty">Drop a deal here</p>
                          )}
                        </div>
                        <footer className="board-column-foot">
                          <span>Stage value</span>
                          <strong>{stageValue === 0 ? "—" : formatEur(stageValue)}</strong>
                        </footer>
                      </section>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}
