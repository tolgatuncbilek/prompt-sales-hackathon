import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { contacts } from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';

const app = new Hono<{ Variables: AuthVariables }>();

/** GET /accounts/:accountId/contacts — list contacts for account */
app.get('/accounts/:accountId/contacts', async (c) => {
  const accountId = c.req.param('accountId');
  const rows = await db
    .select()
    .from(contacts)
    .where(eq(contacts.accountId, accountId));
  return c.json(rows);
});

/** POST /accounts/:accountId/contacts — create contact */
app.post('/accounts/:accountId/contacts', async (c) => {
  const accountId = c.req.param('accountId');
  const body = await c.req.json();

  const [contact] = await db
    .insert(contacts)
    .values({
      accountId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      roleType: body.role_type ?? null,
    })
    .returning();

  if (!contact) {
    return c.json({ error: 'Failed to create contact', status: 500 }, 500);
  }

  return c.json(contact, 201);
});

/** PATCH /:id — update contact */
app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.role_type !== undefined) updates.roleType = body.role_type;

  const [updated] = await db
    .update(contacts)
    .set(updates)
    .where(eq(contacts.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Contact not found', status: 404 }, 404);
  }

  return c.json(updated);
});

/** DELETE /:id — delete contact */
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const [deleted] = await db
    .delete(contacts)
    .where(eq(contacts.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: 'Contact not found', status: 404 }, 404);
  }

  return c.body(null, 204);
});

export default app;
