<script lang="ts">
  import Big from 'big.js';
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
  let itemsPerPage = 20;
  let totalPages = 1;
  
  // Reactive calculation of total pages
  $: totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  
  // Ensure current page is valid when total pages changes
  $: if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }
  
  // Reactively update paginated entries when dependencies change
  $: {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    paginatedEntries = filteredEntries.slice(startIndex, endIndex);
  }
  
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
      let compareResult = 0;
      
      switch (sortConfig.field) {
        case 'rank':
          compareResult = a.rank - b.rank;
          break;
        case 'apy':
          compareResult = a.metrics.apy.cmp(b.metrics.apy);
          break;
        case 'aliveTime':
          compareResult = a.metrics.aliveTime.cmp(b.metrics.aliveTime);
          break;
        case 'campaignsJoined':
          compareResult = a.metrics.campaignsJoined - b.metrics.campaignsJoined;
          break;
        case 'campaignsSuccessful':
          compareResult = a.metrics.campaignsSuccessful - b.metrics.campaignsSuccessful;
          break;
        case 'totalVolume':
          compareResult = a.metrics.totalVolume.cmp(b.metrics.totalVolume);
          break;
        case 'profitLoss':
          compareResult = a.metrics.profitLoss.cmp(b.metrics.profitLoss);
          break;
      }
      
      if (sortConfig.order === 'asc') {
        return compareResult;
      } else {
        return -compareResult;
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
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    paginatedEntries = filteredEntries.slice(startIndex, endIndex);
  }
  
  function handleInstanceClick(entry: MRMLeaderboardEntry) {
    console.log('Instance clicked:', entry);
    // TODO: Show instance detail modal or navigate to instance page
  }
  
  // Calculate summary statistics (from all entries, not affected by filters)
  $: activeInstances = allEntries.filter(e => e.instance.status === 'active').length;
  $: avgAPY = allEntries.length > 0 
    ? allEntries.reduce((sum, e) => sum.plus(e.metrics.apy), new Big(0)).div(allEntries.length) 
    : new Big(0);
  $: totalVolume = allEntries.reduce((sum, e) => sum.plus(e.metrics.totalVolume), new Big(0));
</script>

<div class="min-h-screen bg-white">
  <!-- Subtle gradient accent at top -->
  <div class="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none"></div>
  
  <!-- Content container -->
  <div class="relative container mx-auto py-8 px-4 max-w-7xl">
    <!-- Header Section -->
    <div class="mb-8">
      <h1 class="text-3xl font-semibold text-gray-900 mb-2">
        MRM Instance Leaderboard
      </h1>
      <p class="text-gray-600">Monitor and analyze market making bot performance</p>
    </div>
    
    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
        <p class="text-sm font-medium text-gray-600 mb-1">Active Instances</p>
        <p class="text-2xl font-semibold text-gray-900">{activeInstances}</p>
      </div>
      
      <div class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
        <p class="text-sm font-medium text-gray-600 mb-1">Average APY</p>
        <p class="text-2xl font-semibold text-gray-900">{avgAPY.toFixed(2)}%</p>
      </div>
      
      <div class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
        <p class="text-sm font-medium text-gray-600 mb-1">Total Volume</p>
        <p class="text-2xl font-semibold text-gray-900">
          ${totalVolume.gte(1000000000) 
            ? totalVolume.div(1000000000).toFixed(2) + 'B'
            : totalVolume.gte(1000000) 
            ? totalVolume.div(1000000).toFixed(2) + 'M'
            : totalVolume.div(1000).toFixed(2) + 'K'
          }
        </p>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="bg-white rounded-lg p-6 mb-6 shadow-md border border-gray-100">
      <MRMLeaderboardFilters 
        {filters} 
        onFiltersChange={handleFiltersChange} 
      />
    </div>
    
    <!-- Leaderboard Table -->
    <div class="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100">
      <MRMLeaderboardTable 
        entries={paginatedEntries} 
        {sortConfig}
        onSort={handleSort}
        onInstanceClick={handleInstanceClick}
      />
    </div>
    
    {#if filteredEntries.length === 0}
      <div class="text-center py-12 text-gray-500">
        No instances found matching your criteria
      </div>
    {:else}
      <div class="mt-6">
        <MRMPagination
          {currentPage}
          {totalPages}
          {itemsPerPage}
          totalItems={filteredEntries.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    {/if}
  </div>
</div>