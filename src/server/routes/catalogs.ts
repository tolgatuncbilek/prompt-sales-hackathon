import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { productCatalog, serviceCatalog } from '../../db/schema/index.js';
import type { AuthVariables } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const app = new Hono<{ Variables: AuthVariables }>();

// --- Products ---

/** GET /products — list products (exclude retired unless ?include_retired=true) */
app.get('/products', async (c) => {
  const includeRetired = c.req.query('include_retired') === 'true';

  let query = db.select().from(productCatalog);

  if (!includeRetired) {
    query = query.where(eq(productCatalog.retired, false));
  }

  const rows = await query;
  return c.json(rows);
});

/** POST /products — create product (finance only) */
app.post('/products', requireRole('finance'), async (c) => {
  const body = await c.req.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const listPrice = Number(body.list_price);

  if (!name || !category || !Number.isFinite(listPrice) || listPrice < 0) {
    return c.json({ error: 'Name, category, and a non-negative list price are required', status: 400 }, 400);
  }

  const [product] = await db
    .insert(productCatalog)
    .values({
      name,
      category,
      listPrice: String(listPrice),
      retired: false,
    })
    .returning();

  if (!product) {
    return c.json({ error: 'Failed to create product', status: 500 }, 500);
  }

  return c.json(product, 201);
});

/** PATCH /products/:id — update/retire product (finance only) */
app.patch('/products/:id', requireRole('finance'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.category !== undefined) updates.category = body.category;
  if (body.list_price !== undefined) updates.listPrice = String(body.list_price);
  if (body.retired !== undefined) updates.retired = body.retired;
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(productCatalog)
    .set(updates)
    .where(eq(productCatalog.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Product not found', status: 404 }, 404);
  }

  return c.json(updated);
});

// --- Services ---

/** GET /services — list services (exclude retired unless ?include_retired=true) */
app.get('/services', async (c) => {
  const includeRetired = c.req.query('include_retired') === 'true';

  let query = db.select().from(serviceCatalog);

  if (!includeRetired) {
    query = query.where(eq(serviceCatalog.retired, false));
  }

  const rows = await query;
  return c.json(rows);
});

/** POST /services — create service (finance only) */
app.post('/services', requireRole('finance'), async (c) => {
  const body = await c.req.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const serviceType = typeof body.service_type === 'string' ? body.service_type.trim() : '';
  const listPrice = body.list_price !== undefined ? Number(body.list_price) : 0;

  if (!name || !serviceType || (body.is_third_party !== undefined && typeof body.is_third_party !== 'boolean')) {
    return c.json({ error: 'Name, service type, and a valid source are required', status: 400 }, 400);
  }
  if (!Number.isFinite(listPrice) || listPrice < 0) {
    return c.json({ error: 'List price must be a non-negative number', status: 400 }, 400);
  }

  const [service] = await db
    .insert(serviceCatalog)
    .values({
      name,
      serviceType,
      listPrice: String(listPrice),
      isThirdParty: body.is_third_party ?? false,
      retired: false,
    })
    .returning();

  if (!service) {
    return c.json({ error: 'Failed to create service', status: 500 }, 500);
  }

  return c.json(service, 201);
});

/** PATCH /services/:id — update/retire service (finance only) */
app.patch('/services/:id', requireRole('finance'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.service_type !== undefined) updates.serviceType = body.service_type;
  if (body.list_price !== undefined) updates.listPrice = String(body.list_price);
  if (body.is_third_party !== undefined) updates.isThirdParty = body.is_third_party;
  if (body.retired !== undefined) updates.retired = body.retired;

  const [updated] = await db
    .update(serviceCatalog)
    .set(updates)
    .where(eq(serviceCatalog.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: 'Service not found', status: 404 }, 404);
  }

  return c.json(updated);
});

export default app;
