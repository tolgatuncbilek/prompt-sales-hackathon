import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { caseStatus, casePriority } from './enums.js';
import { accounts } from './accounts.js';
import { serviceCatalog } from './service-catalog.js';
import { users } from './users.js';
import { contacts } from './contacts.js';

export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  serviceId: uuid('service_id').references(() => serviceCatalog.id),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  status: caseStatus('status').default('open').notNull(),
  priority: casePriority('priority').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  escalated: boolean('escalated').default(false).notNull(),
  thirdPartyRef: varchar('third_party_ref', { length: 255 }),
  slaDeadline: timestamp('sla_deadline', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const casesRelations = relations(cases, ({ one }) => ({
  account: one(accounts, {
    fields: [cases.accountId],
    references: [accounts.id],
  }),
  service: one(serviceCatalog, {
    fields: [cases.serviceId],
    references: [serviceCatalog.id],
  }),
  owner: one(users, {
    fields: [cases.ownerUserId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [cases.contactId],
    references: [contacts.id],
  }),
}));

export type Case = InferSelectModel<typeof cases>;
export type NewCase = InferInsertModel<typeof cases>;
