/**
 * Matches API Step Definitions
 * Location: steps/api/matches.steps.ts
 */

import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

export interface MatchEntity {
  id: number;
  match_no: number;
  season: number;
  date: string;
  venue: string;
  home_team: string;
  away_team: string;
  toss_winner?: string;
  toss_decision?: string;
  winner?: string;
  win_margin?: number;
  win_type?: string;
}

export interface MatchListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  data: MatchEntity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

Then('the response body should match the match entity schema', function (this: CustomWorld): void {
  expect(this.lastResponse).toBeDefined();
  const body = this.lastResponse?.data as { success: boolean; data: MatchEntity };
  expect(body).toBeDefined();
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  expect(typeof body.data.id).toBe('number');
  expect(typeof body.data.match_no).toBe('number');
  expect(typeof body.data.date).toBe('string');
  expect(typeof body.data.venue).toBe('string');
  expect(typeof body.data.home_team).toBe('string');
  expect(typeof body.data.away_team).toBe('string');
});

Then('the response body should match the matches list schema', function (this: CustomWorld): void {
  expect(this.lastResponse).toBeDefined();
  const body = this.lastResponse?.data as MatchListResponse;
  expect(body).toBeDefined();
  expect(body.success).toBe(true);
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.meta).toBeDefined();
});

Then('the match ID should be {int}', function (this: CustomWorld, expectedId: number): void {
  const body = this.lastResponse?.data as { data: MatchEntity };
  expect(body).toBeDefined();
  expect(body.data).toBeDefined();
  expect(body.data.id).toBe(expectedId);
});

Then(
  'all returned matches should involve team {string}',
  function (this: CustomWorld, team: string): void {
    const body = this.lastResponse?.data as MatchListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const m of body.data) {
      const matchesTeam = m.home_team === team || m.away_team === team;
      expect(matchesTeam).toBe(true);
    }
  }
);

Then(
  'all returned matches should have venue containing {string} ignoring case',
  function (this: CustomWorld, venueSub: string): void {
    const body = this.lastResponse?.data as MatchListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const m of body.data) {
      expect(m.venue.toLowerCase()).toContain(venueSub.toLowerCase());
    }
  }
);

Then(
  'all returned matches should have dates between {string} and {string}',
  function (this: CustomWorld, fromDate: string, toDate: string): void {
    const body = this.lastResponse?.data as MatchListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const m of body.data) {
      expect(m.date >= fromDate).toBe(true);
      expect(m.date <= toDate).toBe(true);
    }
  }
);

Then(
  'the returned matches should be sorted by {string} in {string} order',
  function (this: CustomWorld, field: string, order: string): void {
    const body = this.lastResponse?.data as MatchListResponse;
    expect(body).toBeDefined();
    const items = body.data;
    for (let i = 0; i < items.length - 1; i++) {
      const current = items[i];
      const next = items[i + 1];
      expect(current).toBeDefined();
      expect(next).toBeDefined();
      if (current === undefined || next === undefined) continue;

      if (field === 'date') {
        const cmp = current.date.localeCompare(next.date);
        if (order === 'asc') expect(cmp <= 0).toBe(true);
        else expect(cmp >= 0).toBe(true);
      } else if (field === 'match_no') {
        if (order === 'asc') expect(current.match_no <= next.match_no).toBe(true);
        else expect(current.match_no >= next.match_no).toBe(true);
      }
    }
  }
);

Then(
  'the matches on page 1 and page 2 should have no overlapping IDs',
  async function (this: CustomWorld): Promise<void> {
    const page2Res = this.lastResponse?.data as MatchListResponse;
    expect(page2Res).toBeDefined();
    const page2Ids = new Set(page2Res.data.map(m => m.id));
    const page1Res = (await this.apiClient.get<MatchListResponse>('/api/matches?page=1&limit=5'))
      .data;
    expect(page1Res).toBeDefined();
    for (const m of page1Res.data) {
      expect(page2Ids.has(m.id)).toBe(false);
    }
  }
);
