/**
 * In-Memory Performance Repository with Multi-Dimensional Indexes & Streak Analysis
 */

import { Performance, PerformanceQueryParams, PaginatedResponse, StreakRecord } from '../types';
import { PlayerRepository } from './PlayerRepository';

export interface IPerformanceRepository {
  findById(id: number): Performance | undefined;
  findByPlayerId(
    playerId: number,
    params?: Omit<PerformanceQueryParams, 'player_id'>
  ): PaginatedResponse<Performance>;
  findByMatchId(matchId: number): readonly Performance[];
  find(params?: PerformanceQueryParams): PaginatedResponse<Performance>;
  findStreaks(minConsecutiveMatches?: number, minRuns?: number, season?: number): StreakRecord[];
  getAll(): readonly Performance[];
  count(): number;
}

export class PerformanceRepository implements IPerformanceRepository {
  private readonly byId: Map<number, Performance> = new Map();
  private readonly byPlayerId: Map<number, Performance[]> = new Map();
  private readonly byMatchId: Map<number, Performance[]> = new Map();
  private readonly all: readonly Performance[];
  private readonly playerRepository?: PlayerRepository;

  constructor(performances: readonly Performance[], playerRepository?: PlayerRepository) {
    this.all = Object.freeze([...performances]);
    this.playerRepository = playerRepository;

    for (const perf of this.all) {
      this.byId.set(perf.id, perf);

      // Player index
      const pList = this.byPlayerId.get(perf.player_id) ?? [];
      pList.push(perf);
      this.byPlayerId.set(perf.player_id, pList);

      // Match index
      const mList = this.byMatchId.get(perf.match_id) ?? [];
      mList.push(perf);
      this.byMatchId.set(perf.match_id, mList);
    }

    // Sort byPlayerId collections chronologically
    for (const list of this.byPlayerId.values()) {
      list.sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        const matchDiff = a.match_no - b.match_no;
        if (matchDiff !== 0) return matchDiff;
        return a.id - b.id;
      });
    }
  }

  findById(id: number): Performance | undefined {
    return this.byId.get(id);
  }

  findByPlayerId(
    playerId: number,
    params?: Omit<PerformanceQueryParams, 'player_id'>
  ): PaginatedResponse<Performance> {
    return this.find({ ...params, player_id: playerId });
  }

  findByMatchId(matchId: number): readonly Performance[] {
    return this.byMatchId.get(matchId) ?? [];
  }

  find(params?: PerformanceQueryParams): PaginatedResponse<Performance> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));

    // 1. Candidate selection via index
    let candidates: readonly Performance[];
    if (params?.player_id !== undefined) {
      candidates = this.byPlayerId.get(params.player_id) ?? [];
    } else if (params?.match_id !== undefined) {
      candidates = this.byMatchId.get(params.match_id) ?? [];
    } else {
      candidates = this.all;
    }

    // 2. Filtering
    const filtered: Performance[] = [];
    const minRuns = params?.min_runs;
    const matchIdFilter = params?.match_id;
    const playerIdFilter = params?.player_id;

    for (const p of candidates) {
      if (playerIdFilter !== undefined && p.player_id !== playerIdFilter) {
        continue;
      }
      if (matchIdFilter !== undefined && p.match_id !== matchIdFilter) {
        continue;
      }
      if (minRuns !== undefined && p.runs < minRuns) {
        continue;
      }

      filtered.push(p);
    }

    // 3. Multi-key stable sort
    const sortBy = params?.sort_by ?? 'date';
    const order = params?.order ?? 'desc';
    const multiplier = order === 'desc' ? -1 : 1;

    filtered.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'date') {
        diff = a.date.localeCompare(b.date);
      } else if (sortBy === 'runs') {
        diff = a.runs - b.runs;
      }

      if (diff !== 0) {
        return diff * multiplier;
      }
      return a.id - b.id; // Deterministic tie-breaker
    });

    // 4. Bounded pagination
    const total = filtered.length;
    const total_pages = total === 0 ? 0 : Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = startIndex >= total ? [] : filtered.slice(startIndex, startIndex + limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        total_pages,
      },
    };
  }

  /**
   * Analytical streak calculation matching SQLite B4-S2 query semantics:
   * Consecutive appearances in season where runs >= minRuns.
   */
  findStreaks(minConsecutiveMatches = 3, minRuns = 30, season?: number): StreakRecord[] {
    const streaks: StreakRecord[] = [];

    for (const [playerId, perfs] of this.byPlayerId.entries()) {
      let currentStreak: Performance[] = [];
      const seasonPerfs =
        season !== undefined ? perfs.filter(p => p.date.startsWith(String(season))) : perfs;

      for (const perf of seasonPerfs) {
        if (perf.runs >= minRuns) {
          currentStreak.push(perf);
        } else {
          if (currentStreak.length >= minConsecutiveMatches) {
            const first = currentStreak[0];
            const last = currentStreak[currentStreak.length - 1];
            if (first !== undefined && last !== undefined) {
              streaks.push({
                player_id: playerId,
                player_name: this.resolvePlayerName(playerId),
                streak_start_date: first.date,
                streak_end_date: last.date,
                streak_length: currentStreak.length,
                match_ids: currentStreak.map(p => p.match_id),
                runs: currentStreak.map(p => p.runs),
              });
            }
          }
          currentStreak = [];
        }
      }

      // Check trailing streak at season end
      if (currentStreak.length >= minConsecutiveMatches) {
        const first = currentStreak[0];
        const last = currentStreak[currentStreak.length - 1];
        if (first !== undefined && last !== undefined) {
          streaks.push({
            player_id: playerId,
            player_name: this.resolvePlayerName(playerId),
            streak_start_date: first.date,
            streak_end_date: last.date,
            streak_length: currentStreak.length,
            match_ids: currentStreak.map(p => p.match_id),
            runs: currentStreak.map(p => p.runs),
          });
        }
      }
    }

    return streaks;
  }

  private resolvePlayerName(playerId: number): string {
    if (this.playerRepository) {
      const p = this.playerRepository.findById(playerId);
      if (p) return p.name;
    }
    return `Player ${playerId}`;
  }

  getAll(): readonly Performance[] {
    return this.all;
  }

  count(): number {
    return this.all.length;
  }
}
