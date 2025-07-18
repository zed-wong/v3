<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  
  export let currentPage: number = 1;
  export let totalPages: number = 1;
  export let itemsPerPage: number = 20;
  export let totalItems: number = 0;
  export let onPageChange: (page: number) => void = () => {};
  
  $: startItem = (currentPage - 1) * itemsPerPage + 1;
  $: endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }
  
  function getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  }
</script>

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
  <div class="text-sm text-gray-400">
    Showing <span class="text-white font-medium">{startItem}-{endItem}</span> of <span class="text-white font-medium">{totalItems}</span> instances
  </div>
  
  <div class="flex items-center gap-2">
    <Button
      variant="ghost"
      size="sm"
      onclick={() => goToPage(currentPage - 1)}
      disabled={currentPage === 1}
      class="text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-all duration-200"
    >
      ← Previous
    </Button>
    
    <div class="flex items-center gap-1">
      {#each getPageNumbers() as page}
        {#if page === '...'}
          <span class="px-2 text-gray-500">...</span>
        {:else}
          <Button
            variant={page === currentPage ? 'default' : 'ghost'}
            size="sm"
            class="w-10 h-10 {page === currentPage 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/25' 
              : 'text-gray-300 hover:text-white hover:bg-white/10'} transition-all duration-200"
            onclick={() => goToPage(page)}
          >
            {page}
          </Button>
        {/if}
      {/each}
    </div>
    
    <Button
      variant="ghost"
      size="sm"
      onclick={() => goToPage(currentPage + 1)}
      disabled={currentPage === totalPages}
      class="text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-all duration-200"
    >
      Next →
    </Button>
  </div>
</div>