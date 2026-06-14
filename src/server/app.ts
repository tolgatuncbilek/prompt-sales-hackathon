import { Hono } from 'hono';
import { errorHandler } from './middleware/error-handler.js';
import { authMiddleware } from './middleware/auth.js';
import type { AuthVariables } from './middleware/auth.js';

// Route imports
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import contactRoutes from './routes/contacts.js';
import dealRoutes from './routes/deals.js';
import forecastRoutes from './routes/forecasts.js';
import caseRoutes from './routes/cases.js';
import offerRoutes from './routes/offers.js';
import catalogRoutes from './routes/catalogs.js';
import activityRoutes from './routes/activities.js';
import notificationRoutes from './routes/notifications.js';
import usersRoutes from './routes/users.js';
import insightsRoutes from './routes/insights.js';
import webhooksRoutes from './routes/webhooks.js';
import syncRoutes from './routes/sync.js';
import bootstrapRoutes from './routes/bootstrap.js';
import meetingsRoutes from './routes/meetings.js';
import assistantRoutes from './routes/assistant.js';

export const app = new Hono<{ Variables: AuthVariables }>().basePath('/api');

// Global error handler
app.onError(errorHandler);

// Health check — no auth
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes — no auth middleware
app.route('/auth', authRoutes);
app.route('/webhooks', webhooksRoutes);
// Bootstrap combines auth resolution + full sync in one RTT (no session required)
app.route('/bootstrap', bootstrapRoutes);

// Protected routes — auth middleware applied
app.use('/*', authMiddleware);

app.get('/downloads/mcp', async (c) => {
  const executable = Bun.file('./dist/mcp-server');
  if (!await executable.exists()) {
    return c.json({ error: 'MCP executable is not available in this build' }, 404);
  }
  return new Response(executable, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="hmd-secure-crm-mcp-linux-x64"',
      'Cache-Control': 'private, max-age=3600',
    },
  });
});

app.route('/accounts', accountRoutes);
app.route('/contacts', contactRoutes);
app.route('/deals', dealRoutes);
app.route('/forecasts', forecastRoutes);
app.route('/cases', caseRoutes);
app.route('/offers', offerRoutes);
app.route('/catalogs', catalogRoutes);
app.route('/activities', activityRoutes);
app.route('/notifications', notificationRoutes);
app.route('/users', usersRoutes);
app.route('/insights', insightsRoutes);
app.route('/sync', syncRoutes);
app.route('/assistant', assistantRoutes);
app.route('/meetings', meetingsRoutes);
