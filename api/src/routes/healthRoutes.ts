import { Router } from 'express';
import { createHealthController } from '../controllers/healthController';
import { MethodNotAllowedError } from '../middleware/errors';

export function createHealthRouter(): Router {
  const router = Router();
  const controller = createHealthController();

  router
    .route('/')
    .get(controller.getHealth)
    .all((_req, _res, next) => {
      next(new MethodNotAllowedError('Method not allowed on /health', ['GET', 'HEAD']));
    });

  return router;
}

export default createHealthRouter;
