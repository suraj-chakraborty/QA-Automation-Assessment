import { Request, Response, NextFunction } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';

interface StreakQuery {
  min_matches?: number;
  min_runs?: number;
  season?: number;
}

export function createStreakController(repos: RepositoryContainer = getRepositories()) {
  return {
    getStreaks: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const query = req.query as unknown as StreakQuery;
        const minMatches = query.min_matches ?? 3;
        const minRuns = query.min_runs ?? 30;
        const season = query.season;

        const streaks = repos.performances.findStreaks(minMatches, minRuns, season);
        res.status(200).json({
          success: true,
          count: streaks.length,
          data: streaks,
        });
      } catch (err) {
        next(err);
      }
    },
  };
}

const defaultController = createStreakController();
export const getStreaks = defaultController.getStreaks;
