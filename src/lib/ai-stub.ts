/**
 * Stubbed AI insights generator.
 * Returns realistic-looking AI insight objects matching AI_INSIGHT table format.
 */

interface StubAccount {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
}

interface StubDeal {
  id: string;
  title: string;
  stage: string;
  updated_at: Date | string | null;
  expected_close?: Date | string | null;
}

interface StubCase {
  id: string;
  status: string;
  priority: string;
  sla_deadline?: Date | string | null;
}

interface StubInsight {
  insight_type: 'enrichment' | 'next_action' | 'risk_flag';
  deal_id: string | null;
  case_id: string | null;
  body: string;
  confidence: number;
  sources: Array<{ url: string; title: string; snippet: string }>;
}

export function generateStubInsights(
  account: StubAccount,
  deals: StubDeal[],
  cases: StubCase[],
): StubInsight[] {
  const insights: StubInsight[] = [];

  // 1. Enrichment insight — always generated
  const industry = account.industry ?? 'technology';
  insights.push({
    insight_type: 'enrichment',
    deal_id: null,
    case_id: null,
    body: [
      `${account.name} is a mid-market ${industry} company`,
      account.domain ? `operating primarily through ${account.domain}.` : '.',
      `Key facts: The company has been expanding its enterprise security portfolio.`,
      `Recent funding activity suggests growth-stage investment.`,
      `Their IT infrastructure modernization initiative aligns with HMD Secure's offering.`,
    ].join(' '),
    confidence: 0.78,
    sources: [
      {
        url: `https://www.crunchbase.com/organization/${(account.name ?? 'company').toLowerCase().replace(/\s+/g, '-')}`,
        title: `${account.name} — Crunchbase`,
        snippet: `${account.name} company profile, funding rounds, and key executives.`,
      },
      {
        url: `https://${account.domain ?? 'example.com'}`,
        title: `${account.name} — Official Website`,
        snippet: `${account.name} provides ${industry} solutions for enterprise customers.`,
      },
    ],
  });

  // 2. Next-action recommendation
  const activeDealCount = deals.filter(
    (d) => d.stage !== 'won' && d.stage !== 'lost',
  ).length;
  const latestDeal = deals[0];
  const nextActionBody = latestDeal
    ? `Recommended next action: Follow up on "${latestDeal.title}" (currently at ${latestDeal.stage.replace(/_/g, ' ')} stage). Consider scheduling a technical review to progress the deal. ${activeDealCount > 1 ? `There are ${activeDealCount} active deals — prioritize the one closest to close.` : ''}`
    : `Recommended next action: Schedule an introductory call with ${account.name} to discuss their security infrastructure needs and identify potential device deployment opportunities.`;

  insights.push({
    insight_type: 'next_action',
    deal_id: latestDeal?.id ?? null,
    case_id: null,
    body: nextActionBody,
    confidence: 0.72,
    sources: [
      {
        url: `https://news.google.com/search?q=${encodeURIComponent(account.name ?? 'company')}`,
        title: `Recent news — ${account.name}`,
        snippet: `Latest updates and industry analysis for ${account.name}.`,
      },
    ],
  });

  // 3. Risk flags — stale deals
  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;

  for (const deal of deals) {
    if (deal.stage === 'won' || deal.stage === 'lost') continue;

    const updatedAt = deal.updated_at ? new Date(deal.updated_at).getTime() : 0;
    if (now - updatedAt > fourteenDays) {
      insights.push({
        insight_type: 'risk_flag',
        deal_id: deal.id,
        case_id: null,
        body: `Deal "${deal.title}" has not been updated in over 14 days (last activity: ${new Date(updatedAt).toLocaleDateString()}). This deal is at risk of going stale. Immediate follow-up recommended.`,
        confidence: 0.91,
        sources: [],
      });
    }
  }

  // 4. Risk flags — cases near SLA
  const twentyFourHours = 24 * 60 * 60 * 1000;

  for (const c of cases) {
    if (c.status === 'resolved' || c.status === 'closed') continue;

    if (c.sla_deadline) {
      const deadline = new Date(c.sla_deadline).getTime();
      if (deadline - now < twentyFourHours && deadline > now) {
        insights.push({
          insight_type: 'risk_flag',
          deal_id: null,
          case_id: c.id,
          body: `Case #${c.id.slice(0, 8)} is approaching its SLA deadline (${c.priority} priority). Less than 24 hours remaining. Escalation may be needed if not resolved promptly.`,
          confidence: 0.95,
          sources: [],
        });
      } else if (deadline <= now) {
        insights.push({
          insight_type: 'risk_flag',
          deal_id: null,
          case_id: c.id,
          body: `Case #${c.id.slice(0, 8)} has breached its SLA deadline (${c.priority} priority). Immediate attention required — customer satisfaction at risk.`,
          confidence: 0.98,
          sources: [],
        });
      }
    }
  }

  return insights;
}
