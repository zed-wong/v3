<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import type { LeaderboardEntry, SortConfig, SortField } from '$lib/types/leaderboard';
  
  export let entries: LeaderboardEntry[] = [];
  export let sortConfig: SortConfig = { field: 'rank', order: 'asc' };
  export let onSort: (field: SortField) => void = () => {};
  export let onPlayerClick: (entry: LeaderboardEntry) => void = () => {};
  
  function getRankEmoji(rank: number) {
    switch (rank) {
      case 1:
        return '🏆';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  }
  
  function getRankChange(current: number, previous?: number) {
    if (!previous) return { symbol: null, class: '' };
    if (current < previous) return { symbol: '↑', class: 'text-green-500' };
    if (current > previous) return { symbol: '↓', class: 'text-red-500' };
    return { symbol: '−', class: 'text-gray-400' };
  }
  
  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }
  
  function formatWinRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }
  
  function formatLastActive(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
</script>

<div class="w-full overflow-hidden rounded-lg border">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-[80px] text-center">Rank</Table.Head>
        <Table.Head>Player</Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('score')}
        >
          Score
          {#if sortConfig.field === 'score'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('gamesPlayed')}
        >
          Games
          {#if sortConfig.field === 'gamesPlayed'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('winRate')}
        >
          Win Rate
          {#if sortConfig.field === 'winRate'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head class="text-right">Streak</Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('lastActive')}
        >
          Last Active
          {#if sortConfig.field === 'lastActive'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each entries as entry (entry.player.id)}
        <Table.Row 
          class="cursor-pointer hover:bg-muted/50 transition-colors"
          onclick={() => onPlayerClick(entry)}
        >
          <Table.Cell class="text-center font-bold">
            <div class="flex items-center justify-center gap-2">
              {#if entry.rank <= 3}
                {#if getRankEmoji(entry.rank)}
                  <span class="text-xl">{getRankEmoji(entry.rank)}</span>
                {/if}
              {/if}
              <span class="{entry.rank <= 3 ? 'text-lg' : ''}">
                {entry.rank}
              </span>
              {#if getRankChange(entry.rank, entry.previousRank).symbol}
                <span class="{getRankChange(entry.rank, entry.previousRank).class} font-bold">
                  {getRankChange(entry.rank, entry.previousRank).symbol}
                </span>
              {/if}
            </div>
          </Table.Cell>
          <Table.Cell>
            <div class="flex items-center gap-3">
              <Avatar.Root class="h-10 w-10">
                <Avatar.Image src={entry.player.avatar} alt={entry.player.displayName} />
                <Avatar.Fallback>
                  {entry.player.displayName.slice(0, 2).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              <div>
                <div class="font-medium">{entry.player.displayName}</div>
                <div class="text-sm text-muted-foreground">@{entry.player.username}</div>
              </div>
              {#if entry.player.country}
                <Badge variant="secondary" class="ml-2">
                  {entry.player.country}
                </Badge>
              {/if}
            </div>
          </Table.Cell>
          <Table.Cell class="text-right font-semibold text-lg">
            {formatNumber(entry.score)}
          </Table.Cell>
          <Table.Cell class="text-right">
            {formatNumber(entry.gamesPlayed)}
          </Table.Cell>
          <Table.Cell class="text-right">
            <span class="{entry.winRate >= 0.6 ? 'text-green-600' : entry.winRate <= 0.4 ? 'text-red-600' : ''}">
              {formatWinRate(entry.winRate)}
            </span>
          </Table.Cell>
          <Table.Cell class="text-right">
            {#if entry.streak && entry.streak > 0}
              <Badge variant={entry.streak >= 5 ? 'default' : 'secondary'}>
                🔥 {entry.streak}
              </Badge>
            {:else}
              <span class="text-muted-foreground">-</span>
            {/if}
          </Table.Cell>
          <Table.Cell class="text-right text-sm text-muted-foreground">
            {formatLastActive(entry.lastActive)}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>