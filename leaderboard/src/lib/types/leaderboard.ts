export interface Player {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  joinedAt: Date;
  country?: string;
  team?: string;
}

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  player: Player;
  score: number;
  gamesPlayed: number;
  winRate: number;
  streak?: number;
  lastActive: Date;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlockedAt: Date;
}

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';
export type GameMode = 'solo' | 'team' | 'tournament' | 'all';

export interface LeaderboardFilters {
  timePeriod: TimePeriod;
  gameMode: GameMode;
  search?: string;
  country?: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  lastUpdated: Date;
  filters: LeaderboardFilters;
}

export type SortField = 'rank' | 'score' | 'gamesPlayed' | 'winRate' | 'lastActive';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}