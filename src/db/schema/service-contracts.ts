import { pgTable, uuid, date, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { invoiceModel } from './enums.js';
import { deals } from './deals.js';
import { serviceCatalog } from './service-catalog.js';

export const serviceContracts = pgTable('service_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id),
  serviceId: uuid('service_id').notNull().references(() => serviceCatalog.id),
  invoiceModel: invoiceModel('invoice_model').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  fixedValue: numeric('fixed_value', { precision: 12, scale: 2 }),
  monthlyRate: numeric('monthly_rate', { precision: 12, scale: 2 }),
  deviceCountTrajectory: jsonb('device_count_trajectory'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const serviceContractsRelations = relations(serviceContracts, ({ one }) => ({
  deal: one(deals, {
    fields: [serviceContracts.dealId],
    references: [deals.id],
  }),
  service: one(serviceCatalog, {
    fields: [serviceContracts.serviceId],
    references: [serviceCatalog.id],
  }),
}));

export type ServiceContract = InferSelectModel<typeof serviceContracts>;
export type NewServiceContract = InferInsertModel<typeof serviceContracts>;
