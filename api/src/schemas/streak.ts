import { z } from 'zod';

/**
 * Query schema for GET /streaks
 */
export const streakQuerySchema = z
  .object({
    min_matches: z
      .string()
      .regex(/^\d+$/, 'min_matches must be a numeric integer')
      .transform(Number)
      .refine(n => n >= 1 && n <= 20, 'min_matches must be between 1 and 20')
      .optional()
      .default('3'),
    min_runs: z
      .string()
      .regex(/^\d+$/, 'min_runs must be a numeric integer')
      .transform(Number)
      .refine(n => n >= 0 && n <= 300, 'min_runs must be between 0 and 300')
      .optional()
      .default('30'),
    season: z
      .string()
      .regex(/^\d{4}$/, 'Season must be a 4-digit year')
      .transform(Number)
      .refine(y => y >= 2008 && y <= 2100, 'Season must be between 2008 and 2100')
      .optional(),
  })
  .strict();
