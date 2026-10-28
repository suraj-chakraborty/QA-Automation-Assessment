/**
 * Common Types and Standard API Response Envelopes
 */

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  readonly page?: number; // 1-indexed, default 1
  readonly limit?: number; // 1..50, default 10
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly total_pages: number;
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly meta: PaginationMeta;
}

export interface SingleResponse<T> {
  readonly data: T;
}

export type ApiResponse<T> = SingleResponse<T> | PaginatedResponse<T>;

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'ROUTE_NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorDetail {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly field?: string;
  readonly details?: unknown;
}

export interface ApiErrorResponse {
  readonly error: ApiErrorDetail;
}
