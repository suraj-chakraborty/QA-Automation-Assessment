/**
 * Data Verification Gate Script: api/scripts/verify-data.ts
 *
 * Comprehensive 7-Phase Verification Suite:
 * Phase 1: File Existence & JSON Parseability
 * Phase 2: Strict Zod Schema & Non-Negative Boundary Validation
 * Phase 3: Primary Key & Composite Uniqueness Checks
 * Phase 4: Foreign Key & Referential Integrity
 * Phase 5: Cross-Entity Consistency & Team Alignment
 * Phase 6: Assessment Variety & Distribution Metrics
 * Phase 7: SQL Streak Persona Validation (B4-S2 & B1 Traceability)
 *
 * Usage:
 *   npm run data:verify
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// ============================================================================
// 1. Zod Domain Schemas & Constants
// ============================================================================

export const CANONICAL_TEAM_CODES = [
  'CSK',
  'MI',
  'RCB',
  'KKR',
  'RR',
  'SRH',
  'DC',
  'PBKS',
  'PK',
  'LSG',
  'GT',
] as const;

export const PLAYER_ROLES = ['batter', 'bowler', 'all-rounder', 'wicketkeeper'] as const;

const TeamCodeEnum = z.enum(CANONICAL_TEAM_CODES);
const PlayerRoleEnum = z.enum(PLAYER_ROLES);
const DateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const TeamSchema = z.object({
  id: z.number().int().positive('Team ID must be a positive integer'),
  code: TeamCodeEnum,
  name: z.string().min(3, 'Team name must be at least 3 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  home_venue: z.string().min(3, 'Home venue must be at least 3 characters'),
  coach: z.string().optional(),
});

export const PlayerSchema = z.object({
  id: z.number().int().positive('Player ID must be a positive integer'),
  name: z.string().min(2, 'Player name must be at least 2 characters'),
  team: TeamCodeEnum,
  teamId: z.number().int().positive().optional(),
  role: PlayerRoleEnum,
  total_runs: z.number().int().nonnegative('total_runs must be >= 0'),
  total_wickets: z.number().int().nonnegative('total_wickets must be >= 0'),
  matches_played: z.number().int().nonnegative('matches_played must be >= 0'),
  batting_style: z.string().optional(),
  bowling_style: z.string().optional(),
  isOverseas: z.boolean().optional(),
});

export const MatchSchema = z
  .object({
    id: z.number().int().positive('Match ID must be a positive integer'),
    match_no: z.number().int().positive('match_no must be a positive integer'),
    season: z.number().int().min(2020).max(2030, 'Season out of range'),
    date: z.string().regex(DateRegex, 'Date must be formatted as YYYY-MM-DD'),
    venue: z.string().min(3, 'Venue must be at least 3 characters'),
    homeTeamId: z.number().int().positive().optional(),
    awayTeamId: z.number().int().positive().optional(),
    home_team: TeamCodeEnum,
    away_team: TeamCodeEnum,
    toss_winner: TeamCodeEnum.optional(),
    toss_decision: z.enum(['bat', 'field']).optional(),
    winner: TeamCodeEnum.optional(),
    win_margin: z.number().int().nonnegative().optional(),
    win_type: z.enum(['runs', 'wickets', 'super_over', 'no_result']).optional(),
    player_of_match_id: z.number().int().positive().optional(),
  })
  .refine(m => m.home_team !== m.away_team, {
    message: 'home_team and away_team cannot be identical',
  });

export const PerformanceSchema = z
  .object({
    id: z.number().int().positive('Performance ID must be a positive integer'),
    match_id: z.number().int().positive('match_id must be a positive integer'),
    player_id: z.number().int().positive('player_id must be a positive integer'),
    match_no: z.number().int().positive('match_no must be a positive integer'),
    date: z.string().regex(DateRegex, 'Date must be formatted as YYYY-MM-DD'),
    runs: z.number().int().nonnegative('runs must be >= 0'),
    balls_faced: z.number().int().nonnegative('balls_faced must be >= 0').optional(),
    fours: z.number().int().nonnegative('fours must be >= 0').optional(),
    sixes: z.number().int().nonnegative('sixes must be >= 0').optional(),
    strike_rate: z.number().nonnegative('strike_rate must be >= 0').optional(),
    wickets: z.number().int().nonnegative('wickets must be >= 0').optional(),
    overs_bowled: z.number().nonnegative('overs_bowled must be >= 0').optional(),
    maidens: z.number().int().nonnegative('maidens must be >= 0').optional(),
    runs_conceded: z.number().int().nonnegative('runs_conceded must be >= 0').optional(),
    economy_rate: z.number().nonnegative('economy_rate must be >= 0').optional(),
    catches: z.number().int().nonnegative('catches must be >= 0').optional(),
    run_outs: z.number().int().nonnegative('run_outs must be >= 0').optional(),
    stumpings: z.number().int().nonnegative('stumpings must be >= 0').optional(),
    is_out: z.boolean().optional(),
    dismissal_type: z.string().optional(),
  })
  .refine(
    p => {
      const fours = p.fours ?? 0;
      const sixes = p.sixes ?? 0;
      return fours * 4 + sixes * 6 <= p.runs;
    },
    {
      message: 'Boundary runs (4*fours + 6*sixes) cannot exceed total runs',
    }
  );

export type Team = z.infer<typeof TeamSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type Performance = z.infer<typeof PerformanceSchema>;

// ============================================================================
// 2. Verification Harness
// ============================================================================

interface DiagnosticError {
  phase: string;
  entity: string;
  identifier: string | number;
  message: string;
}

class VerificationHarness {
  private errors: DiagnosticError[] = [];
  private checksPassed = 0;

  recordPass(count = 1): void {
    this.checksPassed += count;
  }

  recordError(phase: string, entity: string, identifier: string | number, message: string): void {
    this.errors.push({ phase, entity, identifier, message });
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  printSummary(): void {
    console.log('\n============================================================');
    console.log('            DATA VERIFICATION GATE EXECUTION REPORT          ');
    console.log('============================================================\n');

    if (this.errors.length === 0) {
      console.log(
        `[PASS] All ${this.checksPassed} verification assertions completed successfully.`
      );
      console.log(
        '       Referential integrity, uniqueness, schemas, variety & personas: 100% VALID.\n'
      );
    } else {
      console.error(`[FAIL] Detected ${this.errors.length} validation error(s):\n`);
      for (const err of this.errors) {
        console.error(
          `  - [${err.phase}] Entity: ${err.entity} (ID: ${err.identifier}) => ${err.message}`
        );
      }
      console.error(
        `\n[FATAL] Data verification gate FAILED with ${this.errors.length} error(s).\n`
      );
    }
  }
}

// ============================================================================
// 3. Verification Engine
// ============================================================================

export function verifyDataset(dataDir: string): boolean {
  const harness = new VerificationHarness();

  console.log(`[INFO] Starting data verification gate against: ${dataDir}`);

  // --------------------------------------------------------------------------
  // Phase 1: File Existence & JSON Parseability
  // --------------------------------------------------------------------------
  const requiredFiles = {
    teams: path.join(dataDir, 'teams.json'),
    players: path.join(dataDir, 'players.json'),
    matches: path.join(dataDir, 'matches.json'),
    performances: path.join(dataDir, 'performances.json'),
  };

  let rawTeams: unknown[] = [];
  let rawPlayers: unknown[] = [];
  let rawMatches: unknown[] = [];
  let rawPerformances: unknown[] = [];

  for (const [key, filePath] of Object.entries(requiredFiles)) {
    if (!fs.existsSync(filePath)) {
      harness.recordError('Phase 1: File Check', key, filePath, `File does not exist: ${filePath}`);
      continue;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      if (!Array.isArray(parsed)) {
        harness.recordError(
          'Phase 1: File Check',
          key,
          filePath,
          'Root content must be a JSON array'
        );
        continue;
      }
      if (key === 'teams') rawTeams = parsed;
      if (key === 'players') rawPlayers = parsed;
      if (key === 'matches') rawMatches = parsed;
      if (key === 'performances') rawPerformances = parsed;
      harness.recordPass();
    } catch (e) {
      harness.recordError(
        'Phase 1: File Check',
        key,
        filePath,
        `JSON syntax error: ${(e as Error).message}`
      );
    }
  }

  if (harness.hasErrors()) {
    harness.printSummary();
    return false;
  }

  // --------------------------------------------------------------------------
  // Phase 2: Schema & Non-Negative Boundary Validation
  // --------------------------------------------------------------------------
  const validTeams: Team[] = [];
  for (let i = 0; i < rawTeams.length; i++) {
    const res = TeamSchema.safeParse(rawTeams[i]);
    if (!res.success) {
      harness.recordError(
        'Phase 2: Schema',
        'Team',
        i,
        res.error.issues.map(it => `${it.path.join('.')}: ${it.message}`).join('; ')
      );
    } else {
      validTeams.push(res.data);
      harness.recordPass();
    }
  }

  const validPlayers: Player[] = [];
  for (let i = 0; i < rawPlayers.length; i++) {
    const res = PlayerSchema.safeParse(rawPlayers[i]);
    if (!res.success) {
      harness.recordError(
        'Phase 2: Schema',
        'Player',
        i,
        res.error.issues.map(it => `${it.path.join('.')}: ${it.message}`).join('; ')
      );
    } else {
      validPlayers.push(res.data);
      harness.recordPass();
    }
  }

  const validMatches: Match[] = [];
  for (let i = 0; i < rawMatches.length; i++) {
    const res = MatchSchema.safeParse(rawMatches[i]);
    if (!res.success) {
      harness.recordError(
        'Phase 2: Schema',
        'Match',
        i,
        res.error.issues.map(it => `${it.path.join('.')}: ${it.message}`).join('; ')
      );
    } else {
      const parsedDate = new Date(res.data.date);
      if (isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== res.data.date) {
        harness.recordError(
          'Phase 2: Schema',
          'Match',
          res.data.id,
          `Invalid calendar date: ${res.data.date}`
        );
      } else {
        validMatches.push(res.data);
        harness.recordPass();
      }
    }
  }

  const validPerformances: Performance[] = [];
  for (let i = 0; i < rawPerformances.length; i++) {
    const res = PerformanceSchema.safeParse(rawPerformances[i]);
    if (!res.success) {
      harness.recordError(
        'Phase 2: Schema',
        'Performance',
        i,
        res.error.issues.map(it => `${it.path.join('.')}: ${it.message}`).join('; ')
      );
    } else {
      validPerformances.push(res.data);
      harness.recordPass();
    }
  }

  // --------------------------------------------------------------------------
  // Phase 3: Primary Key & Composite Uniqueness Checks
  // --------------------------------------------------------------------------
  const teamIdSet = new Set<number>();
  const teamCodeMap = new Map<string, Team>();
  for (const team of validTeams) {
    if (teamIdSet.has(team.id)) {
      harness.recordError('Phase 3: Unique PK', 'Team', team.id, 'Duplicate team.id');
    }
    teamIdSet.add(team.id);

    const normCode = team.code === 'PK' ? 'PBKS' : team.code;
    if (teamCodeMap.has(normCode)) {
      harness.recordError('Phase 3: Unique PK', 'Team', team.code, 'Duplicate team.code');
    }
    teamCodeMap.set(normCode, team);
    harness.recordPass();
  }

  const playerIdMap = new Map<number, Player>();
  for (const player of validPlayers) {
    if (playerIdMap.has(player.id)) {
      harness.recordError('Phase 3: Unique PK', 'Player', player.id, 'Duplicate player.id');
    }
    playerIdMap.set(player.id, player);
    harness.recordPass();
  }

  const matchIdMap = new Map<number, Match>();
  const matchSeasonSeqSet = new Set<string>();
  for (const match of validMatches) {
    if (matchIdMap.has(match.id)) {
      harness.recordError('Phase 3: Unique PK', 'Match', match.id, 'Duplicate match.id');
    }
    matchIdMap.set(match.id, match);

    const seqKey = `${match.season}:${match.match_no}`;
    if (matchSeasonSeqSet.has(seqKey)) {
      harness.recordError(
        'Phase 3: Unique PK',
        'Match',
        seqKey,
        'Duplicate (season, match_no) sequence'
      );
    }
    matchSeasonSeqSet.add(seqKey);
    harness.recordPass();
  }

  const performanceIdSet = new Set<number>();
  const playerMatchCompositeSet = new Set<string>();
  for (const perf of validPerformances) {
    if (performanceIdSet.has(perf.id)) {
      harness.recordError('Phase 3: Unique PK', 'Performance', perf.id, 'Duplicate performance.id');
    }
    performanceIdSet.add(perf.id);

    const compositeKey = `${perf.player_id}:${perf.match_id}`;
    if (playerMatchCompositeSet.has(compositeKey)) {
      harness.recordError(
        'Phase 3: Unique PK',
        'Performance',
        compositeKey,
        'Duplicate (player_id, match_id) appearance in same match'
      );
    }
    playerMatchCompositeSet.add(compositeKey);
    harness.recordPass();
  }

  // --------------------------------------------------------------------------
  // Phase 4: Foreign Key & Referential Integrity
  // --------------------------------------------------------------------------
  const normalizeTeamCode = (code: string): string => (code === 'PK' ? 'PBKS' : code);

  for (const player of validPlayers) {
    if (!teamCodeMap.has(normalizeTeamCode(player.team))) {
      harness.recordError(
        'Phase 4: FK Check',
        'Player',
        player.id,
        `player.team '${player.team}' does not exist in teams.json`
      );
    } else {
      harness.recordPass();
    }
  }

  for (const match of validMatches) {
    if (!teamCodeMap.has(normalizeTeamCode(match.home_team))) {
      harness.recordError(
        'Phase 4: FK Check',
        'Match',
        match.id,
        `match.home_team '${match.home_team}' does not exist in teams.json`
      );
    }
    if (!teamCodeMap.has(normalizeTeamCode(match.away_team))) {
      harness.recordError(
        'Phase 4: FK Check',
        'Match',
        match.id,
        `match.away_team '${match.away_team}' does not exist in teams.json`
      );
    }
    if (match.player_of_match_id !== undefined && !playerIdMap.has(match.player_of_match_id)) {
      harness.recordError(
        'Phase 4: FK Check',
        'Match',
        match.id,
        `match.player_of_match_id ${match.player_of_match_id} does not exist in players.json`
      );
    }
    harness.recordPass();
  }

  for (const perf of validPerformances) {
    if (!playerIdMap.has(perf.player_id)) {
      harness.recordError(
        'Phase 4: FK Check',
        'Performance',
        perf.id,
        `performance.player_id ${perf.player_id} does not exist in players.json`
      );
    }
    if (!matchIdMap.has(perf.match_id)) {
      harness.recordError(
        'Phase 4: FK Check',
        'Performance',
        perf.id,
        `performance.match_id ${perf.match_id} does not exist in matches.json`
      );
    }
    harness.recordPass();
  }

  // --------------------------------------------------------------------------
  // Phase 5: Cross-Entity Consistency & Team Alignment
  // --------------------------------------------------------------------------
  const playerRunsMap = new Map<number, number>();
  const playerWicketsMap = new Map<number, number>();
  const playerMatchesCountMap = new Map<number, number>();

  for (const perf of validPerformances) {
    const player = playerIdMap.get(perf.player_id);
    const match = matchIdMap.get(perf.match_id);

    if (player && match) {
      // 1. Team alignment
      const playerTeam = normalizeTeamCode(player.team);
      const homeTeam = normalizeTeamCode(match.home_team);
      const awayTeam = normalizeTeamCode(match.away_team);

      if (playerTeam !== homeTeam && playerTeam !== awayTeam) {
        harness.recordError(
          'Phase 5: Alignment',
          'Performance',
          perf.id,
          `Player team (${player.team}) was not participating in match ${match.id} (${match.home_team} vs ${match.away_team})`
        );
      } else {
        harness.recordPass();
      }

      // 2. Denormalized field sync
      if (perf.match_no !== match.match_no) {
        harness.recordError(
          'Phase 5: Sync',
          'Performance',
          perf.id,
          `performance.match_no (${perf.match_no}) does not match match.match_no (${match.match_no})`
        );
      }
      if (perf.date !== match.date) {
        harness.recordError(
          'Phase 5: Sync',
          'Performance',
          perf.id,
          `performance.date (${perf.date}) does not match match.date (${match.date})`
        );
      }

      // 3. Accumulate player stats
      playerRunsMap.set(player.id, (playerRunsMap.get(player.id) ?? 0) + perf.runs);
      playerWicketsMap.set(player.id, (playerWicketsMap.get(player.id) ?? 0) + (perf.wickets ?? 0));
      playerMatchesCountMap.set(player.id, (playerMatchesCountMap.get(player.id) ?? 0) + 1);
    }
  }

  // Aggregate stats reconciliation
  for (const player of validPlayers) {
    const computedRuns = playerRunsMap.get(player.id) ?? 0;
    const computedWickets = playerWicketsMap.get(player.id) ?? 0;
    const computedMatches = playerMatchesCountMap.get(player.id) ?? 0;

    if (computedRuns !== player.total_runs) {
      harness.recordError(
        'Phase 5: Aggregates',
        'Player',
        player.id,
        `player.total_runs (${player.total_runs}) does not equal sum of performance runs (${computedRuns})`
      );
    }
    if (computedWickets !== player.total_wickets) {
      harness.recordError(
        'Phase 5: Aggregates',
        'Player',
        player.id,
        `player.total_wickets (${player.total_wickets}) does not equal sum of performance wickets (${computedWickets})`
      );
    }
    if (computedMatches !== player.matches_played) {
      harness.recordError(
        'Phase 5: Aggregates',
        'Player',
        player.id,
        `player.matches_played (${player.matches_played}) does not equal total performances count (${computedMatches})`
      );
    }
    harness.recordPass();
  }

  // --------------------------------------------------------------------------
  // Phase 6: Assessment Variety & Distribution Metrics
  // --------------------------------------------------------------------------
  if (validTeams.length !== 10) {
    harness.recordError(
      'Phase 6: Variety',
      'Teams',
      validTeams.length,
      `Expected exactly 10 teams, found ${validTeams.length}`
    );
  } else {
    harness.recordPass();
  }

  if (validPlayers.length < 40) {
    harness.recordError(
      'Phase 6: Variety',
      'Players',
      validPlayers.length,
      `Expected at least 40 players, found ${validPlayers.length}`
    );
  } else {
    harness.recordPass();
  }

  if (validMatches.length < 40) {
    harness.recordError(
      'Phase 6: Variety',
      'Matches',
      validMatches.length,
      `Expected at least 40 matches, found ${validMatches.length}`
    );
  } else {
    harness.recordPass();
  }

  // Role diversity check
  const roleCounts: Record<string, number> = {};
  for (const p of validPlayers) {
    roleCounts[p.role] = (roleCounts[p.role] ?? 0) + 1;
  }
  for (const role of PLAYER_ROLES) {
    const count = roleCounts[role] ?? 0;
    if (count < 5) {
      harness.recordError(
        'Phase 6: Variety',
        'PlayerRoles',
        role,
        `Expected at least 5 players with role '${role}', found ${count}`
      );
    } else {
      harness.recordPass();
    }
  }

  // Venue diversity
  const uniqueVenues = new Set(validMatches.map(m => m.venue));
  if (uniqueVenues.size < 5) {
    harness.recordError(
      'Phase 6: Variety',
      'Venues',
      uniqueVenues.size,
      `Expected at least 5 distinct venues, found ${uniqueVenues.size}`
    );
  } else {
    harness.recordPass();
  }

  // Season date span
  const season2024Dates = validMatches
    .filter(m => m.season === 2024)
    .map(m => new Date(m.date).getTime())
    .sort((a, b) => a - b);

  if (season2024Dates.length > 0) {
    const earliest = season2024Dates[0];
    const latest = season2024Dates[season2024Dates.length - 1];
    if (earliest !== undefined && latest !== undefined) {
      const spanDays = (latest - earliest) / (1000 * 60 * 60 * 24);
      if (spanDays < 30) {
        harness.recordError(
          'Phase 6: Variety',
          'DateSpan',
          `${spanDays} days`,
          `Season 2024 matches must span at least 30 days, found ${spanDays}`
        );
      } else {
        harness.recordPass();
      }
    }
  }

  // Zero runs & Century presence
  const hasZeroRuns = validPerformances.some(p => p.runs === 0);
  if (!hasZeroRuns) {
    harness.recordError(
      'Phase 6: Variety',
      'Performances',
      'ZeroRuns',
      'Dataset must contain at least one performance with runs === 0'
    );
  } else {
    harness.recordPass();
  }

  const hasCentury = validPerformances.some(p => p.runs >= 100);
  if (!hasCentury) {
    harness.recordError(
      'Phase 6: Variety',
      'Performances',
      'HighScorer',
      'Dataset must contain at least one performance with runs >= 100'
    );
  } else {
    harness.recordPass();
  }

  // --------------------------------------------------------------------------
  // Phase 7: SQL Streak Persona Validation (B4-S2 & B1 Traceability)
  // --------------------------------------------------------------------------
  const playerPerfsMap = new Map<number, Performance[]>();
  for (const perf of validPerformances) {
    const list = playerPerfsMap.get(perf.player_id) ?? [];
    list.push(perf);
    playerPerfsMap.set(perf.player_id, list);
  }

  // Sort chronological for each player
  for (const perfs of playerPerfsMap.values()) {
    perfs.sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.match_no - b.match_no;
    });
  }

  // Persona 1: Liam Sterling (Player 1) - 5 consecutive with >= 30 runs
  const p1Perfs = (playerPerfsMap.get(1) ?? []).filter(p => {
    const m = matchIdMap.get(p.match_id);
    return m?.season === 2024;
  });
  let p1MaxStreak = 0;
  let p1Curr = 0;
  for (const p of p1Perfs) {
    if (p.runs >= 30) {
      p1Curr++;
      if (p1Curr > p1MaxStreak) p1MaxStreak = p1Curr;
    } else {
      p1Curr = 0;
    }
  }
  if (p1MaxStreak < 5) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 1',
      p1MaxStreak,
      `Player 1 must have at least 5 consecutive matches with >= 30 runs, found ${p1MaxStreak}`
    );
  } else {
    harness.recordPass();
  }

  // Persona 2: Aarav Varma (Player 2) - 3 consecutive with >= 50 runs
  const p2Perfs = (playerPerfsMap.get(2) ?? []).filter(p => {
    const m = matchIdMap.get(p.match_id);
    return m?.season === 2024;
  });
  let p2MaxStreak = 0;
  let p2Curr = 0;
  for (const p of p2Perfs) {
    if (p.runs >= 50) {
      p2Curr++;
      if (p2Curr > p2MaxStreak) p2MaxStreak = p2Curr;
    } else {
      p2Curr = 0;
    }
  }
  if (p2MaxStreak < 3) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 2',
      p2MaxStreak,
      `Player 2 must have at least 3 consecutive matches with >= 50 runs, found ${p2MaxStreak}`
    );
  } else {
    harness.recordPass();
  }

  // Persona 3: Carlos Vance (Player 3) - 4 consecutive with >= 1 wicket
  const p3Perfs = playerPerfsMap.get(3) ?? [];
  let p3MaxStreak = 0;
  let p3Curr = 0;
  for (const p of p3Perfs) {
    if ((p.wickets ?? 0) >= 1) {
      p3Curr++;
      if (p3Curr > p3MaxStreak) p3MaxStreak = p3Curr;
    } else {
      p3Curr = 0;
    }
  }
  if (p3MaxStreak < 4) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 3',
      p3MaxStreak,
      `Player 3 must have at least 4 consecutive matches with >= 1 wicket, found ${p3MaxStreak}`
    );
  } else {
    harness.recordPass();
  }

  // Persona 4: Devansh Patel (Player 4) - 3 consecutive with >= 2 wickets
  const p4Perfs = playerPerfsMap.get(4) ?? [];
  let p4MaxStreak = 0;
  let p4Curr = 0;
  for (const p of p4Perfs) {
    if ((p.wickets ?? 0) >= 2) {
      p4Curr++;
      if (p4Curr > p4MaxStreak) p4MaxStreak = p4Curr;
    } else {
      p4Curr = 0;
    }
  }
  if (p4MaxStreak < 3) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 4',
      p4MaxStreak,
      `Player 4 must have at least 3 consecutive matches with >= 2 wickets, found ${p4MaxStreak}`
    );
  } else {
    harness.recordPass();
  }

  // Persona 5: Kabir Sen (Player 5) - 3 consecutive with runs > 0 and wickets > 0
  const p5Perfs = playerPerfsMap.get(5) ?? [];
  let p5MaxStreak = 0;
  let p5Curr = 0;
  for (const p of p5Perfs) {
    if (p.runs > 0 && (p.wickets ?? 0) > 0) {
      p5Curr++;
      if (p5Curr > p5MaxStreak) p5MaxStreak = p5Curr;
    } else {
      p5Curr = 0;
    }
  }
  if (p5MaxStreak < 3) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 5',
      p5MaxStreak,
      `Player 5 must have at least 3 consecutive all-rounder matches with runs > 0 and wickets > 0, found ${p5MaxStreak}`
    );
  } else {
    harness.recordPass();
  }

  // Persona 6: Nathan Cross (Player 6) - Interrupted streak (e.g. 29 runs breaks >= 30 streak)
  const p6Perfs = playerPerfsMap.get(6) ?? [];
  const p6Has29 = p6Perfs.some(p => p.runs === 29);
  let p6MaxStreak = 0;
  let p6Curr = 0;
  for (const p of p6Perfs) {
    if (p.runs >= 30) {
      p6Curr++;
      if (p6Curr > p6MaxStreak) p6MaxStreak = p6Curr;
    } else {
      p6Curr = 0;
    }
  }
  if (!p6Has29 || p6MaxStreak >= 3) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 6',
      p6MaxStreak,
      'Player 6 must have an interrupted streak (29 runs breaking >= 30 streak with max streak < 3)'
    );
  } else {
    harness.recordPass();
  }

  // Persona 7: Tariq Al-Mansoor (Player 7) - Century streak (>= 100 runs)
  const p7Perfs = playerPerfsMap.get(7) ?? [];
  const p7HasCenturies = p7Perfs.filter(p => p.runs >= 100).length >= 2;
  if (!p7HasCenturies) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 7',
      'Centuries',
      'Player 7 must have a century streak with multiple >= 100 runs'
    );
  } else {
    harness.recordPass();
  }

  // Persona 8: Marcus Thorne (Player 8) - Zero streak
  const p8Perfs = playerPerfsMap.get(8) ?? [];
  let p8MaxZeroStreak = 0;
  let p8ZeroCurr = 0;
  for (const p of p8Perfs) {
    if (p.runs === 0) {
      p8ZeroCurr++;
      if (p8ZeroCurr > p8MaxZeroStreak) p8MaxZeroStreak = p8ZeroCurr;
    } else {
      p8ZeroCurr = 0;
    }
  }
  if (p8MaxZeroStreak < 3) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 8',
      p8MaxZeroStreak,
      `Player 8 must have a zero streak of at least 3 consecutive 0 runs, found ${p8MaxZeroStreak}`
    );
  } else {
    harness.recordPass();
  }

  // Persona 9: Rohan Chakraborty (Player 9) - SR > 180 streak
  const p9Perfs = playerPerfsMap.get(9) ?? [];
  let p9MaxSRStreak = 0;
  let p9SRCurr = 0;
  for (const p of p9Perfs) {
    const sr = p.strike_rate ?? 0;
    if (sr > 180) {
      p9SRCurr++;
      if (p9SRCurr > p9MaxSRStreak) p9MaxSRStreak = p9SRCurr;
    } else {
      p9SRCurr = 0;
    }
  }
  if (p9MaxSRStreak < 3) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 9',
      p9MaxSRStreak,
      `Player 9 must have at least 3 consecutive matches with SR > 180, found ${p9MaxSRStreak}`
    );
  } else {
    harness.recordPass();
  }

  // Persona 10: Ethan Brooks (Player 10) - 2023 and 2024 performance
  const p10Perfs = playerPerfsMap.get(10) ?? [];
  const p10Seasons = new Set(
    p10Perfs
      .map(p => matchIdMap.get(p.match_id)?.season)
      .filter((s): s is number => s !== undefined)
  );
  if (!p10Seasons.has(2023) || !p10Seasons.has(2024)) {
    harness.recordError(
      'Phase 7: Streak Persona',
      'Player 10',
      Array.from(p10Seasons).join(', '),
      'Player 10 must have performances across both 2023 and 2024 seasons'
    );
  } else {
    harness.recordPass();
  }

  // 2023 match existence
  const has2023Match = validMatches.some(m => m.season === 2023);
  if (!has2023Match) {
    harness.recordError(
      'Phase 7: SQL Season',
      'Matches',
      'Season-2023',
      'Dataset must contain at least 1 match from season 2023 for SQL season exclusion testing'
    );
  } else {
    harness.recordPass();
  }

  // --------------------------------------------------------------------------
  // Summary & Return
  // --------------------------------------------------------------------------
  harness.printSummary();
  return !harness.hasErrors();
}

// Execution Entry Point
function main(): void {
  const apiDataDir = path.resolve(process.cwd(), 'api', 'data');
  const rootDataDir = path.resolve(process.cwd(), 'data');
  const targetDir = fs.existsSync(path.join(apiDataDir, 'players.json')) ? apiDataDir : rootDataDir;

  const success = verifyDataset(targetDir);
  process.exit(success ? 0 : 1);
}

// Only invoke when executed as CLI
if (
  process.argv[1]?.includes('verify-data') ||
  process.argv[1]?.endsWith('verify-data.ts') ||
  process.argv[1]?.endsWith('verify-data.js')
) {
  main();
}
