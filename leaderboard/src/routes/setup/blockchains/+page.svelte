<script lang="ts">
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
		{ id: 'ethereum', name: 'Ethereum', description: 'Ethereum mainnet' },
		{ id: 'solana', name: 'Solana', description: 'Solana mainnet' },
		{ id: 'bsc', name: 'Binance Smart Chain', description: 'BSC mainnet' },
		{ id: 'polygon', name: 'Polygon', description: 'Polygon mainnet' },
		{ id: 'arbitrum', name: 'Arbitrum', description: 'Arbitrum One' },
		{ id: 'optimism', name: 'Optimism', description: 'Optimism mainnet' }
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
			goto(`/setup/exchanges?${params}`);
		}
	}
	
	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			mixin: useMixin.toString()
		});
		goto(`/setup/addresses?${params}`);
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="text-3xl font-bold mb-2">Set up supported blockchains</h1>
	<p class="text-muted-foreground mb-8">Select the blockchains you want to support</p>

	<Card class="p-6">
		<div class="space-y-4">
			{#each blockchains as blockchain}
				<div class="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
					<Checkbox 
						checked={selectedBlockchains.includes(blockchain.id)}
						on:change={() => toggleBlockchain(blockchain.id)}
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
					Please select at least one blockchain to continue
				</div>
			{/if}
		</div>

		<div class="flex justify-between pt-6">
			<Button variant="outline" on:click={handleBack}>
				Back
			</Button>
			<Button on:click={handleNext} disabled={selectedBlockchains.length === 0}>
				Continue
			</Button>
		</div>
	</Card>
</div>
</script>