import type { ErrorHandler } from 'hono';

/**
 * Central error handler for the Hono app.
 * Logs the error and returns a consistent JSON envelope.
 */
export const errorHandler: ErrorHandler = (err, c) => {
  console.error(
    `[ERROR] ${c.req.method} ${c.req.path}:`,
    err.message,
    err.stack,
  );

  // Map known error types / messages to status codes
  let status = 500;
  let message = 'Internal server error';

  if (err.message?.includes('not found') || err.message?.includes('Not found')) {
    status = 404;
    message = err.message;
  } else if (
    err.message?.includes('Validation') ||
    err.message?.includes('Invalid') ||
    err.message?.includes('required') ||
    err.message?.includes('Bad request')
  ) {
    status = 400;
    message = err.message;
  } else if (err.message?.includes('Conflict') || err.message?.includes('duplicate')) {
    status = 409;
    message = err.message;
  } else if (err.message?.includes('Forbidden')) {
    status = 403;
    message = err.message;
  } else if (err.message?.includes('Unauthorized')) {
    status = 401;
    message = err.message;
  }

  return c.json({ error: message, status }, status as 400 | 401 | 403 | 404 | 409 | 500);
};
