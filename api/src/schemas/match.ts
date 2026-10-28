import { z } from 'zod';
import { TEAM_CODES } from '../types';
import { paginationQuerySchema, sortOrderSchema, calendarDateSchema } from './common';

/**
 * Query schema for GET /matches
 */
export const matchQuerySchema = z
  .object({
    team: z
      .enum(TEAM_CODES, {
        errorMap: () => ({ message: 'Invalid team code' }),
      })
      .optional(),
    venue: z.string().trim().min(1, 'Venue cannot be empty').optional(),
    date_from: calendarDateSchema.optional(),
    date_to: calendarDateSchema.optional(),
    sort_by: z.enum(['date', 'match_no']).default('date'),
    order: sortOrderSchema,
    ...paginationQuerySchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    // Cross-field semantic check: date_from > date_to triggers 422 Unprocessable Entity
    if (data.date_from && data.date_to && data.date_from > data.date_to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'date_from cannot be after date_to',
        path: ['date_from'],
        params: { statusCode: 422, code: 'UNPROCESSABLE_ENTITY' },
      });
    }
  });
