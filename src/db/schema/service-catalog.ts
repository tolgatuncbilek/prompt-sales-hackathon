import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const serviceCatalog = pgTable('service_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  serviceType: varchar('service_type', { length: 255 }).notNull(),
  isThirdParty: boolean('is_third_party').default(false).notNull(),
  retired: boolean('retired').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ServiceCatalogEntry = InferSelectModel<typeof serviceCatalog>;
export type NewServiceCatalogEntry = InferInsertModel<typeof serviceCatalog>;
