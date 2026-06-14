import { Hono } from 'hono';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';

const app = new Hono();

const humanize = (s: string): string =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

function formatDateOnly(value: Date | string | null | undefined): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapOfferStatus(status: string): string {
  if (status === 'draft') return 'sales_rep';
  if (status === 'approved' || status === 'locked') return 'made';
  return status;
}

/**
 * Turn a stored activity (event_type + payload) into the frontend's
 * { kind, summary } shape. Manual entries carry their own summary/kind in the
 * payload and are used verbatim; system events are rendered to readable text.
 */
function deriveActivity(
  eventType: string,
  payload: Record<string, any> | null,
  isAi: boolean,
): { kind: string; summary: string } {
  const p = payload ?? {};
  if (typeof p.summary === 'string' && typeof p.kind === 'string') {
    return { kind: p.kind, summary: p.summary };
  }
  switch (eventType) {
    case 'account_created':
      return { kind: 'note', summary: `Account created${p.name ? `: ${p.name}` : ''}.` };
    case 'deal_created':
      return { kind: 'stage', summary: `Deal created${p.title ? `: ${p.title}` : ''}.` };
    case 'stage_changed':
      return {
        kind: 'stage',
        summary: `${p.title ? `${p.title} — ` : ''}stage moved${
          p.from && p.to ? ` from ${humanize(p.from)} to ${humanize(p.to)}` : ''
        }.`,
      };
    case 'case_opened':
      return { kind: 'case', summary: `Case opened${p.priority ? ` (${p.priority} priority)` : ''}.` };
    case 'case_status_changed':
      return {
        kind: 'case',
        summary: `Case status changed${p.from && p.to ? ` from ${humanize(p.from)} to ${humanize(p.to)}` : ''}.`,
      };
    case 'forecast_updated':
      return { kind: 'note', summary: `Forecast updated${p.periods ? ` (${p.periods} periods)` : ''}.` };
    case 'offer_submitted':
      return {
        kind: 'offer',
        summary: `Offer submitted${p.deal_title ? ` for ${p.deal_title}` : ''}${p.version ? ` (v${p.version})` : ''}.`,
      };
    case 'offer_rejected':
      return { kind: 'offer', summary: `Offer rejected${p.note ? `: ${p.note}` : ''}.` };
    case 'offer_manager_approved':
      return { kind: 'offer', summary: 'Offer approved by sales manager — routed to Finance.' };
    case 'offer_approved':
      return { kind: 'offer', summary: 'Offer fully approved and locked.' };
    case 'ai_insight_generated':
      return { kind: 'ai', summary: `AI insight generated${p.insight_type ? `: ${humanize(p.insight_type)}` : ''}.` };
    case 'note_added':
      return { kind: 'note', summary: typeof p.text === 'string' ? p.text : 'Note added.' };
    case 'email_received':
      return {
        kind: 'email',
        summary: `Email received from ${p.fromName || p.from}: ${p.subject}`,
      };
    case 'email_sent':
      return {
        kind: 'email',
        summary: `Email sent to ${Array.isArray(p.to) ? p.to.join(', ') : p.to}: ${p.subject}`,
      };
    default:
      return { kind: isAi ? 'ai' : 'note', summary: humanize(eventType) };
  }
}

const fmtActivityWhen = (d: Date): string =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function calculateContractPhases(c: any): { expectedDevices: number | null; phases: { period: string; value: number }[] } {
  const phases: { period: string; value: number }[] = [];
  let expectedDevices: number | null = null;

  const getQuarter = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const y = d.getFullYear();
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `${y}-Q${q}`;
    } catch {
      return "2026-Q3";
    }
  };

  const parseTrajectory = (traj: any): any[] => {
    if (!traj) return [];
    if (Array.isArray(traj)) return traj;
    try {
      return typeof traj === "string" ? JSON.parse(traj) : [];
    } catch {
      return [];
    }
  };

  const start = c.startDate;
  const end = c.endDate;
  const fixed = c.fixedValue ? Number(c.fixedValue) : 0;
  const rate = c.monthlyRate ? Number(c.monthlyRate) : 0;

  if (c.invoiceModel === 'one_off') {
    if (fixed > 0) {
      phases.push({ period: getQuarter(start), value: fixed });
    }
  } else if (c.invoiceModel === 'fixed_term') {
    if (fixed > 0 && start && end) {
      try {
        const dStart = new Date(start);
        const dEnd = new Date(end);

        // Calculate difference in months
        let monthsDiff = (dEnd.getFullYear() - dStart.getFullYear()) * 12 + (dEnd.getMonth() - dStart.getMonth());
        if (monthsDiff <= 0) monthsDiff = 1;

        const monthlyVal = fixed / monthsDiff;
        const quarterVals: Record<string, number> = {};

        for (let m = 0; m < monthsDiff; m++) {
          const currentMonthDate = new Date(dStart.getFullYear(), dStart.getMonth() + m, 15);
          const qLabel = `${currentMonthDate.getFullYear()}-Q${Math.floor(currentMonthDate.getMonth() / 3) + 1}`;
          quarterVals[qLabel] = (quarterVals[qLabel] || 0) + monthlyVal;
        }

        for (const [period, value] of Object.entries(quarterVals)) {
          phases.push({ period, value: Math.round(value) });
        }
      } catch (e) {
        phases.push({ period: getQuarter(start), value: fixed });
      }
    } else if (fixed > 0) {
      phases.push({ period: getQuarter(start), value: fixed });
    }
  } else if (c.invoiceModel === 'monthly_recurring') {
    const traj = parseTrajectory(c.deviceCountTrajectory);
    if (traj.length > 0 && rate > 0) {
      const quarterVals: Record<string, number> = {};
      let maxDevices = 0;

      for (const pt of traj) {
        const devCount = pt.expected_devices || pt.expectedDevices || 0;
        if (devCount > maxDevices) maxDevices = devCount;

        try {
          const mParts = String(pt.month || pt.period).split('-');
          const year = parseInt(mParts[0], 10);
          const month = parseInt(mParts[1], 10) - 1; // 0-indexed
          const qLabel = `${year}-Q${Math.floor(month / 3) + 1}`;

          quarterVals[qLabel] = (quarterVals[qLabel] || 0) + (devCount * rate);
        } catch {
          // Fallback
        }
      }

      expectedDevices = maxDevices;
      for (const [period, value] of Object.entries(quarterVals)) {
        phases.push({ period, value: Math.round(value) });
      }
    } else {
      expectedDevices = null;
    }
  }

  return { expectedDevices, phases };
}

app.get('/', async (c) => {
  // Fetch all tables
  const [
    dbUsers,
    dbAccounts,
    dbContacts,
    dbDeals,
    dbForecasts,
    dbProducts,
    dbServices,
    dbContracts,
    dbCases,
    dbOffers,
    dbOfferLines,
    dbApprovals,
    dbInsights,
    dbActivities,
    dbNotifications,
    dbCompetitors,
  ] = await Promise.all([
    db.select().from(schema.users),
    db.select().from(schema.accounts),
    db.select().from(schema.contacts),
    db.select().from(schema.deals),
    db.select().from(schema.deviceForecasts),
    db.select().from(schema.productCatalog),
    db.select().from(schema.serviceCatalog),
    db.select().from(schema.serviceContracts),
    db.select().from(schema.cases),
    db.select().from(schema.offers),
    db.select().from(schema.offerLines),
    db.select().from(schema.approvalSteps),
    db.select().from(schema.aiInsights),
    db.select().from(schema.activities),
    db.select().from(schema.notifications),
    db.select().from(schema.dealCompetitors),
  ]);

  // Transform to frontend models
  
  const monogram = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const users = dbUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    initials: monogram(u.name || ''),
    title: u.role === 'sales_rep' ? 'Sales Representative' : u.role === 'tam' ? 'Technical Account Manager' : u.role === 'sales_manager' ? 'Sales Manager' : u.role === 'admin' ? 'Administrator' : 'Finance'
  }));

  const accounts = dbAccounts.map(a => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    address: a.address,
    vatId: a.vatId,
    industry: a.industry,
    region: 'Global', // mock
    ownerId: a.ownerUserId,
    lifecycle: 'Customer', // mock
    sites: 1,
    summary: '',
    since: a.createdAt?.toISOString() || '',
  }));

  const contacts = dbContacts.map(c => ({
    id: c.id,
    accountId: c.accountId,
    name: c.name,
    email: c.email,
    phone: c.phone || '',
    roleType: c.roleType,
  }));

  const products = dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    listPrice: Number(p.listPrice),
    retired: p.retired
  }));

  const services = dbServices.map(s => ({
    id: s.id,
    name: s.name,
    serviceType: s.serviceType,
    listPrice: Number(s.listPrice ?? 0),
    isThirdParty: s.isThirdParty,
    retired: s.retired
  }));

  const deals = dbDeals.map(d => {
    const forecasts = dbForecasts.filter(f => f.dealId === d.id);
    const units = forecasts.length > 0 ? forecasts[0].units : 0;
    const unitPrice = forecasts.length > 0 ? Number(forecasts[0].unitPrice) : 0;
    const devicePhases = forecasts.map(f => ({ period: f.periodLabel, units: f.units }));
    return {
      id: d.id,
      accountId: d.accountId,
      parentDealId: d.parentDealId,
      ownerId: d.ownerUserId,
      title: d.title,
      stage: d.stage === 'interest_shown' || d.stage === 'rfi_answered'
        ? 'lead'
        : d.stage === 'rfp_given'
          ? 'offer'
          : d.stage === 'customer_test'
            ? 'customer_testing'
            : d.stage === 'contract_negotiation'
              ? 'final_negotiation'
              : 'closed',
      apiStage: d.stage,
      leadValidated: d.stage !== 'interest_shown',
      channel: d.channel,
      isPilot: d.isPilot,
      expectedClose: formatDateOnly(d.expectedClose),
      updatedAt: d.updatedAt.toISOString(),
      createdAt: d.createdAt.toISOString(),
      deviceUnitPrice: unitPrice,
      devicePhases: devicePhases
    };
  });

  const serviceContracts = dbContracts.map(c => {
    const calculated = calculateContractPhases(c);
    return {
      id: c.id,
      dealId: c.dealId,
      serviceId: c.serviceId,
      invoiceModel: c.invoiceModel,
      startDate: c.startDate,
      endDate: c.endDate,
      fixedValue: c.fixedValue ? Number(c.fixedValue) : null,
      monthlyRate: c.monthlyRate ? Number(c.monthlyRate) : null,
      deviceCountTrajectory: c.deviceCountTrajectory,
      createdAt: c.createdAt.toISOString(),
      expectedDevices: calculated.expectedDevices,
      phases: calculated.phases
    };
  });

  const cases = dbCases.map((c, i) => ({
    id: c.id,
    ref: `CASE-${String(i + 1).padStart(4, "0")}`,
    accountId: c.accountId,
    serviceId: c.serviceId,
    ownerId: c.ownerUserId,
    contactId: c.contactId,
    status: c.status,
    priority: c.priority,
    title: c.title,
    description: c.description || '',
    escalated: c.escalated,
    thirdPartyRef: c.thirdPartyRef,
    slaDeadline: c.slaDeadline ? c.slaDeadline.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    notes: dbActivities
      .filter(a => a.entityType === 'case' && a.entityId === c.id && a.eventType === 'note_added')
      .map(a => {
        const p = (a.payload as Record<string, any>) || {};
        return {
          author: p.author_name || 'System',
          body: p.text || '',
          when: a.createdAt.toISOString(),
          internal: !!p.internal
        };
      })
      .sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())
  }));

  const offers = dbOffers.map(o => {
    const lines = dbOfferLines.filter(l => l.offerId === o.id).map(l => {
      const prod = dbProducts.find(p => p.id === l.productId);
      const serv = dbServices.find(s => s.id === l.serviceId);
      return {
        productId: l.productId,
        serviceId: l.serviceId,
        label: prod ? prod.name : (serv ? serv.name : 'Item'),
        unitPrice: Number(l.unitPrice),
        quantity: l.quantity,
        discountPct: Number(l.discountPct)
      };
    });
    const approvals = dbApprovals.filter(a => a.offerId === o.id).map(a => ({
      id: a.id,
      stepOrder: a.stepOrder,
      roleRequired: a.roleRequired,
      decidedById: a.decidedBy,
      decision: a.decision,
      note: a.note,
      decidedAt: a.decidedAt ? a.decidedAt.toISOString() : null
    }));
    return {
      id: o.id,
      ref: `OFF-${o.id.split('-')[0]}`,
      dealId: o.dealId,
      createdById: o.createdBy,
      version: o.version,
      status: mapOfferStatus(o.status),
      discountPct: Number(o.discountPct),
      justification: o.justification,
      lockedAt: o.lockedAt ? o.lockedAt.toISOString() : null,
      createdAt: o.createdAt.toISOString(),
      lines,
      approvals
    };
  });

  function parseInsightBody(body: string): { headline: string; evidence: string[] } {
    const sentences = body.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    if (sentences.length === 0) {
      return { headline: body, evidence: [] };
    }
    const headline = sentences[0];
    const evidence: string[] = [];
    for (let i = 1; i < sentences.length; i++) {
      const s = sentences[i];
      if (s.includes("(1)") || s.toLowerCase().startsWith("risk factors:")) {
        const parts = s.split(/\(\d+\)/);
        for (const p of parts) {
          const cleanPart = p.replace(/^\s*risk\s+factors:\s*/i, "").trim();
          if (cleanPart) evidence.push(cleanPart);
        }
      } else {
        evidence.push(s);
      }
    }
    return { headline, evidence };
  }

  const aiInsights = dbInsights.map(i => {
    const { headline, evidence } = parseInsightBody(i.body);
    return {
      id: i.id,
      accountId: i.accountId,
      dealId: i.dealId,
      caseId: i.caseId,
      type: i.insightType,
      headline,
      body: i.body,
      confidence: Number(i.confidence),
      evidence,
      sources: i.sources || [],
      status: i.status,
      draftEmail: i.draftEmail || undefined
    };
  });


  // Map offer -> deal so offer activities also surface on the deal timeline.
  const offerToDeal = new Map(dbOffers.map((o) => [o.id, o.dealId]));

  const activities = dbActivities.map(a => {
    const { kind, summary } = deriveActivity(
      a.eventType,
      a.payload as Record<string, any> | null,
      a.isAiGenerated,
    );
    const dealId =
      a.entityType === 'deal'
        ? a.entityId
        : a.entityType === 'offer'
          ? offerToDeal.get(a.entityId) ?? null
          : null;
    return {
      id: a.id,
      accountId: a.accountId,
      dealId,
      actorId: a.actorUserId,
      kind,
      summary,
      when: fmtActivityWhen(a.createdAt),
      isAi: a.isAiGenerated,
    };
  });

  const notifications = dbNotifications.map(n => ({
    id: n.id,
    userId: n.userId,
    kind: 'note', // fallback
    body: n.body,
    read: n.read,
    when: n.createdAt.toISOString()
  }));

  const dealCompetitors = dbCompetitors.map((row) => ({
    id: row.id,
    dealId: row.dealId,
    name: row.name,
    netTotal: row.netTotal != null ? Number(row.netTotal) : null,
    createdAt: row.createdAt.toISOString(),
  }));

  // Build a lightweight ETag from counts + unread notification count so clients
  // can use conditional GET (If-None-Match) and receive 304 Not Modified when
  // the data hasn't changed since the previous fetch.
  const etag = `"sync-${dbDeals.length}-${dbOffers.length}-${dbActivities.length}-${dbNotifications.filter((n) => !n.read).length}"`;
  const ifNoneMatch = c.req.header('If-None-Match');
  if (ifNoneMatch === etag) {
    return c.body(null, 304);
  }

  c.header('ETag', etag);
  c.header('Cache-Control', 'private, no-cache'); // validate with ETag before using cached copy

  return c.json({
    users, accounts, contacts, products, services,
    deals, serviceContracts, cases, offers, aiInsights, activities, notifications,
    dealCompetitors,
  });
});

export default app;
