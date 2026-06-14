// HMD Secure AI-Native CRM — Forecasting helpers.
// Pure calculation layer extracted from crm.ts.

import {
  inForecast,
  PERIODS,
  deviceInPeriod,
  serviceInPeriod,
  probability,
  periodLabel,
  periodYear,
  deviceGmPerUnit,
  serviceGmRate,
  serviceContractsForDeal,
  accountCountry,
  TIERS,
  OPEN_STATUSES,
  STAGE_META,
  isStale,
  isOverdue,
} from "./crm.ts";
import type {
  Deal,
  Measure,
  Stage,
  ForecastRow,
} from "./crm.ts";

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

// ---------------------------------------------------------------------------
// Editable stage-probability weighting + explainable headline metrics.
//
// The deal status IS the commitment tier; each tier maps to a win probability.
// Finance owns these values (FORECAST.md §2), so they live as config the view
// can edit rather than a hardcoded constant. Every weighted number below flows
// from this map, which is what makes the forecast auditable: change a rung and
// the whole picture re-prices.
// ---------------------------------------------------------------------------

export type StageProbs = Record<Stage, number>;

export function defaultStageProbs(): StageProbs {
  return {
    lead: STAGE_META.lead.probability,
    offer: STAGE_META.offer.probability,
    customer_testing: STAGE_META.customer_testing.probability,
    final_negotiation: STAGE_META.final_negotiation.probability,
    closed: 1,
  };
}

/** Reseller deals skip Final negotiation, so Customer testing is their last gate
 *  before Won — surfaced as a labelled rule, not a silent override. */
export const RESELLER_TEST_PROB = 0.7;

export function dealProbability(deal: Deal, probs: StageProbs): number {
  if (deal.channel === "reseller" && deal.stage === "customer_testing") {
    return Math.max(probs.customer_testing, RESELLER_TEST_PROB);
  }
  return probs[deal.stage] ?? STAGE_META[deal.stage].probability;
}

export function dealWeighted(deal: Deal, m: Measure, probs: StageProbs): number {
  return dealMeasureTotal(deal, m) * dealProbability(deal, probs);
}

/** Period-level weighted contribution for one deal — used by phasing + explain. */
export function dealWeightedInPeriod(deal: Deal, period: string, m: Measure, probs: StageProbs): number {
  return dealMeasureInPeriod(deal, period, m) * dealProbability(deal, probs);
}

export function weightedForecastP(dealList: Deal[], m: Measure, probs: StageProbs): number {
  return dealList.filter(inForecast).reduce((s, d) => s + dealWeighted(d, m, probs), 0);
}

/** Committed = the most-advanced open tier (Final negotiation / very high win). */
export function committedForecast(dealList: Deal[], m: Measure): number {
  return securedForecast(dealList, m);
}

/** At-risk = weighted value attributable to stale or overdue open deals. */
export function atRiskForecast(dealList: Deal[], m: Measure, probs: StageProbs): number {
  return dealList
    .filter(inForecast)
    .filter((d) => isStale(d) || isOverdue(d))
    .reduce((s, d) => s + dealWeighted(d, m, probs), 0);
}

export type LadderRung = { stage: Stage; count: number; gross: number; weighted: number; probability: number };

/** The win-probability ladder: per open stage, gross value × tier probability →
 *  weighted value. The visible bridge from raw pipeline to the weighted number. */
export function stageLadder(dealList: Deal[], m: Measure, probs: StageProbs): LadderRung[] {
  const open = dealList.filter(inForecast);
  return OPEN_STATUSES.map((stage) => {
    const ds = open.filter((d) => d.stage === stage);
    const gross = ds.reduce((s, d) => s + dealMeasureTotal(d, m), 0);
    const weighted = ds.reduce((s, d) => s + dealWeighted(d, m, probs), 0);
    return { stage, count: ds.length, gross, weighted, probability: probs[stage] };
  });
}

/** Weighted total for one revenue stream, kept separate from the other so the
 *  headline can show device and service as two labelled segments (never summed). */
export function weightedStream(dealList: Deal[], stream: "device" | "service", m: Measure, probs: StageProbs): number {
  return dealList.filter(inForecast).reduce((s, d) => {
    const gross = PERIODS.reduce(
      (t, p) => t + (stream === "device" ? deviceMeasureInPeriod(d, p, m) : serviceMeasureInPeriod(d.id, p, m)),
      0,
    );
    return s + gross * dealProbability(d, probs);
  }, 0);
}

/** Forecast re-sliced by deal owner — a saved-view lens over the same dataset. */
export function ownerSeries(dealList: Deal[], m: Measure, nameOf: (id: string) => string): Series[] {
  const inc = dealList.filter(inForecast);
  const owners = [...new Set(inc.map((d) => d.ownerId))];
  return owners
    .map((ownerId) => {
      const ds = inc.filter((d) => d.ownerId === ownerId);
      const values = PERIODS.map((p) => ds.reduce((s, d) => s + dealMeasureInPeriod(d, p, m), 0));
      return { key: ownerId, label: nameOf(ownerId), values, total: values.reduce((a, b) => a + b, 0) };
    })
    .sort((a, b) => b.total - a.total);
}
