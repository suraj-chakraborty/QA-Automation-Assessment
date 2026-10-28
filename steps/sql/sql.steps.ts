/**
 * Cucumber Step Definitions for SQL Engineering (@sql)
 * Location: steps/sql/sql.steps.ts
 */

import { Given, When, Then, After, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { CustomWorld } from '../../support/world';
import { seedDatabase } from '../../scripts/seed-db';

interface RoundTripRow {
  txn_a_id: number;
  txn_b_id: number;
  account_a: string;
  account_b: string;
  amount_a_to_b: number;
  amount_b_to_a: number;
  pct_diff: number;
  sent_at: string;
  returned_at: string;
  hours_between: number;
}

interface StreakRow {
  player_name: string;
  streak_start_date: string;
  streak_end_date: string;
  streak_length: number;
}

After({ tags: '@sql' }, function (this: CustomWorld) {
  if (this.db) {
    this.db.close();
    this.db = undefined;
  }
});

Given(
  'an initialized SQLite database with round-trip transfer seed data',
  function (this: CustomWorld) {
    if (this.db) {
      this.db.close();
    }
    this.db = new Database(':memory:');
    seedDatabase(this.db);
  }
);

Given(
  'an initialized SQLite database with the IPL 2024 synthetic dataset',
  function (this: CustomWorld) {
    if (this.db) {
      this.db.close();
    }
    this.db = new Database(':memory:');
    seedDatabase(this.db);
  }
);

When(
  'I execute the round-trip transfer query {string}',
  function (this: CustomWorld, queryPath: string) {
    const fullPath = path.resolve(process.cwd(), queryPath);
    const sqlText = fs.readFileSync(fullPath, 'utf-8');
    const cleanSql = sqlText.replace(/--.*$/gm, '').trim();
    const rows = this.db!.prepare(cleanSql).all() as unknown as RoundTripRow[];
    this.setTestData('sqlResults', rows);
    console.log(`\n[SQL Execution Result] ${path.basename(queryPath)}:`);
    console.table(rows);
  }
);

When('I execute the IPL streaks query {string}', function (this: CustomWorld, queryPath: string) {
  const fullPath = path.resolve(process.cwd(), queryPath);
  const sqlText = fs.readFileSync(fullPath, 'utf-8');
  const cleanSql = sqlText.replace(/--.*$/gm, '').trim();
  const rows = this.db!.prepare(cleanSql).all() as unknown as StreakRow[];
  this.setTestData('sqlResults', rows);
  console.log(`\n[SQL Execution Result] ${path.basename(queryPath)}:`);
  console.table(rows);
});

Then(
  'the query should return exactly 5 matched transfer pairs:',
  function (this: CustomWorld, dataTable: DataTable) {
    const rows = this.getTestData<RoundTripRow[]>('sqlResults');
    const expected = dataTable.hashes();
    expect(rows.length).toBe(5);

    for (let i = 0; i < expected.length; i++) {
      const exp = expected[i]!;
      const actual = rows[i]!;
      expect(String(actual.txn_a_id)).toBe(exp.txn_a_id);
      expect(String(actual.txn_b_id)).toBe(exp.txn_b_id);
      expect(actual.account_a).toBe(exp.account_a);
      expect(actual.account_b).toBe(exp.account_b);
      expect(Number(actual.amount_a_to_b)).toBe(Number(exp.amount_a_to_b));
      expect(Number(actual.amount_b_to_a)).toBe(Number(exp.amount_b_to_a));
      expect(Number(actual.pct_diff)).toBe(Number(exp.pct_diff));
      expect(Number(actual.hours_between)).toBe(Number(exp.hours_between));
    }
  }
);

Then('no non-qualifying transactions should appear in the results', function (this: CustomWorld) {
  const rows = this.getTestData<RoundTripRow[]>('sqlResults');
  const nonQualifyingIds = [11, 12, 13, 14, 15, 16, 17];
  for (const row of rows) {
    expect(nonQualifyingIds).not.toContain(row.txn_a_id);
    expect(nonQualifyingIds).not.toContain(row.txn_b_id);
  }
});

Then(
  'the query should return exactly 5 qualifying streaks:',
  function (this: CustomWorld, dataTable: DataTable) {
    const rows = this.getTestData<StreakRow[]>('sqlResults');
    const expected = dataTable.hashes();
    expect(rows.length).toBe(5);

    for (let i = 0; i < expected.length; i++) {
      const exp = expected[i]!;
      const actual = rows[i]!;
      expect(actual.player_name).toBe(exp.player_name);
      expect(actual.streak_start_date).toBe(exp.streak_start_date);
      expect(actual.streak_end_date).toBe(exp.streak_end_date);
      expect(Number(actual.streak_length)).toBe(Number(exp.streak_length));
    }
  }
);

Then(
  'players with interrupted streaks like Nathan Cross should not appear',
  function (this: CustomWorld) {
    const rows = this.getTestData<StreakRow[]>('sqlResults');
    const playerNames = rows.map(r => r.player_name);
    expect(playerNames).not.toContain('Nathan Cross');
  }
);

Then('performances from 2023 season should be strictly excluded', function (this: CustomWorld) {
  const rows = this.getTestData<StreakRow[]>('sqlResults');
  for (const r of rows) {
    expect(r.streak_start_date).not.toContain('2023');
    expect(r.streak_end_date).not.toContain('2023');
  }
});
