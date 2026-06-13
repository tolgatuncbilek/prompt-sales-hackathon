import { pgTable, uuid, integer, numeric, text, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { offerStatus } from './enums.js';
import { deals } from './deals.js';
import { users } from './users.js';

export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  version: integer('version').default(1).notNull(),
  status: offerStatus('status').default('draft').notNull(),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).default('0').notNull(),
  justification: text('justification'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const offersRelations = relations(offers, ({ one, many }) => ({
  deal: one(deals, {
    fields: [offers.dealId],
    references: [deals.id],
  }),
  creator: one(users, {
    fields: [offers.createdBy],
    references: [users.id],
  }),
}));

export type Offer = InferSelectModel<typeof offers>;
export type NewOffer = InferInsertModel<typeof offers>;
