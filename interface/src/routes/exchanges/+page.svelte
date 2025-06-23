<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	
	$: deploymentMethod = $page.url.searchParams.get('method');
	$: useMixin = $page.url.searchParams.get('mixin') === 'true';
	$: selectedBlockchains = $page.url.searchParams.get('blockchains')?.split(',') || [];
	
	interface ExchangeConfig {
		name: string;
		apiKey: string;
		apiSecret: string;
		enabled: boolean;
	}
	
	let exchanges: ExchangeConfig[] = [
		{ name: 'Binance', apiKey: '', apiSecret: '', enabled: false },
		{ name: 'OKX', apiKey: '', apiSecret: '', enabled: false },
		{ name: 'Bybit', apiKey: '', apiSecret: '', enabled: false },
		{ name: 'Gate.io', apiKey: '', apiSecret: '', enabled: false }
	];
	
	$: hasConfiguredExchange = exchanges.some(ex => ex.enabled && ex.apiKey && ex.apiSecret);
	
	function toggleExchange(index: number) {
		exchanges[index].enabled = !exchanges[index].enabled;
	}
	
	function handleNext() {
		if (hasConfiguredExchange) {
			// This would be the final step
			goto('/complete');
		}
	}
	
	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			mixin: useMixin.toString()
		});
		goto(`/blockchains?${params}`);
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="text-3xl font-bold mb-2">Set up exchanges and API Keys</h1>
	<p class="text-muted-foreground mb-8">Configure exchange API credentials for trading</p>

	<Card class="p-6">
		<div class="space-y-6">
			{#each exchanges as exchange, index}
				{#if index > 0}
					<Separator />
				{/if}
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">{exchange.name}</h3>
						<Button 
							variant={exchange.enabled ? "default" : "outline"}
							size="sm"
							onclick={() => toggleExchange(index)}
						>
							{exchange.enabled ? 'Enabled' : 'Enable'}
						</Button>
					</div>
					
					{#if exchange.enabled}
						<div class="space-y-3 pl-4">
							<div class="space-y-2">
								<Label for="{exchange.name}-key">API Key</Label>
								<Input 
									id="{exchange.name}-key"
									type="text" 
									placeholder="Enter API key"
									bind:value={exchange.apiKey}
								/>
							</div>
							
							<div class="space-y-2">
								<Label for="{exchange.name}-secret">API Secret</Label>
								<Input 
									id="{exchange.name}-secret"
									type="password" 
									placeholder="Enter API secret"
									bind:value={exchange.apiSecret}
								/>
							</div>
						</div>
					{/if}
				</div>
			{/each}
			
			<div class="mt-6 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
				<p class="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
					⚠️ Security Notice
				</p>
				<p class="text-sm text-amber-700 dark:text-amber-300">
					API keys will be encrypted and stored in your local database. Never share these credentials.
				</p>
			</div>
			
			{#if !hasConfiguredExchange}
				<div class="text-sm text-muted-foreground text-center">
					Please configure at least one exchange to continue
				</div>
			{/if}
		</div>

		<div class="flex justify-between pt-6">
			<Button variant="outline" onclick={handleBack}>
				Back
			</Button>
			<Button onclick={handleNext} disabled={!hasConfiguredExchange}>
				Complete Setup
			</Button>
		</div>
	</Card>
</div>