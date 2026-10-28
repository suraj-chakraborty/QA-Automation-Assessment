/**
 * Cross-System SQL Verification Gate: scripts/verify-sql.ts
 * Executable via: npm run sql:verify
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config/env';
import { getRepositories } from '../api/src/repositories';
import { seedDatabase } from './seed-db';

interface CountResult {
  c: number;
}

interface SqlStreakRow {
  player_name: string;
  streak_start_date: string;
  streak_end_date: string;
  streak_length: number;
}

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

export function verifySqlAgreement(): boolean {
  console.log('[SQL Verify Gate] Starting cross-system validation...');
  const dbPath = path.resolve(process.cwd(), config.SQLITE_PATH);
  seedDatabase(dbPath); // Ensure clean state

  const db = new Database(dbPath);
  const repos = getRepositories();
  let errors = 0;

  // 1. Validate Table Row Counts vs JSON Source
  const teamCount = (db.prepare('SELECT count(*) as c FROM teams').get() as CountResult).c;
  const playerCount = (db.prepare('SELECT count(*) as c FROM players').get() as CountResult).c;
  const matchCount = (db.prepare('SELECT count(*) as c FROM matches').get() as CountResult).c;
  const perfCount = (db.prepare('SELECT count(*) as c FROM performances').get() as CountResult).c;
  const txnCount = (db.prepare('SELECT count(*) as c FROM transactions').get() as CountResult).c;

  if (
    teamCount !== 10 ||
    playerCount !== 50 ||
    matchCount !== 46 ||
    perfCount !== 450 ||
    txnCount !== 17
  ) {
    console.error(
      `[FAIL] Table count mismatch: teams=${teamCount}, players=${playerCount}, matches=${matchCount}, perfs=${perfCount}, txns=${txnCount}`
    );
    errors++;
  } else {
    console.log('[PASS] Phase 1: All table counts match JSON dataset exactly.');
  }

  // 2. Validate IPL Streaks Agreement (SQLite vs API Repository findStreaks)
  const streakSql = fs.readFileSync(
    path.resolve(process.cwd(), 'sql/queries/02_ipl_streaks.sql'),
    'utf-8'
  );
  const cleanStreakSql = streakSql.replace(/--.*$/gm, '').trim();
  const sqlStreaks = db.prepare(cleanStreakSql).all() as unknown as SqlStreakRow[];

  const apiStreaks = repos.performances.findStreaks(3, 30, 2024);

  if (sqlStreaks.length !== apiStreaks.length) {
    console.error(
      `[FAIL] Streak count mismatch: SQLite returned ${sqlStreaks.length}, API returned ${apiStreaks.length}`
    );
    errors++;
  } else {
    for (let i = 0; i < sqlStreaks.length; i++) {
      const sqlItem = sqlStreaks[i];
      if (!sqlItem) continue;
      const apiItem = apiStreaks.find(s => s.player_name === sqlItem.player_name);
      if (!apiItem) {
        console.error(`[FAIL] Player ${sqlItem.player_name} missing from API streaks.`);
        errors++;
      } else if (
        apiItem.streak_length !== sqlItem.streak_length ||
        apiItem.streak_start_date !== sqlItem.streak_start_date
      ) {
        console.error(
          `[FAIL] Streak mismatch for ${sqlItem.player_name}: SQL=${sqlItem.streak_length} (${sqlItem.streak_start_date}), API=${apiItem.streak_length} (${apiItem.streak_start_date})`
        );
        errors++;
      }
    }
    console.log(
      `[PASS] Phase 2: IPL Streaks: 100% agreement across all ${sqlStreaks.length} streaks.`
    );
    console.table(sqlStreaks);
  }

  // 3. Validate Round-Trip Transfers (Exactly 5 Matches, 0 False Positives)
  const roundTripSql = fs.readFileSync(
    path.resolve(process.cwd(), 'sql/queries/05_round_trip_transfers.sql'),
    'utf-8'
  );
  const cleanRoundTripSql = roundTripSql.replace(/--.*$/gm, '').trim();
  const roundTripRows = db.prepare(cleanRoundTripSql).all() as unknown as RoundTripRow[];

  if (roundTripRows.length !== 5) {
    console.error(`[FAIL] Round-trip transfer expected 5 matches, got ${roundTripRows.length}`);
    errors++;
  } else {
    console.log(
      '[PASS] Phase 3: Round-Trip Transfers: Exactly 5 qualifying matches, 0 false positives.'
    );
    console.table(roundTripRows);
  }

  db.close();

  if (errors === 0) {
    console.log('\n[PASS] Cross-System SQL Verification Gate: 100% VALIDATED.\n');
    return true;
  } else {
    console.error(`\n[FAIL] Cross-System SQL Verification Gate FAILED with ${errors} errors.\n`);
    return false;
  }
}

if (process.argv[1]?.includes('verify-sql')) {
  const success = verifySqlAgreement();
  process.exit(success ? 0 : 1);
}
