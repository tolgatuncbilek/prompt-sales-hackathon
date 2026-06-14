import { pgTable, uuid, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { deals } from './deals.js';

export const dealCompetitors = pgTable('deal_competitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  netTotal: numeric('net_total', { precision: 14, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dealCompetitorsRelations = relations(dealCompetitors, ({ one }) => ({
  deal: one(deals, {
    fields: [dealCompetitors.dealId],
    references: [deals.id],
  }),
}));

export type DealCompetitor = InferSelectModel<typeof dealCompetitors>;
export type NewDealCompetitor = InferInsertModel<typeof dealCompetitors>;
