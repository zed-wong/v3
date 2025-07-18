<script lang="ts">
  import { onMount } from 'svelte';
  import MRMLeaderboardTable from '$lib/components/mrm-leaderboard-table.svelte';
  import MRMLeaderboardFilters from '$lib/components/mrm-leaderboard-filters.svelte';
  import MRMPagination from '$lib/components/mrm-pagination.svelte';
  import { generateMockMRMLeaderboard, filterAndSortMRMEntries } from '$lib/data/mock-mrm-data';
  import type { MRMLeaderboardEntry, MRMLeaderboardFilters as Filters, SortConfig, SortField } from '$lib/types/mrm-instance';
  
  let allEntries: MRMLeaderboardEntry[] = [];
  let filteredEntries: MRMLeaderboardEntry[] = [];
  let paginatedEntries: MRMLeaderboardEntry[] = [];
  let filters: Filters = {
    timePeriod: 'all-time',
    status: 'all',
    search: '',
    teeOnly: false,
    attestedOnly: false
  };
  let sortConfig: SortConfig = {
    field: 'rank',
    order: 'asc'
  };
  
  // Pagination state
  let currentPage = 1;
  let itemsPerPage = 50;
  let totalPages = 1;
  
  onMount(() => {
    allEntries = generateMockMRMLeaderboard(250); // Generate more data to test pagination
    applyFiltersAndSort();
  });
  
  function handleFiltersChange(newFilters: Filters) {
    filters = newFilters;
    currentPage = 1; // Reset to first page when filters change
    applyFiltersAndSort();
  }
  
  function handleSort(field: SortField) {
    if (sortConfig.field === field) {
      sortConfig.order = sortConfig.order === 'asc' ? 'desc' : 'asc';
    } else {
      sortConfig.field = field;
      sortConfig.order = field === 'rank' ? 'asc' : 'desc';
    }
    applyFiltersAndSort();
  }
  
  function handlePageChange(page: number) {
    currentPage = page;
    updatePaginatedEntries();
  }
  
  function handleItemsPerPageChange(newItemsPerPage: number) {
    itemsPerPage = newItemsPerPage;
    currentPage = 1;
    updatePaginatedEntries();
  }
  
  function applyFiltersAndSort() {
    // Apply filters
    let result = filterAndSortMRMEntries(allEntries, filters);
    
    // Apply sorting
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortConfig.field) {
        case 'rank':
          aVal = a.rank;
          bVal = b.rank;
          break;
        case 'apy':
          aVal = a.metrics.apy;
          bVal = b.metrics.apy;
          break;
        case 'aliveTime':
          aVal = a.metrics.aliveTime;
          bVal = b.metrics.aliveTime;
          break;
        case 'campaignsJoined':
          aVal = a.metrics.campaignsJoined;
          bVal = b.metrics.campaignsJoined;
          break;
        case 'campaignsSuccessful':
          aVal = a.metrics.campaignsSuccessful;
          bVal = b.metrics.campaignsSuccessful;
          break;
        case 'totalVolume':
          aVal = a.metrics.totalVolume;
          bVal = b.metrics.totalVolume;
          break;
        case 'profitLoss':
          aVal = a.metrics.profitLoss;
          bVal = b.metrics.profitLoss;
          break;
      }
      
      if (sortConfig.order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // Update ranks after sorting
    result = result.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    filteredEntries = result;
    updatePaginatedEntries();
  }
  
  function updatePaginatedEntries() {
    totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
    
    // Ensure current page is valid
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    paginatedEntries = filteredEntries.slice(startIndex, endIndex);
  }
  
  function handleInstanceClick(entry: MRMLeaderboardEntry) {
    console.log('Instance clicked:', entry);
    // TODO: Show instance detail modal or navigate to instance page
  }
  
  // Calculate summary statistics (from all filtered entries, not just current page)
  $: activeInstances = filteredEntries.filter(e => e.instance.status === 'active').length;
  $: avgAPY = filteredEntries.length > 0 
    ? filteredEntries.reduce((sum, e) => sum + e.metrics.apy, 0) / filteredEntries.length 
    : 0;
  $: totalVolume = filteredEntries.reduce((sum, e) => sum + e.metrics.totalVolume, 0);
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
  
  <div class="relative z-10 container mx-auto py-8 px-4">
    <!-- Header Section -->
    <div class="mb-12 text-center">
      <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
        MRM Instance Leaderboard
      </h1>
      <p class="text-xl text-gray-300">Track and compare market making bot performance in real-time</p>
    </div>
    
    <!-- Summary Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div class="relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div class="relative p-6 bg-black rounded-lg leading-none flex items-center justify-center space-x-6">
          <div class="space-y-2">
            <p class="text-sm text-gray-400">Active Instances</p>
            <p class="text-3xl font-bold text-white">{activeInstances}</p>
          </div>
        </div>
      </div>
      
      <div class="relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div class="relative p-6 bg-black rounded-lg leading-none flex items-center justify-center space-x-6">
          <div class="space-y-2">
            <p class="text-sm text-gray-400">Average APY</p>
            <p class="text-3xl font-bold text-white">
              {avgAPY.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
      
      <div class="relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        <div class="relative p-6 bg-black rounded-lg leading-none flex items-center justify-center space-x-6">
          <div class="space-y-2">
            <p class="text-sm text-gray-400">Total Volume</p>
            <p class="text-3xl font-bold text-white">
              ${totalVolume >= 1000000000 
                ? (totalVolume / 1000000000).toFixed(2) + 'B'
                : totalVolume >= 1000000 
                ? (totalVolume / 1000000).toFixed(2) + 'M'
                : (totalVolume / 1000).toFixed(2) + 'K'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="backdrop-blur-xl bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
      <MRMLeaderboardFilters 
        {filters} 
        onFiltersChange={handleFiltersChange} 
      />
    </div>
    
    <!-- Leaderboard Table -->
    <div class="backdrop-blur-xl bg-white/5 rounded-xl overflow-hidden border border-white/10">
      <MRMLeaderboardTable 
        entries={paginatedEntries} 
        {sortConfig}
        onSort={handleSort}
        onInstanceClick={handleInstanceClick}
      />
    </div>
    
    {#if filteredEntries.length === 0}
      <div class="text-center py-12 text-gray-400">
        No instances found matching your criteria
      </div>
    {:else}
      <div class="mt-8">
        <MRMPagination
          {currentPage}
          {totalPages}
          {itemsPerPage}
          totalItems={filteredEntries.length}
          onPageChange={handlePageChange}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes tilt {
    0%, 50%, 100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(0.5deg);
    }
    75% {
      transform: rotate(-0.5deg);
    }
  }
  
  .animate-tilt {
    animation: tilt 10s infinite linear;
  }
</style>