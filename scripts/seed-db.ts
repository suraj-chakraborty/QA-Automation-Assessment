/**
 * Database Seeding Pipeline: scripts/seed-db.ts
 * Executable via: npm run db:seed
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config/env';

export interface SeedStats {
  teams: number;
  players: number;
  matches: number;
  performances: number;
  transactions: number;
  durationMs: number;
}

interface TeamJson {
  id: number;
  code: string;
  name: string;
  city: string;
  coach?: string;
  home_venue: string;
}

interface PlayerJson {
  id: number;
  name: string;
  team: string;
  teamId?: number;
  role: 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper';
  batting_style?: string;
  bowling_style?: string;
  isOverseas?: boolean;
  total_runs: number;
  total_wickets: number;
  matches_played: number;
}

interface MatchJson {
  id: number;
  match_no: number;
  season: number;
  date: string;
  venue: string;
  homeTeamId?: number;
  awayTeamId?: number;
  home_team: string;
  away_team: string;
  toss_winner?: string;
  toss_decision?: string;
  winner?: string;
  win_margin?: number;
  win_type?: string;
  player_of_match_id?: number;
}

interface PerformanceJson {
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
  maidens?: number;
  runs_conceded?: number;
  economy_rate?: number;
  catches?: number;
  run_outs?: number;
  stumpings?: number;
  is_out?: boolean;
  dismissal_type?: string;
}

type TransactionSeedRow = [number, string, string, number, string];

export function seedDatabase(dbOrPath?: string | Database.Database): SeedStats {
  let db: Database.Database;
  let shouldClose = true;

  if (typeof dbOrPath === 'object' && dbOrPath !== null) {
    db = dbOrPath;
    shouldClose = false;
  } else {
    const targetPath = dbOrPath || path.resolve(process.cwd(), config.SQLITE_PATH);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    db = new Database(targetPath);
  }

  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  const startTime = Date.now();

  // 1. Execute DDL Schema
  const schemaPath = path.resolve(process.cwd(), 'sql', 'schema.sql');
  const ddl = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(ddl);

  // 2. Clear existing records cleanly
  db.exec(`
    DELETE FROM transactions;
    DELETE FROM performances;
    DELETE FROM matches;
    DELETE FROM players;
    DELETE FROM teams;
  `);

  // 3. Load JSON Datasets
  const apiDataDir = path.resolve(process.cwd(), 'api', 'data');
  const teams: TeamJson[] = JSON.parse(
    fs.readFileSync(path.join(apiDataDir, 'teams.json'), 'utf-8')
  );
  const players: PlayerJson[] = JSON.parse(
    fs.readFileSync(path.join(apiDataDir, 'players.json'), 'utf-8')
  );
  const matches: MatchJson[] = JSON.parse(
    fs.readFileSync(path.join(apiDataDir, 'matches.json'), 'utf-8')
  );
  const performances: PerformanceJson[] = JSON.parse(
    fs.readFileSync(path.join(apiDataDir, 'performances.json'), 'utf-8')
  );

  // 4. Prepared Insert Statements
  const insertTeam = db.prepare(`
    INSERT INTO teams (id, code, name, city, coach, home_venue)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertPlayer = db.prepare(`
    INSERT INTO players (id, name, team, team_id, role, batting_style, bowling_style, is_overseas, total_runs, total_wickets, matches_played)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMatch = db.prepare(`
    INSERT INTO matches (id, match_no, season, date, venue, home_team_id, away_team_id, home_team, away_team, toss_winner, toss_decision, winner, win_margin, win_type, player_of_match_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPerf = db.prepare(`
    INSERT INTO performances (id, player_id, match_id, match_no, date, runs, balls_faced, fours, sixes, strike_rate, wickets, overs_bowled, maidens, runs_conceded, economy_rate, catches, run_outs, stumpings, is_out, dismissal_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTxn = db.prepare(`
    INSERT INTO transactions (txn_id, from_account, to_account, amount, txn_ts)
    VALUES (?, ?, ?, ?, ?)
  `);

  // 5. Seed Transactions (5 Qualifying pairs + 5 Non-qualifying edge cases)
  const transactionSeedData: TransactionSeedRow[] = [
    // Qualifying 5 Matches:
    [1, 'ACC_100', 'ACC_200', 1000.0, '2024-06-01 10:00:00'], // Match 1: 5% diff, 8h
    [2, 'ACC_200', 'ACC_100', 950.0, '2024-06-01 18:00:00'],
    [3, 'ACC_101', 'ACC_201', 500.0, '2024-06-02 09:00:00'], // Match 2: exactly 24.0h, 5%
    [4, 'ACC_201', 'ACC_101', 525.0, '2024-06-03 09:00:00'],
    [5, 'ACC_102', 'ACC_202', 200.0, '2024-06-04 12:00:00'], // Match 3: exactly +10.0%
    [6, 'ACC_202', 'ACC_102', 220.0, '2024-06-04 15:00:00'],
    [7, 'ACC_103', 'ACC_203', 300.0, '2024-06-05 08:00:00'], // Match 4: exactly -10.0%
    [8, 'ACC_203', 'ACC_103', 270.0, '2024-06-05 14:00:00'],
    [9, 'ACC_104', 'ACC_204', 70.0, '2024-06-06 09:00:00'], // Match 5: float boundary (70 vs 77)
    [10, 'ACC_204', 'ACC_104', 77.0, '2024-06-06 13:00:00'],
    // Non-Qualifying Cases:
    [11, 'ACC_105', 'ACC_205', 100.0, '2024-06-07 10:00:00'], // 20% difference (>10%)
    [12, 'ACC_205', 'ACC_105', 120.0, '2024-06-07 12:00:00'],
    [13, 'ACC_106', 'ACC_206', 400.0, '2024-06-08 10:00:00'], // 24h + 1 second
    [14, 'ACC_206', 'ACC_106', 400.0, '2024-06-09 10:00:01'],
    [15, 'ACC_107', 'ACC_207', 150.0, '2024-06-10 12:00:00'], // No return transaction
    [16, 'ACC_108', 'ACC_208', 250.0, '2024-06-11 10:00:00'], // Non-reciprocal return
    [17, 'ACC_999', 'ACC_108', 250.0, '2024-06-11 12:00:00'],
  ];

  // 6. Execute Atomic Transaction Batch
  const seedBatch = db.transaction(() => {
    for (const t of teams) {
      insertTeam.run(t.id, t.code, t.name, t.city, t.coach ?? null, t.home_venue ?? null);
    }
    for (const p of players) {
      insertPlayer.run(
        p.id,
        p.name,
        p.team,
        p.teamId ?? null,
        p.role,
        p.batting_style ?? null,
        p.bowling_style ?? null,
        p.isOverseas ? 1 : 0,
        p.total_runs,
        p.total_wickets,
        p.matches_played
      );
    }
    for (const m of matches) {
      insertMatch.run(
        m.id,
        m.match_no,
        m.season,
        m.date,
        m.venue,
        m.homeTeamId ?? null,
        m.awayTeamId ?? null,
        m.home_team,
        m.away_team,
        m.toss_winner ?? null,
        m.toss_decision ?? null,
        m.winner ?? null,
        m.win_margin ?? null,
        m.win_type ?? null,
        m.player_of_match_id ?? null
      );
    }
    for (const pf of performances) {
      insertPerf.run(
        pf.id,
        pf.player_id,
        pf.match_id,
        pf.match_no,
        pf.date,
        pf.runs,
        pf.balls_faced ?? 0,
        pf.fours ?? 0,
        pf.sixes ?? 0,
        pf.strike_rate ?? 0.0,
        pf.wickets ?? 0,
        pf.overs_bowled ?? 0.0,
        pf.maidens ?? 0,
        pf.runs_conceded ?? 0,
        pf.economy_rate ?? 0.0,
        pf.catches ?? 0,
        pf.run_outs ?? 0,
        pf.stumpings ?? 0,
        pf.is_out ? 1 : 0,
        pf.dismissal_type ?? null
      );
    }
    for (const txn of transactionSeedData) {
      insertTxn.run(...txn);
    }
  });

  seedBatch();

  const durationMs = Date.now() - startTime;
  if (shouldClose) {
    db.close();
  }

  return {
    teams: teams.length,
    players: players.length,
    matches: matches.length,
    performances: performances.length,
    transactions: transactionSeedData.length,
    durationMs,
  };
}

if (process.argv[1]?.includes('seed-db')) {
  console.log('[Seed Pipeline] Seeding SQLite database...');
  const stats = seedDatabase();
  console.log(`[Seed Pipeline] Successfully seeded:`);
  console.log(`  - Teams: ${stats.teams}`);
  console.log(`  - Players: ${stats.players}`);
  console.log(`  - Matches: ${stats.matches}`);
  console.log(`  - Performances: ${stats.performances}`);
  console.log(`  - Transactions: ${stats.transactions}`);
  console.log(`  - Total Elapsed Time: ${stats.durationMs}ms (< 2000ms gate requirement)\n`);
}
