import { pgTable, uuid, varchar, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { dealStage, channelType } from './enums.js';
import { accounts } from './accounts.js';
import { users } from './users.js';

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  parentDealId: uuid('parent_deal_id').references(() => deals.id),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 500 }).notNull(),
  stage: dealStage('stage').notNull(),
  channel: channelType('channel').notNull(),
  isPilot: boolean('is_pilot').default(false).notNull(),
  expectedClose: date('expected_close'),
  staleFlaggedAt: timestamp('stale_flagged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dealsRelations = relations(deals, ({ one, many }) => ({
  account: one(accounts, {
    fields: [deals.accountId],
    references: [accounts.id],
  }),
  parentDeal: one(deals, {
    fields: [deals.parentDealId],
    references: [deals.id],
    relationName: 'parentChild',
  }),
  childDeals: many(deals, { relationName: 'parentChild' }),
  owner: one(users, {
    fields: [deals.ownerUserId],
    references: [users.id],
  }),
}));

export type Deal = InferSelectModel<typeof deals>;
export type NewDeal = InferInsertModel<typeof deals>;
