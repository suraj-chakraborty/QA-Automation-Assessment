import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from './middleware/cors';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { createApiRouter } from './routes';
import { RepositoryContainer, getRepositories } from './repositories';

export function createApp(repos: RepositoryContainer = getRepositories()): Application {
  const app = express();

  // Disable powered-by header
  app.disable('x-powered-by');

  // Security headers & compression
  app.use(helmet());
  app.use(compression());

  // Body parsing with safe size limits
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Zero-dependency CORS middleware
  app.use(corsMiddleware);

  // Mount API router across /api/v1, /api, and / prefixes for full URL compatibility
  const apiRouter = createApiRouter(repos);
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // 404 Route Not Found JSON catch-all
  app.use(notFoundHandler);

  // Central 4-argument Express error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
