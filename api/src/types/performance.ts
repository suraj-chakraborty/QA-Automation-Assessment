/**
 * Performance Domain Model and Streak Types
 */

import { PaginationParams, SortOrder } from './common';

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run out'
  | 'stumped'
  | 'hit wicket'
  | 'not out';

export type PerformanceSortField = 'date' | 'runs';

export interface Performance {
  readonly id: number;
  readonly player_id: number;
  readonly match_id: number;
  readonly match_no: number;
  readonly date: string; // ISO 8601: YYYY-MM-DD
  readonly runs: number; // >= 0
  readonly balls_faced?: number;
  readonly fours?: number;
  readonly sixes?: number;
  readonly strike_rate?: number;
  readonly wickets?: number;
  readonly overs_bowled?: number;
  readonly maidens?: number;
  readonly runs_conceded?: number;
  readonly economy_rate?: number;
  readonly catches?: number;
  readonly run_outs?: number;
  readonly stumpings?: number;
  readonly is_out?: boolean;
  readonly dismissal_type?: DismissalType;
}

export interface PerformanceQueryParams extends PaginationParams {
  readonly player_id?: number;
  readonly match_id?: number;
  readonly min_runs?: number; // Integer 0..300
  readonly sort_by?: PerformanceSortField; // Default: 'date'
  readonly order?: SortOrder; // Default: 'desc'
}

export interface StreakRecord {
  readonly player_id: number;
  readonly player_name: string;
  readonly streak_start_date: string;
  readonly streak_end_date: string;
  readonly streak_length: number;
  readonly match_ids: readonly number[];
  readonly runs: readonly number[];
}
