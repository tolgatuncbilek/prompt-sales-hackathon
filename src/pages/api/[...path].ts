import type { APIRoute } from 'astro';
import { app } from '../../server/app.js';

const handler: APIRoute = async ({ request }) => {
  return app.fetch(request);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
