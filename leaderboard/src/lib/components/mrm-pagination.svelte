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

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
  <div class="text-sm text-muted-foreground">
    Showing {startItem}-{endItem} of {totalItems} instances
  </div>
  
  <div class="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onclick={() => goToPage(currentPage - 1)}
      disabled={currentPage === 1}
    >
      Previous
    </Button>
    
    <div class="flex items-center gap-1">
      {#each getPageNumbers() as page}
        {#if page === '...'}
          <span class="px-2 text-muted-foreground">...</span>
        {:else}
          <Button
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            class="w-10"
            onclick={() => goToPage(page)}
          >
            {page}
          </Button>
        {/if}
      {/each}
    </div>
    
    <Button
      variant="outline"
      size="sm"
      onclick={() => goToPage(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      Next
    </Button>
  </div>
</div>