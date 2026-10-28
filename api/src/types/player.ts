/**
 * Player Domain Model and Query Parameter Types
 */

import { PaginationParams, SortOrder } from './common';
import { TeamCode } from './team';

export const PLAYER_ROLES = ['batter', 'bowler', 'all-rounder', 'wicketkeeper'] as const;

export type PlayerRole = (typeof PLAYER_ROLES)[number];

export type PlayerSortField = 'name' | 'team' | 'total_runs';

export interface Player {
  readonly id: number;
  readonly name: string;
  readonly team: TeamCode;
  readonly teamId?: number;
  readonly role: PlayerRole;
  readonly batting_style?: string;
  readonly bowling_style?: string;
  readonly isOverseas?: boolean;
  readonly total_runs: number;
  readonly total_wickets: number;
  readonly matches_played: number;
}

export interface PlayerQueryParams extends PaginationParams {
  readonly team?: TeamCode;
  readonly role?: PlayerRole;
  readonly q?: string; // Case-insensitive substring search (min 2 chars)
  readonly min_runs?: number; // Integer 0..1000
  readonly sort_by?: PlayerSortField; // Default: 'name'
  readonly order?: SortOrder; // Default: 'asc'
}
