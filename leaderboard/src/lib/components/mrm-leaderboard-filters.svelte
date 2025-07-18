<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import type { MRMLeaderboardFilters, TimePeriod, StatusFilter } from '$lib/types/mrm-instance';
  
  export let filters: MRMLeaderboardFilters;
  export let onFiltersChange: (filters: MRMLeaderboardFilters) => void;
  
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onFiltersChange({
      ...filters,
      search: target.value
    });
  }
  
  function handleTimePeriodChange(value: string | undefined) {
    if (value) {
      onFiltersChange({
        ...filters,
        timePeriod: value as TimePeriod
      });
    }
  }
  
  function handleStatusChange(value: string | undefined) {
    if (value) {
      onFiltersChange({
        ...filters,
        status: value as StatusFilter
      });
    }
  }
  
  function getTimePeriodLabel(period: TimePeriod): string {
    switch (period) {
      case '24h': return '24 Hours';
      case '7d': return '7 Days';
      case '30d': return '30 Days';
      case 'all-time': return 'All Time';
    }
  }
  
  function getStatusLabel(status: StatusFilter): string {
    switch (status) {
      case 'all': return 'All Status';
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'paused': return 'Paused';
    }
  }
</script>

<div class="flex flex-col gap-4 mb-6">
  <div class="flex flex-col sm:flex-row gap-4">
    <div class="relative flex-1">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
      <Input
        type="text"
        placeholder="Search instances by name or ID..."
        class="pl-10"
        value={filters.search || ''}
        oninput={handleSearchInput}
      />
    </div>
    
    <Select.Root value={filters.timePeriod as any} onSelectedChange={handleTimePeriodChange}>
      <Select.Trigger class="w-full sm:w-[180px]">
        <span data-slot="select-value">{getTimePeriodLabel(filters.timePeriod)}</span>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="24h">24 Hours</Select.Item>
        <Select.Item value="7d">7 Days</Select.Item>
        <Select.Item value="30d">30 Days</Select.Item>
        <Select.Item value="all-time">All Time</Select.Item>
      </Select.Content>
    </Select.Root>
    
    <Select.Root value={filters.status as any} onSelectedChange={handleStatusChange}>
      <Select.Trigger class="w-full sm:w-[180px]">
        <span data-slot="select-value">{getStatusLabel(filters.status)}</span>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="all">All Status</Select.Item>
        <Select.Item value="active">Active</Select.Item>
        <Select.Item value="inactive">Inactive</Select.Item>
        <Select.Item value="paused">Paused</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>
  
  <div class="flex flex-wrap gap-2 text-sm">
    <span class="text-muted-foreground">Quick filters:</span>
    <button 
      class="px-3 py-1 rounded-md border hover:bg-muted transition-colors"
      onclick={() => onFiltersChange({ ...filters, minAPY: 50 })}
    >
      APY &gt; 50%
    </button>
    <button 
      class="px-3 py-1 rounded-md border hover:bg-muted transition-colors"
      onclick={() => onFiltersChange({ ...filters, status: 'active' })}
    >
      Active Only
    </button>
    {#if filters.minAPY || filters.status !== 'all'}
      <button 
        class="px-3 py-1 rounded-md border hover:bg-muted transition-colors text-red-600"
        onclick={() => onFiltersChange({ ...filters, minAPY: undefined, status: 'all' })}
      >
        Clear Filters
      </button>
    {/if}
  </div>
</div>