<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	
	$: deploymentMethod = $page.url.searchParams.get('method');
	$: keyMethod = $page.url.searchParams.get('keyMethod');
	$: privateKey = $page.url.searchParams.get('privateKey');
	
	// Mock addresses - in real implementation these would be derived from the private key
	const addresses = [
		{ chain: 'Ethereum', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bd9e' },
		{ chain: 'Solana', address: '7VJoKjR6R6CTDP7dN5eAzrKd8ZF2bgPeFMVuZjLg7KPH' },
		{ chain: 'BSC', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' },
		{ chain: 'Polygon', address: '0x4A35582a710E1F4b2030A3F826DA20BfB6703C09' }
	];
	
	function getKeySource() {
		if (keyMethod === 'mixin') return $_('onboarding.addresses.mixinSpendKey');
		if (keyMethod === 'existing') return $_('onboarding.addresses.importedPrivateKey');
		return $_('onboarding.addresses.generatedPrivateKey');
	}
	
	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod || ''
		});
		goto(`/blockchains?${params}`);
	}
	
	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod || ''
		});
		
		if (keyMethod === 'generate') {
			goto(`/private-key?${params}`);
		} else {
			goto(`/onboard?${params}`);
		}
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="text-3xl font-bold mb-2">{$_('onboarding.addresses.title')}</h1>
	<p class="text-muted-foreground mb-8">
		{$_('onboarding.addresses.subtitlePrefix')} {getKeySource()}
	</p>

	<Card class="p-6">
		<div class="space-y-4">
			<div class="text-sm text-muted-foreground mb-4">
				{$_('onboarding.addresses.description')}
			</div>
			
			{#each addresses as { chain, address }, i}
				{#if i > 0}
					<Separator />
				{/if}
				<div class="space-y-1">
					<h3 class="font-semibold text-sm">{chain}</h3>
					<div class="font-mono text-sm text-muted-foreground break-all">
						{address}
					</div>
				</div>
			{/each}
			
			<div class="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
				<p class="text-sm text-blue-800 dark:text-blue-200">
					{$_('onboarding.addresses.infoText')}
				</p>
			</div>
		</div>

		<div class="flex justify-between pt-6">
			<Button variant="outline" onclick={handleBack}>
				{$_('common.back')}
			</Button>
			<Button onclick={handleNext}>
				{$_('common.next')}
			</Button>
		</div>
	</Card>
</div>