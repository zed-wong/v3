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

<div class="flex flex-col gap-4">
  <div class="flex flex-col sm:flex-row gap-4">
    <div class="relative flex-1">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      <Input
        type="text"
        placeholder="Search instances by name or ID..."
        class="pl-10"
        value={filters.search || ''}
        oninput={handleSearchInput}
      />
    </div>
    
    <Select.Root type="single" value={filters.timePeriod} onValueChange={(value: string | undefined) => value && handleTimePeriodChange(value)}>
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
    
    <Select.Root type="single" value={filters.status} onValueChange={(value: string | undefined) => value && handleStatusChange(value)}>
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
    <span class="text-gray-600">Quick filters:</span>
    <button 
      class="px-3 py-1.5 rounded-md border {filters.teeOnly 
        ? 'bg-green-50 border-green-300 text-green-700' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-colors"
      onclick={() => onFiltersChange({ ...filters, teeOnly: !filters.teeOnly })}
    >
      🔒 TEE Only
    </button>
    <button 
      class="px-3 py-1.5 rounded-md border {filters.attestedOnly 
        ? 'bg-blue-50 border-blue-300 text-blue-700' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-colors"
      onclick={() => onFiltersChange({ ...filters, attestedOnly: !filters.attestedOnly })}
    >
      ✓ Verified Only
    </button>
    <button 
      class="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      onclick={() => onFiltersChange({ ...filters, minAPY: 50 })}
    >
      APY &gt; 50%
    </button>
    <button 
      class="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      onclick={() => onFiltersChange({ ...filters, status: 'active' })}
    >
      Active Only
    </button>
    {#if filters.minAPY || filters.status !== 'all' || filters.teeOnly || filters.attestedOnly}
      <button 
        class="px-3 py-1.5 rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
        onclick={() => onFiltersChange({ ...filters, minAPY: undefined, status: 'all', teeOnly: false, attestedOnly: false })}
      >
        Clear Filters
      </button>
    {/if}
  </div>
</div>