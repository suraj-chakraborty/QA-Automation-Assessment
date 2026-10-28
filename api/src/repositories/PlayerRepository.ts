/**
 * In-Memory Player Repository with Prebuilt Multi-Dimensional Indexes
 */

import { Player, PlayerQueryParams, PaginatedResponse, PlayerRole } from '../types';

export interface IPlayerRepository {
  findById(id: number): Player | undefined;
  find(params?: PlayerQueryParams): PaginatedResponse<Player>;
  getAll(): readonly Player[];
  count(): number;
  create(data: Omit<Player, 'id'>): Player;
  update(id: number, data: Partial<Player>): Player | undefined;
  delete(id: number): boolean;
}

export class PlayerRepository implements IPlayerRepository {
  private readonly byId: Map<number, Player> = new Map();
  private readonly byTeam: Map<string, Player[]> = new Map();
  private readonly byRole: Map<PlayerRole, Player[]> = new Map();
  private all: Player[];

  constructor(players: readonly Player[]) {
    this.all = [...players];

    for (const player of this.all) {
      this.byId.set(player.id, player);

      // Team index (normalize PK to PBKS)
      const teamKey = player.team === 'PK' ? 'PBKS' : player.team;
      const teamList = this.byTeam.get(teamKey) ?? [];
      teamList.push(player);
      this.byTeam.set(teamKey, teamList);

      // Role index
      const roleList = this.byRole.get(player.role) ?? [];
      roleList.push(player);
      this.byRole.set(player.role, roleList);
    }
  }

  findById(id: number): Player | undefined {
    return this.byId.get(id);
  }

  find(params?: PlayerQueryParams): PaginatedResponse<Player> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));

    // 1. Candidate selection via index
    let candidates: readonly Player[];
    if (params?.team !== undefined) {
      const normalizedTeam = params.team === 'PK' ? 'PBKS' : params.team;
      candidates = this.byTeam.get(normalizedTeam) ?? [];
    } else if (params?.role !== undefined) {
      candidates = this.byRole.get(params.role) ?? [];
    } else {
      candidates = this.all;
    }

    // 2. Secondary filtering
    const filtered: Player[] = [];
    const query = params?.q ? params.q.trim().toLowerCase() : undefined;
    const minRuns = params?.min_runs;
    const teamFilter = params?.team ? (params.team === 'PK' ? 'PBKS' : params.team) : undefined;
    const roleFilter = params?.role;

    for (const p of candidates) {
      // If team filter wasn't used for candidate narrowing
      if (teamFilter !== undefined && params?.team === undefined) {
        const pTeam = p.team === 'PK' ? 'PBKS' : p.team;
        if (pTeam !== teamFilter) continue;
      }

      // If role filter wasn't used for candidate narrowing
      if (roleFilter !== undefined && candidates !== this.byRole.get(roleFilter)) {
        if (p.role !== roleFilter) continue;
      }

      // min_runs filter
      if (minRuns !== undefined && p.total_runs < minRuns) {
        continue;
      }

      // q substring search (case-insensitive)
      if (query !== undefined && !p.name.toLowerCase().includes(query)) {
        continue;
      }

      filtered.push(p);
    }

    // 3. Multi-key stable sort
    const sortBy = params?.sort_by ?? 'name';
    const order = params?.order ?? 'asc';
    const multiplier = order === 'desc' ? -1 : 1;

    filtered.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'name') {
        diff = a.name.localeCompare(b.name);
      } else if (sortBy === 'team') {
        diff = a.team.localeCompare(b.team);
      } else if (sortBy === 'total_runs') {
        diff = a.total_runs - b.total_runs;
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

  create(data: Omit<Player, 'id'>): Player {
    const maxId = this.byId.size > 0 ? Math.max(...this.byId.keys()) : 0;
    const newId = maxId + 1;

    const newPlayer: Player = {
      id: newId,
      name: data.name,
      team: data.team,
      role: data.role,
      ...(data.batting_style ? { batting_style: data.batting_style } : {}),
      ...(data.bowling_style ? { bowling_style: data.bowling_style } : {}),
      isOverseas: data.isOverseas ?? false,
      total_runs: data.total_runs ?? 0,
      total_wickets: data.total_wickets ?? 0,
      matches_played: data.matches_played ?? 0,
      ...(data.teamId !== undefined ? { teamId: data.teamId } : {}),
    };

    // Update byId
    this.byId.set(newId, newPlayer);

    // Update byTeam
    const teamKey = newPlayer.team === 'PK' ? 'PBKS' : newPlayer.team;
    let teamList = this.byTeam.get(teamKey);
    if (!teamList) {
      teamList = [];
      this.byTeam.set(teamKey, teamList);
    }
    teamList.push(newPlayer);

    // Update byRole
    let roleList = this.byRole.get(newPlayer.role);
    if (!roleList) {
      roleList = [];
      this.byRole.set(newPlayer.role, roleList);
    }
    roleList.push(newPlayer);

    // Update all
    this.all.push(newPlayer);

    return newPlayer;
  }

  update(id: number, data: Partial<Player>): Player | undefined {
    const existing = this.byId.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Player = {
      id, // Preserve immutable id
      name: data.name ?? existing.name,
      team: data.team ?? existing.team,
      role: data.role ?? existing.role,
      isOverseas: data.isOverseas ?? existing.isOverseas,
      total_runs: data.total_runs ?? existing.total_runs,
      total_wickets: data.total_wickets ?? existing.total_wickets,
      matches_played: data.matches_played ?? existing.matches_played,
      ...(data.batting_style !== undefined
        ? { batting_style: data.batting_style }
        : existing.batting_style !== undefined
          ? { batting_style: existing.batting_style }
          : {}),
      ...(data.bowling_style !== undefined
        ? { bowling_style: data.bowling_style }
        : existing.bowling_style !== undefined
          ? { bowling_style: existing.bowling_style }
          : {}),
      ...(data.teamId !== undefined
        ? { teamId: data.teamId }
        : existing.teamId !== undefined
          ? { teamId: existing.teamId }
          : {}),
    };

    // Update byId
    this.byId.set(id, updated);

    // Update byTeam
    if (existing.team !== updated.team) {
      const oldTeamKey = existing.team === 'PK' ? 'PBKS' : existing.team;
      const oldTeamList = this.byTeam.get(oldTeamKey);
      if (oldTeamList) {
        const idx = oldTeamList.findIndex(p => p.id === id);
        if (idx !== -1) oldTeamList.splice(idx, 1);
      }

      const newTeamKey = updated.team === 'PK' ? 'PBKS' : updated.team;
      let newTeamList = this.byTeam.get(newTeamKey);
      if (!newTeamList) {
        newTeamList = [];
        this.byTeam.set(newTeamKey, newTeamList);
      }
      newTeamList.push(updated);
    } else {
      const teamKey = updated.team === 'PK' ? 'PBKS' : updated.team;
      const teamList = this.byTeam.get(teamKey);
      if (teamList) {
        const idx = teamList.findIndex(p => p.id === id);
        if (idx !== -1) teamList[idx] = updated;
      }
    }

    // Update byRole
    if (existing.role !== updated.role) {
      const oldRoleList = this.byRole.get(existing.role);
      if (oldRoleList) {
        const idx = oldRoleList.findIndex(p => p.id === id);
        if (idx !== -1) oldRoleList.splice(idx, 1);
      }

      let newRoleList = this.byRole.get(updated.role);
      if (!newRoleList) {
        newRoleList = [];
        this.byRole.set(updated.role, newRoleList);
      }
      newRoleList.push(updated);
    } else {
      const roleList = this.byRole.get(updated.role);
      if (roleList) {
        const idx = roleList.findIndex(p => p.id === id);
        if (idx !== -1) roleList[idx] = updated;
      }
    }

    // Update all
    const allIdx = this.all.findIndex(p => p.id === id);
    if (allIdx !== -1) {
      this.all[allIdx] = updated;
    }

    return updated;
  }

  delete(id: number): boolean {
    const existing = this.byId.get(id);
    if (!existing) {
      return false;
    }

    // Remove from byId
    this.byId.delete(id);

    // Remove from byTeam
    const teamKey = existing.team === 'PK' ? 'PBKS' : existing.team;
    const teamList = this.byTeam.get(teamKey);
    if (teamList) {
      const idx = teamList.findIndex(p => p.id === id);
      if (idx !== -1) teamList.splice(idx, 1);
    }

    // Remove from byRole
    const roleList = this.byRole.get(existing.role);
    if (roleList) {
      const idx = roleList.findIndex(p => p.id === id);
      if (idx !== -1) roleList.splice(idx, 1);
    }

    // Remove from all
    const allIdx = this.all.findIndex(p => p.id === id);
    if (allIdx !== -1) {
      this.all.splice(allIdx, 1);
    }

    return true;
  }

  getAll(): readonly Player[] {
    return this.all;
  }

  count(): number {
    return this.all.length;
  }
}
