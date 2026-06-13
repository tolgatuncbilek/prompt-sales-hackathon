import { pgEnum } from 'drizzle-orm/pg-core';

export const roleType = pgEnum('role_type', [
  'financial_decision_maker',
  'budget_holder',
  'tech_decision_maker',
  'influencer',
]);

export const dealStage = pgEnum('deal_stage', [
  'interest_shown',
  'rfi_answered',
  'rfp_given',
  'customer_test',
  'contract_negotiation',
  'won',
  'lost',
]);

export const channelType = pgEnum('channel_type', [
  'direct',
  'reseller',
]);

export const invoiceModel = pgEnum('invoice_model', [
  'one_off',
  'fixed_term',
  'monthly_recurring',
]);

export const caseStatus = pgEnum('case_status', [
  'open',
  'in_progress',
  'escalated',
  'resolved',
  'closed',
]);

export const casePriority = pgEnum('case_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const offerStatus = pgEnum('offer_status', [
  'draft',
  'pending_manager',
  'pending_finance',
  'approved',
  'rejected',
  'locked',
]);

export const approvalRole = pgEnum('approval_role', [
  'sales_manager',
  'finance',
]);

export const approvalDecision = pgEnum('approval_decision', [
  'approved',
  'rejected',
]);

export const userRole = pgEnum('user_role', [
  'sales_rep',
  'tam',
  'sales_manager',
  'finance',
]);

export const agentTrigger = pgEnum('agent_trigger', [
  'account_created',
  'domain_updated',
  'stage_changed',
  'stale_flagged',
  'scheduled',
  'manual',
]);

export const agentStatus = pgEnum('agent_status', [
  'queued',
  'running',
  'completed',
  'failed',
]);

export const insightType = pgEnum('insight_type', [
  'enrichment',
  'next_action',
  'risk_flag',
  'pipeline_summary',
  'offer_draft',
]);

export const insightStatus = pgEnum('insight_status', [
  'pending_review',
  'accepted',
  'dismissed',
]);
