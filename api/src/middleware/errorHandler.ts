import { Request, Response, NextFunction } from 'express';
import { AppError, MethodNotAllowedError, NotFoundError } from './errors';

/**
 * 404 Handler for Unmatched Routes (Always emits JSON, never HTML)
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(
    new NotFoundError(
      `Route ${req.method} ${req.originalUrl || req.url} not found`,
      'ROUTE_NOT_FOUND'
    )
  );
}

/**
 * Central Error Handler (4 arguments required for Express error middleware)
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // 1. Method Not Allowed (405) with Allow header
  if (err instanceof MethodNotAllowedError) {
    res.setHeader('Allow', err.allowedMethods.join(', '));
    res.status(405).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // 2. Custom Application Errors (400, 404, 422, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.field !== undefined ? { field: err.field } : {}),
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  // 3. JSON Syntax Error from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload in request body',
        field: 'body',
      },
    });
    return;
  }

  // 4. Uncaught Internal Server Errors (500)
  // Stack traces and raw internal error details are strictly suppressed
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
    },
  });
}
