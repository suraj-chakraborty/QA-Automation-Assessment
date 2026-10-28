/**
 * Streaks API Step Definitions
 * Location: steps/api/streaks.steps.ts
 */

import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

export interface StreakEntity {
  player_id: number;
  player_name: string;
  streak_start_date: string;
  streak_end_date: string;
  streak_length: number;
  match_ids: number[];
  runs: number[];
}

export interface StreakListResponse {
  success: boolean;
  count: number;
  data: StreakEntity[];
}

Then('the response body should match the streak list schema', function (this: CustomWorld): void {
  expect(this.lastResponse).toBeDefined();
  const body = this.lastResponse?.data as StreakListResponse;
  expect(body).toBeDefined();
  expect(body.success).toBe(true);
  expect(Array.isArray(body.data)).toBe(true);
  expect(typeof body.count).toBe('number');
});

Then(
  'all returned streaks should have streak_length greater than or equal to {int}',
  function (this: CustomWorld, minMatches: number): void {
    const body = this.lastResponse?.data as StreakListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const s of body.data) {
      expect(s.streak_length).toBeGreaterThanOrEqual(minMatches);
      expect(s.match_ids.length).toBe(s.streak_length);
      expect(s.runs.length).toBe(s.streak_length);
    }
  }
);

Then(
  'all returned streaks should have all match runs greater than or equal to {int}',
  function (this: CustomWorld, minRuns: number): void {
    const body = this.lastResponse?.data as StreakListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const s of body.data) {
      for (const run of s.runs) {
        expect(run).toBeGreaterThanOrEqual(minRuns);
      }
    }
  }
);

Then(
  'all returned streaks should have start date in year {int}',
  function (this: CustomWorld, year: number): void {
    const body = this.lastResponse?.data as StreakListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    const yrStr = String(year);
    for (const s of body.data) {
      expect(s.streak_start_date.startsWith(yrStr)).toBe(true);
    }
  }
);

Then(
  'the streak list should include persona {string} with streak length {int}',
  function (this: CustomWorld, personaName: string, expectedLength: number): void {
    expect(this.lastResponse).toBeDefined();
    const body = this.lastResponse?.data as StreakListResponse;
    expect(body).toBeDefined();
    const found = body.data.find(s => s.player_name === personaName);
    expect(found).toBeDefined();
    if (found !== undefined) {
      expect(found.streak_length).toBe(expectedLength);
    }
  }
);

Then(
  'the streak list should include persona {string} with streak length at least {int}',
  function (this: CustomWorld, personaName: string, minLength: number): void {
    expect(this.lastResponse).toBeDefined();
    const body = this.lastResponse?.data as StreakListResponse;
    expect(body).toBeDefined();
    const found = body.data.find(s => s.player_name === personaName);
    expect(found).toBeDefined();
    if (found !== undefined) {
      expect(found.streak_length).toBeGreaterThanOrEqual(minLength);
    }
  }
);
