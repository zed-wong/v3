<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import type { MRMLeaderboardEntry, SortConfig, SortField, SecuritySpecs } from '$lib/types/mrm-instance';
  
  export let entries: MRMLeaderboardEntry[] = [];
  export let sortConfig: SortConfig = { field: 'rank', order: 'asc' };
  export let onSort: (field: SortField) => void = () => {};
  export let onInstanceClick: (entry: MRMLeaderboardEntry) => void = () => {};
  
  function getRankEmoji(rank: number) {
    switch (rank) {
      case 1:
        return '🥇';
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
  
  function formatROI(roi: number): string {
    const sign = roi >= 0 ? '+' : '';
    return `${sign}${roi.toFixed(2)}%`;
  }
  
  function formatAPY(apy: number): string {
    return `${apy.toFixed(2)}%`;
  }
  
  function formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  }
  
  function formatPnL(pnl: number): string {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${formatVolume(Math.abs(pnl))}`;
  }
  
  function formatAliveTime(hours: number): string {
    if (hours < 24) {
      return `${Math.floor(hours)}h`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days}d`;
    }
    const months = Math.floor(days / 30);
    return `${months}mo`;
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'secondary';
    }
  }
  
  function getSuccessRate(successful: number, total: number): number {
    return total > 0 ? (successful / total) * 100 : 0;
  }
  
  function getAttestationBadge(status: SecuritySpecs['attestationStatus']) {
    switch (status) {
      case 'success':
        return { text: 'Attested', variant: 'default', emoji: '✓' };
      case 'failed':
        return { text: 'Failed', variant: 'destructive', emoji: '✗' };
      case 'pending':
        return { text: 'Pending', variant: 'secondary', emoji: '⏳' };
      case 'not_available':
        return { text: 'N/A', variant: 'outline', emoji: '—' };
    }
  }
  
  function getSecurityBadge(security: SecuritySpecs) {
    if (security.runInTEE && security.attestationStatus === 'success') {
      return { text: 'TEE + Attested', variant: 'default', class: 'bg-green-500 text-white' };
    } else if (security.runInTEE) {
      return { text: 'TEE', variant: 'secondary', class: '' };
    } else {
      return { text: 'Standard', variant: 'outline', class: '' };
    }
  }
</script>

<div class="w-full overflow-hidden rounded-lg border">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-[80px] text-center">Rank</Table.Head>
        <Table.Head>Instance</Table.Head>
        <Table.Head>Security</Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('apy')}
        >
          APY
          {#if sortConfig.field === 'apy'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('aliveTime')}
        >
          Alive Time
          {#if sortConfig.field === 'aliveTime'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('campaignsSuccessful')}
        >
          Campaigns
          {#if sortConfig.field === 'campaignsSuccessful'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('totalVolume')}
        >
          Volume
          {#if sortConfig.field === 'totalVolume'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-muted/50"
          onclick={() => onSort('profitLoss')}
        >
          P&L
          {#if sortConfig.field === 'profitLoss'}
            <span class="ml-1">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each entries as entry (entry.instance.id)}
        <Table.Row 
          class="cursor-pointer hover:bg-muted/50 transition-colors"
          onclick={() => onInstanceClick(entry)}
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
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="font-medium">{entry.instance.name}</span>
                <Badge variant={getStatusColor(entry.instance.status)}>
                  {entry.instance.status}
                </Badge>
              </div>
              <div class="text-xs text-muted-foreground font-mono">
                {entry.instance.uuid || entry.instance.mixinId || entry.instance.id}
              </div>
            </div>
          </Table.Cell>
          <Table.Cell>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1">
                {@const secBadge = getSecurityBadge(entry.security)}
                <Badge variant={secBadge.variant} class={secBadge.class}>
                  {secBadge.text}
                </Badge>
              </div>
              <div class="flex items-center gap-1">
                {@const attBadge = getAttestationBadge(entry.security.attestationStatus)}
                <span class="text-xs text-muted-foreground">
                  {attBadge.emoji} {attBadge.text}
                </span>
              </div>
            </div>
          </Table.Cell>
          <Table.Cell class="text-right font-semibold">
            {formatAPY(entry.metrics.apy)}
          </Table.Cell>
          <Table.Cell class="text-right">
            {formatAliveTime(entry.metrics.aliveTime)}
          </Table.Cell>
          <Table.Cell class="text-right">
            <div class="flex flex-col items-end gap-0.5">
              <span class="font-medium">{entry.metrics.campaignsSuccessful}/{entry.metrics.campaignsJoined}</span>
              <span class="text-xs text-muted-foreground">
                {getSuccessRate(entry.metrics.campaignsSuccessful, entry.metrics.campaignsJoined).toFixed(0)}% success
              </span>
            </div>
          </Table.Cell>
          <Table.Cell class="text-right font-medium">
            {formatVolume(entry.metrics.totalVolume)}
          </Table.Cell>
          <Table.Cell class="text-right font-semibold {entry.metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}">
            {formatPnL(entry.metrics.profitLoss)}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>