import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const app = new Hono<{ Variables: AuthVariables }>();

/** GET / — list all users (sales_manager, finance only) */
app.get('/', requireRole('sales_manager', 'finance'), async (c) => {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);
  return c.json(allUsers);
});

/** GET /me — current user profile */
app.get('/me', async (c) => {
  const user = c.get('user');
  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    azureOid: user.azureOid,
    createdAt: user.createdAt,
  });
});

/** PATCH /:id/role — change user role (sales_manager only) */
app.patch('/:id/role', requireRole('sales_manager'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ role?: string }>();

  if (!body.role) {
    return c.json({ error: 'role is required', status: 400 }, 400);
  }

  const validRoles = ['sales_rep', 'tam', 'sales_manager', 'finance'];
  if (!validRoles.includes(body.role)) {
    return c.json(
      { error: `Invalid role. Must be one of: ${validRoles.join(', ')}`, status: 400 },
      400,
    );
  }

  const [updated] = await db
    .update(users)
    .set({ role: body.role })
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'User not found', status: 404 }, 404);
  }

  return c.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  });
});

export default app;
