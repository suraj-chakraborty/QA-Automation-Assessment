import { z } from 'zod';
import { paginationQuerySchema, sortOrderSchema } from './common';

/**
 * Query schema for GET /performances
 */
export const performanceQuerySchema = z
  .object({
    player_id: z
      .string()
      .regex(/^\d+$/, 'player_id must be a numeric integer')
      .transform(Number)
      .refine(n => n >= 1, 'player_id must be >= 1')
      .optional(),
    match_id: z
      .string()
      .regex(/^\d+$/, 'match_id must be a numeric integer')
      .transform(Number)
      .refine(n => n >= 1, 'match_id must be >= 1')
      .optional(),
    min_runs: z
      .string()
      .regex(/^\d+$/, 'min_runs must be a numeric integer')
      .transform(Number)
      .refine(n => n >= 0 && n <= 300, 'min_runs must be between 0 and 300')
      .optional(),
    sort_by: z.enum(['date', 'runs']).default('date'),
    order: sortOrderSchema.default('desc'),
    ...paginationQuerySchema,
  })
  .strict();

/**
 * Query schema for GET /players/:id/performances
 */
export const playerPerformancesQuerySchema = z
  .object({
    min_runs: z
      .string()
      .regex(/^\d+$/, 'min_runs must be a numeric integer')
      .transform(Number)
      .refine(n => n >= 0 && n <= 300, 'min_runs must be between 0 and 300')
      .optional(),
    sort_by: z.enum(['date', 'runs']).default('date'),
    order: sortOrderSchema.default('desc'),
    ...paginationQuerySchema,
  })
  .strict();
