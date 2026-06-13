import { db } from '../../db/index.js';
import { activities, notifications } from '../../db/schema/index.js';

/**
 * Write an activity row to the account timeline.
 * Every state change should call this to maintain timeline completeness.
 */
export async function writeActivity(params: {
  accountId: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  isAiGenerated?: boolean;
}) {
  const [row] = await db
    .insert(activities)
    .values({
      accountId: params.accountId,
      actorUserId: params.actorUserId,
      entityType: params.entityType,
      entityId: params.entityId,
      eventType: params.eventType,
      payload: params.payload ?? {},
      isAiGenerated: params.isAiGenerated ?? false,
    })
    .returning();
  return row;
}

/**
 * Create a notification for a specific user.
 */
export async function createNotification(params: {
  userId: string;
  entityType: string;
  entityId: string;
  body: string;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      body: params.body,
      read: false,
    })
    .returning();
  return row;
}
