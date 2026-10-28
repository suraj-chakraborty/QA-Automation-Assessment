/**
 * Performances API Step Definitions
 * Location: steps/api/performances.steps.ts
 */

import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

export interface PerformanceEntity {
  id: number;
  player_id: number;
  match_id: number;
  match_no: number;
  date: string;
  runs: number;
  balls_faced?: number;
  fours?: number;
  sixes?: number;
  strike_rate?: number;
  wickets?: number;
  overs_bowled?: number;
  economy?: number;
  dismissal_type?: string;
}

export interface PerformanceListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  data: PerformanceEntity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

Then(
  'the response body should match the performance entity schema',
  function (this: CustomWorld): void {
    expect(this.lastResponse).toBeDefined();
    const body = this.lastResponse?.data as { success: boolean; data: PerformanceEntity };
    expect(body).toBeDefined();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(typeof body.data.id).toBe('number');
    expect(typeof body.data.player_id).toBe('number');
    expect(typeof body.data.match_id).toBe('number');
    expect(typeof body.data.runs).toBe('number');
  }
);

Then(
  'the response body should match the performances list schema',
  function (this: CustomWorld): void {
    expect(this.lastResponse).toBeDefined();
    const body = this.lastResponse?.data as PerformanceListResponse;
    expect(body).toBeDefined();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
  }
);

Then('the performance ID should be {int}', function (this: CustomWorld, expectedId: number): void {
  const body = this.lastResponse?.data as { data: PerformanceEntity };
  expect(body).toBeDefined();
  expect(body.data).toBeDefined();
  expect(body.data.id).toBe(expectedId);
});

Then(
  'all returned performances should have player_id {int}',
  function (this: CustomWorld, playerId: number): void {
    const body = this.lastResponse?.data as PerformanceListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const p of body.data) {
      expect(p.player_id).toBe(playerId);
    }
  }
);

Then(
  'all returned performances should have match_id {int}',
  function (this: CustomWorld, matchId: number): void {
    const body = this.lastResponse?.data as PerformanceListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const p of body.data) {
      expect(p.match_id).toBe(matchId);
    }
  }
);

Then(
  'all returned performances should have runs greater than or equal to {int}',
  function (this: CustomWorld, minRuns: number): void {
    const body = this.lastResponse?.data as PerformanceListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const p of body.data) {
      expect(p.runs).toBeGreaterThanOrEqual(minRuns);
    }
  }
);

Then(
  'the returned performances should be sorted by {string} in {string} order',
  function (this: CustomWorld, field: string, order: string): void {
    const body = this.lastResponse?.data as PerformanceListResponse;
    expect(body).toBeDefined();
    const items = body.data;
    for (let i = 0; i < items.length - 1; i++) {
      const current = items[i];
      const next = items[i + 1];
      expect(current).toBeDefined();
      expect(next).toBeDefined();
      if (current === undefined || next === undefined) continue;

      if (field === 'runs') {
        if (order === 'desc') expect(current.runs >= next.runs).toBe(true);
        else expect(current.runs <= next.runs).toBe(true);
      } else if (field === 'date') {
        const cmp = current.date.localeCompare(next.date);
        if (order === 'asc') expect(cmp <= 0).toBe(true);
        else expect(cmp >= 0).toBe(true);
      }
    }
  }
);
