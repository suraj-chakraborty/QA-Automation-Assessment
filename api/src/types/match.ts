/**
 * Match Domain Model and Query Parameter Types
 */

import { PaginationParams, SortOrder } from './common';
import { TeamCode } from './team';

export type TossDecision = 'bat' | 'field';
export type MatchWinType = 'runs' | 'wickets' | 'super_over' | 'no_result';
export type MatchSortField = 'date' | 'match_no';

export interface Match {
  readonly id: number;
  readonly match_no: number;
  readonly season: number;
  readonly date: string; // ISO 8601: YYYY-MM-DD
  readonly venue: string;
  readonly homeTeamId?: number;
  readonly awayTeamId?: number;
  readonly home_team: TeamCode;
  readonly away_team: TeamCode;
  readonly toss_winner?: TeamCode;
  readonly toss_decision?: TossDecision;
  readonly winner?: TeamCode;
  readonly win_margin?: number;
  readonly win_type?: MatchWinType;
  readonly player_of_match_id?: number;
}

export interface MatchQueryParams extends PaginationParams {
  readonly team?: TeamCode;
  readonly venue?: string;
  readonly date_from?: string; // YYYY-MM-DD
  readonly date_to?: string; // YYYY-MM-DD
  readonly sort_by?: MatchSortField; // Default: 'date'
  readonly order?: SortOrder; // Default: 'asc'
}
