import { Router } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';
import { createPerformanceController } from '../controllers/performanceController';
import { validateQuery, validateParams } from '../middleware/validate';
import { performanceQuerySchema } from '../schemas';
import { idParamSchema } from '../schemas/common';
import { MethodNotAllowedError } from '../middleware/errors';

export function createPerformanceRouter(repos: RepositoryContainer = getRepositories()): Router {
  const router = Router();
  const controller = createPerformanceController(repos);

  router
    .route('/')
    .get(validateQuery(performanceQuerySchema), controller.listPerformances)
    .all((_req, _res, next) => {
      next(new MethodNotAllowedError('Method not allowed on /performances', ['GET', 'HEAD']));
    });

  router
    .route('/:id')
    .get(validateParams(idParamSchema), controller.getPerformanceById)
    .all((_req, _res, next) => {
      next(new MethodNotAllowedError('Method not allowed on /performances/:id', ['GET', 'HEAD']));
    });

  return router;
}

export default createPerformanceRouter;
