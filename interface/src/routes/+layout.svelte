<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { waitLocale, isLoading } from 'svelte-i18n';
	
	let { children } = $props();
</script>

{#if $isLoading}
	<div class="flex items-center justify-center min-h-screen">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
	</div>
{:else}
	{@render children()}
{/if}
