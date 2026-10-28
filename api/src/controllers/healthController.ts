import { Request, Response } from 'express';
import config from '../../../config';

export function createHealthController() {
  return {
    getHealth: (_req: Request, res: Response): void => {
      res.status(200).json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'streamhub-api',
        version: '1.0.0',
        environment: config.NODE_ENV,
      });
    },
  };
}

const defaultController = createHealthController();
export const getHealth = defaultController.getHealth;
