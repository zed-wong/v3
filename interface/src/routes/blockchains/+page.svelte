<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	
	$: deploymentMethod = $page.url.searchParams.get('method');
	$: useMixin = $page.url.searchParams.get('mixin') === 'true';
	
	let selectedBlockchains: string[] = [];
	
	const blockchains = [
		{ id: 'ethereum', name: $_('onboarding.blockchain.chains.ethereum.name'), description: $_('onboarding.blockchain.chains.ethereum.description') },
		{ id: 'solana', name: $_('onboarding.blockchain.chains.solana.name'), description: $_('onboarding.blockchain.chains.solana.description') },
		{ id: 'bsc', name: $_('onboarding.blockchain.chains.bsc.name'), description: $_('onboarding.blockchain.chains.bsc.description') },
		{ id: 'polygon', name: $_('onboarding.blockchain.chains.polygon.name'), description: $_('onboarding.blockchain.chains.polygon.description') },
		{ id: 'arbitrum', name: $_('onboarding.blockchain.chains.arbitrum.name'), description: $_('onboarding.blockchain.chains.arbitrum.description') },
		{ id: 'optimism', name: $_('onboarding.blockchain.chains.optimism.name'), description: $_('onboarding.blockchain.chains.optimism.description') }
	];
	
	function toggleBlockchain(blockchainId: string) {
		if (selectedBlockchains.includes(blockchainId)) {
			selectedBlockchains = selectedBlockchains.filter(id => id !== blockchainId);
		} else {
			selectedBlockchains = [...selectedBlockchains, blockchainId];
		}
	}
	
	function handleNext() {
		if (selectedBlockchains.length > 0) {
			const params = new URLSearchParams({
				method: deploymentMethod || '',
				mixin: useMixin.toString(),
				blockchains: selectedBlockchains.join(',')
			});
			goto(`/exchanges?${params}`);
		}
	}
	
	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			mixin: useMixin.toString()
		});
		goto(`/addresses?${params}`);
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="text-3xl font-bold mb-2">{$_('onboarding.blockchain.title')}</h1>
	<p class="text-muted-foreground mb-8">{$_('onboarding.blockchain.subtitle')}</p>

	<Card class="p-6">
		<div class="space-y-4">
			{#each blockchains as blockchain}
				<div class="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
					<Checkbox 
						checked={selectedBlockchains.includes(blockchain.id)}
						onchange={() => toggleBlockchain(blockchain.id)}
						id={blockchain.id}
					/>
					<Label for={blockchain.id} class="flex-1 cursor-pointer">
						<div class="font-medium">{blockchain.name}</div>
						<div class="text-sm text-muted-foreground">{blockchain.description}</div>
					</Label>
				</div>
			{/each}
			
			{#if selectedBlockchains.length === 0}
				<div class="text-sm text-muted-foreground text-center py-4">
					{$_('onboarding.blockchain.validation')}
				</div>
			{/if}
		</div>

		<div class="flex justify-between pt-6">
			<Button variant="outline" onclick={handleBack}>
				{$_('common.back')}
			</Button>
			<Button onclick={handleNext} disabled={selectedBlockchains.length === 0}>
				{$_('common.next')}
			</Button>
		</div>
	</Card>
</div>