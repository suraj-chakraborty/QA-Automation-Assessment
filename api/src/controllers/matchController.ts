import { Request, Response, NextFunction } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';
import { NotFoundError } from '../middleware/errors';
import { MatchQueryParams } from '../types';

export function createMatchController(repos: RepositoryContainer = getRepositories()) {
  return {
    listMatches: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const query = req.query as unknown as MatchQueryParams;
        const result = repos.matches.find(query);
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

    getMatchById: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const id = Number((req.params as { id?: string }).id);
        const match = repos.matches.findById(id);
        if (!match) {
          return next(new NotFoundError(`Match with id ${id} not found`));
        }
        res.status(200).json({
          success: true,
          data: match,
        });
      } catch (err) {
        next(err);
      }
    },
  };
}

const defaultController = createMatchController();
export const listMatches = defaultController.listMatches;
export const getMatchById = defaultController.getMatchById;
