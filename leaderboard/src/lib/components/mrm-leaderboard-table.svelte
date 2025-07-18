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
    if (current < previous) return { symbol: '↑', class: 'text-green-600' };
    if (current > previous) return { symbol: '↓', class: 'text-red-600' };
    return { symbol: '−', class: 'text-gray-400' };
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
        return { text: 'Verified', variant: 'default', emoji: '✓' };
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
      return { text: 'TEE + Verified', variant: 'default', class: 'bg-green-100 text-green-800 border-green-200' };
    } else if (security.runInTEE) {
      return { text: 'TEE', variant: 'secondary', class: 'bg-blue-100 text-blue-800 border-blue-200' };
    } else {
      return { text: 'Standard', variant: 'outline', class: '' };
    }
  }
</script>

<div class="w-full">
  <Table.Root>
    <Table.Header>
      <Table.Row class="border-b hover:bg-transparent">
        <Table.Head class="w-[100px] text-center font-medium">Rank</Table.Head>
        <Table.Head class="font-medium">Instance</Table.Head>
        <Table.Head class="font-medium">Security</Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-gray-50 font-medium"
          onclick={() => onSort('apy')}
        >
          APY
          {#if sortConfig.field === 'apy'}
            <span class="ml-1 text-blue-600">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-gray-50 font-medium"
          onclick={() => onSort('aliveTime')}
        >
          Uptime
          {#if sortConfig.field === 'aliveTime'}
            <span class="ml-1 text-blue-600">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-gray-50 font-medium"
          onclick={() => onSort('campaignsSuccessful')}
        >
          Campaigns
          {#if sortConfig.field === 'campaignsSuccessful'}
            <span class="ml-1 text-blue-600">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-gray-50 font-medium"
          onclick={() => onSort('totalVolume')}
        >
          Volume
          {#if sortConfig.field === 'totalVolume'}
            <span class="ml-1 text-blue-600">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
        <Table.Head 
          class="text-right cursor-pointer hover:bg-gray-50 font-medium"
          onclick={() => onSort('profitLoss')}
        >
          P&L
          {#if sortConfig.field === 'profitLoss'}
            <span class="ml-1 text-blue-600">
              {sortConfig.order === 'asc' ? '↑' : '↓'}
            </span>
          {/if}
        </Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each entries as entry, i (entry.instance.id)}
        <Table.Row 
          class="border-b hover:bg-gray-50 cursor-pointer"
          onclick={() => onInstanceClick(entry)}
        >
          <Table.Cell class="text-center font-medium">
            <div class="flex items-center justify-center gap-2">
              {#if entry.rank <= 3}
                {#if getRankEmoji(entry.rank)}
                  <span class="text-xl">{getRankEmoji(entry.rank)}</span>
                {/if}
              {/if}
              <span class="{entry.rank <= 3 ? 'text-lg font-semibold' : ''}">
                #{entry.rank}
              </span>
              {#if getRankChange(entry.rank, entry.previousRank).symbol}
                <span class="{getRankChange(entry.rank, entry.previousRank).class} text-sm">
                  {getRankChange(entry.rank, entry.previousRank).symbol}
                </span>
              {/if}
            </div>
          </Table.Cell>
          <Table.Cell>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">
                  {entry.instance.name}
                </span>
                <Badge 
                  variant={getStatusColor(entry.instance.status)}
                  class={entry.instance.status === 'active' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : entry.instance.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'}
                >
                  {entry.instance.status}
                </Badge>
              </div>
              <div class="text-xs text-gray-500 font-mono">
                {entry.instance.uuid || entry.instance.mixinId || entry.instance.id}
              </div>
            </div>
          </Table.Cell>
          <Table.Cell>
            {@const secBadge = getSecurityBadge(entry.security)}
            {@const attBadge = getAttestationBadge(entry.security.attestationStatus)}
            <div class="flex flex-col gap-1">
              <Badge variant={secBadge.variant} class={secBadge.class}>
                {secBadge.text}
              </Badge>
              <span class="text-xs text-gray-500 flex items-center gap-1">
                <span class="{entry.security.attestationStatus === 'success' ? 'text-green-600' : ''}">{attBadge.emoji}</span>
                {attBadge.text}
              </span>
            </div>
          </Table.Cell>
          <Table.Cell class="text-right">
            <div class="font-medium text-gray-900">
              {formatAPY(entry.metrics.apy)}
            </div>
          </Table.Cell>
          <Table.Cell class="text-right text-gray-600">
            {formatAliveTime(entry.metrics.aliveTime)}
          </Table.Cell>
          <Table.Cell class="text-right">
            <div class="flex flex-col items-end gap-0.5">
              <span class="font-medium text-gray-900">
                {entry.metrics.campaignsSuccessful}/{entry.metrics.campaignsJoined}
              </span>
              <div class="flex items-center gap-1">
                <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-600 rounded-full"
                    style="width: {getSuccessRate(entry.metrics.campaignsSuccessful, entry.metrics.campaignsJoined)}%"
                  ></div>
                </div>
                <span class="text-xs text-gray-500">
                  {getSuccessRate(entry.metrics.campaignsSuccessful, entry.metrics.campaignsJoined).toFixed(0)}%
                </span>
              </div>
            </div>
          </Table.Cell>
          <Table.Cell class="text-right font-medium text-gray-900">
            {formatVolume(entry.metrics.totalVolume)}
          </Table.Cell>
          <Table.Cell class="text-right">
            <span class="font-medium {entry.metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}">
              {formatPnL(entry.metrics.profitLoss)}
            </span>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>