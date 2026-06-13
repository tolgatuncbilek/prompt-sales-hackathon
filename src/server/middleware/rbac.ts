import { createMiddleware } from 'hono/factory';
import type { AuthVariables } from './auth.js';

/**
 * Role guard factory.
 * Returns middleware that checks if the authenticated user's role
 * is in the allowed roles list. Returns 403 if not.
 *
 * Usage: app.use(requireRole('sales_manager', 'finance'))
 */
export function requireRole(...roles: string[]) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required', status: 401 }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json(
        {
          error: `Forbidden — requires one of: ${roles.join(', ')}`,
          status: 403,
        },
        403,
      );
    }

    await next();
  });
}
