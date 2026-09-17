import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { Hono } from 'hono';
import { externalPostRoutes } from './routes/external-post.js';

const app = new Hono();

// This route is reachable only through a Devvit-managed external endpoint.
// Devvit checks the managed app token before this handler is invoked.
app.route('/external', externalPostRoutes);

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
