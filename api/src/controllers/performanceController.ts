import { Request, Response, NextFunction } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';
import { NotFoundError } from '../middleware/errors';
import { PerformanceQueryParams } from '../types';

export function createPerformanceController(repos: RepositoryContainer = getRepositories()) {
  return {
    listPerformances: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const query = req.query as unknown as PerformanceQueryParams;
        const result = repos.performances.find(query);
        res.status(200).json({
          success: true,
          count: result.data.length,
          total: result.meta.total,
          page: result.meta.page,
          data: result.data,
          meta: {
            ...result.meta,
            totalPages: result.meta.total_pages,
          },
        });
      } catch (err) {
        next(err);
      }
    },

    getPerformanceById: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const id = Number((req.params as { id?: string }).id);
        const performance = repos.performances.findById(id);
        if (!performance) {
          return next(new NotFoundError(`Performance with id ${id} not found`));
        }
        res.status(200).json({
          success: true,
          data: performance,
        });
      } catch (err) {
        next(err);
      }
    },
  };
}

const defaultController = createPerformanceController();
export const listPerformances = defaultController.listPerformances;
export const getPerformanceById = defaultController.getPerformanceById;
