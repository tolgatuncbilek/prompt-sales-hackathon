import { pgTable, uuid, varchar, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const productCatalog = pgTable('product_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  listPrice: numeric('list_price', { precision: 12, scale: 2 }).notNull(),
  retired: boolean('retired').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ProductCatalogEntry = InferSelectModel<typeof productCatalog>;
export type NewProductCatalogEntry = InferInsertModel<typeof productCatalog>;
