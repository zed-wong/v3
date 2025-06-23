<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Plus, Trash2 } from 'lucide-svelte';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';

	let deploymentMethod = $derived(page.url.searchParams.get('method'));
	let keyMethod = $derived(page.url.searchParams.get('keyMethod'));
	let chains = $derived(page.url.searchParams.get('chains'));
	
	interface Exchange {
		id: string;
		name: string;
		apiKey: string;
		apiSecret: string;
		enabled: boolean;
	}
	
	let exchanges = $state<Exchange[]>([
		{ id: 'binance', name: 'Binance', apiKey: '', apiSecret: '', enabled: false },
		{ id: 'okx', name: 'OKX', apiKey: '', apiSecret: '', enabled: false },
		{ id: 'bybit', name: 'Bybit', apiKey: '', apiSecret: '', enabled: false },
		{ id: 'gateio', name: 'Gate.io', apiKey: '', apiSecret: '', enabled: false }
	]);
	
	let canContinue = $derived(exchanges.some(ex => ex.enabled && ex.apiKey && ex.apiSecret));
	
	function toggleExchange(id: string) {
		const index = exchanges.findIndex(ex => ex.id === id);
		if (index !== -1) {
			exchanges[index].enabled = !exchanges[index].enabled;
		}
	}

	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod || '',
			chains: chains || ''
		});
		goto(`/complete?${params}`);
	}

	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod || ''
		});
		goto(`/blockchains?${params}`);
	}
</script>

<OnboardingLayout
	title={$t('onboarding.exchanges.title')}
	subtitle={$t('onboarding.exchanges.subtitle')}
	currentStep={3}
	totalSteps={3}
	onNext={handleNext}
	nextDisabled={!canContinue}
	backUrl="/blockchains"
	nextLabel={$t('common.continue')}
>
	<Card class="max-w-3xl mx-auto p-8">
		<div class="space-y-6">
			{#each exchanges as exchange}
				<Card class="p-4 {exchange.enabled ? 'border-primary bg-primary/5' : ''}">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<label class="flex items-center space-x-3 cursor-pointer" for="enable-{exchange.id}">
								<Checkbox
									id="enable-{exchange.id}"
									checked={exchange.enabled}
									onCheckedChange={() => toggleExchange(exchange.id)}
								/>
								<span class="text-lg font-medium">{exchange.name}</span>
							</label>
						</div>
						
						{#if exchange.enabled}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
								<div class="space-y-2">
									<Label for="{exchange.id}-api-key">{$t('onboarding.exchanges.apiKey')}</Label>
									<Input
										id="{exchange.id}-api-key"
										type="text"
										placeholder="Enter API key"
										bind:value={exchange.apiKey}
										class="font-mono"
									/>
								</div>
								<div class="space-y-2">
									<Label for="{exchange.id}-api-secret">{$t('onboarding.exchanges.apiSecret')}</Label>
									<Input
										id="{exchange.id}-api-secret"
										type="password"
										placeholder="Enter API secret"
										bind:value={exchange.apiSecret}
										class="font-mono"
									/>
								</div>
							</div>
						{/if}
					</div>
				</Card>
			{/each}

			<Card class="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
					</svg>
					<div class="space-y-1">
						<p class="text-sm font-medium text-blue-800 dark:text-blue-200">API Key Requirements</p>
						<ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
							<li>Trading permissions required</li>
							<li>IP whitelist recommended for security</li>
							<li>Read-only access for balance queries</li>
						</ul>
					</div>
				</div>
			</Card>
		</div>
	</Card>
</OnboardingLayout>