<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import type { LeaderboardFilters, TimePeriod, GameMode } from '$lib/types/leaderboard';
  
  export let filters: LeaderboardFilters;
  export let onFiltersChange: (filters: LeaderboardFilters) => void;
  
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
  
  function handleGameModeChange(value: string | undefined) {
    if (value) {
      onFiltersChange({
        ...filters,
        gameMode: value as GameMode
      });
    }
  }
</script>

<div class="flex flex-col sm:flex-row gap-4 mb-6">
  <div class="relative flex-1">
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
    <Input
      type="text"
      placeholder="Search players..."
      class="pl-10"
      value={filters.search || ''}
      oninput={handleSearchInput}
    />
  </div>
  
  <Select.Root type="single" value={filters.timePeriod} onValueChange={(value: string | undefined) => value && handleTimePeriodChange(value)}>
    <Select.Trigger class="w-full sm:w-[180px]">
      <span data-slot="select-value">{filters.timePeriod === 'all-time' ? 'All Time' : filters.timePeriod === 'daily' ? 'Daily' : filters.timePeriod === 'weekly' ? 'Weekly' : 'Monthly'}</span>
    </Select.Trigger>
    <Select.Content>
      <Select.Item value="daily">Daily</Select.Item>
      <Select.Item value="weekly">Weekly</Select.Item>
      <Select.Item value="monthly">Monthly</Select.Item>
      <Select.Item value="all-time">All Time</Select.Item>
    </Select.Content>
  </Select.Root>
  
  <Select.Root type="single" value={filters.gameMode} onValueChange={(value: string | undefined) => value && handleGameModeChange(value)}>
    <Select.Trigger class="w-full sm:w-[180px]">
      <span data-slot="select-value">{filters.gameMode === 'all' ? 'All Modes' : filters.gameMode === 'solo' ? 'Solo' : filters.gameMode === 'team' ? 'Team' : 'Tournament'}</span>
    </Select.Trigger>
    <Select.Content>
      <Select.Item value="all">All Modes</Select.Item>
      <Select.Item value="solo">Solo</Select.Item>
      <Select.Item value="team">Team</Select.Item>
      <Select.Item value="tournament">Tournament</Select.Item>
    </Select.Content>
  </Select.Root>
</div>