import { pgTable, uuid, numeric, integer } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { offers } from './offers.js';
import { productCatalog } from './product-catalog.js';
import { serviceCatalog } from './service-catalog.js';

export const offerLines = pgTable('offer_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offer_id').notNull().references(() => offers.id),
  productId: uuid('product_id').references(() => productCatalog.id),
  serviceId: uuid('service_id').references(() => serviceCatalog.id),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).default('0').notNull(),
});

export const offerLinesRelations = relations(offerLines, ({ one }) => ({
  offer: one(offers, {
    fields: [offerLines.offerId],
    references: [offers.id],
  }),
  product: one(productCatalog, {
    fields: [offerLines.productId],
    references: [productCatalog.id],
  }),
  service: one(serviceCatalog, {
    fields: [offerLines.serviceId],
    references: [serviceCatalog.id],
  }),
}));

export type OfferLine = InferSelectModel<typeof offerLines>;
export type NewOfferLine = InferInsertModel<typeof offerLines>;
