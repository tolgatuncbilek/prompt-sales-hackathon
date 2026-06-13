/**
 * HMD Secure CRM — Seed Script
 *
 * Populates the database with realistic demo data for the hackathon.
 * Safe to re-run: skips if the users table already has rows.
 *
 * Usage: bun run src/db/seed.ts
 */
import { db } from "./index.js";
import {
  users,
  accounts,
  contacts,
  deals,
  deviceForecasts,
  productCatalog,
  serviceCatalog,
  serviceContracts,
  cases,
  offers,
  offerLines,
  approvalSteps,
  activities,
  agentRuns,
  aiInsights,
  notifications,
} from "./schema/index.js";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a Date offset from "now" by the given number of days. */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function daysFromNowStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Quarter start/end helpers for forecast periods. */
function quarterStart(year: number, q: number): string {
  return new Date(Date.UTC(year, (q - 1) * 3, 1)).toISOString().split('T')[0];
}
function quarterEnd(year: number, q: number): string {
  return new Date(Date.UTC(year, q * 3, 0)).toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Deterministic UUIDs — stored so we can reference them across inserts
// ---------------------------------------------------------------------------

// Users
const userId = {
  janne: crypto.randomUUID(),
  maria: crypto.randomUUID(),
  tomas: crypto.randomUUID(),
  sofia: crypto.randomUUID(),
  anssi: crypto.randomUUID(),
  laura: crypto.randomUUID(),
};

// Products
const productId = {
  xr20: crypto.randomUUID(),
  xr21: crypto.randomUUID(),
  xr10lite: crypto.randomUUID(),
  tb500: crypto.randomUUID(),
  sc100: crypto.randomUUID(),
  gw200: crypto.randomUUID(),
};

// Services
const serviceId = {
  mdm: crypto.randomUUID(),
  shield: crypto.randomUUID(),
  cloudguard: crypto.randomUUID(),
  fieldSupport: crypto.randomUUID(),
  telconet: crypto.randomUUID(),
};

// Accounts
const accountId = {
  securitas: crypto.randomUUID(),
  deutscheBahn: crypto.randomUUID(),
  nhs: crypto.randomUUID(),
  stenaLine: crypto.randomUUID(),
  danishDefence: crypto.randomUUID(),
  kone: crypto.randomUUID(),
  veolia: crypto.randomUUID(),
  postnord: crypto.randomUUID(),
};

// Contacts (2-3 per account = ~20)
const contactId: Record<string, string> = {};
for (let i = 1; i <= 22; i++) {
  contactId[`c${i}`] = crypto.randomUUID();
}

// Deals
const dealId: Record<string, string> = {};
for (let i = 1; i <= 12; i++) {
  dealId[`d${i}`] = crypto.randomUUID();
}

// Cases
const caseId: Record<string, string> = {};
for (let i = 1; i <= 10; i++) {
  caseId[`cs${i}`] = crypto.randomUUID();
}

// Offers
const offerId: Record<string, string> = {};
for (let i = 1; i <= 6; i++) {
  offerId[`o${i}`] = crypto.randomUUID();
}

// Offer Lines
const offerLineId: Record<string, string> = {};
for (let i = 1; i <= 20; i++) {
  offerLineId[`ol${i}`] = crypto.randomUUID();
}

// Approval Steps
const approvalId: Record<string, string> = {};
for (let i = 1; i <= 12; i++) {
  approvalId[`a${i}`] = crypto.randomUUID();
}

// Device Forecasts
const forecastId: Record<string, string> = {};
for (let i = 1; i <= 30; i++) {
  forecastId[`f${i}`] = crypto.randomUUID();
}

// Service Contracts
const contractId: Record<string, string> = {};
for (let i = 1; i <= 8; i++) {
  contractId[`sc${i}`] = crypto.randomUUID();
}

// Agent Runs & AI Insights
const agentRunId: Record<string, string> = {};
for (let i = 1; i <= 4; i++) {
  agentRunId[`ar${i}`] = crypto.randomUUID();
}
const insightId: Record<string, string> = {};
for (let i = 1; i <= 4; i++) {
  insightId[`in${i}`] = crypto.randomUUID();
}

// Activities
const activityId: Record<string, string> = {};
for (let i = 1; i <= 60; i++) {
  activityId[`act${i}`] = crypto.randomUUID();
}

// Notifications
const notifId: Record<string, string> = {};
for (let i = 1; i <= 10; i++) {
  notifId[`n${i}`] = crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  // Check if data already exists
  const existing = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (existing[0]?.count > 0) {
    console.log("⏭  Database already seeded — skipping.");
    process.exit(0);
  }

  console.log("🌱 Seeding HMD Secure CRM...");

  // =========================================================================
  // 1. USERS
  // =========================================================================
  await db.insert(users).values([
    { id: userId.janne,  azureOid: "aad-janne-001",  name: "Janne Lehtosalo", email: "janne@hmdsecure.com",  role: "sales_rep",      createdAt: daysAgo(90) },
    { id: userId.maria,  azureOid: "aad-maria-002",  name: "Maria Virtanen",  email: "maria@hmdsecure.com",  role: "sales_rep",      createdAt: daysAgo(90) },
    { id: userId.tomas,  azureOid: "aad-tomas-003",  name: "Tomas Eriksson",  email: "tomas@hmdsecure.com",  role: "tam",            createdAt: daysAgo(90) },
    { id: userId.sofia,  azureOid: "aad-sofia-004",  name: "Sofia Andersson", email: "sofia@hmdsecure.com",  role: "tam",            createdAt: daysAgo(90) },
    { id: userId.anssi,  azureOid: "aad-anssi-005",  name: "Anssi Rönnemaa",  email: "anssi@hmdsecure.com",  role: "sales_manager",  createdAt: daysAgo(90) },
    { id: userId.laura,  azureOid: "aad-laura-006",  name: "Laura Korhonen",  email: "laura@hmdsecure.com",  role: "finance",        createdAt: daysAgo(90) },
  ]);
  console.log("  ✓ Users");

  // =========================================================================
  // 2. PRODUCT CATALOG
  // =========================================================================
  await db.insert(productCatalog).values([
    { id: productId.xr20,    name: "XR-20",      category: "Rugged Smartphone", listPrice: "449.00",  retired: false, updatedAt: daysAgo(60) },
    { id: productId.xr21,    name: "XR-21",      category: "Rugged Smartphone", listPrice: "529.00",  retired: false, updatedAt: daysAgo(30) },
    { id: productId.xr10lite, name: "XR-10 Lite", category: "Rugged Smartphone", listPrice: "329.00",  retired: false, updatedAt: daysAgo(60) },
    { id: productId.tb500,   name: "TB-500",     category: "Rugged Tablet",     listPrice: "899.00",  retired: false, updatedAt: daysAgo(60) },
    { id: productId.sc100,   name: "SC-100",     category: "Body Camera",       listPrice: "299.00",  retired: false, updatedAt: daysAgo(45) },
    { id: productId.gw200,   name: "GW-200",     category: "IoT Gateway",       listPrice: "199.00",  retired: false, updatedAt: daysAgo(60) },
  ]);
  console.log("  ✓ Product catalog");

  // =========================================================================
  // 3. SERVICE CATALOG
  // =========================================================================
  await db.insert(serviceCatalog).values([
    { id: serviceId.mdm,          name: "HMD Secure MDM",       serviceType: "Device Management",  isThirdParty: false, retired: false, createdAt: daysAgo(90) },
    { id: serviceId.shield,       name: "HMD Secure Shield",    serviceType: "Endpoint Security",  isThirdParty: false, retired: false, createdAt: daysAgo(90) },
    { id: serviceId.cloudguard,   name: "CloudGuard Protect",   serviceType: "Cloud Security",     isThirdParty: true,  retired: false, createdAt: daysAgo(90) },
    { id: serviceId.fieldSupport, name: "HMD Field Support",    serviceType: "On-site Support",    isThirdParty: false, retired: false, createdAt: daysAgo(90) },
    { id: serviceId.telconet,     name: "TelcoNet Connectivity", serviceType: "Connectivity",       isThirdParty: true,  retired: false, createdAt: daysAgo(90) },
  ]);
  console.log("  ✓ Service catalog");

  // =========================================================================
  // 4. ACCOUNTS
  // =========================================================================
  await db.insert(accounts).values([
    { id: accountId.securitas,      name: "Securitas Finland Oy",  domain: "securitas.fi",      address: "Elimäenkatu 26, 00510 Helsinki",         vatId: "FI20954395",  industry: "Security Services",      ownerUserId: userId.janne, createdAt: daysAgo(75), updatedAt: daysAgo(2) },
    { id: accountId.deutscheBahn,   name: "Deutsche Bahn AG",      domain: "deutschebahn.com",  address: "Potsdamer Platz 2, 10785 Berlin",        vatId: "DE814160246", industry: "Transportation",          ownerUserId: userId.janne, createdAt: daysAgo(60), updatedAt: daysAgo(1) },
    { id: accountId.nhs,            name: "NHS Digital",            domain: "digital.nhs.uk",    address: "7-8 Wellington Place, Leeds LS1 4AP",    vatId: null,          industry: "Healthcare",             ownerUserId: userId.maria, createdAt: daysAgo(55), updatedAt: daysAgo(3) },
    { id: accountId.stenaLine,      name: "Stena Line AB",          domain: "stenaline.com",     address: "Danmarksterminalen, 405 19 Göteborg",   vatId: "SE556231019201", industry: "Maritime & Logistics", ownerUserId: userId.maria, createdAt: daysAgo(50), updatedAt: daysAgo(5) },
    { id: accountId.danishDefence,  name: "Danish Defence",         domain: "forsvaret.dk",      address: "Holmens Kanal 42, 1060 København",      vatId: null,          industry: "Defence & Government",   ownerUserId: userId.janne, createdAt: daysAgo(45), updatedAt: daysAgo(22) },
    { id: accountId.kone,           name: "Kone Oyj",               domain: "kone.com",          address: "Keilasatama 3, 02150 Espoo",            vatId: "FI19274565",  industry: "Industrial & Elevators", ownerUserId: userId.maria, createdAt: daysAgo(40), updatedAt: daysAgo(4) },
    { id: accountId.veolia,         name: "Veolia Nordic",          domain: "veolia.fi",         address: "Lehtikuusentie 6, 01300 Vantaa",        vatId: "FI22345678",  industry: "Utilities & Environment", ownerUserId: userId.janne, createdAt: daysAgo(35), updatedAt: daysAgo(25) },
    { id: accountId.postnord,       name: "PostNord AB",            domain: "postnord.com",      address: "Terminalvägen 24, 171 73 Solna",        vatId: "SE556771809401", industry: "Postal & Logistics", ownerUserId: userId.maria, createdAt: daysAgo(30), updatedAt: daysAgo(6) },
  ]);
  console.log("  ✓ Accounts");

  // =========================================================================
  // 5. CONTACTS (2-3 per account)
  // =========================================================================
  await db.insert(contacts).values([
    // Securitas Finland (3)
    { id: contactId.c1,  accountId: accountId.securitas,     name: "Mikko Hämäläinen",   email: "mikko.hamalainen@securitas.fi",    phone: "+358 40 123 4567", roleType: "tech_decision_maker",    createdAt: daysAgo(70) },
    { id: contactId.c2,  accountId: accountId.securitas,     name: "Sari Laine",          email: "sari.laine@securitas.fi",          phone: "+358 50 234 5678", roleType: "financial_decision_maker", createdAt: daysAgo(70) },
    { id: contactId.c3,  accountId: accountId.securitas,     name: "Pekka Koistinen",     email: "pekka.koistinen@securitas.fi",     phone: "+358 40 345 6789", roleType: "influencer",             createdAt: daysAgo(65) },
    // Deutsche Bahn (3)
    { id: contactId.c4,  accountId: accountId.deutscheBahn,  name: "Klaus Weber",         email: "klaus.weber@deutschebahn.com",     phone: "+49 30 297 0001",  roleType: "budget_holder",          createdAt: daysAgo(58) },
    { id: contactId.c5,  accountId: accountId.deutscheBahn,  name: "Petra Schneider",     email: "petra.schneider@deutschebahn.com", phone: "+49 30 297 0002",  roleType: "tech_decision_maker",    createdAt: daysAgo(58) },
    { id: contactId.c6,  accountId: accountId.deutscheBahn,  name: "Hans Müller",         email: "hans.muller@deutschebahn.com",     phone: "+49 30 297 0003",  roleType: "influencer",             createdAt: daysAgo(55) },
    // NHS Digital (2)
    { id: contactId.c7,  accountId: accountId.nhs,           name: "James Patel",         email: "james.patel@digital.nhs.uk",       phone: "+44 113 2345 001", roleType: "tech_decision_maker",    createdAt: daysAgo(52) },
    { id: contactId.c8,  accountId: accountId.nhs,           name: "Sarah Thompson",      email: "sarah.thompson@digital.nhs.uk",    phone: "+44 113 2345 002", roleType: "financial_decision_maker", createdAt: daysAgo(52) },
    // Stena Line (3)
    { id: contactId.c9,  accountId: accountId.stenaLine,     name: "Erik Johansson",      email: "erik.johansson@stenaline.com",     phone: "+46 31 704 0001",  roleType: "budget_holder",          createdAt: daysAgo(48) },
    { id: contactId.c10, accountId: accountId.stenaLine,     name: "Anna Lindberg",       email: "anna.lindberg@stenaline.com",      phone: "+46 31 704 0002",  roleType: "tech_decision_maker",    createdAt: daysAgo(48) },
    { id: contactId.c11, accountId: accountId.stenaLine,     name: "Lars Bergström",      email: "lars.bergstrom@stenaline.com",     phone: "+46 31 704 0003",  roleType: "influencer",             createdAt: daysAgo(45) },
    // Danish Defence (2)
    { id: contactId.c12, accountId: accountId.danishDefence,  name: "Christian Nielsen",   email: "cnielsen@forsvaret.dk",            phone: "+45 72 81 0001",   roleType: "tech_decision_maker",    createdAt: daysAgo(42) },
    { id: contactId.c13, accountId: accountId.danishDefence,  name: "Mette Hansen",        email: "mhansen@forsvaret.dk",             phone: "+45 72 81 0002",   roleType: "financial_decision_maker", createdAt: daysAgo(42) },
    // Kone (3)
    { id: contactId.c14, accountId: accountId.kone,          name: "Juha Salminen",       email: "juha.salminen@kone.com",           phone: "+358 204 75 001",  roleType: "budget_holder",          createdAt: daysAgo(38) },
    { id: contactId.c15, accountId: accountId.kone,          name: "Elina Mäkinen",       email: "elina.makinen@kone.com",           phone: "+358 204 75 002",  roleType: "tech_decision_maker",    createdAt: daysAgo(38) },
    { id: contactId.c16, accountId: accountId.kone,          name: "Risto Lahtinen",      email: "risto.lahtinen@kone.com",          phone: "+358 204 75 003",  roleType: "influencer",             createdAt: daysAgo(35) },
    // Veolia (2)
    { id: contactId.c17, accountId: accountId.veolia,        name: "Ville Aaltonen",      email: "ville.aaltonen@veolia.fi",         phone: "+358 10 765 001",  roleType: "tech_decision_maker",    createdAt: daysAgo(33) },
    { id: contactId.c18, accountId: accountId.veolia,        name: "Tiina Heikkinen",     email: "tiina.heikkinen@veolia.fi",        phone: "+358 10 765 002",  roleType: "financial_decision_maker", createdAt: daysAgo(33) },
    // PostNord (3)
    { id: contactId.c19, accountId: accountId.postnord,      name: "Anders Svensson",     email: "anders.svensson@postnord.com",     phone: "+46 8 23 22 001",  roleType: "budget_holder",          createdAt: daysAgo(28) },
    { id: contactId.c20, accountId: accountId.postnord,      name: "Karin Nilsson",       email: "karin.nilsson@postnord.com",       phone: "+46 8 23 22 002",  roleType: "tech_decision_maker",    createdAt: daysAgo(28) },
    { id: contactId.c21, accountId: accountId.postnord,      name: "Oscar Eriksson",      email: "oscar.eriksson@postnord.com",      phone: "+46 8 23 22 003",  roleType: "influencer",             createdAt: daysAgo(25) },
  ]);
  console.log("  ✓ Contacts");

  // =========================================================================
  // 6. DEALS (12)
  // =========================================================================
  await db.insert(deals).values([
    // d1 — WON (direct) — Securitas pilot
    {
      id: dealId.d1, accountId: accountId.securitas, parentDealId: null,
      ownerUserId: userId.janne, title: "Securitas Helsinki Guard Devices – Pilot",
      stage: "won", channel: "direct", isPilot: true,
      expectedClose: daysAgoStr(10), staleFlaggedAt: null,
      createdAt: daysAgo(65), updatedAt: daysAgo(10),
    },
    // d2 — WON (reseller) — Stena Line
    {
      id: dealId.d2, accountId: accountId.stenaLine, parentDealId: null,
      ownerUserId: userId.maria, title: "Stena Line Onboard Crew Devices",
      stage: "won", channel: "reseller", isPilot: false,
      expectedClose: daysAgoStr(20), staleFlaggedAt: null,
      createdAt: daysAgo(45), updatedAt: daysAgo(20),
    },
    // d3 — LOST — NHS Digital
    {
      id: dealId.d3, accountId: accountId.nhs, parentDealId: null,
      ownerUserId: userId.maria, title: "NHS Community Nurse Tablets",
      stage: "lost", channel: "direct", isPilot: false,
      expectedClose: daysAgoStr(5), staleFlaggedAt: null,
      createdAt: daysAgo(50), updatedAt: daysAgo(5),
    },
    // d4 — CONTRACT_NEGOTIATION (direct) — Deutsche Bahn
    {
      id: dealId.d4, accountId: accountId.deutscheBahn, parentDealId: null,
      ownerUserId: userId.janne, title: "DB Maintenance Crew Rugged Phones",
      stage: "contract_negotiation", channel: "direct", isPilot: false,
      expectedClose: daysFromNowStr(15), staleFlaggedAt: null,
      createdAt: daysAgo(40), updatedAt: daysAgo(2),
    },
    // d5 — CONTRACT_NEGOTIATION (direct) — Kone
    {
      id: dealId.d5, accountId: accountId.kone, parentDealId: null,
      ownerUserId: userId.maria, title: "Kone Elevator Technician XR-21 Rollout",
      stage: "contract_negotiation", channel: "direct", isPilot: false,
      expectedClose: daysFromNowStr(20), staleFlaggedAt: null,
      createdAt: daysAgo(35), updatedAt: daysAgo(3),
    },
    // d6 — CUSTOMER_TEST — Danish Defence (pilot, STALE)
    {
      id: dealId.d6, accountId: accountId.danishDefence, parentDealId: null,
      ownerUserId: userId.janne, title: "Danish Defence Field Communication Pilot",
      stage: "customer_test", channel: "direct", isPilot: true,
      expectedClose: daysFromNowStr(30), staleFlaggedAt: daysAgo(3),
      createdAt: daysAgo(42), updatedAt: daysAgo(22),
    },
    // d7 — CUSTOMER_TEST — PostNord
    {
      id: dealId.d7, accountId: accountId.postnord, parentDealId: null,
      ownerUserId: userId.maria, title: "PostNord Delivery Driver Devices",
      stage: "customer_test", channel: "direct", isPilot: false,
      expectedClose: daysFromNowStr(25), staleFlaggedAt: null,
      createdAt: daysAgo(28), updatedAt: daysAgo(4),
    },
    // d8 — RFP_GIVEN — Veolia (STALE)
    {
      id: dealId.d8, accountId: accountId.veolia, parentDealId: null,
      ownerUserId: userId.janne, title: "Veolia Nordic Field Worker IoT Kit",
      stage: "rfp_given", channel: "direct", isPilot: false,
      expectedClose: daysFromNowStr(45), staleFlaggedAt: daysAgo(5),
      createdAt: daysAgo(30), updatedAt: daysAgo(25),
    },
    // d9 — RFP_GIVEN — NHS Digital (new attempt)
    {
      id: dealId.d9, accountId: accountId.nhs, parentDealId: null,
      ownerUserId: userId.maria, title: "NHS Mental Health Team Smartphones",
      stage: "rfp_given", channel: "reseller", isPilot: false,
      expectedClose: daysFromNowStr(35), staleFlaggedAt: null,
      createdAt: daysAgo(20), updatedAt: daysAgo(7),
    },
    // d10 — RFI_ANSWERED — Securitas follow-on (linked to pilot d1)
    {
      id: dealId.d10, accountId: accountId.securitas, parentDealId: dealId.d1,
      ownerUserId: userId.janne, title: "Securitas National Rollout – 3-Year",
      stage: "rfi_answered", channel: "direct", isPilot: false,
      expectedClose: daysFromNowStr(60), staleFlaggedAt: null,
      createdAt: daysAgo(8), updatedAt: daysAgo(1),
    },
    // d11 — RFI_ANSWERED — Stena Line (reseller)
    {
      id: dealId.d11, accountId: accountId.stenaLine, parentDealId: null,
      ownerUserId: userId.maria, title: "Stena Line Body Cameras for Security",
      stage: "rfi_answered", channel: "reseller", isPilot: false,
      expectedClose: daysFromNowStr(50), staleFlaggedAt: null,
      createdAt: daysAgo(15), updatedAt: daysAgo(6),
    },
    // d12 — INTEREST_SHOWN — Deutsche Bahn follow-on (linked to d4 pilot-ish)
    {
      id: dealId.d12, accountId: accountId.deutscheBahn, parentDealId: dealId.d4,
      ownerUserId: userId.janne, title: "DB IoT Platform for Rail Yards",
      stage: "interest_shown", channel: "direct", isPilot: false,
      expectedClose: daysFromNowStr(90), staleFlaggedAt: null,
      createdAt: daysAgo(5), updatedAt: daysAgo(5),
    },
  ]);
  console.log("  ✓ Deals");

  // =========================================================================
  // 7. DEVICE FORECASTS — 3 periods per active deal (9 active deals)
  // =========================================================================
  const forecastRows = [
    // d1 (won pilot) — historical
    { id: forecastId.f1,  dealId: dealId.d1,  periodLabel: "2026-Q1", periodStart: quarterStart(2026, 1), periodEnd: quarterEnd(2026, 1), units: 150,  unitPrice: "449.00", createdAt: daysAgo(60) },
    { id: forecastId.f2,  dealId: dealId.d1,  periodLabel: "2026-Q2", periodStart: quarterStart(2026, 2), periodEnd: quarterEnd(2026, 2), units: 100,  unitPrice: "449.00", createdAt: daysAgo(60) },
    { id: forecastId.f3,  dealId: dealId.d1,  periodLabel: "2026-Q3", periodStart: quarterStart(2026, 3), periodEnd: quarterEnd(2026, 3), units: 50,   unitPrice: "449.00", createdAt: daysAgo(60) },
    // d2 (won reseller)
    { id: forecastId.f4,  dealId: dealId.d2,  periodLabel: "2026-Q1", periodStart: quarterStart(2026, 1), periodEnd: quarterEnd(2026, 1), units: 200,  unitPrice: "529.00", createdAt: daysAgo(40) },
    { id: forecastId.f5,  dealId: dealId.d2,  periodLabel: "2026-Q2", periodStart: quarterStart(2026, 2), periodEnd: quarterEnd(2026, 2), units: 300,  unitPrice: "529.00", createdAt: daysAgo(40) },
    { id: forecastId.f6,  dealId: dealId.d2,  periodLabel: "2026-Q3", periodStart: quarterStart(2026, 3), periodEnd: quarterEnd(2026, 3), units: 250,  unitPrice: "529.00", createdAt: daysAgo(40) },
    // d4 (contract negotiation — DB)
    { id: forecastId.f7,  dealId: dealId.d4,  periodLabel: "2026-Q3", periodStart: quarterStart(2026, 3), periodEnd: quarterEnd(2026, 3), units: 500,  unitPrice: "449.00", createdAt: daysAgo(35) },
    { id: forecastId.f8,  dealId: dealId.d4,  periodLabel: "2026-Q4", periodStart: quarterStart(2026, 4), periodEnd: quarterEnd(2026, 4), units: 1000, unitPrice: "449.00", createdAt: daysAgo(35) },
    { id: forecastId.f9,  dealId: dealId.d4,  periodLabel: "2027-Q1", periodStart: quarterStart(2027, 1), periodEnd: quarterEnd(2027, 1), units: 1500, unitPrice: "449.00", createdAt: daysAgo(35) },
    // d5 (contract negotiation — Kone)
    { id: forecastId.f10, dealId: dealId.d5,  periodLabel: "2026-Q3", periodStart: quarterStart(2026, 3), periodEnd: quarterEnd(2026, 3), units: 300,  unitPrice: "529.00", createdAt: daysAgo(30) },
    { id: forecastId.f11, dealId: dealId.d5,  periodLabel: "2026-Q4", periodStart: quarterStart(2026, 4), periodEnd: quarterEnd(2026, 4), units: 600,  unitPrice: "529.00", createdAt: daysAgo(30) },
    { id: forecastId.f12, dealId: dealId.d5,  periodLabel: "2027-Q1", periodStart: quarterStart(2027, 1), periodEnd: quarterEnd(2027, 1), units: 800,  unitPrice: "529.00", createdAt: daysAgo(30) },
    // d6 (customer test — Danish Defence, stale)
    { id: forecastId.f13, dealId: dealId.d6,  periodLabel: "2026-Q4", periodStart: quarterStart(2026, 4), periodEnd: quarterEnd(2026, 4), units: 200,  unitPrice: "449.00", createdAt: daysAgo(40) },
    { id: forecastId.f14, dealId: dealId.d6,  periodLabel: "2027-Q1", periodStart: quarterStart(2027, 1), periodEnd: quarterEnd(2027, 1), units: 800,  unitPrice: "449.00", createdAt: daysAgo(40) },
    { id: forecastId.f15, dealId: dealId.d6,  periodLabel: "2027-Q2", periodStart: quarterStart(2027, 2), periodEnd: quarterEnd(2027, 2), units: 1200, unitPrice: "449.00", createdAt: daysAgo(40) },
    // d7 (customer test — PostNord)
    { id: forecastId.f16, dealId: dealId.d7,  periodLabel: "2026-Q4", periodStart: quarterStart(2026, 4), periodEnd: quarterEnd(2026, 4), units: 400,  unitPrice: "329.00", createdAt: daysAgo(25) },
    { id: forecastId.f17, dealId: dealId.d7,  periodLabel: "2027-Q1", periodStart: quarterStart(2027, 1), periodEnd: quarterEnd(2027, 1), units: 1200, unitPrice: "329.00", createdAt: daysAgo(25) },
    { id: forecastId.f18, dealId: dealId.d7,  periodLabel: "2027-Q2", periodStart: quarterStart(2027, 2), periodEnd: quarterEnd(2027, 2), units: 2000, unitPrice: "329.00", createdAt: daysAgo(25) },
    // d8 (rfp_given — Veolia, stale)
    { id: forecastId.f19, dealId: dealId.d8,  periodLabel: "2027-Q1", periodStart: quarterStart(2027, 1), periodEnd: quarterEnd(2027, 1), units: 100,  unitPrice: "199.00", createdAt: daysAgo(28) },
    { id: forecastId.f20, dealId: dealId.d8,  periodLabel: "2027-Q2", periodStart: quarterStart(2027, 2), periodEnd: quarterEnd(2027, 2), units: 250,  unitPrice: "199.00", createdAt: daysAgo(28) },
    { id: forecastId.f21, dealId: dealId.d8,  periodLabel: "2027-Q3", periodStart: quarterStart(2027, 3), periodEnd: quarterEnd(2027, 3), units: 400,  unitPrice: "199.00", createdAt: daysAgo(28) },
    // d10 (rfi_answered — Securitas follow-on)
    { id: forecastId.f22, dealId: dealId.d10, periodLabel: "2026-Q4", periodStart: quarterStart(2026, 4), periodEnd: quarterEnd(2026, 4), units: 500,  unitPrice: "449.00", createdAt: daysAgo(7) },
    { id: forecastId.f23, dealId: dealId.d10, periodLabel: "2027-Q2", periodStart: quarterStart(2027, 2), periodEnd: quarterEnd(2027, 2), units: 2000, unitPrice: "449.00", createdAt: daysAgo(7) },
    { id: forecastId.f24, dealId: dealId.d10, periodLabel: "2028-Q1", periodStart: quarterStart(2028, 1), periodEnd: quarterEnd(2028, 1), units: 5000, unitPrice: "449.00", createdAt: daysAgo(7) },
    // d11 (rfi_answered — Stena body cams)
    { id: forecastId.f25, dealId: dealId.d11, periodLabel: "2027-Q1", periodStart: quarterStart(2027, 1), periodEnd: quarterEnd(2027, 1), units: 80,   unitPrice: "299.00", createdAt: daysAgo(12) },
    { id: forecastId.f26, dealId: dealId.d11, periodLabel: "2027-Q2", periodStart: quarterStart(2027, 2), periodEnd: quarterEnd(2027, 2), units: 150,  unitPrice: "299.00", createdAt: daysAgo(12) },
    { id: forecastId.f27, dealId: dealId.d11, periodLabel: "2027-Q3", periodStart: quarterStart(2027, 3), periodEnd: quarterEnd(2027, 3), units: 200,  unitPrice: "299.00", createdAt: daysAgo(12) },
    // d12 (interest shown — DB IoT)
    { id: forecastId.f28, dealId: dealId.d12, periodLabel: "2027-Q2", periodStart: quarterStart(2027, 2), periodEnd: quarterEnd(2027, 2), units: 50,   unitPrice: "199.00", createdAt: daysAgo(4) },
    { id: forecastId.f29, dealId: dealId.d12, periodLabel: "2027-Q3", periodStart: quarterStart(2027, 3), periodEnd: quarterEnd(2027, 3), units: 100,  unitPrice: "199.00", createdAt: daysAgo(4) },
    { id: forecastId.f30, dealId: dealId.d12, periodLabel: "2027-Q4", periodStart: quarterStart(2027, 4), periodEnd: quarterEnd(2027, 4), units: 200,  unitPrice: "199.00", createdAt: daysAgo(4) },
  ];
  await db.insert(deviceForecasts).values(forecastRows);
  console.log("  ✓ Device forecasts");

  // =========================================================================
  // 8. SERVICE CONTRACTS (8)
  // =========================================================================
  await db.insert(serviceContracts).values([
    // Monthly recurring — MDM (3)
    {
      id: contractId.sc1, dealId: dealId.d1, serviceId: serviceId.mdm,
      invoiceModel: "monthly_recurring", startDate: daysAgoStr(60), endDate: null,
      fixedValue: null, monthlyRate: "3.50",
      deviceCountTrajectory: JSON.stringify([
        { month: "2026-04", expected_devices: 150 },
        { month: "2026-05", expected_devices: 200 },
        { month: "2026-06", expected_devices: 250 },
      ]),
      createdAt: daysAgo(60),
    },
    {
      id: contractId.sc2, dealId: dealId.d2, serviceId: serviceId.mdm,
      invoiceModel: "monthly_recurring", startDate: daysAgoStr(20), endDate: null,
      fixedValue: null, monthlyRate: "3.50",
      deviceCountTrajectory: JSON.stringify([
        { month: "2026-06", expected_devices: 200 },
        { month: "2026-07", expected_devices: 350 },
        { month: "2026-08", expected_devices: 500 },
      ]),
      createdAt: daysAgo(20),
    },
    // Monthly recurring — Shield
    {
      id: contractId.sc3, dealId: dealId.d4, serviceId: serviceId.shield,
      invoiceModel: "monthly_recurring", startDate: daysFromNowStr(15), endDate: null,
      fixedValue: null, monthlyRate: "5.00",
      deviceCountTrajectory: JSON.stringify([
        { month: "2026-08", expected_devices: 500 },
        { month: "2026-09", expected_devices: 800 },
        { month: "2026-10", expected_devices: 1000 },
      ]),
      createdAt: daysAgo(10),
    },
    // Fixed-term — CloudGuard (3)
    {
      id: contractId.sc4, dealId: dealId.d1, serviceId: serviceId.cloudguard,
      invoiceModel: "fixed_term", startDate: daysAgoStr(60), endDate: daysFromNowStr(305),
      fixedValue: "24000.00", monthlyRate: null, deviceCountTrajectory: null,
      createdAt: daysAgo(60),
    },
    {
      id: contractId.sc5, dealId: dealId.d5, serviceId: serviceId.cloudguard,
      invoiceModel: "fixed_term", startDate: daysFromNowStr(20), endDate: daysFromNowStr(385),
      fixedValue: "36000.00", monthlyRate: null, deviceCountTrajectory: null,
      createdAt: daysAgo(15),
    },
    // Fixed-term — Field Support
    {
      id: contractId.sc6, dealId: dealId.d7, serviceId: serviceId.fieldSupport,
      invoiceModel: "fixed_term", startDate: daysFromNowStr(25), endDate: daysFromNowStr(390),
      fixedValue: "18000.00", monthlyRate: null, deviceCountTrajectory: null,
      createdAt: daysAgo(10),
    },
    // One-off — TelcoNet Connectivity setup (2)
    {
      id: contractId.sc7, dealId: dealId.d1, serviceId: serviceId.telconet,
      invoiceModel: "one_off", startDate: daysAgoStr(58), endDate: null,
      fixedValue: "4500.00", monthlyRate: null, deviceCountTrajectory: null,
      createdAt: daysAgo(58),
    },
    {
      id: contractId.sc8, dealId: dealId.d2, serviceId: serviceId.telconet,
      invoiceModel: "one_off", startDate: daysAgoStr(18), endDate: null,
      fixedValue: "3200.00", monthlyRate: null, deviceCountTrajectory: null,
      createdAt: daysAgo(18),
    },
  ]);
  console.log("  ✓ Service contracts");

  // =========================================================================
  // 9. CASES (10)
  // =========================================================================
  await db.insert(cases).values([
    // 3 open
    {
      id: caseId.cs1, accountId: accountId.securitas, serviceId: serviceId.mdm,
      ownerUserId: userId.tomas, contactId: contactId.c1,
      title: "Device connectivity issue",
      status: "open", priority: "medium", escalated: false, thirdPartyRef: null,
      slaDeadline: daysFromNow(2), createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      id: caseId.cs2, accountId: accountId.deutscheBahn, serviceId: serviceId.shield,
      ownerUserId: userId.sofia, contactId: contactId.c5,
      title: "Shield blocking internal app",
      status: "open", priority: "high", escalated: false, thirdPartyRef: null,
      slaDeadline: daysFromNow(1), createdAt: daysAgo(2), updatedAt: daysAgo(2),
    },
    {
      id: caseId.cs3, accountId: accountId.postnord, serviceId: serviceId.mdm,
      ownerUserId: userId.tomas, contactId: contactId.c20,
      title: "MDM policy not syncing",
      status: "open", priority: "low", escalated: false, thirdPartyRef: null,
      slaDeadline: daysFromNow(5), createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    // 2 in_progress
    {
      id: caseId.cs4, accountId: accountId.kone, serviceId: serviceId.cloudguard,
      ownerUserId: userId.sofia, contactId: contactId.c15,
      title: "Screen replacement request",
      status: "in_progress", priority: "high", escalated: false, thirdPartyRef: null,
      slaDeadline: daysFromNow(3), createdAt: daysAgo(5), updatedAt: daysAgo(1),
    },
    {
      id: caseId.cs5, accountId: accountId.stenaLine, serviceId: serviceId.fieldSupport,
      ownerUserId: userId.tomas, contactId: contactId.c10,
      title: "CloudGuard integration failed",
      status: "in_progress", priority: "medium", escalated: false, thirdPartyRef: null,
      slaDeadline: daysFromNow(4), createdAt: daysAgo(4), updatedAt: daysAgo(2),
    },
    // 2 escalated (one with third_party_ref)
    {
      id: caseId.cs6, accountId: accountId.securitas, serviceId: serviceId.cloudguard,
      ownerUserId: userId.tomas, contactId: contactId.c2,
      title: "Battery draining quickly",
      status: "escalated", priority: "critical", escalated: true, thirdPartyRef: "CG-2026-04891",
      slaDeadline: daysFromNow(1), createdAt: daysAgo(7), updatedAt: daysAgo(1),
    },
    {
      id: caseId.cs7, accountId: accountId.danishDefence, serviceId: serviceId.shield,
      ownerUserId: userId.sofia, contactId: contactId.c12,
      title: "Location tracking inaccurate",
      status: "escalated", priority: "high", escalated: true, thirdPartyRef: null,
      slaDeadline: daysFromNow(2), createdAt: daysAgo(6), updatedAt: daysAgo(1),
    },
    // 2 resolved
    {
      id: caseId.cs8, accountId: accountId.nhs, serviceId: serviceId.mdm,
      ownerUserId: userId.sofia, contactId: contactId.c7,
      title: "Password reset needed",
      status: "resolved", priority: "medium", escalated: false, thirdPartyRef: null,
      slaDeadline: null, createdAt: daysAgo(15), updatedAt: daysAgo(3),
    },
    {
      id: caseId.cs9, accountId: accountId.veolia, serviceId: serviceId.telconet,
      ownerUserId: userId.tomas, contactId: contactId.c17,
      title: "New user onboarding",
      status: "resolved", priority: "low", escalated: false, thirdPartyRef: null,
      slaDeadline: null, createdAt: daysAgo(20), updatedAt: daysAgo(8),
    },
    // 1 closed
    {
      id: caseId.cs10, accountId: accountId.stenaLine, serviceId: serviceId.mdm,
      ownerUserId: userId.tomas, contactId: contactId.c9,
      title: "Device retirement process",
      status: "closed", priority: "low", escalated: false, thirdPartyRef: null,
      slaDeadline: null, createdAt: daysAgo(30), updatedAt: daysAgo(14),
    },
  ]);
  console.log("  ✓ Cases");

  // =========================================================================
  // 10. OFFERS (6) + OFFER LINES
  // =========================================================================
  await db.insert(offers).values([
    // o1 — draft
    {
      id: offerId.o1, dealId: dealId.d7, createdBy: userId.maria,
      version: 1, status: "draft", discountPct: "0", justification: null,
      lockedAt: null, createdAt: daysAgo(3),
    },
    // o2 — pending_manager (has discount)
    {
      id: offerId.o2, dealId: dealId.d4, createdBy: userId.janne,
      version: 1, status: "pending_manager", discountPct: "12.5",
      justification: "Strategic account — DB is testing our platform against Samsung Knox. 12.5% discount matches their budget ceiling and secures a 3-year commitment of 3000+ devices.",
      lockedAt: null, createdAt: daysAgo(5),
    },
    // o3 — pending_finance
    {
      id: offerId.o3, dealId: dealId.d5, createdBy: userId.maria,
      version: 1, status: "pending_finance", discountPct: "8",
      justification: "Kone volume deal — 1700 units across 3 quarters. 8% volume discount aligns with our enterprise tier pricing.",
      lockedAt: null, createdAt: daysAgo(7),
    },
    // o4 — approved (locked)
    {
      id: offerId.o4, dealId: dealId.d1, createdBy: userId.janne,
      version: 2, status: "approved", discountPct: "5",
      justification: "Pilot pricing for Securitas Finland — competitive replacement for aging fleet.",
      lockedAt: daysAgo(12), createdAt: daysAgo(20),
    },
    // o5 — rejected
    {
      id: offerId.o5, dealId: dealId.d3, createdBy: userId.maria,
      version: 1, status: "rejected", discountPct: "25",
      justification: "NHS public sector pricing — matching competitor's 25% discount.",
      lockedAt: null, createdAt: daysAgo(30),
    },
    // o6 — locked (older, for won deal d2)
    {
      id: offerId.o6, dealId: dealId.d2, createdBy: userId.maria,
      version: 1, status: "locked", discountPct: "0",
      justification: null,
      lockedAt: daysAgo(22), createdAt: daysAgo(35),
    },
  ]);
  console.log("  ✓ Offers");

  // Offer Lines
  await db.insert(offerLines).values([
    // o1 — draft (PostNord)
    { id: offerLineId.ol1,  offerId: offerId.o1, productId: productId.xr10lite, serviceId: null,          unitPrice: "329.00", quantity: 400,  discountPct: "0" },
    { id: offerLineId.ol2,  offerId: offerId.o1, productId: null,               serviceId: serviceId.mdm, unitPrice: "3.50",   quantity: 400,  discountPct: "0" },
    // o2 — pending_manager (DB)
    { id: offerLineId.ol3,  offerId: offerId.o2, productId: productId.xr20,     serviceId: null,              unitPrice: "449.00", quantity: 500,  discountPct: "12.5" },
    { id: offerLineId.ol4,  offerId: offerId.o2, productId: null,               serviceId: serviceId.shield,  unitPrice: "5.00",   quantity: 500,  discountPct: "0" },
    { id: offerLineId.ol5,  offerId: offerId.o2, productId: null,               serviceId: serviceId.mdm,     unitPrice: "3.50",   quantity: 500,  discountPct: "0" },
    // o3 — pending_finance (Kone)
    { id: offerLineId.ol6,  offerId: offerId.o3, productId: productId.xr21,     serviceId: null,                  unitPrice: "529.00", quantity: 300,  discountPct: "8" },
    { id: offerLineId.ol7,  offerId: offerId.o3, productId: null,               serviceId: serviceId.cloudguard,  unitPrice: "36000.00", quantity: 1, discountPct: "0" },
    { id: offerLineId.ol8,  offerId: offerId.o3, productId: null,               serviceId: serviceId.shield,      unitPrice: "5.00",   quantity: 300,  discountPct: "0" },
    { id: offerLineId.ol9,  offerId: offerId.o3, productId: null,               serviceId: serviceId.mdm,         unitPrice: "3.50",   quantity: 300,  discountPct: "0" },
    // o4 — approved (Securitas pilot)
    { id: offerLineId.ol10, offerId: offerId.o4, productId: productId.xr20,     serviceId: null,              unitPrice: "449.00", quantity: 150,  discountPct: "5" },
    { id: offerLineId.ol11, offerId: offerId.o4, productId: null,               serviceId: serviceId.mdm,     unitPrice: "3.50",   quantity: 150,  discountPct: "0" },
    { id: offerLineId.ol12, offerId: offerId.o4, productId: null,               serviceId: serviceId.telconet, unitPrice: "4500.00", quantity: 1, discountPct: "0" },
    // o5 — rejected (NHS)
    { id: offerLineId.ol13, offerId: offerId.o5, productId: productId.tb500,    serviceId: null,              unitPrice: "899.00", quantity: 200,  discountPct: "25" },
    { id: offerLineId.ol14, offerId: offerId.o5, productId: null,               serviceId: serviceId.mdm,     unitPrice: "3.50",   quantity: 200,  discountPct: "25" },
    // o6 — locked (Stena Line)
    { id: offerLineId.ol15, offerId: offerId.o6, productId: productId.xr21,     serviceId: null,              unitPrice: "529.00", quantity: 200,  discountPct: "0" },
    { id: offerLineId.ol16, offerId: offerId.o6, productId: null,               serviceId: serviceId.mdm,     unitPrice: "3.50",   quantity: 200,  discountPct: "0" },
  ]);
  console.log("  ✓ Offer lines");

  // =========================================================================
  // 11. APPROVAL STEPS
  // =========================================================================
  await db.insert(approvalSteps).values([
    // o2 — pending_manager: step 1 pending, step 2 not yet
    { id: approvalId.a1, offerId: offerId.o2, stepOrder: 1, roleRequired: "sales_manager", decidedBy: null,         decision: null,       note: null, decidedAt: null },
    { id: approvalId.a2, offerId: offerId.o2, stepOrder: 2, roleRequired: "finance",       decidedBy: null,         decision: null,       note: null, decidedAt: null },
    // o3 — pending_finance: step 1 approved, step 2 pending
    { id: approvalId.a3, offerId: offerId.o3, stepOrder: 1, roleRequired: "sales_manager", decidedBy: userId.anssi, decision: "approved", note: "Volume pricing looks reasonable for Kone.", decidedAt: daysAgo(5) },
    { id: approvalId.a4, offerId: offerId.o3, stepOrder: 2, roleRequired: "finance",       decidedBy: null,         decision: null,       note: null, decidedAt: null },
    // o4 — approved: both steps approved
    { id: approvalId.a5, offerId: offerId.o4, stepOrder: 1, roleRequired: "sales_manager", decidedBy: userId.anssi, decision: "approved", note: "Pilot pricing approved for strategic account.", decidedAt: daysAgo(15) },
    { id: approvalId.a6, offerId: offerId.o4, stepOrder: 2, roleRequired: "finance",       decidedBy: userId.laura, decision: "approved", note: "Margins acceptable at 5% discount.", decidedAt: daysAgo(12) },
    // o5 — rejected: step 1 rejected
    { id: approvalId.a7, offerId: offerId.o5, stepOrder: 1, roleRequired: "sales_manager", decidedBy: userId.anssi, decision: "rejected", note: "25% discount exceeds maximum threshold. Resubmit at 15% or below with stronger volume commitment.", decidedAt: daysAgo(28) },
    // o6 — locked: both steps approved
    { id: approvalId.a8, offerId: offerId.o6, stepOrder: 1, roleRequired: "sales_manager", decidedBy: userId.anssi, decision: "approved", note: "Standard pricing, no discount.", decidedAt: daysAgo(30) },
    { id: approvalId.a9, offerId: offerId.o6, stepOrder: 2, roleRequired: "finance",       decidedBy: userId.laura, decision: "approved", note: null, decidedAt: daysAgo(22) },
  ]);
  console.log("  ✓ Approval steps");

  // =========================================================================
  // 12. AGENT RUNS (4)
  // =========================================================================
  await db.insert(agentRuns).values([
    {
      id: agentRunId.ar1, accountId: accountId.securitas,
      triggerType: "account_created", openclawTaskId: "oc-task-001",
      status: "completed", errorMessage: null,
      startedAt: daysAgo(74), finishedAt: daysAgo(74),
    },
    {
      id: agentRunId.ar2, accountId: accountId.deutscheBahn,
      triggerType: "stage_changed", openclawTaskId: "oc-task-002",
      status: "completed", errorMessage: null,
      startedAt: daysAgo(3), finishedAt: daysAgo(3),
    },
    {
      id: agentRunId.ar3, accountId: accountId.danishDefence,
      triggerType: "stale_flagged", openclawTaskId: "oc-task-003",
      status: "completed", errorMessage: null,
      startedAt: daysAgo(3), finishedAt: daysAgo(3),
    },
    {
      id: agentRunId.ar4, accountId: accountId.securitas,
      triggerType: "scheduled", openclawTaskId: "oc-task-004",
      status: "completed", errorMessage: null,
      startedAt: daysAgo(1), finishedAt: daysAgo(1),
    },
  ]);
  console.log("  ✓ Agent runs");

  // =========================================================================
  // 13. AI INSIGHTS (4)
  // =========================================================================
  await db.insert(aiInsights).values([
    // in1 — enrichment for Securitas
    {
      id: insightId.in1, agentRunId: agentRunId.ar1, accountId: accountId.securitas,
      dealId: null, caseId: null,
      insightType: "enrichment",
      body: "Securitas Finland is a subsidiary of Securitas AB (Stockholm: SECU-B), a global security services leader with 345,000+ employees across 44 markets. The Finnish subsidiary operates across corporate security, event security, and critical infrastructure verticals. They are currently mid-cycle in a digital transformation initiative, replacing legacy radio and paper-based guard tour systems with smart devices. Key competitor intel: G4S Finland already runs Samsung Knox for 800 guards in the Helsinki metro area. Securitas Finland's FY2025 revenue was EUR 420M with a stated objective to deploy connected devices to 60% of field staff by 2027.",
      confidence: "0.87",
      sources: JSON.stringify([
        { url: "https://www.securitas.com/en/annual-report-2025/", title: "Securitas AB Annual Report 2025", snippet: "Digital transformation of guarding services..." },
        { url: "https://www.kauppalehti.fi/yritykset/securitas-oy", title: "Securitas Oy — Kauppalehti", snippet: "Revenue EUR 420M, employees 4,200..." },
      ]),
      status: "accepted", reviewedBy: userId.janne, reviewedAt: daysAgo(70),
      createdAt: daysAgo(74),
    },
    // in2 — next_action for Deutsche Bahn
    {
      id: insightId.in2, agentRunId: agentRunId.ar2, accountId: accountId.deutscheBahn,
      dealId: dealId.d4, caseId: null,
      insightType: "next_action",
      body: "Deutsche Bahn's maintenance division has a procurement window closing July 15, 2026. Recommend scheduling a technical demo with Petra Schneider (tech decision maker) before June 30 to align with their internal approval cycle. Key talking point: their current Motorola Solutions contract expires Q3 2026, creating a natural switching opportunity. Suggest bundling HMD Secure Shield with the device order to differentiate from pure-hardware competitors.",
      confidence: "0.79",
      sources: JSON.stringify([
        { url: "https://www.deutschebahn.com/en/procurement-portal", title: "DB Procurement Portal", snippet: "Open tenders for mobile field solutions..." },
        { url: "https://www.handelsblatt.com/unternehmen/industrie/deutsche-bahn-digitalisierung", title: "Handelsblatt — DB Digitalization", snippet: "EUR 12B investment in digital infrastructure..." },
      ]),
      status: "pending_review", reviewedBy: null, reviewedAt: null,
      createdAt: daysAgo(3),
    },
    // in3 — risk_flag for stale Danish Defence deal
    {
      id: insightId.in3, agentRunId: agentRunId.ar3, accountId: accountId.danishDefence,
      dealId: dealId.d6, caseId: null,
      insightType: "risk_flag",
      body: "The Danish Defence Field Communication Pilot deal has not been updated in 22 days. Risk factors: (1) Defence procurement cycles typically require security certification that HMD Secure has not yet completed for Danish CFCS standards. (2) Recent news indicates Danish Defence is evaluating a competing offer from Bittium for secure tactical communications. (3) The pilot test period may have ended without documented results. Recommend immediate outreach to Christian Nielsen to assess pilot satisfaction and next steps.",
      confidence: "0.72",
      sources: JSON.stringify([
        { url: "https://www.forsvaret.dk/en/procurement/", title: "Danish Defence Procurement", snippet: "Active evaluation of field communication systems..." },
        { url: "https://www.bittium.com/defence", title: "Bittium Defence Solutions", snippet: "Bittium Tough Mobile 3 for military communications..." },
      ]),
      status: "pending_review", reviewedBy: null, reviewedAt: null,
      createdAt: daysAgo(3),
    },
    // in4 — pipeline_summary
    {
      id: insightId.in4, agentRunId: agentRunId.ar4, accountId: accountId.securitas,
      dealId: null, caseId: null,
      insightType: "pipeline_summary",
      body: "Weekly pipeline summary for Securitas Finland: The national rollout deal (Securitas National Rollout — 3-Year) is progressing at RFI stage with a potential 7,500 device deployment worth EUR 3.37M in hardware alone. Combined with existing service contracts (MDM, CloudGuard), the total 3-year account value could reach EUR 4.2M. The pilot has been delivered successfully with 150 units deployed. One open escalated case (CG-2026-04891) with CloudGuard needs resolution before the rollout decision — the customer has flagged this as a blocker.",
      confidence: "0.91",
      sources: JSON.stringify([
        { url: "crm://internal/account/" + accountId.securitas, title: "CRM — Securitas Finland Account", snippet: "Internal CRM data aggregation" },
      ]),
      status: "pending_review", reviewedBy: null, reviewedAt: null,
      createdAt: daysAgo(1),
    },
  ]);
  console.log("  ✓ AI insights");

  // =========================================================================
  // 14. ACTIVITIES (~60)
  // =========================================================================
  const activityRows = [
    // --- Account Created events (8) ---
    { id: activityId.act1,  accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "account", entityId: accountId.securitas,     eventType: "account_created", payload: JSON.stringify({ name: "Securitas Finland Oy" }), isAiGenerated: false, createdAt: daysAgo(75) },
    { id: activityId.act2,  accountId: accountId.deutscheBahn,  actorUserId: userId.janne, entityType: "account", entityId: accountId.deutscheBahn,  eventType: "account_created", payload: JSON.stringify({ name: "Deutsche Bahn AG" }), isAiGenerated: false, createdAt: daysAgo(60) },
    { id: activityId.act3,  accountId: accountId.nhs,           actorUserId: userId.maria, entityType: "account", entityId: accountId.nhs,           eventType: "account_created", payload: JSON.stringify({ name: "NHS Digital" }), isAiGenerated: false, createdAt: daysAgo(55) },
    { id: activityId.act4,  accountId: accountId.stenaLine,     actorUserId: userId.maria, entityType: "account", entityId: accountId.stenaLine,     eventType: "account_created", payload: JSON.stringify({ name: "Stena Line AB" }), isAiGenerated: false, createdAt: daysAgo(50) },
    { id: activityId.act5,  accountId: accountId.danishDefence, actorUserId: userId.janne, entityType: "account", entityId: accountId.danishDefence, eventType: "account_created", payload: JSON.stringify({ name: "Danish Defence" }), isAiGenerated: false, createdAt: daysAgo(45) },
    { id: activityId.act6,  accountId: accountId.kone,          actorUserId: userId.maria, entityType: "account", entityId: accountId.kone,          eventType: "account_created", payload: JSON.stringify({ name: "Kone Oyj" }), isAiGenerated: false, createdAt: daysAgo(40) },
    { id: activityId.act7,  accountId: accountId.veolia,        actorUserId: userId.janne, entityType: "account", entityId: accountId.veolia,        eventType: "account_created", payload: JSON.stringify({ name: "Veolia Nordic" }), isAiGenerated: false, createdAt: daysAgo(35) },
    { id: activityId.act8,  accountId: accountId.postnord,      actorUserId: userId.maria, entityType: "account", entityId: accountId.postnord,      eventType: "account_created", payload: JSON.stringify({ name: "PostNord AB" }), isAiGenerated: false, createdAt: daysAgo(30) },

    // --- Deal stage changes (12) ---
    { id: activityId.act9,  accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "deal", entityId: dealId.d1,  eventType: "stage_changed", payload: JSON.stringify({ old: "interest_shown", new: "rfi_answered" }), isAiGenerated: false, createdAt: daysAgo(60) },
    { id: activityId.act10, accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "deal", entityId: dealId.d1,  eventType: "stage_changed", payload: JSON.stringify({ old: "rfi_answered", new: "rfp_given" }), isAiGenerated: false, createdAt: daysAgo(50) },
    { id: activityId.act11, accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "deal", entityId: dealId.d1,  eventType: "stage_changed", payload: JSON.stringify({ old: "rfp_given", new: "customer_test" }), isAiGenerated: false, createdAt: daysAgo(35) },
    { id: activityId.act12, accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "deal", entityId: dealId.d1,  eventType: "stage_changed", payload: JSON.stringify({ old: "customer_test", new: "contract_negotiation" }), isAiGenerated: false, createdAt: daysAgo(20) },
    { id: activityId.act13, accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "deal", entityId: dealId.d1,  eventType: "stage_changed", payload: JSON.stringify({ old: "contract_negotiation", new: "won" }), isAiGenerated: false, createdAt: daysAgo(10) },
    { id: activityId.act14, accountId: accountId.deutscheBahn,  actorUserId: userId.janne, entityType: "deal", entityId: dealId.d4,  eventType: "stage_changed", payload: JSON.stringify({ old: "customer_test", new: "contract_negotiation" }), isAiGenerated: false, createdAt: daysAgo(8) },
    { id: activityId.act15, accountId: accountId.kone,          actorUserId: userId.maria, entityType: "deal", entityId: dealId.d5,  eventType: "stage_changed", payload: JSON.stringify({ old: "customer_test", new: "contract_negotiation" }), isAiGenerated: false, createdAt: daysAgo(10) },
    { id: activityId.act16, accountId: accountId.stenaLine,     actorUserId: userId.maria, entityType: "deal", entityId: dealId.d2,  eventType: "stage_changed", payload: JSON.stringify({ old: "customer_test", new: "won" }), isAiGenerated: false, createdAt: daysAgo(20) },
    { id: activityId.act17, accountId: accountId.nhs,           actorUserId: userId.maria, entityType: "deal", entityId: dealId.d3,  eventType: "stage_changed", payload: JSON.stringify({ old: "contract_negotiation", new: "lost" }), isAiGenerated: false, createdAt: daysAgo(5) },
    { id: activityId.act18, accountId: accountId.danishDefence, actorUserId: userId.janne, entityType: "deal", entityId: dealId.d6,  eventType: "stage_changed", payload: JSON.stringify({ old: "rfp_given", new: "customer_test" }), isAiGenerated: false, createdAt: daysAgo(30) },
    { id: activityId.act19, accountId: accountId.postnord,      actorUserId: userId.maria, entityType: "deal", entityId: dealId.d7,  eventType: "stage_changed", payload: JSON.stringify({ old: "rfp_given", new: "customer_test" }), isAiGenerated: false, createdAt: daysAgo(10) },
    { id: activityId.act20, accountId: accountId.veolia,        actorUserId: userId.janne, entityType: "deal", entityId: dealId.d8,  eventType: "stage_changed", payload: JSON.stringify({ old: "rfi_answered", new: "rfp_given" }), isAiGenerated: false, createdAt: daysAgo(25) },

    // --- Case opened events (6) ---
    { id: activityId.act21, accountId: accountId.securitas,     actorUserId: userId.tomas, entityType: "case", entityId: caseId.cs1,  eventType: "case_opened", payload: JSON.stringify({ priority: "medium", service: "HMD Secure MDM" }), isAiGenerated: false, createdAt: daysAgo(1) },
    { id: activityId.act22, accountId: accountId.deutscheBahn,  actorUserId: userId.sofia, entityType: "case", entityId: caseId.cs2,  eventType: "case_opened", payload: JSON.stringify({ priority: "high", service: "HMD Secure Shield" }), isAiGenerated: false, createdAt: daysAgo(2) },
    { id: activityId.act23, accountId: accountId.securitas,     actorUserId: userId.tomas, entityType: "case", entityId: caseId.cs6,  eventType: "case_opened", payload: JSON.stringify({ priority: "critical", service: "CloudGuard Protect" }), isAiGenerated: false, createdAt: daysAgo(7) },
    { id: activityId.act24, accountId: accountId.kone,          actorUserId: userId.sofia, entityType: "case", entityId: caseId.cs4,  eventType: "case_opened", payload: JSON.stringify({ priority: "high", service: "CloudGuard Protect" }), isAiGenerated: false, createdAt: daysAgo(5) },
    { id: activityId.act25, accountId: accountId.stenaLine,     actorUserId: userId.tomas, entityType: "case", entityId: caseId.cs5,  eventType: "case_opened", payload: JSON.stringify({ priority: "medium", service: "HMD Field Support" }), isAiGenerated: false, createdAt: daysAgo(4) },
    { id: activityId.act26, accountId: accountId.danishDefence, actorUserId: userId.sofia, entityType: "case", entityId: caseId.cs7,  eventType: "case_opened", payload: JSON.stringify({ priority: "high", service: "HMD Secure Shield" }), isAiGenerated: false, createdAt: daysAgo(6) },

    // --- Case status changes (4) ---
    { id: activityId.act27, accountId: accountId.securitas,     actorUserId: userId.tomas, entityType: "case", entityId: caseId.cs6,  eventType: "case_status_changed", payload: JSON.stringify({ old: "open", new: "in_progress" }), isAiGenerated: false, createdAt: daysAgo(6) },
    { id: activityId.act28, accountId: accountId.securitas,     actorUserId: userId.tomas, entityType: "case", entityId: caseId.cs6,  eventType: "case_status_changed", payload: JSON.stringify({ old: "in_progress", new: "escalated", third_party_ref: "CG-2026-04891" }), isAiGenerated: false, createdAt: daysAgo(4) },
    { id: activityId.act29, accountId: accountId.nhs,           actorUserId: userId.sofia, entityType: "case", entityId: caseId.cs8,  eventType: "case_status_changed", payload: JSON.stringify({ old: "in_progress", new: "resolved" }), isAiGenerated: false, createdAt: daysAgo(3) },
    { id: activityId.act30, accountId: accountId.stenaLine,     actorUserId: userId.tomas, entityType: "case", entityId: caseId.cs10, eventType: "case_status_changed", payload: JSON.stringify({ old: "resolved", new: "closed" }), isAiGenerated: false, createdAt: daysAgo(14) },

    // --- Note added events (12) ---
    { id: activityId.act31, accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "account", entityId: accountId.securitas,     eventType: "note_added", payload: JSON.stringify({ text: "Met with Mikko Hämäläinen at Securitas HQ. They are evaluating XR-20 vs Samsung XCover for 300 guards in Helsinki metro. Key differentiator: our MDM integration and rugged certification. Follow-up demo scheduled for next week." }), isAiGenerated: false, createdAt: daysAgo(68) },
    { id: activityId.act32, accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "deal",    entityId: dealId.d1,                eventType: "note_added", payload: JSON.stringify({ text: "Pilot test completed successfully. 150 devices deployed across 3 guard stations. Battery life and drop resistance exceeded expectations. Sari Laine confirmed budget allocation for national rollout in Q4." }), isAiGenerated: false, createdAt: daysAgo(15) },
    { id: activityId.act33, accountId: accountId.deutscheBahn,  actorUserId: userId.janne, entityType: "deal",    entityId: dealId.d4,                eventType: "note_added", payload: JSON.stringify({ text: "Contract review with Klaus Weber. DB legal requesting data residency guarantees for EU. Need to provide Azure North Europe confirmation letter. Target sign-off by end of June." }), isAiGenerated: false, createdAt: daysAgo(3) },
    { id: activityId.act34, accountId: accountId.kone,          actorUserId: userId.maria, entityType: "deal",    entityId: dealId.d5,                eventType: "note_added", payload: JSON.stringify({ text: "Kone IT team completed security audit of XR-21. Passed all checks. Juha Salminen wants to begin procurement after board meeting on June 25. Offer submitted with 8% volume discount." }), isAiGenerated: false, createdAt: daysAgo(5) },
    { id: activityId.act35, accountId: accountId.nhs,           actorUserId: userId.maria, entityType: "deal",    entityId: dealId.d3,                eventType: "note_added", payload: JSON.stringify({ text: "NHS deal lost to Samsung. Their NHS Digital framework agreement gave Samsung a 30% discount that we couldn't match even at 25%. Lesson: need NHS framework registration before next bid." }), isAiGenerated: false, createdAt: daysAgo(5) },
    { id: activityId.act36, accountId: accountId.danishDefence, actorUserId: userId.janne, entityType: "deal",    entityId: dealId.d6,                eventType: "note_added", payload: JSON.stringify({ text: "Pilot devices delivered to Holstebro barracks. Christian Nielsen confirmed 20 units in field testing with infantry scouts. Waiting for test report — was expected 2 weeks ago." }), isAiGenerated: false, createdAt: daysAgo(22) },
    { id: activityId.act37, accountId: accountId.postnord,      actorUserId: userId.maria, entityType: "deal",    entityId: dealId.d7,                eventType: "note_added", payload: JSON.stringify({ text: "PostNord Stockholm testing XR-10 Lite with 50 delivery drivers. Initial feedback positive — drivers prefer the lighter weight vs current Zebra devices. Full results expected in 2 weeks." }), isAiGenerated: false, createdAt: daysAgo(4) },
    { id: activityId.act38, accountId: accountId.securitas,     actorUserId: userId.tomas, entityType: "case",    entityId: caseId.cs6,               eventType: "note_added", payload: JSON.stringify({ text: "CloudGuard Protect API returning 503 errors intermittently since June 8. Affects device policy push for Securitas fleet. Escalated to CloudGuard support — ticket CG-2026-04891. They are investigating their EU-North load balancer." }), isAiGenerated: false, createdAt: daysAgo(4) },
    { id: activityId.act39, accountId: accountId.deutscheBahn,  actorUserId: userId.sofia, entityType: "case",    entityId: caseId.cs2,               eventType: "note_added", payload: JSON.stringify({ text: "DB reporting Shield agent consuming 15% CPU on XR-20 devices in warm environments (>35C in engine rooms). Need to coordinate with Shield dev team for profiling. Petra Schneider concerned about battery drain." }), isAiGenerated: false, createdAt: daysAgo(1) },
    { id: activityId.act40, accountId: accountId.stenaLine,     actorUserId: userId.maria, entityType: "account", entityId: accountId.stenaLine,      eventType: "note_added", payload: JSON.stringify({ text: "Stena Line expanding to Baltic routes in Q4. Erik Johansson mentioned possible additional 150 devices for new vessel crew. Should follow up in September." }), isAiGenerated: false, createdAt: daysAgo(6) },
    { id: activityId.act41, accountId: accountId.veolia,        actorUserId: userId.janne, entityType: "deal",    entityId: dealId.d8,                eventType: "note_added", payload: JSON.stringify({ text: "Sent RFP response to Ville Aaltonen. Veolia comparing us with Caterpillar Cat S75 for field worker IoT. Our GW-200 gateway is a differentiator they don't have. Need to follow up — no response in 3 weeks." }), isAiGenerated: false, createdAt: daysAgo(25) },
    { id: activityId.act42, accountId: accountId.kone,          actorUserId: userId.sofia, entityType: "case",    entityId: caseId.cs4,               eventType: "note_added", payload: JSON.stringify({ text: "CloudGuard policy sync delay affecting Kone test devices. Working with CloudGuard support to adjust sync interval from 4h to 1h for enterprise tier. Elina Mäkinen needs resolution by Friday." }), isAiGenerated: false, createdAt: daysAgo(2) },

    // --- Offer events (6) ---
    { id: activityId.act43, accountId: accountId.postnord,      actorUserId: userId.maria, entityType: "offer",   entityId: offerId.o1, eventType: "offer_created",   payload: JSON.stringify({ version: 1, status: "draft" }), isAiGenerated: false, createdAt: daysAgo(3) },
    { id: activityId.act44, accountId: accountId.deutscheBahn,  actorUserId: userId.janne, entityType: "offer",   entityId: offerId.o2, eventType: "offer_submitted", payload: JSON.stringify({ version: 1, discount_pct: 12.5, status: "pending_manager" }), isAiGenerated: false, createdAt: daysAgo(5) },
    { id: activityId.act45, accountId: accountId.kone,          actorUserId: userId.maria, entityType: "offer",   entityId: offerId.o3, eventType: "offer_submitted", payload: JSON.stringify({ version: 1, discount_pct: 8, status: "pending_finance" }), isAiGenerated: false, createdAt: daysAgo(7) },
    { id: activityId.act46, accountId: accountId.securitas,     actorUserId: userId.anssi, entityType: "offer",   entityId: offerId.o4, eventType: "offer_approved",  payload: JSON.stringify({ version: 2, approved_by: "Anssi Rönnemaa", role: "sales_manager" }), isAiGenerated: false, createdAt: daysAgo(15) },
    { id: activityId.act47, accountId: accountId.securitas,     actorUserId: userId.laura, entityType: "offer",   entityId: offerId.o4, eventType: "offer_approved",  payload: JSON.stringify({ version: 2, approved_by: "Laura Korhonen", role: "finance" }), isAiGenerated: false, createdAt: daysAgo(12) },
    { id: activityId.act48, accountId: accountId.nhs,           actorUserId: userId.anssi, entityType: "offer",   entityId: offerId.o5, eventType: "offer_rejected",  payload: JSON.stringify({ version: 1, rejected_by: "Anssi Rönnemaa", reason: "Discount exceeds 20% threshold" }), isAiGenerated: false, createdAt: daysAgo(28) },

    // --- AI insight generated events (5) ---
    { id: activityId.act49, accountId: accountId.securitas,     actorUserId: null, entityType: "ai_insight", entityId: insightId.in1, eventType: "ai_insight_generated", payload: JSON.stringify({ insight_type: "enrichment", confidence: 0.87 }), isAiGenerated: true, createdAt: daysAgo(74) },
    { id: activityId.act50, accountId: accountId.deutscheBahn,  actorUserId: null, entityType: "ai_insight", entityId: insightId.in2, eventType: "ai_insight_generated", payload: JSON.stringify({ insight_type: "next_action", confidence: 0.79 }), isAiGenerated: true, createdAt: daysAgo(3) },
    { id: activityId.act51, accountId: accountId.danishDefence, actorUserId: null, entityType: "ai_insight", entityId: insightId.in3, eventType: "ai_insight_generated", payload: JSON.stringify({ insight_type: "risk_flag", confidence: 0.72 }), isAiGenerated: true, createdAt: daysAgo(3) },
    { id: activityId.act52, accountId: accountId.securitas,     actorUserId: null, entityType: "ai_insight", entityId: insightId.in4, eventType: "ai_insight_generated", payload: JSON.stringify({ insight_type: "pipeline_summary", confidence: 0.91 }), isAiGenerated: true, createdAt: daysAgo(1) },

    // --- Additional notes and stage changes for realism (8) ---
    { id: activityId.act53, accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "deal",    entityId: dealId.d10, eventType: "stage_changed",  payload: JSON.stringify({ old: "interest_shown", new: "rfi_answered" }), isAiGenerated: false, createdAt: daysAgo(5) },
    { id: activityId.act54, accountId: accountId.securitas,     actorUserId: userId.janne, entityType: "deal",    entityId: dealId.d10, eventType: "note_added",     payload: JSON.stringify({ text: "Securitas national rollout RFI submitted. Mikko confirmed they want to standardize on XR-20 across all 15 Finnish regions. This could be our largest deal to date." }), isAiGenerated: false, createdAt: daysAgo(5) },
    { id: activityId.act55, accountId: accountId.stenaLine,     actorUserId: userId.maria, entityType: "deal",    entityId: dealId.d11, eventType: "stage_changed",  payload: JSON.stringify({ old: "interest_shown", new: "rfi_answered" }), isAiGenerated: false, createdAt: daysAgo(10) },
    { id: activityId.act56, accountId: accountId.stenaLine,     actorUserId: userId.maria, entityType: "deal",    entityId: dealId.d11, eventType: "note_added",     payload: JSON.stringify({ text: "Stena Line interested in SC-100 body cameras for onboard security team. 430 crew across 10 vessels. Reseller deal through Nordic IT Distribution." }), isAiGenerated: false, createdAt: daysAgo(10) },
    { id: activityId.act57, accountId: accountId.deutscheBahn,  actorUserId: userId.janne, entityType: "deal",    entityId: dealId.d12, eventType: "note_added",     payload: JSON.stringify({ text: "Klaus mentioned DB is exploring IoT for rail yard asset tracking. GW-200 could be a fit. Very early stage — needs proper scoping meeting in July." }), isAiGenerated: false, createdAt: daysAgo(5) },
    { id: activityId.act58, accountId: accountId.nhs,           actorUserId: userId.maria, entityType: "deal",    entityId: dealId.d9,  eventType: "note_added",     payload: JSON.stringify({ text: "Second attempt at NHS — this time through reseller HealthTech Solutions who hold the NHS framework. Mental health team needs 200 smartphones. RFP submitted." }), isAiGenerated: false, createdAt: daysAgo(7) },
    { id: activityId.act59, accountId: accountId.postnord,      actorUserId: userId.tomas, entityType: "case",    entityId: caseId.cs3,  eventType: "case_opened",   payload: JSON.stringify({ priority: "low", service: "HMD Secure MDM" }), isAiGenerated: false, createdAt: daysAgo(1) },
    { id: activityId.act60, accountId: accountId.danishDefence, actorUserId: userId.sofia, entityType: "case",    entityId: caseId.cs7,  eventType: "case_status_changed", payload: JSON.stringify({ old: "open", new: "escalated" }), isAiGenerated: false, createdAt: daysAgo(3) },
  ];
  await db.insert(activities).values(activityRows);
  console.log("  ✓ Activities");

  // =========================================================================
  // 15. NOTIFICATIONS (10)
  // =========================================================================
  await db.insert(notifications).values([
    // Approval notifications
    { id: notifId.n1,  userId: userId.anssi, entityType: "offer", entityId: offerId.o2, body: "New offer pending your approval: DB Maintenance Crew Rugged Phones (12.5% discount)", read: false, createdAt: daysAgo(5) },
    { id: notifId.n2,  userId: userId.laura, entityType: "offer", entityId: offerId.o3, body: "Offer pending Finance approval: Kone Elevator Technician XR-21 Rollout (8% discount)", read: false, createdAt: daysAgo(5) },
    { id: notifId.n3,  userId: userId.janne, entityType: "offer", entityId: offerId.o4, body: "Your offer for Securitas Helsinki Guard Devices has been approved and locked.", read: true, createdAt: daysAgo(12) },
    { id: notifId.n4,  userId: userId.maria, entityType: "offer", entityId: offerId.o5, body: "Your offer for NHS Community Nurse Tablets was rejected. Reason: discount exceeds threshold.", read: true, createdAt: daysAgo(28) },
    // Stale deal warnings
    { id: notifId.n5,  userId: userId.janne, entityType: "deal", entityId: dealId.d6, body: "Deal stale: Danish Defence Field Communication Pilot has not been updated in 22 days.", read: false, createdAt: daysAgo(3) },
    { id: notifId.n6,  userId: userId.janne, entityType: "deal", entityId: dealId.d8, body: "Deal stale: Veolia Nordic Field Worker IoT Kit has not been updated in 25 days.", read: false, createdAt: daysAgo(5) },
    // AI insight notifications
    { id: notifId.n7,  userId: userId.janne, entityType: "ai_insight", entityId: insightId.in2, body: "AI insights updated for Deutsche Bahn AG — next action recommendation available.", read: false, createdAt: daysAgo(3) },
    { id: notifId.n8,  userId: userId.janne, entityType: "ai_insight", entityId: insightId.in3, body: "AI risk flag: Danish Defence pilot deal at risk — competitor activity detected.", read: false, createdAt: daysAgo(3) },
    { id: notifId.n9,  userId: userId.janne, entityType: "ai_insight", entityId: insightId.in4, body: "Weekly pipeline summary available for Securitas Finland.", read: false, createdAt: daysAgo(1) },
    // Case SLA warning
    { id: notifId.n10, userId: userId.tomas, entityType: "case", entityId: caseId.cs6, body: "SLA alert: CloudGuard Protect case for Securitas Finland approaching deadline (1 day remaining).", read: false, createdAt: daysAgo(0) },
  ]);
  console.log("  ✓ Notifications");

  // =========================================================================
  // Done
  // =========================================================================
  console.log("\n✅ Seed complete — inserted demo data across all tables.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
