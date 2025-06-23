<script lang="ts">
	import { _ } from 'svelte-i18n';
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
	<h1 class="text-3xl font-bold mb-2">{$_('onboarding.exchanges.title')}</h1>
	<p class="text-muted-foreground mb-8">{$_('onboarding.exchanges.subtitle')}</p>

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
							{exchange.enabled ? $_('common.enabled') : $_('common.enable')}
						</Button>
					</div>
					
					{#if exchange.enabled}
						<div class="space-y-3 pl-4">
							<div class="space-y-2">
								<Label for="{exchange.name}-key">{$_('onboarding.exchanges.apiKey')}</Label>
								<Input 
									id="{exchange.name}-key"
									type="text" 
									placeholder={$_('onboarding.exchanges.apiKeyPlaceholder')}
									bind:value={exchange.apiKey}
								/>
							</div>
							
							<div class="space-y-2">
								<Label for="{exchange.name}-secret">{$_('onboarding.exchanges.apiSecret')}</Label>
								<Input 
									id="{exchange.name}-secret"
									type="password" 
									placeholder={$_('onboarding.exchanges.apiSecretPlaceholder')}
									bind:value={exchange.apiSecret}
								/>
							</div>
						</div>
					{/if}
				</div>
			{/each}
			
			<div class="mt-6 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
				<p class="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
					{$_('onboarding.exchanges.securityTitle')}
				</p>
				<p class="text-sm text-amber-700 dark:text-amber-300">
					{$_('onboarding.exchanges.securityText')}
				</p>
			</div>
			
			{#if !hasConfiguredExchange}
				<div class="text-sm text-muted-foreground text-center">
					{$_('onboarding.exchanges.validation')}
				</div>
			{/if}
		</div>

		<div class="flex justify-between pt-6">
			<Button variant="outline" onclick={handleBack}>
				{$_('common.back')}
			</Button>
			<Button onclick={handleNext} disabled={!hasConfiguredExchange}>
				{$_('onboarding.exchanges.completeSetup')}
			</Button>
		</div>
	</Card>
</div>