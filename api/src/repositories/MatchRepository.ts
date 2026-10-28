/**
 * In-Memory Match Repository with Prebuilt Multi-Dimensional Indexes
 */

import { Match, MatchQueryParams, PaginatedResponse } from '../types';

export interface IMatchRepository {
  findById(id: number): Match | undefined;
  find(params?: MatchQueryParams): PaginatedResponse<Match>;
  getAll(): readonly Match[];
  count(): number;
}

export class MatchRepository implements IMatchRepository {
  private readonly byId: Map<number, Match> = new Map();
  private readonly byTeam: Map<string, Match[]> = new Map();
  private readonly byVenue: Map<string, Match[]> = new Map();
  private readonly all: readonly Match[];

  constructor(matches: readonly Match[]) {
    this.all = Object.freeze([...matches]);

    for (const match of this.all) {
      this.byId.set(match.id, match);

      // Home & Away team index
      const homeNorm = match.home_team === 'PK' ? 'PBKS' : match.home_team;
      const awayNorm = match.away_team === 'PK' ? 'PBKS' : match.away_team;

      for (const t of [homeNorm, awayNorm]) {
        const teamList = this.byTeam.get(t) ?? [];
        teamList.push(match);
        this.byTeam.set(t, teamList);
      }

      // Venue index
      const venueNorm = match.venue.toLowerCase().trim();
      const venueList = this.byVenue.get(venueNorm) ?? [];
      venueList.push(match);
      this.byVenue.set(venueNorm, venueList);
    }
  }

  findById(id: number): Match | undefined {
    return this.byId.get(id);
  }

  find(params?: MatchQueryParams): PaginatedResponse<Match> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));

    // 1. Candidate selection via index
    let candidates: readonly Match[];
    if (params?.team !== undefined) {
      const normalizedTeam = params.team === 'PK' ? 'PBKS' : params.team;
      candidates = this.byTeam.get(normalizedTeam) ?? [];
    } else {
      candidates = this.all;
    }

    // 2. Filtering
    const filtered: Match[] = [];
    const venueFilter = params?.venue?.trim().toLowerCase();
    const dateFrom = params?.date_from;
    const dateTo = params?.date_to;

    for (const m of candidates) {
      // venue filter (case-insensitive substring)
      if (venueFilter !== undefined && !m.venue.toLowerCase().includes(venueFilter)) {
        continue;
      }

      // date_from filter (inclusive)
      if (dateFrom !== undefined && m.date < dateFrom) {
        continue;
      }

      // date_to filter (inclusive)
      if (dateTo !== undefined && m.date > dateTo) {
        continue;
      }

      filtered.push(m);
    }

    // 3. Multi-key stable sort
    const sortBy = params?.sort_by ?? 'date';
    const order = params?.order ?? 'asc';
    const multiplier = order === 'desc' ? -1 : 1;

    filtered.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'date') {
        diff = a.date.localeCompare(b.date);
      } else if (sortBy === 'match_no') {
        diff = a.match_no - b.match_no;
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

  getAll(): readonly Match[] {
    return this.all;
  }

  count(): number {
    return this.all.length;
  }
}
