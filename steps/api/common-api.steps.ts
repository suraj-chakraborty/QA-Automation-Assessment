/**
 * Common API Step Definitions
 * Location: steps/api/common-api.steps.ts
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

export interface ErrorEnvelope {
  success: boolean;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Array<{ field?: string; message: string; code?: string }>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  totalPages?: number;
}

Given('the API server is operational', async function (this: CustomWorld): Promise<void> {
  const res = await this.apiClient.get('/health');
  expect(res.status).toBe(200);
});

When(
  'I send a POST request to {string} with body:',
  async function (this: CustomWorld, path: string, docString: string): Promise<void> {
    const payload = JSON.parse(docString) as Record<string, unknown>;
    this.lastResponse = await this.apiClient.post(path, payload);
  }
);

When(
  'I send a PUT request to {string} with body:',
  async function (this: CustomWorld, path: string, docString: string): Promise<void> {
    const payload = JSON.parse(docString) as Record<string, unknown>;
    this.lastResponse = await this.apiClient.put(path, payload);
  }
);

When(
  'I send a DELETE request to {string}',
  async function (this: CustomWorld, path: string): Promise<void> {
    this.lastResponse = await this.apiClient.delete(path);
  }
);

When(
  'I send an unsupported PATCH request to {string}',
  async function (this: CustomWorld, path: string): Promise<void> {
    this.lastResponse = await this.apiClient.patch(path, {});
  }
);

When(
  'I send an unsupported DELETE request to {string}',
  async function (this: CustomWorld, path: string): Promise<void> {
    this.lastResponse = await this.apiClient.delete(path);
  }
);

When(
  'I send an unsupported POST request to {string} with body {string}',
  async function (this: CustomWorld, path: string, bodyStr: string): Promise<void> {
    const payload = JSON.parse(bodyStr) as Record<string, unknown>;
    this.lastResponse = await this.apiClient.post(path, payload);
  }
);

Then(
  'the response header {string} should contain {string}',
  function (this: CustomWorld, headerName: string, expectedValue: string): void {
    expect(this.lastResponse).toBeDefined();
    const actual = this.lastResponse?.header(headerName) ?? '';
    expect(actual.toLowerCase()).toContain(expectedValue.toLowerCase());
  }
);

Then(
  'the response header {string} should be present',
  function (this: CustomWorld, headerName: string): void {
    expect(this.lastResponse).toBeDefined();
    const val = this.lastResponse?.header(headerName);
    expect(val).toBeDefined();
    if (val !== undefined) {
      expect(val.length).toBeGreaterThan(0);
    }
  }
);

Then(
  'the response error code should be {string}',
  function (this: CustomWorld, expectedCode: string): void {
    expect(this.lastResponse).toBeDefined();
    const data = this.lastResponse?.data as ErrorEnvelope;
    expect(data).toBeDefined();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe(expectedCode);
  }
);

Then(
  'the response error message should contain {string}',
  function (this: CustomWorld, expectedMsg: string): void {
    expect(this.lastResponse).toBeDefined();
    const data = this.lastResponse?.data as ErrorEnvelope;
    expect(data).toBeDefined();
    expect(data.error).toBeDefined();
    expect(data.error.message.toLowerCase()).toContain(expectedMsg.toLowerCase());
  }
);

Then(
  'the response pagination meta should have page {int} and limit {int}',
  function (this: CustomWorld, expectedPage: number, expectedLimit: number): void {
    expect(this.lastResponse).toBeDefined();
    const data = this.lastResponse?.data as { meta?: PaginationMeta };
    expect(data).toBeDefined();
    expect(data.meta).toBeDefined();
    expect(data.meta?.page).toBe(expectedPage);
    expect(data.meta?.limit).toBe(expectedLimit);
  }
);

Then('the response data array should be empty', function (this: CustomWorld): void {
  expect(this.lastResponse).toBeDefined();
  const data = this.lastResponse?.data as { data?: unknown[] };
  expect(data).toBeDefined();
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data?.length).toBe(0);
});

Then(
  'the response data array should contain at least {int} items',
  function (this: CustomWorld, minCount: number): void {
    expect(this.lastResponse).toBeDefined();
    const data = this.lastResponse?.data as { data?: unknown[] };
    expect(data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data?.length).toBeGreaterThanOrEqual(minCount);
  }
);
