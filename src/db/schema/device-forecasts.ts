import { pgTable, uuid, varchar, date, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { deals } from './deals.js';

export const deviceForecasts = pgTable('device_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id),
  periodLabel: varchar('period_label', { length: 50 }).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  units: integer('units').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const deviceForecastsRelations = relations(deviceForecasts, ({ one }) => ({
  deal: one(deals, {
    fields: [deviceForecasts.dealId],
    references: [deals.id],
  }),
}));

export type DeviceForecast = InferSelectModel<typeof deviceForecasts>;
export type NewDeviceForecast = InferInsertModel<typeof deviceForecasts>;
