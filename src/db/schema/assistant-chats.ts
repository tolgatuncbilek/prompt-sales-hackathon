import { relations, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const assistantThreads = pgTable('assistant_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 160 }).notNull().default('New chat'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('assistant_threads_user_updated_idx').on(table.userId, table.updatedAt),
]);

export const assistantMessages = pgTable('assistant_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => assistantThreads.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 16 }).notNull(),
  content: text('content').notNull(),
  evidence: jsonb('evidence'),
  uncertainty: text('uncertainty'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('assistant_messages_thread_created_idx').on(table.threadId, table.createdAt),
]);

export const assistantThreadsRelations = relations(assistantThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [assistantThreads.userId],
    references: [users.id],
  }),
  messages: many(assistantMessages),
}));

export const assistantMessagesRelations = relations(assistantMessages, ({ one }) => ({
  thread: one(assistantThreads, {
    fields: [assistantMessages.threadId],
    references: [assistantThreads.id],
  }),
}));

export type AssistantThread = InferSelectModel<typeof assistantThreads>;
export type NewAssistantThread = InferInsertModel<typeof assistantThreads>;
export type AssistantMessage = InferSelectModel<typeof assistantMessages>;
export type NewAssistantMessage = InferInsertModel<typeof assistantMessages>;
