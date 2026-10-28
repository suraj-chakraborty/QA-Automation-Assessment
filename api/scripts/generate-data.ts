/**
 * Synthetic IPL Dataset Generator: api/scripts/generate-data.ts
 *
 * Generates mathematically consistent, referentially sound, synthetic IPL data:
 * - 10 teams (CSK, MI, RCB, KKR, RR, SRH, DC, PK/PBKS, LSG, GT)
 * - 50 fictional players (5 per team, IDs 1-50, all 4 roles represented)
 * - 46 matches (IDs 1-46; 45 in 2024 season, 1 in 2023 season)
 * - 450 player performances (IDs 1-450) with 10 deterministic streak personas
 *
 * Output: api/data/{teams,players,matches,performances}.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface TeamDef {
  id: number;
  code: string;
  name: string;
  city: string;
  coach: string;
  homeGround: string;
}

interface PlayerDef {
  id: number;
  name: string;
  team: string;
  teamId: number;
  role: 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper';
  battingStyle: string;
  bowlingStyle: string;
  isOverseas: boolean;
}

interface MatchDef {
  id: number;
  matchNo: number;
  season: number;
  date: string;
  venue: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: string;
  awayTeam: string;
  tossWinnerTeamId: number;
  tossWinner: string;
  tossDecision: 'bat' | 'field';
  winnerTeamId: number;
  winner: string;
  winMarginRuns?: number;
  winMarginWickets?: number;
  winMargin: number;
  winType: 'runs' | 'wickets';
  playerOfMatchId: number;
}

interface PerformanceDef {
  id: number;
  player_id: number;
  match_id: number;
  match_no: number;
  date: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  wickets: number;
  overs_bowled: number;
  maidens: number;
  runs_conceded: number;
  economy_rate: number;
  catches: number;
  run_outs: number;
  stumpings: number;
  is_out: boolean;
  dismissal_type?: string;
}

export function generateAllData(): {
  teams: unknown[];
  players: unknown[];
  matches: unknown[];
  performances: unknown[];
} {
  // 1. 10 Franchises
  const teams: TeamDef[] = [
    {
      id: 1,
      code: 'CSK',
      name: 'Chennai Super Kings',
      city: 'Chennai',
      coach: 'Stephen Fleming',
      homeGround: 'M. A. Chidambaram Stadium',
    },
    {
      id: 2,
      code: 'MI',
      name: 'Mumbai Indians',
      city: 'Mumbai',
      coach: 'Mark Boucher',
      homeGround: 'Wankhede Stadium',
    },
    {
      id: 3,
      code: 'RCB',
      name: 'Royal Challengers Bengaluru',
      city: 'Bengaluru',
      coach: 'Andy Flower',
      homeGround: 'M. Chinnaswamy Stadium',
    },
    {
      id: 4,
      code: 'KKR',
      name: 'Kolkata Knight Riders',
      city: 'Kolkata',
      coach: 'Chandrakant Pandit',
      homeGround: 'Eden Gardens',
    },
    {
      id: 5,
      code: 'RR',
      name: 'Rajasthan Royals',
      city: 'Jaipur',
      coach: 'Kumar Sangakkara',
      homeGround: 'Sawai Mansingh Stadium',
    },
    {
      id: 6,
      code: 'SRH',
      name: 'Sunrisers Hyderabad',
      city: 'Hyderabad',
      coach: 'Daniel Vettori',
      homeGround: 'Rajiv Gandhi Intl Cricket Stadium',
    },
    {
      id: 7,
      code: 'DC',
      name: 'Delhi Capitals',
      city: 'Delhi',
      coach: 'Ricky Ponting',
      homeGround: 'Arun Jaitley Stadium',
    },
    {
      id: 8,
      code: 'PK',
      name: 'Punjab Kings',
      city: 'Mohali',
      coach: 'Trevor Bayliss',
      homeGround: 'HPCA Stadium',
    },
    {
      id: 9,
      code: 'LSG',
      name: 'Lucknow Super Giants',
      city: 'Lucknow',
      coach: 'Justin Langer',
      homeGround: 'BRSABV Ekana Cricket Stadium',
    },
    {
      id: 10,
      code: 'GT',
      name: 'Gujarat Titans',
      city: 'Ahmedabad',
      coach: 'Ashish Nehra',
      homeGround: 'Narendra Modi Stadium',
    },
  ];

  // 2. 50 Fictional Players (5 per team)
  const playersDef: PlayerDef[] = [
    // MI (Team 2)
    {
      id: 1,
      name: 'Liam Sterling',
      team: 'MI',
      teamId: 2,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      isOverseas: true,
    },
    {
      id: 15,
      name: 'Aryan Kulkarni',
      team: 'MI',
      teamId: 2,
      role: 'wicketkeeper',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 16,
      name: 'Jayden Miller',
      team: 'MI',
      teamId: 2,
      role: 'all-rounder',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast',
      isOverseas: true,
    },
    {
      id: 17,
      name: 'Vikram Singhania',
      team: 'MI',
      teamId: 2,
      role: 'bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm legbreak',
      isOverseas: false,
    },
    {
      id: 18,
      name: 'Samar Bose',
      team: 'MI',
      teamId: 2,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },

    // CSK (Team 1)
    {
      id: 2,
      name: 'Aarav Varma',
      team: 'CSK',
      teamId: 1,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      isOverseas: false,
    },
    {
      id: 11,
      name: 'Zayd Farooqi',
      team: 'CSK',
      teamId: 1,
      role: 'wicketkeeper',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 12,
      name: 'Nikhil Reddy',
      team: 'CSK',
      teamId: 1,
      role: 'all-rounder',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Slow left-arm orthodox',
      isOverseas: false,
    },
    {
      id: 13,
      name: 'Haris Qureshi',
      team: 'CSK',
      teamId: 1,
      role: 'bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast-medium',
      isOverseas: false,
    },
    {
      id: 14,
      name: 'Neil Vance',
      team: 'CSK',
      teamId: 1,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },

    // RCB (Team 3)
    {
      id: 3,
      name: 'Carlos Vance',
      team: 'RCB',
      teamId: 3,
      role: 'all-rounder',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Left-arm fast-medium',
      isOverseas: true,
    },
    {
      id: 19,
      name: 'Lucas Meyer',
      team: 'RCB',
      teamId: 3,
      role: 'wicketkeeper',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },
    {
      id: 20,
      name: 'Adhiraj Roy',
      team: 'RCB',
      teamId: 3,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 21,
      name: 'Bilal Sheikh',
      team: 'RCB',
      teamId: 3,
      role: 'bowler',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Left-arm fast',
      isOverseas: false,
    },
    {
      id: 22,
      name: 'Sean O Connor',
      team: 'RCB',
      teamId: 3,
      role: 'batter',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },

    // KKR (Team 4)
    {
      id: 4,
      name: 'Devansh Patel',
      team: 'KKR',
      teamId: 4,
      role: 'bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm legbreak',
      isOverseas: false,
    },
    {
      id: 23,
      name: 'Tanmay Joshi',
      team: 'KKR',
      teamId: 4,
      role: 'wicketkeeper',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 24,
      name: 'Darren Holt',
      team: 'KKR',
      teamId: 4,
      role: 'all-rounder',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      isOverseas: true,
    },
    {
      id: 25,
      name: 'Farhan Baig',
      team: 'KKR',
      teamId: 4,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 26,
      name: 'Yashwardhan Rao',
      team: 'KKR',
      teamId: 4,
      role: 'batter',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },

    // RR (Team 5)
    {
      id: 5,
      name: 'Kabir Sen',
      team: 'RR',
      teamId: 5,
      role: 'all-rounder',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      isOverseas: false,
    },
    {
      id: 27,
      name: 'Oscar Davies',
      team: 'RR',
      teamId: 5,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },
    {
      id: 28,
      name: 'Manan Mehta',
      team: 'RR',
      teamId: 5,
      role: 'wicketkeeper',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 29,
      name: 'Rashid Mirza',
      team: 'RR',
      teamId: 5,
      role: 'bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm legbreak',
      isOverseas: false,
    },
    {
      id: 30,
      name: 'Pranav Nair',
      team: 'RR',
      teamId: 5,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },

    // SRH (Team 6)
    {
      id: 6,
      name: 'Nathan Cross',
      team: 'SRH',
      teamId: 6,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast',
      isOverseas: true,
    },
    {
      id: 31,
      name: 'George Mercer',
      team: 'SRH',
      teamId: 6,
      role: 'wicketkeeper',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },
    {
      id: 32,
      name: 'Kunal Saxena',
      team: 'SRH',
      teamId: 6,
      role: 'all-rounder',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      isOverseas: false,
    },
    {
      id: 33,
      name: 'Ryan Gallagher',
      team: 'SRH',
      teamId: 6,
      role: 'bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast',
      isOverseas: true,
    },
    {
      id: 34,
      name: 'Reyansh Dave',
      team: 'SRH',
      teamId: 6,
      role: 'batter',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },

    // DC (Team 7)
    {
      id: 7,
      name: 'Tariq Al-Mansoor',
      team: 'DC',
      teamId: 7,
      role: 'batter',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      isOverseas: true,
    },
    {
      id: 35,
      name: 'Felix Campbell',
      team: 'DC',
      teamId: 7,
      role: 'wicketkeeper',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },
    {
      id: 36,
      name: 'Aditya Bhatt',
      team: 'DC',
      teamId: 7,
      role: 'all-rounder',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      isOverseas: false,
    },
    {
      id: 37,
      name: 'Imran Nadir',
      team: 'DC',
      teamId: 7,
      role: 'bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast',
      isOverseas: false,
    },
    {
      id: 38,
      name: 'Connor Walsh',
      team: 'DC',
      teamId: 7,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },

    // PK (Team 8)
    {
      id: 9,
      name: 'Rohan Chakraborty',
      team: 'PK',
      teamId: 8,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 39,
      name: 'Sameer Merchant',
      team: 'PK',
      teamId: 8,
      role: 'wicketkeeper',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 40,
      name: 'Alexey Petrov',
      team: 'PK',
      teamId: 8,
      role: 'all-rounder',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast-medium',
      isOverseas: true,
    },
    {
      id: 41,
      name: 'Digvijay Rana',
      team: 'PK',
      teamId: 8,
      role: 'bowler',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Left-arm orthodox',
      isOverseas: false,
    },
    {
      id: 42,
      name: 'Henry Fletcher',
      team: 'PK',
      teamId: 8,
      role: 'batter',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },

    // LSG (Team 9)
    {
      id: 10,
      name: 'Ethan Brooks',
      team: 'LSG',
      teamId: 9,
      role: 'batter',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Right-arm medium',
      isOverseas: true,
    },
    {
      id: 43,
      name: 'Mohsin Tariq',
      team: 'LSG',
      teamId: 9,
      role: 'wicketkeeper',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
    {
      id: 44,
      name: 'Keshav Murthy',
      team: 'LSG',
      teamId: 9,
      role: 'all-rounder',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      isOverseas: false,
    },
    {
      id: 45,
      name: 'Damian Cole',
      team: 'LSG',
      teamId: 9,
      role: 'bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast',
      isOverseas: true,
    },
    {
      id: 46,
      name: 'Aniket Deshmukh',
      team: 'LSG',
      teamId: 9,
      role: 'batter',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },

    // GT (Team 10)
    {
      id: 8,
      name: 'Marcus Thorne',
      team: 'GT',
      teamId: 10,
      role: 'bowler',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Left-arm fast',
      isOverseas: true,
    },
    {
      id: 47,
      name: 'Wesley Vance',
      team: 'GT',
      teamId: 10,
      role: 'wicketkeeper',
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },
    {
      id: 48,
      name: 'Shaurya Dixit',
      team: 'GT',
      teamId: 10,
      role: 'all-rounder',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      isOverseas: false,
    },
    {
      id: 49,
      name: 'Caleb Bennett',
      team: 'GT',
      teamId: 10,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: true,
    },
    {
      id: 50,
      name: 'Parthiban Sundar',
      team: 'GT',
      teamId: 10,
      role: 'batter',
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'None',
      isOverseas: false,
    },
  ];

  // Map of team players
  const playersByTeam = new Map<string, PlayerDef[]>();
  for (const p of playersDef) {
    const list = playersByTeam.get(p.team) ?? [];
    list.push(p);
    playersByTeam.set(p.team, list);
  }

  // 3. Matches (46 matches: 45 in 2024 season, 1 in 2023 season)
  // Single round robin for 10 teams gives 45 matches in 2024.
  // Pairings list
  const pairings: Array<[string, string]> = [
    // Round 1
    ['CSK', 'RCB'],
    ['PK', 'DC'],
    ['KKR', 'SRH'],
    ['RR', 'LSG'],
    ['GT', 'MI'],
    // Round 2
    ['RCB', 'PK'],
    ['CSK', 'GT'],
    ['SRH', 'MI'],
    ['RR', 'DC'],
    ['LSG', 'PK'],
    // Round 3
    ['GT', 'SRH'],
    ['DC', 'CSK'],
    ['MI', 'RR'],
    ['RCB', 'LSG'],
    ['DC', 'KKR'],
    // Round 4
    ['GT', 'PK'],
    ['SRH', 'CSK'],
    ['RR', 'RCB'],
    ['MI', 'DC'],
    ['LSG', 'GT'],
    // Round 5
    ['CSK', 'KKR'],
    ['PK', 'SRH'],
    ['GT', 'RR'],
    ['MI', 'RCB'],
    ['LSG', 'DC'],
    // Round 6
    ['PK', 'RR'],
    ['KKR', 'LSG'],
    ['MI', 'CSK'],
    ['RCB', 'SRH'],
    ['GT', 'DC'],
    // Round 7
    ['PK', 'MI'],
    ['LSG', 'CSK'],
    ['DC', 'SRH'],
    ['KKR', 'RCB'],
    ['RR', 'MI'],
    // Round 8
    ['CSK', 'PK'],
    ['SRH', 'RR'],
    ['KKR', 'MI'],
    ['RCB', 'GT'],
    ['DC', 'LSG'],
    // Round 9
    ['PK', 'KKR'],
    ['MI', 'LSG'],
    ['RCB', 'CSK'],
    ['RR', 'KKR'],
    ['SRH', 'GT'], // Match 45
  ];

  const matchDates2024 = [
    '2024-03-22',
    '2024-03-23', // Double header
    '2024-03-23',
    '2024-03-24', // Double header
    '2024-03-24',
    '2024-03-25',
    '2024-03-26',
    '2024-03-27',
    '2024-03-28',
    '2024-03-30', // Double header
    '2024-03-31',
    '2024-03-31',
    '2024-04-01',
    '2024-04-02',
    '2024-04-03',
    '2024-04-04',
    '2024-04-05',
    '2024-04-06', // Double header
    '2024-04-07',
    '2024-04-07',
    '2024-04-08',
    '2024-04-09',
    '2024-04-10',
    '2024-04-11',
    '2024-04-12',
    '2024-04-13',
    '2024-04-14', // Double header
    '2024-04-14',
    '2024-04-15',
    '2024-04-16',
    '2024-04-18',
    '2024-04-19',
    '2024-04-20',
    '2024-04-21', // Double header
    '2024-04-22',
    '2024-04-24',
    '2024-04-26',
    '2024-04-28',
    '2024-05-01',
    '2024-05-04',
    '2024-05-08',
    '2024-05-12',
    '2024-05-16',
    '2024-05-20',
    '2024-05-26', // Final: 2024-05-26 (Match 45)
  ];

  const teamVenueMap = new Map<string, string>();
  const teamIdMap = new Map<string, number>();
  for (const t of teams) {
    teamVenueMap.set(t.code, t.homeGround);
    teamIdMap.set(t.code, t.id);
  }

  const matches: MatchDef[] = [];

  for (let i = 0; i < 45; i++) {
    const pair = pairings[i]!;
    const homeTeam = pair[0];
    const awayTeam = pair[1];
    const date = matchDates2024[i]!;
    const venue = teamVenueMap.get(homeTeam) ?? 'M. A. Chidambaram Stadium';
    const homeTeamId = teamIdMap.get(homeTeam)!;
    const awayTeamId = teamIdMap.get(awayTeam)!;

    // Determine winner deterministically
    const winner = i % 2 === 0 ? homeTeam : awayTeam;
    const winnerTeamId = teamIdMap.get(winner)!;
    const winType: 'runs' | 'wickets' = i % 2 === 0 ? 'wickets' : 'runs';
    const winMargin = winType === 'wickets' ? (i % 6) + 3 : (i % 30) + 10;

    // Pick a player of the match from winner's roster
    const winnerPlayers = playersByTeam.get(winner) ?? [];
    const potm = winnerPlayers[i % winnerPlayers.length]!;

    matches.push({
      id: i + 1,
      matchNo: i + 1,
      season: 2024,
      date,
      venue,
      homeTeamId,
      awayTeamId,
      homeTeam,
      awayTeam,
      tossWinnerTeamId: homeTeamId,
      tossWinner: homeTeam,
      tossDecision: i % 2 === 0 ? 'field' : 'bat',
      winnerTeamId,
      winner,
      winMarginRuns: winType === 'runs' ? winMargin : undefined,
      winMarginWickets: winType === 'wickets' ? winMargin : undefined,
      winMargin,
      winType,
      playerOfMatchId: potm.id,
    });
  }

  // Match 46: Season 2023 Boundary match (GT vs LSG, 2023-05-28)
  matches.push({
    id: 46,
    matchNo: 46,
    season: 2023,
    date: '2023-05-28',
    venue: 'Narendra Modi Stadium, Ahmedabad',
    homeTeamId: 10,
    awayTeamId: 9,
    homeTeam: 'GT',
    awayTeam: 'LSG',
    tossWinnerTeamId: 10,
    tossWinner: 'GT',
    tossDecision: 'bat',
    winnerTeamId: 10,
    winner: 'GT',
    winMarginRuns: 18,
    winMarginWickets: undefined,
    winMargin: 18,
    winType: 'runs',
    playerOfMatchId: 8,
  });

  // 4. Synthesize 450 Performances
  // Matches 1 to 44 have 10 performances each (44 * 10 = 440)
  // Match 46 (Season 2023) has 10 performances (5 GT, 5 LSG) = 10
  // Total = 450 performances (IDs 1-450)!
  // Match 45 is the season 2024 Final fixture with 0 performances.

  const performances: PerformanceDef[] = [];
  let perfIdCounter = 1;

  // Track each player's chronological match appearances for streak injection
  const playerMatchHistory = new Map<
    number,
    Array<{ matchId: number; matchNo: number; date: string }>
  >();

  // Determine which matches each player plays in
  for (let mIdx = 0; mIdx < 44; mIdx++) {
    const m = matches[mIdx]!;
    const homePlayers = playersByTeam.get(m.homeTeam) ?? [];
    const awayPlayers = playersByTeam.get(m.awayTeam) ?? [];

    for (const p of [...homePlayers, ...awayPlayers]) {
      const hist = playerMatchHistory.get(p.id) ?? [];
      hist.push({ matchId: m.id, matchNo: m.matchNo, date: m.date });
      playerMatchHistory.set(p.id, hist);
    }
  }

  // Match 46 (2023) appearances for GT and LSG
  const match46 = matches[45]!; // ID 46
  const gtPlayers = playersByTeam.get('GT') ?? [];
  const lsgPlayers = playersByTeam.get('LSG') ?? [];

  for (const p of [...gtPlayers, ...lsgPlayers]) {
    const hist = playerMatchHistory.get(p.id) ?? [];
    hist.push({ matchId: match46.id, matchNo: match46.matchNo, date: match46.date });
    playerMatchHistory.set(p.id, hist);
  }

  // Deterministic performance plan for Personas 1 to 10
  // Map: `${playerId}:${matchId}` => performance attributes
  const personaStats = new Map<
    string,
    {
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      wickets: number;
      overs: number;
      maidens: number;
      runsConceded: number;
      catches: number;
      isDismissed: boolean;
    }
  >();

  // Strict cricket math boundary calculator
  const computeBoundaries = (
    runs: number,
    prefFours = 4,
    prefSixes = 2
  ): { fours: number; sixes: number } => {
    if (runs <= 0) return { fours: 0, sixes: 0 };
    let sixes = Math.min(prefSixes, Math.floor(runs / 6));
    const rem = runs - sixes * 6;
    let fours = Math.min(prefFours, Math.floor(rem / 4));
    while (fours * 4 + sixes * 6 > runs) {
      if (sixes > 0) sixes--;
      else if (fours > 0) fours--;
      else break;
    }
    return { fours, sixes };
  };

  // Persona 1: Liam Sterling (Player 1, MI batter) -> 5 consecutive matches with >= 30 runs!
  const p1Matches = playerMatchHistory.get(1) ?? [];
  const p1RunsSeq = [52, 68, 85, 44, 91, 14, 104, 32, 18];
  for (let i = 0; i < p1Matches.length; i++) {
    const m = p1Matches[i]!;
    const runs = p1RunsSeq[i] ?? 25;
    const b = computeBoundaries(runs, Math.floor(runs / 10) + 1, Math.floor(runs / 25));
    const balls = Math.max(b.fours + b.sixes + 3, Math.floor(runs * 0.7));
    personaStats.set(`1:${m.matchId}`, {
      runs,
      balls,
      fours: b.fours,
      sixes: b.sixes,
      wickets: 0,
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      catches: 1,
      isDismissed: runs < 100,
    });
  }

  // Persona 2: Aarav Varma (Player 2, CSK batter) -> 3 consecutive with >= 50 runs!
  const p2Matches = playerMatchHistory.get(2) ?? [];
  const p2RunsSeq = [54, 62, 58, 18, 24, 32, 12, 45, 20];
  for (let i = 0; i < p2Matches.length; i++) {
    const m = p2Matches[i]!;
    const runs = p2RunsSeq[i] ?? 20;
    const b = computeBoundaries(runs, Math.floor(runs / 10) + 1, Math.floor(runs / 28));
    const balls = Math.max(b.fours + b.sixes + 3, Math.floor(runs * 0.75));
    personaStats.set(`2:${m.matchId}`, {
      runs,
      balls,
      fours: b.fours,
      sixes: b.sixes,
      wickets: 0,
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      catches: 0,
      isDismissed: true,
    });
  }

  // Persona 3: Carlos Vance (Player 3, RCB all-rounder) -> 4 consecutive with >= 1 wicket!
  const p3Matches = playerMatchHistory.get(3) ?? [];
  const p3WicketsSeq = [2, 1, 3, 1, 0, 2, 0, 1, 0];
  for (let i = 0; i < p3Matches.length; i++) {
    const m = p3Matches[i]!;
    const wkts = p3WicketsSeq[i] ?? 0;
    const b = computeBoundaries(22, 2, 1);
    personaStats.set(`3:${m.matchId}`, {
      runs: 22,
      balls: 18,
      fours: b.fours,
      sixes: b.sixes,
      wickets: wkts,
      overs: 4.0,
      maidens: 0,
      runsConceded: 28,
      catches: 1,
      isDismissed: true,
    });
  }

  // Persona 4: Devansh Patel (Player 4, KKR bowler) -> 3 consecutive with >= 2 wickets!
  const p4Matches = playerMatchHistory.get(4) ?? [];
  const p4WktsSeq = [3, 2, 4, 1, 0, 2, 1, 0, 1];
  for (let i = 0; i < p4Matches.length; i++) {
    const m = p4Matches[i]!;
    const wkts = p4WktsSeq[i] ?? 1;
    personaStats.set(`4:${m.matchId}`, {
      runs: 4,
      balls: 6,
      fours: 1,
      sixes: 0,
      wickets: wkts,
      overs: 4.0,
      maidens: 0,
      runsConceded: 24,
      catches: 0,
      isDismissed: true,
    });
  }

  // Persona 5: Kabir Sen (Player 5, RR all-rounder) -> 3 consecutive all-rounder matches runs > 0 and wickets > 0!
  const p5Matches = playerMatchHistory.get(5) ?? [];
  const p5Runs = [28, 35, 21, 45, 0, 18, 22, 15, 30];
  const p5Wkts = [1, 2, 1, 0, 2, 0, 1, 0, 1];
  for (let i = 0; i < p5Matches.length; i++) {
    const m = p5Matches[i]!;
    const runs = p5Runs[i] ?? 10;
    const b = computeBoundaries(runs, 2, 1);
    personaStats.set(`5:${m.matchId}`, {
      runs,
      balls: runs === 0 ? 3 : 15,
      fours: b.fours,
      sixes: b.sixes,
      wickets: p5Wkts[i] ?? 0,
      overs: 3.0,
      maidens: 0,
      runsConceded: 22,
      catches: 0,
      isDismissed: true,
    });
  }

  // Persona 6: Nathan Cross (Player 6, SRH batter) -> Interrupted streak (36, 42, then 29 breaks streak!)
  const p6Matches = playerMatchHistory.get(6) ?? [];
  const p6RunsSeq = [36, 42, 29, 55, 48, 16, 25, 38, 12];
  for (let i = 0; i < p6Matches.length; i++) {
    const m = p6Matches[i]!;
    const runs = p6RunsSeq[i] ?? 20;
    const b = computeBoundaries(runs, 3, 1);
    personaStats.set(`6:${m.matchId}`, {
      runs,
      balls: 22,
      fours: b.fours,
      sixes: b.sixes,
      wickets: 0,
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      catches: 0,
      isDismissed: true,
    });
  }

  // Persona 7: Tariq Al-Mansoor (Player 7, DC batter) -> Century streak (102, 105 in consecutive matches!)
  const p7Matches = playerMatchHistory.get(7) ?? [];
  const p7RunsSeq = [102, 105, 44, 38, 22, 15, 33, 41, 26];
  for (let i = 0; i < p7Matches.length; i++) {
    const m = p7Matches[i]!;
    const runs = p7RunsSeq[i] ?? 30;
    const b = runs >= 100 ? computeBoundaries(runs, 10, 5) : computeBoundaries(runs, 2, 1);
    const balls = runs >= 100 ? 58 : 25;
    personaStats.set(`7:${m.matchId}`, {
      runs,
      balls,
      fours: b.fours,
      sixes: b.sixes,
      wickets: 0,
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      catches: 1,
      isDismissed: runs < 100,
    });
  }

  // Persona 8: Marcus Thorne (Player 8, GT bowler) -> Zero streak (0 runs in consecutive matches!)
  const p8Matches = playerMatchHistory.get(8) ?? [];
  for (let i = 0; i < p8Matches.length; i++) {
    const m = p8Matches[i]!;
    const runs = i < 3 ? 0 : 2;
    personaStats.set(`8:${m.matchId}`, {
      runs,
      balls: runs === 0 ? 3 : 5,
      fours: 0,
      sixes: 0,
      wickets: 1,
      overs: 4.0,
      maidens: 0,
      runsConceded: 30,
      catches: 0,
      isDismissed: true,
    });
  }

  // Persona 9: Rohan Chakraborty (Player 9, PK batter) -> SR > 180 streak (3 consecutive matches)
  const p9Matches = playerMatchHistory.get(9) ?? [];
  const p9Runs = [38, 46, 42, 22, 18, 25, 20, 15, 24];
  const p9Balls = [20, 24, 21, 18, 16, 20, 18, 14, 20];
  for (let i = 0; i < p9Matches.length; i++) {
    const m = p9Matches[i]!;
    const runs = p9Runs[i] ?? 20;
    const b =
      i < 3
        ? i === 0
          ? { fours: 5, sixes: 2 } // 32 <= 38
          : i === 1
            ? { fours: 4, sixes: 3 } // 34 <= 46
            : { fours: 3, sixes: 4 } // 36 <= 42
        : computeBoundaries(runs, 2, 1);

    personaStats.set(`9:${m.matchId}`, {
      runs,
      balls: p9Balls[i] ?? 18,
      fours: b.fours,
      sixes: b.sixes,
      wickets: 0,
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      catches: 0,
      isDismissed: true,
    });
  }

  // Persona 10: Ethan Brooks (Player 10, LSG batter) -> 2023 and 2024 performance!
  const p10Matches = playerMatchHistory.get(10) ?? [];
  for (let i = 0; i < p10Matches.length; i++) {
    const m = p10Matches[i]!;
    const is2023 = m.matchId === 46;
    const runs = is2023 ? 48 : 34;
    const b = computeBoundaries(runs, 4, 1);
    personaStats.set(`10:${m.matchId}`, {
      runs,
      balls: 25,
      fours: b.fours,
      sixes: b.sixes,
      wickets: 0,
      overs: 0,
      maidens: 0,
      runsConceded: 0,
      catches: 0,
      isDismissed: true,
    });
  }

  // Function to create a performance record
  const createPerf = (
    p: PlayerDef,
    matchId: number,
    matchNo: number,
    date: string
  ): PerformanceDef => {
    const key = `${p.id}:${matchId}`;
    let stats = personaStats.get(key);

    if (!stats) {
      if (p.role === 'batter') {
        const runs = (matchId * 7 + p.id) % 28;
        const b = computeBoundaries(runs, 2, 1);
        const balls = Math.max(b.fours + b.sixes + 2, Math.floor(runs * 0.8) + 3);
        stats = {
          runs,
          balls,
          fours: b.fours,
          sixes: b.sixes,
          wickets: 0,
          overs: 0,
          maidens: 0,
          runsConceded: 0,
          catches: p.id % 3 === 0 ? 1 : 0,
          isDismissed: true,
        };
      } else if (p.role === 'wicketkeeper') {
        const runs = (matchId * 5 + p.id) % 25;
        const b = computeBoundaries(runs, 2, 0);
        const balls = Math.max(b.fours + 2, Math.floor(runs * 0.9) + 2);
        stats = {
          runs,
          balls,
          fours: b.fours,
          sixes: 0,
          wickets: 0,
          overs: 0,
          maidens: 0,
          runsConceded: 0,
          catches: 1,
          isDismissed: true,
        };
      } else if (p.role === 'all-rounder') {
        const runs = (matchId * 4 + p.id) % 22;
        const b = computeBoundaries(runs, 2, 0);
        const balls = Math.max(b.fours + 2, runs + 2);
        const wickets = (matchId + p.id) % 3;
        stats = {
          runs,
          balls,
          fours: b.fours,
          sixes: 0,
          wickets,
          overs: 3.0,
          maidens: 0,
          runsConceded: 24,
          catches: 0,
          isDismissed: true,
        };
      } else {
        // bowler
        const runs = (matchId + p.id) % 8;
        const b = computeBoundaries(runs, 1, 0);
        const balls = Math.max(runs, 4);
        const wickets = (matchId + p.id) % 3;
        stats = {
          runs,
          balls,
          fours: b.fours,
          sixes: 0,
          wickets,
          overs: 4.0,
          maidens: 0,
          runsConceded: 28,
          catches: 0,
          isDismissed: true,
        };
      }
    }

    const strikeRate = stats.balls > 0 ? Number(((stats.runs / stats.balls) * 100).toFixed(2)) : 0;
    const economyRate = stats.overs > 0 ? Number((stats.runsConceded / stats.overs).toFixed(2)) : 0;

    const pid = perfIdCounter++;
    return {
      id: pid,
      player_id: p.id,
      match_id: matchId,
      match_no: matchNo,
      date,
      runs: stats.runs,
      balls_faced: stats.balls,
      fours: stats.fours,
      sixes: stats.sixes,
      strike_rate: strikeRate,
      wickets: stats.wickets,
      overs_bowled: stats.overs,
      maidens: stats.maidens,
      runs_conceded: stats.runsConceded,
      economy_rate: economyRate,
      catches: stats.catches,
      run_outs: 0,
      stumpings: 0,
      is_out: stats.isDismissed,
      dismissal_type: stats.isDismissed ? 'caught' : 'not out',
    };
  };

  // Generate 440 performances for Matches 1 to 44
  for (let mIdx = 0; mIdx < 44; mIdx++) {
    const m = matches[mIdx]!;
    const homePlayers = playersByTeam.get(m.homeTeam) ?? [];
    const awayPlayers = playersByTeam.get(m.awayTeam) ?? [];

    for (const p of [...homePlayers, ...awayPlayers]) {
      performances.push(createPerf(p, m.id, m.matchNo, m.date));
    }
  }

  // Generate 10 performances for Match 46 (2023)
  for (const p of [...gtPlayers, ...lsgPlayers]) {
    performances.push(createPerf(p, match46.id, match46.matchNo, match46.date));
  }

  // 5. Aggregate Player Totals from performances
  const playerAggregates = new Map<
    number,
    { totalRuns: number; totalWickets: number; matchesPlayed: number }
  >();

  for (const perf of performances) {
    const curr = playerAggregates.get(perf.player_id) ?? {
      totalRuns: 0,
      totalWickets: 0,
      matchesPlayed: 0,
    };
    curr.totalRuns += perf.runs;
    curr.totalWickets += perf.wickets;
    curr.matchesPlayed += 1;
    playerAggregates.set(perf.player_id, curr);
  }

  const finalPlayers = playersDef.map(p => {
    const agg = playerAggregates.get(p.id) ?? {
      totalRuns: 0,
      totalWickets: 0,
      matchesPlayed: 0,
    };
    return {
      id: p.id,
      name: p.name,
      team: p.team,
      teamId: p.teamId,
      role: p.role,
      batting_style: p.battingStyle,
      bowling_style: p.bowlingStyle,
      isOverseas: p.isOverseas,
      total_runs: agg.totalRuns,
      total_wickets: agg.totalWickets,
      matches_played: agg.matchesPlayed,
    };
  });

  const finalTeams = teams.map(t => ({
    id: t.id,
    code: t.code,
    name: t.name,
    city: t.city,
    coach: t.coach,
    home_venue: t.homeGround,
  }));

  const finalMatches = matches.map(m => ({
    id: m.id,
    match_no: m.matchNo,
    season: m.season,
    date: m.date,
    venue: m.venue,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    home_team: m.homeTeam,
    away_team: m.awayTeam,
    toss_winner: m.tossWinner,
    toss_decision: m.tossDecision,
    winner: m.winner,
    win_margin: m.winMargin,
    win_type: m.winType,
    player_of_match_id: m.playerOfMatchId,
  }));

  return {
    teams: finalTeams,
    players: finalPlayers,
    matches: finalMatches,
    performances,
  };
}

function main(): void {
  const outputDir = path.resolve(process.cwd(), 'api', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const { teams, players, matches, performances } = generateAllData();

  fs.writeFileSync(path.join(outputDir, 'teams.json'), JSON.stringify(teams, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'players.json'), JSON.stringify(players, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'matches.json'), JSON.stringify(matches, null, 2), 'utf-8');
  fs.writeFileSync(
    path.join(outputDir, 'performances.json'),
    JSON.stringify(performances, null, 2),
    'utf-8'
  );

  console.log(`[SUCCESS] Generated dataset in ${outputDir}:`);
  console.log(`  - teams.json: ${teams.length} records`);
  console.log(`  - players.json: ${players.length} records`);
  console.log(`  - matches.json: ${matches.length} records`);
  console.log(`  - performances.json: ${performances.length} records`);
}

main();
