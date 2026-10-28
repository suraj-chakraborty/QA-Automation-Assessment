import { Router } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';
import { createStreakController } from '../controllers/streakController';
import { validateQuery } from '../middleware/validate';
import { streakQuerySchema } from '../schemas';
import { MethodNotAllowedError } from '../middleware/errors';

export function createStreakRouter(repos: RepositoryContainer = getRepositories()): Router {
  const router = Router();
  const controller = createStreakController(repos);

  router
    .route(['/', '/batting-30'])
    .get(validateQuery(streakQuerySchema), controller.getStreaks)
    .all((_req, _res, next) => {
      next(new MethodNotAllowedError('Method not allowed on /streaks', ['GET', 'HEAD']));
    });

  return router;
}

export default createStreakRouter;
