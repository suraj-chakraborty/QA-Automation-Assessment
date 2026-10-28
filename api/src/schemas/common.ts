import { z } from 'zod';

/**
 * Strict positive integer parser from query string
 */
export const integerQueryParam = (options: {
  min?: number;
  max?: number;
  defaultValue?: number;
  fieldName: string;
}) =>
  z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val.trim() === '') {
        return options.defaultValue;
      }
      const trimmed = val.trim();
      if (!/^\d+$/.test(trimmed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${options.fieldName} must be a valid integer`,
        });
        return z.NEVER;
      }
      const num = Number(trimmed);
      if (!Number.isSafeInteger(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${options.fieldName} must be a safe integer`,
        });
        return z.NEVER;
      }
      if (options.min !== undefined && num < options.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${options.fieldName} must be >= ${options.min}`,
        });
        return z.NEVER;
      }
      if (options.max !== undefined && num > options.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${options.fieldName} must be <= ${options.max}`,
        });
        return z.NEVER;
      }
      return num;
    });

/**
 * Strict path parameter schema for resource IDs (:id)
 */
export const idParamSchema = z
  .object({
    id: z
      .string({ required_error: 'id parameter is required' })
      .regex(/^\d+$/, { message: 'id must be a numeric integer' })
      .transform((val, ctx) => {
        const num = Number(val);
        if (!Number.isSafeInteger(num) || num < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'id must be a positive integer >= 1',
          });
          return z.NEVER;
        }
        return num;
      }),
  })
  .strict();

/**
 * Common pagination schemas (page >= 1, limit 1..50)
 */
export const paginationQuerySchema = {
  page: integerQueryParam({ min: 1, defaultValue: 1, fieldName: 'page' }),
  limit: integerQueryParam({ min: 1, max: 50, defaultValue: 10, fieldName: 'limit' }),
};

export const sortOrderSchema = z.enum(['asc', 'desc']).default('asc');

/**
 * Calendar date string validator (YYYY-MM-DD with Gregorian calendar verification)
 */
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  .refine(
    val => {
      const parts = val.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const d = parts[2];
      if (y === undefined || m === undefined || d === undefined) return false;
      if (m < 1 || m > 12 || d < 1 || d > 31) return false;
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    },
    { message: 'Must be a valid calendar date' }
  );
