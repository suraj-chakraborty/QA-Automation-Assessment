/**
 * Streamhub API Client - Typed HTTP and In-Process Supertest Client
 * Location: clients/ApiClient.ts
 */

import http from 'http';
import type { Application } from 'express';
import supertest, { Test } from 'supertest';
import { createApp } from '../api/src/app';
import { getRepositories } from '../api/src/repositories';
import config from '../config/env';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type ApiClientMode = 'in-process' | 'http';

export interface RequestOptions {
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface ApiResponse<T = unknown> {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly durationMs: number;
  readonly data: T;
  readonly body: T;
  readonly ok: boolean;
  header(name: string): string | undefined;
  isSuccess(): boolean;
  isClientError(): boolean;
  isServerError(): boolean;
}

export class ApiResponseImpl<T = unknown> implements ApiResponse<T> {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly headers: Record<string, string>,
    public readonly durationMs: number,
    public readonly data: T,
    public readonly ok: boolean
  ) {}

  public get body(): T {
    return this.data;
  }

  public header(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }

  public isSuccess(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  public isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  public isServerError(): boolean {
    return this.status >= 500;
  }
}

export interface ApiClientOptions {
  mode?: ApiClientMode;
  baseUrl?: string;
  baseURL?: string;
  app?: Application;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  timeout?: number;
  fallbackToInProcess?: boolean;
}

export class ApiClient {
  private readonly mode: ApiClientMode;
  private readonly baseUrl: string;
  private readonly app: Application;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly fallbackToInProcess: boolean;

  constructor(options: ApiClientOptions = {}) {
    const rawUrl = options.baseURL ?? options.baseUrl ?? config.API_BASE_URL;
    this.baseUrl = rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
    this.app = options.app ?? createApp(getRepositories());
    this.mode = options.mode ?? 'http';
    this.defaultHeaders = {
      Accept: 'application/json',
      ...options.defaultHeaders,
    };
    this.timeoutMs = options.timeoutMs ?? options.timeout ?? config.DEFAULT_TIMEOUT_MS;
    this.fallbackToInProcess = options.fallbackToInProcess ?? true;
  }

  public getMode(): ApiClientMode {
    return this.mode;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async get<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  public async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, options);
  }

  public async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, options);
  }

  public async delete<T = unknown>(
    path: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  public async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, options);
  }

  public async head(path: string, options?: RequestOptions): Promise<ApiResponse<null>> {
    return this.request<null>('HEAD', path, undefined, options);
  }

  public async options(path: string, options?: RequestOptions): Promise<ApiResponse<null>> {
    return this.request<null>('OPTIONS', path, undefined, options);
  }

  public async request<T = unknown>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    if (this.mode === 'in-process') {
      return this.executeInProcess<T>(method, path, body, options);
    }

    try {
      return await this.executeHttp<T>(method, path, body, options);
    } catch (err) {
      if (this.fallbackToInProcess) {
        return await this.executeInProcess<T>(method, path, body, options);
      }
      throw err;
    }
  }

  public async dispose(): Promise<void> {
    // Graceful cleanup hook for persistent HTTP connections or handles
  }

  private async executeInProcess<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const agent = supertest(this.app);
    let req: Test;

    switch (method) {
      case 'GET':
        req = agent.get(path);
        break;
      case 'POST':
        req = agent.post(path);
        break;
      case 'PUT':
        req = agent.put(path);
        break;
      case 'DELETE':
        req = agent.delete(path);
        break;
      case 'PATCH':
        req = agent.patch(path);
        break;
      case 'HEAD':
        req = agent.head(path);
        break;
      case 'OPTIONS':
        req = agent.options(path);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const combinedHeaders = { ...this.defaultHeaders, ...options?.headers };
    for (const [key, value] of Object.entries(combinedHeaders)) {
      req = req.set(key, value);
    }

    if (options?.query) {
      req = req.query(this.sanitizeQuery(options.query));
    }

    if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
      req = req.send(body as object);
    }

    const startTime = performance.now();
    const res = await req;
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

    const normalizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(res.headers)) {
      if (value !== undefined) {
        normalizedHeaders[key.toLowerCase()] = Array.isArray(value)
          ? value.join(', ')
          : String(value);
      }
    }

    const statusText = http.STATUS_CODES[res.status] ?? '';

    return new ApiResponseImpl<T>(
      res.status,
      statusText,
      normalizedHeaders,
      durationMs,
      res.body as T,
      res.status >= 200 && res.status < 300
    );
  }

  private async executeHttp<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const targetUrl = new URL(cleanPath, this.baseUrl);

    if (options?.query) {
      const sanitized = this.sanitizeQuery(options.query);
      for (const [key, value] of Object.entries(sanitized)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            targetUrl.searchParams.append(key, String(item));
          }
        } else if (value !== undefined && value !== null) {
          targetUrl.searchParams.append(key, String(value));
        }
      }
    }

    const combinedHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...options?.headers,
    };

    let requestBody: string | undefined = undefined;
    if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestBody = typeof body === 'string' ? body : JSON.stringify(body);
      if (!combinedHeaders['content-type'] && !combinedHeaders['Content-Type']) {
        combinedHeaders['content-type'] = 'application/json';
      }
    }

    const timeout = options?.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const startTime = performance.now();
    try {
      const response = await fetch(targetUrl.toString(), {
        method,
        headers: combinedHeaders,
        body: requestBody,
        signal: controller.signal,
      });
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

      const normalizedHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        normalizedHeaders[key.toLowerCase()] = value;
      });

      const rawText = await response.text();
      let parsedBody: unknown = rawText;
      const contentType = normalizedHeaders['content-type'] ?? '';
      if (contentType.includes('application/json') && rawText.trim().length > 0) {
        try {
          parsedBody = JSON.parse(rawText);
        } catch {
          parsedBody = rawText;
        }
      }

      return new ApiResponseImpl<T>(
        response.status,
        response.statusText || (http.STATUS_CODES[response.status] ?? ''),
        normalizedHeaders,
        durationMs,
        parsedBody as T,
        response.ok
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private sanitizeQuery(
    query: Record<string, unknown>
  ): Record<string, string | number | boolean | (string | number | boolean)[]> {
    const result: Record<string, string | number | boolean | (string | number | boolean)[]> = {};
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) {
          result[key] = val.map(v =>
            typeof v === 'object' ? JSON.stringify(v) : (v as string | number | boolean)
          );
        } else if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          result[key] = val;
        } else {
          result[key] = String(val);
        }
      }
    }
    return result;
  }
}

export default ApiClient;
