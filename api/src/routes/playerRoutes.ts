import { Router } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';
import { createPlayerController } from '../controllers/playerController';
import { validateQuery, validateParams, validateBody } from '../middleware/validate';
import {
  playerQuerySchema,
  createPlayerSchema,
  updatePlayerSchema,
  playerPerformancesQuerySchema,
} from '../schemas';
import { idParamSchema } from '../schemas/common';
import { MethodNotAllowedError } from '../middleware/errors';

export function createPlayerRouter(repos: RepositoryContainer = getRepositories()): Router {
  const router = Router();
  const controller = createPlayerController(repos);

  router
    .route('/')
    .get(validateQuery(playerQuerySchema), controller.listPlayers)
    .post(validateBody(createPlayerSchema), controller.createPlayer)
    .all((_req, _res, next) => {
      next(new MethodNotAllowedError('Method not allowed on /players', ['GET', 'POST']));
    });

  router
    .route('/:id/performances')
    .get(
      validateParams(idParamSchema),
      validateQuery(playerPerformancesQuerySchema),
      controller.getPlayerPerformances
    )
    .all((_req, _res, next) => {
      next(
        new MethodNotAllowedError('Method not allowed on /players/:id/performances', [
          'GET',
          'HEAD',
        ])
      );
    });

  router
    .route('/:id')
    .get(validateParams(idParamSchema), controller.getPlayerById)
    .put(validateParams(idParamSchema), validateBody(updatePlayerSchema), controller.updatePlayer)
    .delete(validateParams(idParamSchema), controller.deletePlayer)
    .all((_req, _res, next) => {
      next(
        new MethodNotAllowedError('Method not allowed on /players/:id', ['GET', 'PUT', 'DELETE'])
      );
    });

  return router;
}

export default createPlayerRouter;
