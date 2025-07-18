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
        class="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 transition-colors"
        value={filters.search || ''}
        oninput={handleSearchInput}
      />
    </div>
    
    <Select.Root value={filters.timePeriod as any} onSelectedChange={handleTimePeriodChange}>
      <Select.Trigger class="w-full sm:w-[180px] bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
        <span data-slot="select-value">{getTimePeriodLabel(filters.timePeriod)}</span>
      </Select.Trigger>
      <Select.Content class="bg-gray-900 border-white/10">
        <Select.Item value="24h" class="text-white hover:bg-white/10">24 Hours</Select.Item>
        <Select.Item value="7d" class="text-white hover:bg-white/10">7 Days</Select.Item>
        <Select.Item value="30d" class="text-white hover:bg-white/10">30 Days</Select.Item>
        <Select.Item value="all-time" class="text-white hover:bg-white/10">All Time</Select.Item>
      </Select.Content>
    </Select.Root>
    
    <Select.Root value={filters.status as any} onSelectedChange={handleStatusChange}>
      <Select.Trigger class="w-full sm:w-[180px] bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
        <span data-slot="select-value">{getStatusLabel(filters.status)}</span>
      </Select.Trigger>
      <Select.Content class="bg-gray-900 border-white/10">
        <Select.Item value="all" class="text-white hover:bg-white/10">All Status</Select.Item>
        <Select.Item value="active" class="text-white hover:bg-white/10">Active</Select.Item>
        <Select.Item value="inactive" class="text-white hover:bg-white/10">Inactive</Select.Item>
        <Select.Item value="paused" class="text-white hover:bg-white/10">Paused</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>
  
  <div class="flex flex-wrap gap-2 text-sm">
    <span class="text-gray-400">Quick filters:</span>
    <button 
      class="px-4 py-2 rounded-lg border transition-all duration-200 {filters.teeOnly 
        ? 'bg-gradient-to-r from-emerald-500/20 to-green-600/20 border-emerald-500/50 text-emerald-400' 
        : 'border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20'}"
      onclick={() => onFiltersChange({ ...filters, teeOnly: !filters.teeOnly })}
    >
      🔒 TEE Only
    </button>
    <button 
      class="px-4 py-2 rounded-lg border transition-all duration-200 {filters.attestedOnly 
        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border-blue-500/50 text-blue-400' 
        : 'border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20'}"
      onclick={() => onFiltersChange({ ...filters, attestedOnly: !filters.attestedOnly })}
    >
      ✓ Verified Only
    </button>
    <button 
      class="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 hover:border-white/20 text-gray-300 transition-all duration-200"
      onclick={() => onFiltersChange({ ...filters, minAPY: 50 })}
    >
      APY &gt; 50%
    </button>
    <button 
      class="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 hover:border-white/20 text-gray-300 transition-all duration-200"
      onclick={() => onFiltersChange({ ...filters, status: 'active' })}
    >
      Active Only
    </button>
    {#if filters.minAPY || filters.status !== 'all' || filters.teeOnly || filters.attestedOnly}
      <button 
        class="px-4 py-2 rounded-lg border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all duration-200"
        onclick={() => onFiltersChange({ ...filters, minAPY: undefined, status: 'all', teeOnly: false, attestedOnly: false })}
      >
        Clear Filters
      </button>
    {/if}
  </div>
</div>