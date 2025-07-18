export interface MRMInstance {
  id: string;
  name: string;
  url?: string;
  uuid?: string;
  mixinId?: string;
  status: 'active' | 'inactive' | 'paused';
  createdAt: Date;
}

export interface SecuritySpecs {
  runInTEE: boolean;
  attestationStatus: 'success' | 'failed' | 'pending' | 'not_available';
  lastAttestationCheck?: Date;
  attestationEndpoint?: string;
  securityLevel: 'high' | 'medium' | 'low';
  encryptedStorage: boolean;
  secureBootEnabled: boolean;
}

export interface MRMMetrics {
  roi: number; // Return on Investment percentage
  apy: number; // Annual Percentage Yield
  aliveTime: number; // Time in hours
  campaignsJoined: number;
  campaignsSuccessful: number;
  totalVolume: number; // Total trading volume in USD
  profitLoss: number; // Total P&L in USD
  lastUpdated: Date;
}

export interface MRMLeaderboardEntry {
  rank: number;
  previousRank?: number;
  instance: MRMInstance;
  metrics: MRMMetrics;
  security: SecuritySpecs;
}

export type TimePeriod = '24h' | '7d' | '30d' | 'all-time';
export type SortField = 'rank' | 'apy' | 'aliveTime' | 'campaignsJoined' | 'campaignsSuccessful' | 'totalVolume' | 'profitLoss';
export type StatusFilter = 'all' | 'active' | 'inactive' | 'paused';

export interface MRMLeaderboardFilters {
  timePeriod: TimePeriod;
  status: StatusFilter;
  search?: string;
  minAPY?: number;
  teeOnly?: boolean;
  attestedOnly?: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export interface MRMLeaderboardData {
  entries: MRMLeaderboardEntry[];
  totalInstances: number;
  lastUpdated: Date;
  filters: MRMLeaderboardFilters;
}