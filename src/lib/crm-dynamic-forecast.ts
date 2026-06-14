import type { Deal, Offer, Stage, DealCompetitor } from "./crm.ts";
import {
  STAGE_META,
  accounts,
  deals,
  cases,
  dealTotal,
  dealForecastNet,
  accountById,
} from "./crm.ts";

export type IndustryStats = {
  industry: string;
  dealWinRate: number;
  dealWon: number;
  dealTotal: number;
  serviceCaseWinRate: number;
  serviceCasesResolved: number;
  serviceCasesTotal: number;
};

export type DynamicForecastBreakdown = {
  probability: number;
  fixedProbability: number;
  weightedValue: number;
  industryWinRate: number;
  serviceCaseWinRate: number;
  industry: string;
  competitorCount: number;
  competitorScore: number;
  ourNetTotal: number | null;
  avgCompetitorNetTotal: number | null;
  priceDeltaPct: number | null;
  stageBoost: number;
  detailLines: string[];
  summary: string;
};

const STAGE_DYNAMIC_BLEND: Record<Stage, number> = {
  lead: 0.35,
  offer: 0.5,
  customer_testing: 0.65,
  final_negotiation: 0.8,
  closed: 1,
};

const FINAL_NEGOTIATION_BOOST = 1.12;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function fmtEurShort(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(2)}m`;
  if (amount >= 1_000) return `€${Math.round(amount / 1_000)}k`;
  return `€${Math.round(amount)}`;
}

export function industryForAccount(accountId: string): string {
  return accountById(accountId)?.industry?.trim() || "Unknown";
}

export function industryForDeal(deal: Deal): string {
  return industryForAccount(deal.accountId);
}

export function dealsInIndustry(industry: string): Deal[] {
  const key = industry.trim().toLowerCase();
  return deals.filter((d) => industryForDeal(d).toLowerCase() === key);
}

function isDealWon(deal: Deal): boolean {
  if (deal.apiStage === "lost") return false;
  if (deal.apiStage === "won") return true;
  return deal.stage === "closed";
}

export function casesInIndustry(industry: string) {
  const key = industry.trim().toLowerCase();
  return cases.filter((c) => {
    const acc = accountById(c.accountId);
    return (acc?.industry?.trim().toLowerCase() ?? "") === key;
  });
}

/** Won deals / all deals in the industry. */
export function industryDealWinRate(industry: string): number {
  const list = dealsInIndustry(industry);
  if (list.length === 0) return 0.5;
  const won = list.filter(isDealWon).length;
  return won / list.length;
}

/** Resolved or closed service cases / all service cases in the industry. */
export function industryServiceCaseWinRate(industry: string): number {
  const list = casesInIndustry(industry);
  if (list.length === 0) return 0.5;
  const resolved = list.filter((c) => c.status === "resolved" || c.status === "closed").length;
  return resolved / list.length;
}

export function industryStatsList(): IndustryStats[] {
  const industries = [...new Set(accounts.map((a) => a.industry?.trim() || "Unknown"))].sort();
  return industries.map((industry) => {
    const industryDeals = dealsInIndustry(industry);
    const industryCases = casesInIndustry(industry);
    const dealWon = industryDeals.filter(isDealWon).length;
    const serviceCasesResolved = industryCases.filter(
      (c) => c.status === "resolved" || c.status === "closed",
    ).length;
    return {
      industry,
      dealWinRate: industryDeals.length ? dealWon / industryDeals.length : 0,
      dealWon,
      dealTotal: industryDeals.length,
      serviceCaseWinRate: industryCases.length ? serviceCasesResolved / industryCases.length : 0,
      serviceCasesResolved,
      serviceCasesTotal: industryCases.length,
    };
  });
}

function competitorScore(
  count: number,
  ourNet: number | null,
  competitors: DealCompetitor[],
): { score: number; avgCompetitorNetTotal: number | null; priceDeltaPct: number | null } {
  const countFactor = 1 / (1 + count * 0.22);
  const priced = competitors.filter((c) => c.netTotal != null && c.netTotal > 0);
  if (priced.length === 0 || ourNet == null || ourNet <= 0) {
    return { score: countFactor, avgCompetitorNetTotal: null, priceDeltaPct: null };
  }
  const avgComp = priced.reduce((s, c) => s + (c.netTotal ?? 0), 0) / priced.length;
  const priceDeltaPct = ((avgComp - ourNet) / ourNet) * 100;
  const priceFactor = clamp(0.55 + (avgComp / ourNet) * 0.35, 0.45, 1.15);
  return {
    score: countFactor * priceFactor,
    avgCompetitorNetTotal: avgComp,
    priceDeltaPct,
  };
}

export function dynamicForecast(
  deal: Deal,
  competitors: DealCompetitor[],
  _resolveOffer?: (id: string) => Offer | undefined,
): DynamicForecastBreakdown {
  const industry = industryForDeal(deal);
  const industryWinRate = industryDealWinRate(industry);
  const serviceCaseWinRate = industryServiceCaseWinRate(industry);
  const fixedProbability = STAGE_META[deal.stage].probability;
  const industryDeals = dealsInIndustry(industry);
  const dealWon = industryDeals.filter(isDealWon).length;

  if (deal.apiStage === "lost") {
    const total = dealTotal(deal);
    return {
      probability: 0,
      fixedProbability: 0,
      weightedValue: 0,
      industryWinRate,
      serviceCaseWinRate,
      industry,
      competitorCount: competitors.length,
      competitorScore: 0,
      ourNetTotal: total || null,
      avgCompetitorNetTotal: null,
      priceDeltaPct: null,
      stageBoost: 1,
      detailLines: ["Deal marked lost — no forward forecast."],
      summary: "Lost deal; dynamic forecast is 0%.",
    };
  }

  if (isDealWon(deal)) {
    const total = dealTotal(deal);
    return {
      probability: 1,
      fixedProbability: 1,
      weightedValue: total,
      industryWinRate,
      serviceCaseWinRate,
      industry,
      competitorCount: competitors.length,
      competitorScore: 1,
      ourNetTotal: total || null,
      avgCompetitorNetTotal: null,
      priceDeltaPct: null,
      stageBoost: 1,
      detailLines: ["Contract signed — realised value."],
      summary: "Closed deal; dynamic forecast equals 100%.",
    };
  }

  const ourNet = dealForecastNet(deal, _resolveOffer) || null;
  const { score: compScore, avgCompetitorNetTotal, priceDeltaPct } = competitorScore(
    competitors.length,
    ourNet,
    competitors,
  );

  const dynamicBase =
    industryWinRate * 0.38 + serviceCaseWinRate * 0.27 + compScore * 0.35;

  const blend = STAGE_DYNAMIC_BLEND[deal.stage];
  let probability = (1 - blend) * fixedProbability + blend * dynamicBase;

  let stageBoost = 1;
  if (deal.stage === "final_negotiation") {
    stageBoost = FINAL_NEGOTIATION_BOOST;
    probability = clamp(probability * stageBoost + 0.04, 0.05, 0.97);
  } else {
    probability = clamp(probability, 0.05, 0.95);
  }

  const detailLines = [
    `Industry win rate (${industry}): ${pct(industryWinRate)} (${dealWon} won / ${industryDeals.length} deals)`,
    `Service case resolution (${industry}): ${pct(serviceCaseWinRate)}`,
    `Competitors: ${competitors.length}${avgCompetitorNetTotal != null && ourNet != null ? ` · avg offer ${fmtEurShort(avgCompetitorNetTotal)} vs ours ${fmtEurShort(ourNet)}${priceDeltaPct != null ? ` (${priceDeltaPct >= 0 ? "+" : ""}${Math.round(priceDeltaPct)}%)` : ""}` : ""}`,
    `Stage ladder: ${pct(fixedProbability)} fixed · ${pct(probability)} dynamic`,
  ];

  const summary =
    deal.stage === "final_negotiation"
      ? "Blends stage ladder with industry, service-case, and competitor signals; final-negotiation stage adds a closing boost."
      : "Weighted blend of industry win history, service-case resolution rate, competitor count/pricing, and the fixed stage ladder.";

  return {
    probability,
    fixedProbability,
    weightedValue: dealForecastNet(deal, _resolveOffer) * probability,
    industryWinRate,
    serviceCaseWinRate,
    industry,
    competitorCount: competitors.length,
    competitorScore: compScore,
    ourNetTotal: ourNet,
    avgCompetitorNetTotal,
    priceDeltaPct,
    stageBoost,
    detailLines,
    summary,
  };
}

export function dynamicWeightedTotal(
  deal: Deal,
  competitors: DealCompetitor[],
  resolveOffer?: (id: string) => Offer | undefined,
): number {
  return dynamicForecast(deal, competitors, resolveOffer).weightedValue;
}
