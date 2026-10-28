import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, UnprocessableEntityError } from './errors';

interface ZodIssueCustomParams {
  statusCode?: number;
  code?: string;
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issues = result.error.issues;
      const firstIssue = issues[0];
      if (!firstIssue) {
        return next(new ValidationError('Invalid query parameters'));
      }

      const is422 = issues.some(issue => {
        const params = (issue as { params?: ZodIssueCustomParams }).params;
        return params?.statusCode === 422 || params?.code === 'UNPROCESSABLE_ENTITY';
      });

      let field: string | undefined;
      if (firstIssue.code === 'unrecognized_keys') {
        field = firstIssue.keys[0];
      } else if (firstIssue.path.length > 0) {
        field = String(firstIssue.path[0]);
      }

      const details = issues.map(issue => ({
        field: issue.code === 'unrecognized_keys' ? issue.keys.join(', ') : issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      const message =
        firstIssue.code === 'unrecognized_keys'
          ? `Unrecognized query parameter(s): ${firstIssue.keys.join(', ')}`
          : firstIssue.message;

      if (is422) {
        return next(new UnprocessableEntityError(message, field, details));
      }
      return next(new ValidationError(message, field, details));
    }

    req.query = result.data;
    next();
  };
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const issues = result.error.issues;
      const firstIssue = issues[0];
      if (!firstIssue) {
        return next(new ValidationError('Invalid path parameters'));
      }

      const field = firstIssue.path.length > 0 ? String(firstIssue.path[0]) : 'id';
      const details = issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }));

      return next(
        new ValidationError(
          firstIssue.message || `Invalid path parameter: ${field}`,
          field,
          details
        )
      );
    }

    req.params = result.data;
    next();
  };
}

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues;
      const firstIssue = issues[0];
      if (!firstIssue) {
        return next(new ValidationError('Invalid request payload'));
      }

      const is422 = issues.some(issue => {
        const params = (issue as { params?: ZodIssueCustomParams }).params;
        return (
          params?.statusCode === 422 ||
          params?.code === 'UNPROCESSABLE_ENTITY' ||
          (issue.code === 'invalid_enum_value' &&
            (issue.path[0] === 'team' || issue.path[0] === 'role')) ||
          (issue.code === 'too_small' &&
            (issue.path[0] === 'total_runs' ||
              issue.path[0] === 'total_wickets' ||
              issue.path[0] === 'matches_played'))
        );
      });

      let field: string | undefined;
      if (firstIssue.code === 'unrecognized_keys') {
        field = firstIssue.keys[0];
      } else if (firstIssue.path.length > 0) {
        field = String(firstIssue.path[0]);
      }

      const details = issues.map(issue => ({
        field: issue.code === 'unrecognized_keys' ? issue.keys.join(', ') : issue.path.join('.'),
        message: issue.message,
      }));

      const message =
        firstIssue.code === 'unrecognized_keys'
          ? `Unrecognized request field(s): ${firstIssue.keys.join(', ')}`
          : firstIssue.message;

      if (is422) {
        return next(new UnprocessableEntityError(message, field, details));
      }
      return next(new ValidationError(message, field, details));
    }

    req.body = result.data;
    next();
  };
}
