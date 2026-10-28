/**
 * Repository Factory, In-Memory Data Loader, and Singleton Container
 */

import * as fs from 'fs';
import * as path from 'path';
import { Player, Match, Performance } from '../types';
import { PlayerRepository } from './PlayerRepository';
import { MatchRepository } from './MatchRepository';
import { PerformanceRepository } from './PerformanceRepository';

export * from './PlayerRepository';
export * from './MatchRepository';
export * from './PerformanceRepository';

export interface RepositoryContainer {
  players: PlayerRepository;
  matches: MatchRepository;
  performances: PerformanceRepository;
}

export function loadJsonData<T>(fileName: string): T[] {
  // Look in api/data first, then fallback to root data
  const apiDataPath = path.resolve(process.cwd(), 'api', 'data', fileName);
  const rootDataPath = path.resolve(process.cwd(), 'data', fileName);

  const resolvedPath = fs.existsSync(apiDataPath)
    ? apiDataPath
    : fs.existsSync(rootDataPath)
      ? rootDataPath
      : apiDataPath;

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Dataset file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  return JSON.parse(raw) as T[];
}

export function createRepositories(data?: {
  players?: readonly Player[];
  matches?: readonly Match[];
  performances?: readonly Performance[];
}): RepositoryContainer {
  const rawPlayers = data?.players ?? loadJsonData<Player>('players.json');
  const rawMatches = data?.matches ?? loadJsonData<Match>('matches.json');
  const rawPerformances = data?.performances ?? loadJsonData<Performance>('performances.json');

  const players = new PlayerRepository(rawPlayers);
  const matches = new MatchRepository(rawMatches);
  const performances = new PerformanceRepository(rawPerformances, players);

  return { players, matches, performances };
}

// Lazy-loaded or boot-loaded singleton container
let defaultContainer: RepositoryContainer | null = null;

export function getRepositories(): RepositoryContainer {
  if (!defaultContainer) {
    defaultContainer = createRepositories();
  }
  return defaultContainer;
}

export const playerRepository = {
  get instance(): PlayerRepository {
    return getRepositories().players;
  },
};

export const matchRepository = {
  get instance(): MatchRepository {
    return getRepositories().matches;
  },
};

export const performanceRepository = {
  get instance(): PerformanceRepository {
    return getRepositories().performances;
  },
};
