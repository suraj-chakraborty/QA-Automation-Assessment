import { createApp } from './app';
import config from '../../config';
import { getRepositories } from './repositories';

const app = createApp(getRepositories());
const port = config.PORT;
const host = config.API_HOST;

const server = app.listen(port, host, () => {
  console.log(`[API] Server listening on ${host}:${port}`);
  console.log(`[API] Base URL: ${config.API_BASE_URL}`);
  console.log(`[API] Environment: ${config.NODE_ENV}`);
});

function gracefulShutdown(signal: string): void {
  console.log(`[API] Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    console.log('[API] HTTP server closed cleanly.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[API] Forced exit after shutdown timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { server, app };
