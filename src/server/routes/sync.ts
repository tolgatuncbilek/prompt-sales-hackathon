import { Hono } from 'hono';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';

const app = new Hono();

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
  ]);

  // Transform to frontend models
  
  const monogram = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const users = dbUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    initials: monogram(u.name || ''),
    title: u.role === 'sales_rep' ? 'Sales Representative' : u.role === 'tam' ? 'Technical Account Manager' : u.role === 'sales_manager' ? 'Sales Manager' : 'Finance'
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
    type: s.serviceType,
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
      expectedClose: d.expectedClose,
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

  const cases = dbCases.map(c => ({
    id: c.id,
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
    notes: [] // Not modelled in db yet
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
      stepOrder: a.stepOrder,
      roleRequired: a.roleRequired,
      decidedById: a.decidedByUserId,
      decision: a.decision,
      note: a.note,
      decidedAt: a.decidedAt ? a.decidedAt.toISOString() : null
    }));
    return {
      id: o.id,
      ref: `OFF-${o.id.split('-')[0]}`,
      dealId: o.dealId,
      createdById: o.createdByUserId,
      version: o.version,
      status: o.status,
      discountPct: Number(o.discountPct),
      justification: o.justification,
      lockedAt: o.lockedAt ? o.lockedAt.toISOString() : null,
      createdAt: o.createdAt.toISOString(),
      lines,
      approvals
    };
  });

  const aiInsights = dbInsights.map(i => ({
    id: i.id,
    accountId: i.accountId,
    dealId: i.dealId,
    caseId: i.caseId,
    type: i.insightType,
    headline: i.body.substring(0, 50) + '...',
    body: i.body,
    confidence: Number(i.confidence),
    evidence: [],
    sources: i.sources || [],
    status: i.status
  }));

  const activities = dbActivities.map(a => ({
    id: a.id,
    accountId: a.accountId,
    actorId: a.actorUserId,
    kind: a.isAiGenerated ? 'ai' : 'note',
    summary: a.eventType,
    when: a.createdAt.toISOString(),
    isAi: a.isAiGenerated
  }));

  const notifications = dbNotifications.map(n => ({
    id: n.id,
    userId: n.userId,
    kind: 'note', // fallback
    body: n.body,
    read: n.read,
    when: n.createdAt.toISOString()
  }));

  return c.json({
    users, accounts, contacts, products, services,
    deals, serviceContracts, cases, offers, aiInsights, activities, notifications
  });
});

export default app;
