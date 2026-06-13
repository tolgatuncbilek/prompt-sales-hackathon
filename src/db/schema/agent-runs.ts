import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { agentTrigger, agentStatus } from './enums.js';
import { accounts } from './accounts.js';

export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  triggerType: agentTrigger('trigger_type').notNull(),
  openclawTaskId: varchar('openclaw_task_id', { length: 255 }),
  status: agentStatus('status').default('queued').notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const agentRunsRelations = relations(agentRuns, ({ one, many }) => ({
  account: one(accounts, {
    fields: [agentRuns.accountId],
    references: [accounts.id],
  }),
}));

export type AgentRun = InferSelectModel<typeof agentRuns>;
export type NewAgentRun = InferInsertModel<typeof agentRuns>;
