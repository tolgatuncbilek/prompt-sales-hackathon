import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { approvalRole, approvalDecision } from './enums.js';
import { offers } from './offers.js';
import { users } from './users.js';

export const approvalSteps = pgTable('approval_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offer_id').notNull().references(() => offers.id),
  stepOrder: integer('step_order').notNull(),
  roleRequired: approvalRole('role_required').notNull(),
  decidedBy: uuid('decided_by').references(() => users.id),
  decision: approvalDecision('decision'),
  note: text('note'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
});

export const approvalStepsRelations = relations(approvalSteps, ({ one }) => ({
  offer: one(offers, {
    fields: [approvalSteps.offerId],
    references: [offers.id],
  }),
  decider: one(users, {
    fields: [approvalSteps.decidedBy],
    references: [users.id],
  }),
}));

export type ApprovalStep = InferSelectModel<typeof approvalSteps>;
export type NewApprovalStep = InferInsertModel<typeof approvalSteps>;
