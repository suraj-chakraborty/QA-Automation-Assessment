/**
 * Team Domain Model and Types
 */

export const TEAM_CODES = [
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

export type TeamCode = (typeof TEAM_CODES)[number];

export interface Team {
  readonly id: number;
  readonly code: TeamCode;
  readonly name: string;
  readonly city: string;
  readonly coach?: string;
  readonly home_venue: string;
}
