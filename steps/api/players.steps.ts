/**
 * Player API Step Definitions
 * Location: steps/api/players.steps.ts
 */

import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

export interface PlayerEntity {
  id: number;
  name: string;
  team: string;
  role: string;
  batting_style?: string;
  bowling_style?: string;
  isOverseas?: boolean;
  total_runs: number;
  total_wickets: number;
  matches_played: number;
}

export interface PlayerListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  data: PlayerEntity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

Then('the response body should match the player entity schema', function (this: CustomWorld): void {
  expect(this.lastResponse).toBeDefined();
  const body = this.lastResponse?.data as { success: boolean; data: PlayerEntity };
  expect(body).toBeDefined();
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  expect(typeof body.data.id).toBe('number');
  expect(typeof body.data.name).toBe('string');
  expect(typeof body.data.team).toBe('string');
  expect(typeof body.data.role).toBe('string');
  expect(typeof body.data.total_runs).toBe('number');
});

Then('the response body should match the players list schema', function (this: CustomWorld): void {
  expect(this.lastResponse).toBeDefined();
  const body = this.lastResponse?.data as PlayerListResponse;
  expect(body).toBeDefined();
  expect(body.success).toBe(true);
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.meta).toBeDefined();
  expect(typeof body.meta.total_pages).toBe('number');
});

Then(
  'the created player ID should be stored in scenario context',
  function (this: CustomWorld): void {
    const body = this.lastResponse?.data as { data: PlayerEntity };
    expect(body).toBeDefined();
    expect(body.data).toBeDefined();
    expect(body.data.id).toBeDefined();
    this.setTestData('createdPlayerId', body.data.id);
  }
);

When('I request the created player by ID', async function (this: CustomWorld): Promise<void> {
  const id = this.getTestData<number>('createdPlayerId');
  this.lastResponse = await this.apiClient.get(`/api/players/${id}`);
});

When(
  'I update the created player with body:',
  async function (this: CustomWorld, docString: string): Promise<void> {
    const id = this.getTestData<number>('createdPlayerId');
    const payload = JSON.parse(docString) as Record<string, unknown>;
    this.lastResponse = await this.apiClient.put(`/api/players/${id}`, payload);
  }
);

When('I delete the created player', async function (this: CustomWorld): Promise<void> {
  const id = this.getTestData<number>('createdPlayerId');
  this.lastResponse = await this.apiClient.delete(`/api/players/${id}`);
});

Then(
  'the player name should be {string}',
  function (this: CustomWorld, expectedName: string): void {
    const body = this.lastResponse?.data as { data: PlayerEntity };
    expect(body).toBeDefined();
    expect(body.data).toBeDefined();
    expect(body.data.name).toBe(expectedName);
  }
);

Then(
  'the player total_runs should be {int}',
  function (this: CustomWorld, expectedRuns: number): void {
    const body = this.lastResponse?.data as { data: PlayerEntity };
    expect(body).toBeDefined();
    expect(body.data).toBeDefined();
    expect(body.data.total_runs).toBe(expectedRuns);
  }
);

Then(
  'the player matches_played should be {int}',
  function (this: CustomWorld, expectedMatches: number): void {
    const body = this.lastResponse?.data as { data: PlayerEntity };
    expect(body).toBeDefined();
    expect(body.data).toBeDefined();
    expect(body.data.matches_played).toBe(expectedMatches);
  }
);

Then(
  'all returned players should belong to team {string}',
  function (this: CustomWorld, team: string): void {
    const body = this.lastResponse?.data as PlayerListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const p of body.data) {
      expect(p.team).toBe(team);
    }
  }
);

Then(
  'all returned players should have role {string}',
  function (this: CustomWorld, role: string): void {
    const body = this.lastResponse?.data as PlayerListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const p of body.data) {
      expect(p.role).toBe(role);
    }
  }
);

Then(
  'all returned players names should contain {string} ignoring case',
  function (this: CustomWorld, query: string): void {
    const body = this.lastResponse?.data as PlayerListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const p of body.data) {
      expect(p.name.toLowerCase()).toContain(query.toLowerCase());
    }
  }
);

Then(
  'all returned players should have total_runs greater than or equal to {int}',
  function (this: CustomWorld, minRuns: number): void {
    const body = this.lastResponse?.data as PlayerListResponse;
    expect(body).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    for (const p of body.data) {
      expect(p.total_runs).toBeGreaterThanOrEqual(minRuns);
    }
  }
);

Then(
  'the returned players should be sorted by {string} in {string} order',
  function (this: CustomWorld, field: string, order: string): void {
    const body = this.lastResponse?.data as PlayerListResponse;
    expect(body).toBeDefined();
    const items = body.data;
    for (let i = 0; i < items.length - 1; i++) {
      const current = items[i];
      const next = items[i + 1];
      expect(current).toBeDefined();
      expect(next).toBeDefined();
      if (current === undefined || next === undefined) continue;

      if (field === 'name') {
        const cmp = current.name.localeCompare(next.name);
        if (order === 'asc') expect(cmp <= 0).toBe(true);
        else expect(cmp >= 0).toBe(true);
      } else if (field === 'total_runs') {
        if (order === 'desc') expect(current.total_runs >= next.total_runs).toBe(true);
        else expect(current.total_runs <= next.total_runs).toBe(true);
      } else if (field === 'team') {
        const cmp = current.team.localeCompare(next.team);
        if (order === 'asc') expect(cmp <= 0).toBe(true);
        else expect(cmp >= 0).toBe(true);
      }
    }
  }
);

Then(
  'the players on page 1 and page 2 should have no overlapping IDs',
  async function (this: CustomWorld): Promise<void> {
    const page2Res = this.lastResponse?.data as PlayerListResponse;
    expect(page2Res).toBeDefined();
    const page2Ids = new Set(page2Res.data.map(p => p.id));
    const page1Res = (await this.apiClient.get<PlayerListResponse>('/api/players?page=1&limit=5'))
      .data;
    expect(page1Res).toBeDefined();
    for (const p of page1Res.data) {
      expect(page2Ids.has(p.id)).toBe(false);
    }
  }
);
