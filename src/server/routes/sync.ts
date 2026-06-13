import { Hono } from 'hono';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';

const app = new Hono();

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
      stage: d.stage,
      channel: d.channel,
      isPilot: d.isPilot,
      expectedClose: d.expectedClose,
      updatedAt: d.updatedAt.toISOString(),
      createdAt: d.createdAt.toISOString(),
      deviceUnitPrice: unitPrice,
      devicePhases: devicePhases
    };
  });

  const serviceContracts = dbContracts.map(c => ({
    id: c.id,
    dealId: c.dealId,
    serviceId: c.serviceId,
    invoiceModel: c.invoiceModel,
    startDate: c.startDate,
    endDate: c.endDate,
    fixedValue: c.fixedValue ? Number(c.fixedValue) : null,
    monthlyRate: c.monthlyRate ? Number(c.monthlyRate) : null,
    deviceCountTrajectory: c.deviceCountTrajectory,
    createdAt: c.createdAt.toISOString()
  }));

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
