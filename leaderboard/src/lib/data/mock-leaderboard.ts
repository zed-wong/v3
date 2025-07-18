import type { LeaderboardEntry, Player } from '$lib/types/leaderboard';

const firstNames = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Quinn', 'Sage', 'River', 'Phoenix'];
const lastNames = ['Smith', 'Chen', 'Kumar', 'Johnson', 'Williams', 'Garcia', 'Silva', 'Kim'];
const countries = ['USA', 'CAN', 'UK', 'JPN', 'KOR', 'BRA', 'GER', 'FRA'];
const teams = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', null];

function generatePlayer(id: number): Player {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${id}`;
  
  return {
    id: `player-${id}`,
    username,
    displayName: `${firstName} ${lastName}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    country: countries[Math.floor(Math.random() * countries.length)],
    team: teams[Math.floor(Math.random() * teams.length)] || undefined
  };
}

function generateLeaderboardEntry(rank: number): LeaderboardEntry {
  const player = generatePlayer(rank);
  const baseScore = 10000 - rank * 100;
  const score = baseScore + Math.floor(Math.random() * 100);
  const gamesPlayed = Math.floor(Math.random() * 500) + 50;
  const wins = Math.floor(gamesPlayed * (0.3 + Math.random() * 0.4));
  const winRate = wins / gamesPlayed;
  const hasStreak = Math.random() > 0.7;
  const streak = hasStreak ? Math.floor(Math.random() * 10) + 1 : 0;
  const previousRank = rank === 1 ? 1 : rank + Math.floor(Math.random() * 5) - 2;
  
  return {
    rank,
    previousRank: previousRank > 0 ? previousRank : undefined,
    player,
    score,
    gamesPlayed,
    winRate,
    streak,
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    achievements: []
  };
}

export function generateMockLeaderboard(count: number = 100): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => generateLeaderboardEntry(i + 1));
}