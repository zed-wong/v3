import Big from 'big.js';
import type { MRMLeaderboardEntry, MRMInstance, MRMMetrics, SecuritySpecs } from '$lib/types/mrm-instance';

const instanceNames = [
  'Alpha Bot', 'Beta Trader', 'Gamma Engine', 'Delta MM', 'Epsilon Algo',
  'Zeta Market', 'Eta Liquidity', 'Theta Bot', 'Iota Maker', 'Kappa Trade',
  'Lambda Flow', 'Mu Strategy', 'Nu Arbitrage', 'Xi Provider', 'Omicron Bot',
  'Pi Network', 'Rho System', 'Sigma Engine', 'Tau Algorithm', 'Upsilon MM'
];

const statuses: Array<'active' | 'inactive' | 'paused'> = ['active', 'inactive', 'paused'];

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateMixinId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateInstance(index: number): MRMInstance {
  const name = instanceNames[index % instanceNames.length] + ' #' + Math.floor(index / instanceNames.length + 1);
  const statusWeight = Math.random();
  const status = statusWeight < 0.7 ? 'active' : statusWeight < 0.9 ? 'paused' : 'inactive';
  
  return {
    id: `mrm-${index + 1}`,
    name,
    url: Math.random() > 0.5 ? `https://mrm-${index + 1}.example.com` : undefined,
    uuid: Math.random() > 0.3 ? generateUUID() : undefined,
    mixinId: Math.random() > 0.5 ? generateMixinId() : undefined,
    status,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
  };
}

function generateMetrics(rank: number, instance: MRMInstance): MRMMetrics {
  // Higher ranked instances tend to have better metrics
  const performanceFactor = 1 - (rank - 1) / 100;
  const randomFactor = 0.5 + Math.random() * 0.5;
  
  // Calculate alive time based on created date, ensure it's positive
  const aliveHoursNum = Math.max(0, (Date.now() - instance.createdAt.getTime()) / (1000 * 60 * 60));
  const aliveHours = new Big(aliveHoursNum);
  
  // ROI: Top performers can have 50%+, lower ranks might be negative
  const roiNum = (performanceFactor * 60 - 10) * randomFactor + (Math.random() - 0.3) * 20;
  const roi = new Big(roiNum);
  
  // APY: Generally positive, correlated with ROI
  const apyNum = Math.max(0, roiNum * 3.5 + Math.random() * 50);
  const apy = new Big(apyNum);
  
  // Campaigns: More active time = more campaigns, minimum 1 if active for more than 24h
  const baseCampaigns = aliveHoursNum / 24 * (0.5 + Math.random());
  const campaignsJoined = aliveHoursNum >= 24 ? Math.max(1, Math.floor(baseCampaigns)) : 0;
  const successRate = Math.min(1, 0.4 + performanceFactor * 0.4 + Math.random() * 0.2);
  const campaignsSuccessful = Math.min(campaignsJoined, Math.floor(campaignsJoined * successRate));
  
  // Volume: Higher rank = higher volume, ensure it's never negative
  const volumeNum = Math.max(0, (1000000 * performanceFactor + Math.random() * 500000) * (aliveHoursNum / 168));
  const totalVolume = new Big(volumeNum);
  
  // P&L: Correlated with ROI and volume
  const profitLoss = totalVolume.times(roi.div(100)).times(0.1);
  
  return {
    roi,
    apy,
    aliveTime: aliveHours,
    campaignsJoined,
    campaignsSuccessful,
    totalVolume,
    profitLoss,
    lastUpdated: new Date(Date.now() - Math.random() * 60 * 60 * 1000)
  };
}

function generateSecuritySpecs(rank: number): SecuritySpecs {
  // Higher ranked instances tend to have better security
  const securityFactor = 1 - (rank - 1) / 100;
  const random = Math.random();
  
  // TEE more likely for top performers
  const runInTEE = random < (0.3 + securityFactor * 0.5);
  
  // Attestation status
  let attestationStatus: SecuritySpecs['attestationStatus'];
  if (runInTEE) {
    const attestRandom = Math.random();
    if (attestRandom < 0.8) {
      attestationStatus = 'success';
    } else if (attestRandom < 0.9) {
      attestationStatus = 'pending';
    } else {
      attestationStatus = 'failed';
    }
  } else {
    attestationStatus = Math.random() < 0.3 ? 'not_available' : 'failed';
  }
  
  // Security level based on TEE and attestation
  let securityLevel: SecuritySpecs['securityLevel'];
  if (runInTEE && attestationStatus === 'success') {
    securityLevel = 'high';
  } else if (runInTEE || attestationStatus === 'success') {
    securityLevel = 'medium';
  } else {
    securityLevel = 'low';
  }
  
  return {
    runInTEE,
    attestationStatus,
    lastAttestationCheck: attestationStatus !== 'not_available' 
      ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      : undefined,
    attestationEndpoint: attestationStatus !== 'not_available'
      ? `https://attestation.mrm-${rank}.example.com/verify`
      : undefined,
    securityLevel,
    encryptedStorage: runInTEE || Math.random() < 0.4,
    secureBootEnabled: runInTEE
  };
}

export function generateMockMRMLeaderboard(count: number = 100): MRMLeaderboardEntry[] {
  const entries: MRMLeaderboardEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    const instance = generateInstance(i);
    const metrics = generateMetrics(i + 1, instance);
    
    // Generate previous rank (most stay similar, some move up/down)
    let previousRank: number | undefined;
    if (i > 0) {
      const change = Math.floor(Math.random() * 5) - 2;
      previousRank = Math.max(1, i + 1 + change);
    }
    
    entries.push({
      rank: i + 1,
      previousRank,
      instance,
      metrics,
      security: generateSecuritySpecs(i + 1)
    });
  }
  
  return entries;
}

export function filterAndSortMRMEntries(
  entries: MRMLeaderboardEntry[],
  filters: {
    search?: string;
    status?: string;
    minAPY?: number;
    teeOnly?: boolean;
    attestedOnly?: boolean;
  }
): MRMLeaderboardEntry[] {
  let filtered = [...entries];
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(entry => 
      entry.instance.name.toLowerCase().includes(searchLower) ||
      entry.instance.id.toLowerCase().includes(searchLower) ||
      (entry.instance.uuid && entry.instance.uuid.toLowerCase().includes(searchLower)) ||
      (entry.instance.mixinId && entry.instance.mixinId.toLowerCase().includes(searchLower))
    );
  }
  
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(entry => entry.instance.status === filters.status);
  }
  
  if (filters.minAPY !== undefined) {
    const minAPY = new Big(filters.minAPY);
    filtered = filtered.filter(entry => entry.metrics.apy.gte(minAPY));
  }
  
  if (filters.teeOnly) {
    filtered = filtered.filter(entry => entry.security.runInTEE);
  }
  
  if (filters.attestedOnly) {
    filtered = filtered.filter(entry => entry.security.attestationStatus === 'success');
  }
  
  return filtered;
}