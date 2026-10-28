import { Router } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';
import { createMatchController } from '../controllers/matchController';
import { validateQuery, validateParams } from '../middleware/validate';
import { matchQuerySchema } from '../schemas';
import { idParamSchema } from '../schemas/common';
import { MethodNotAllowedError } from '../middleware/errors';

export function createMatchRouter(repos: RepositoryContainer = getRepositories()): Router {
  const router = Router();
  const controller = createMatchController(repos);

  router
    .route('/')
    .get(validateQuery(matchQuerySchema), controller.listMatches)
    .all((_req, _res, next) => {
      next(new MethodNotAllowedError('Method not allowed on /matches', ['GET', 'HEAD']));
    });

  router
    .route('/:id')
    .get(validateParams(idParamSchema), controller.getMatchById)
    .all((_req, _res, next) => {
      next(new MethodNotAllowedError('Method not allowed on /matches/:id', ['GET', 'HEAD']));
    });

  return router;
}

export default createMatchRouter;
