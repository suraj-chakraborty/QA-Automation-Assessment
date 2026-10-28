/**
 * Smoke Step Definitions
 * Location: steps/smoke.steps.ts
 */

import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

/**
 * Health check response payload contract
 */
interface HealthCheckPayload {
  success: boolean;
  status: string;
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  environment: string;
}

/**
 * Player record entity contract
 */
interface PlayerRecord {
  id: number;
  name: string;
  team: string;
  role: string;
  total_runs: number;
  total_wickets: number;
  matches_played: number;
}

/**
 * Generic paginated response envelope contract
 */
interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    totalPages?: number;
  };
}

When(
  'I send a GET request to {string}',
  async function (this: CustomWorld, path: string): Promise<void> {
    const response = await this.apiClient.get(path);
    this.lastResponse = response;
  }
);

Then(
  'the response status code should be {int}',
  function (this: CustomWorld, expectedStatusCode: number): void {
    expect(this.lastResponse).toBeDefined();
    expect(this.lastResponse?.status).toBe(expectedStatusCode);
  }
);

Then(
  'the response body should contain status {string}',
  function (this: CustomWorld, expectedStatus: string): void {
    expect(this.lastResponse).toBeDefined();
    const data = this.lastResponse?.data as HealthCheckPayload;
    expect(data).toBeDefined();
    expect(data.status).toBe(expectedStatus);
    expect(data.success).toBe(true);
  }
);

Then(
  'the response body should have a valid health check payload',
  function (this: CustomWorld): void {
    expect(this.lastResponse).toBeDefined();
    const data = this.lastResponse?.data as HealthCheckPayload;
    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.status).toBe('ok');
    expect(typeof data.service).toBe('string');
    expect(data.service).toBe('streamhub-api');
    expect(typeof data.version).toBe('string');
    expect(typeof data.uptime).toBe('number');
    expect(data.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof data.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(data.timestamp))).toBe(false);
  }
);

Then(
  'the response body should be a paginated list with valid schema',
  function (this: CustomWorld): void {
    expect(this.lastResponse).toBeDefined();
    const data = this.lastResponse?.data as PaginatedResponse<PlayerRecord>;
    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(typeof data.count).toBe('number');
    expect(typeof data.total).toBe('number');
    expect(typeof data.page).toBe('number');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(data.count);
    expect(data.meta).toBeDefined();
    expect(typeof data.meta.page).toBe('number');
    expect(typeof data.meta.limit).toBe('number');
    expect(typeof data.meta.total).toBe('number');
    expect(typeof data.meta.total_pages).toBe('number');
  }
);

Then('the response should contain a non-empty list of players', function (this: CustomWorld): void {
  expect(this.lastResponse).toBeDefined();
  const data = this.lastResponse?.data as PaginatedResponse<PlayerRecord>;
  expect(data).toBeDefined();
  expect(data.data.length).toBeGreaterThanOrEqual(10);
  const firstPlayer = data.data[0];
  expect(firstPlayer).toBeDefined();
  if (firstPlayer) {
    expect(typeof firstPlayer.id).toBe('number');
    expect(firstPlayer.id).toBeGreaterThan(0);
    expect(typeof firstPlayer.name).toBe('string');
    expect(firstPlayer.name.length).toBeGreaterThan(0);
    expect(typeof firstPlayer.team).toBe('string');
    expect(typeof firstPlayer.role).toBe('string');
  }
});
