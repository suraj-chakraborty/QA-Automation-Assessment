import { Request, Response, NextFunction } from 'express';
import { RepositoryContainer, getRepositories } from '../repositories';
import { NotFoundError } from '../middleware/errors';
import { Player, PlayerQueryParams, PerformanceQueryParams } from '../types';

export function createPlayerController(repos: RepositoryContainer = getRepositories()) {
  return {
    listPlayers: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const query = req.query as unknown as PlayerQueryParams;
        const result = repos.players.find(query);
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

    getPlayerById: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const id = Number((req.params as { id?: string }).id);
        const player = repos.players.findById(id);
        if (!player) {
          return next(new NotFoundError(`Player with id ${id} not found`));
        }
        res.status(200).json({
          success: true,
          data: player,
        });
      } catch (err) {
        next(err);
      }
    },

    createPlayer: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const body = req.body as Omit<Player, 'id'>;
        const created = repos.players.create(body);
        res.setHeader('Location', `/api/players/${created.id}`);
        res.status(201).json({
          success: true,
          data: created,
        });
      } catch (err) {
        next(err);
      }
    },

    updatePlayer: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const id = Number((req.params as { id?: string }).id);
        const body = req.body as Partial<Player>;
        const updated = repos.players.update(id, body);
        if (!updated) {
          return next(new NotFoundError(`Player with id ${id} not found`));
        }
        res.status(200).json({
          success: true,
          data: updated,
        });
      } catch (err) {
        next(err);
      }
    },

    deletePlayer: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const id = Number((req.params as { id?: string }).id);
        const deleted = repos.players.delete(id);
        if (!deleted) {
          return next(new NotFoundError(`Player with id ${id} not found`));
        }
        res.status(200).json({
          success: true,
          data: {
            id,
            deleted: true,
            message: `Player ${id} deleted successfully`,
          },
          message: `Player ${id} deleted successfully`,
        });
      } catch (err) {
        next(err);
      }
    },

    getPlayerPerformances: (req: Request, res: Response, next: NextFunction): void => {
      try {
        const id = Number((req.params as { id?: string }).id);
        const player = repos.players.findById(id);
        if (!player) {
          return next(new NotFoundError(`Player with id ${id} not found`));
        }
        const query = req.query as unknown as Omit<PerformanceQueryParams, 'player_id'>;
        const result = repos.performances.findByPlayerId(id, query);
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
  };
}

const defaultController = createPlayerController();
export const listPlayers = defaultController.listPlayers;
export const getPlayerById = defaultController.getPlayerById;
export const createPlayer = defaultController.createPlayer;
export const updatePlayer = defaultController.updatePlayer;
export const deletePlayer = defaultController.deletePlayer;
export const getPlayerPerformances = defaultController.getPlayerPerformances;
