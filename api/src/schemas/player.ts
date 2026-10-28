import { z } from 'zod';
import { TEAM_CODES, PLAYER_ROLES } from '../types';
import { paginationQuerySchema, sortOrderSchema } from './common';

/**
 * Query schema for GET /players
 */
export const playerQuerySchema = z
  .object({
    team: z
      .enum(TEAM_CODES, {
        errorMap: () => ({ message: 'Invalid team code' }),
      })
      .optional(),
    role: z
      .enum(PLAYER_ROLES, {
        errorMap: () => ({ message: 'Invalid player role' }),
      })
      .optional(),
    q: z
      .string()
      .trim()
      .min(2, { message: 'Search query q must be at least 2 characters' })
      .optional(),
    min_runs: z
      .string()
      .optional()
      .transform((val, ctx) => {
        if (val === undefined || val.trim() === '') return undefined;
        if (!/^\d+$/.test(val.trim())) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'min_runs must be an integer' });
          return z.NEVER;
        }
        const num = Number(val.trim());
        if (num < 0 || num > 1000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'min_runs must be between 0 and 1000',
          });
          return z.NEVER;
        }
        return num;
      }),
    sort_by: z.enum(['name', 'team', 'total_runs']).default('name'),
    order: sortOrderSchema,
    ...paginationQuerySchema,
  })
  .strict();

/**
 * Body schema for POST /players
 */
export const createPlayerSchema = z
  .object({
    name: z
      .string({ required_error: 'name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100),
    team: z.enum(TEAM_CODES, {
      errorMap: () => ({
        message: 'Invalid team code',
        params: { statusCode: 422, code: 'UNPROCESSABLE_ENTITY' },
      }),
    }),
    role: z.enum(PLAYER_ROLES, {
      errorMap: () => ({
        message: 'Invalid player role',
        params: { statusCode: 422, code: 'UNPROCESSABLE_ENTITY' },
      }),
    }),
    batting_style: z.string().trim().min(1).optional(),
    bowling_style: z.string().trim().min(1).optional(),
    isOverseas: z.boolean().optional().default(false),
    total_runs: z.number().int().min(0, 'total_runs must be >= 0').optional().default(0),
    total_wickets: z.number().int().min(0, 'total_wickets must be >= 0').optional().default(0),
    matches_played: z.number().int().min(0, 'matches_played must be >= 0').optional().default(0),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Semantic cricket check: wickets cannot exceed matches_played * 10
    if (data.matches_played > 0 && data.total_wickets > data.matches_played * 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'total_wickets exceeds maximum possible wickets for matches played',
        path: ['total_wickets'],
        params: { statusCode: 422, code: 'UNPROCESSABLE_ENTITY' },
      });
    }
  });

/**
 * Body schema for PUT /players/:id
 */
export const updatePlayerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    team: z
      .enum(TEAM_CODES, {
        errorMap: () => ({
          message: 'Invalid team code',
          params: { statusCode: 422, code: 'UNPROCESSABLE_ENTITY' },
        }),
      })
      .optional(),
    role: z
      .enum(PLAYER_ROLES, {
        errorMap: () => ({
          message: 'Invalid player role',
          params: { statusCode: 422, code: 'UNPROCESSABLE_ENTITY' },
        }),
      })
      .optional(),
    batting_style: z.string().trim().min(1).optional(),
    bowling_style: z.string().trim().min(1).optional(),
    isOverseas: z.boolean().optional(),
    total_runs: z.number().int().min(0, 'total_runs must be >= 0').optional(),
    total_wickets: z.number().int().min(0, 'total_wickets must be >= 0').optional(),
    matches_played: z.number().int().min(0, 'matches_played must be >= 0').optional(),
  })
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
    params: { statusCode: 422, code: 'UNPROCESSABLE_ENTITY' },
  })
  .superRefine((data, ctx) => {
    if (
      data.matches_played !== undefined &&
      data.total_wickets !== undefined &&
      data.matches_played > 0 &&
      data.total_wickets > data.matches_played * 10
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'total_wickets exceeds maximum possible wickets for matches played',
        path: ['total_wickets'],
        params: { statusCode: 422, code: 'UNPROCESSABLE_ENTITY' },
      });
    }
  });
