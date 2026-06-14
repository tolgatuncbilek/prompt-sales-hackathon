import type {
  User,
  Stage,
  Offer,
  CaseRecord,
  CaseNote,
  AiInsight,
  Deal,
  ActivityKind,
} from "../lib/crm.ts";

export type Screen = "home" | "accounts" | "account" | "deals" | "deal" | "cases" | "offers" | "forecast" | "catalog" | "assistant";
export type Toast = { id: number; msg: string } | null;

export type PendingStageChange = { dealId: string; fromStage: Stage; targetStage: Stage; validateLead: boolean } | null;

export type EditKind = "account" | "deal" | "case" | "product" | "service";

export type AppCtx = {
  user: User;
  go: (screen: Screen) => void;
  openAccount: (id: string) => void;
  openDeal: (id: string) => void;
  openOffers: (id?: string) => void;
  openCase: (id: string) => void;
  notify: (msg: string) => void;
  logActivity: (input: {
    accountId: string;
    dealId?: string | null;
    kind: ActivityKind;
    summary: string;
    payload?: any;
    entityType?: string;
    entityId?: string;
    eventType?: string;
  }) => void;
  // mutable state
  dealStage: Record<string, Stage>;
  dealLeadValidated: Record<string, boolean>;
  requestMoveDeal: (id: string, stage: Stage) => void;
  validateLead: (id: string) => void;
  moveDeal: (id: string, stage: Stage) => void;
  offerState: Record<string, Offer>;
  decideOffer: (offerId: string, decision: "approved" | "rejected", note?: string) => void;
  submitOfferForApproval: (offerId: string) => void;
  approveOfferMade: (offerId: string) => void;
  addOffer: (offer: Offer) => void;
  updateOffer: (offerId: string, updater: (offer: Offer) => Offer) => void;
  addCase: (caseRec: CaseRecord) => void;
  insightStatus: Record<string, AiInsight["status"]>;
  setInsight: (id: string, status: AiInsight["status"]) => void;
  caseNotes: Record<string, CaseNote[]>;
  addNote: (caseId: string, note: CaseNote) => void;
  // inline editing: per-entity field overrides applied at render
  patch: (kind: EditKind, id: string, field: string, value: unknown) => void;
  eff: <T extends { id: string }>(kind: EditKind, base: T) => T;
  addAccount: (account: Account) => void;
  addDeal: (deal: Deal, serviceValue: number, serviceContractId?: string | null, serviceId?: string | null) => void;
  addCompetitor: (dealId: string, name: string, netTotal: number | null) => Promise<void>;
  removeCompetitor: (dealId: string, competitorId: string) => Promise<void>;
  updateDeal: (deal: Deal, updates: Partial<Pick<Deal, "title" | "stage" | "apiStage" | "channel" | "leadValidated">> & { device?: number; service?: number; total?: number }) => Promise<void>;
};
