import { Router } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';
import { createPlayerRouter } from './playerRoutes';
import { createMatchRouter } from './matchRoutes';
import { createPerformanceRouter } from './performanceRoutes';
import { createStreakRouter } from './streakRoutes';
import { createHealthRouter } from './healthRoutes';

export * from './playerRoutes';
export * from './matchRoutes';
export * from './performanceRoutes';
export * from './streakRoutes';
export * from './healthRoutes';

export function createApiRouter(repos: RepositoryContainer = getRepositories()): Router {
  const router = Router();

  router.use('/health', createHealthRouter());
  router.use('/players', createPlayerRouter(repos));
  router.use('/matches', createMatchRouter(repos));
  router.use('/performances', createPerformanceRouter(repos));
  router.use('/streaks', createStreakRouter(repos));

  return router;
}

export default createApiRouter;
