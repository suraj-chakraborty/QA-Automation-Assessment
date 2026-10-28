import { ApiErrorCode } from '../types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly field?: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    field?: string,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, field, details);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string,
    code: 'RESOURCE_NOT_FOUND' | 'ROUTE_NOT_FOUND' = 'RESOURCE_NOT_FOUND'
  ) {
    super(404, code, message);
  }
}

export class MethodNotAllowedError extends AppError {
  public readonly allowedMethods: readonly string[];

  constructor(message: string, allowedMethods: readonly string[]) {
    super(405, 'METHOD_NOT_ALLOWED', message);
    this.allowedMethods = Object.freeze([...allowedMethods]);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string, field?: string, details?: unknown) {
    super(422, 'UNPROCESSABLE_ENTITY', message, field, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal error occurred', details?: unknown) {
    super(500, 'INTERNAL_SERVER_ERROR', message, undefined, details);
  }
}
