import { pgTable, uuid, text, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { insightType, insightStatus } from './enums.js';
import { agentRuns } from './agent-runs.js';
import { accounts } from './accounts.js';
import { deals } from './deals.js';
import { cases } from './cases.js';
import { users } from './users.js';

export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentRunId: uuid('agent_run_id').notNull().references(() => agentRuns.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  dealId: uuid('deal_id').references(() => deals.id),
  caseId: uuid('case_id').references(() => cases.id),
  insightType: insightType('insight_type').notNull(),
  body: text('body').notNull(),
  confidence: numeric('confidence', { precision: 3, scale: 2 }).notNull(),
  sources: jsonb('sources'),
  draftEmail: text('draft_email'),
  status: insightStatus('status').default('pending_review').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  agentRun: one(agentRuns, {
    fields: [aiInsights.agentRunId],
    references: [agentRuns.id],
  }),
  account: one(accounts, {
    fields: [aiInsights.accountId],
    references: [accounts.id],
  }),
  deal: one(deals, {
    fields: [aiInsights.dealId],
    references: [deals.id],
  }),
  case: one(cases, {
    fields: [aiInsights.caseId],
    references: [cases.id],
  }),
  reviewer: one(users, {
    fields: [aiInsights.reviewedBy],
    references: [users.id],
  }),
}));

export type AiInsight = InferSelectModel<typeof aiInsights>;
export type NewAiInsight = InferInsertModel<typeof aiInsights>;
