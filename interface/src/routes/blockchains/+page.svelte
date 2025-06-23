<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';

	let deploymentMethod = $derived(page.url.searchParams.get('method'));
	let keyMethod = $derived(page.url.searchParams.get('keyMethod'));
	
	const blockchains = [
		{ id: 'ethereum', name: 'Ethereum', icon: '⟠' },
		{ id: 'solana', name: 'Solana', icon: '◉' },
		{ id: 'bsc', name: 'BNB Smart Chain', icon: '⬢' },
		{ id: 'polygon', name: 'Polygon', icon: '⬡' },
		{ id: 'arbitrum', name: 'Arbitrum', icon: '▲' },
		{ id: 'optimism', name: 'Optimism', icon: '⬭' }
	];
	
	let selectedChains = $state<Set<string>>(new Set(['ethereum', 'solana']));
	
	function toggleChain(chainId: string) {
		const newSet = new Set(selectedChains);
		if (newSet.has(chainId)) {
			newSet.delete(chainId);
		} else {
			newSet.add(chainId);
		}
		selectedChains = newSet;
	}

	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod || '',
			chains: Array.from(selectedChains).join(',')
		});
		goto(`/exchanges?${params}`);
	}

	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod || ''
		});
		if (keyMethod === 'mixin') {
			goto(`/addresses?${params}`);
		} else {
			goto(`/onboard/private-key?${params}`);
		}
	}
</script>

<OnboardingLayout
	title={$t('onboarding.blockchains.title')}
	subtitle={$t('onboarding.blockchains.subtitle')}
	currentStep={3}
	totalSteps={3}
	onNext={handleNext}
	nextDisabled={selectedChains.size === 0}
	backUrl={keyMethod === 'mixin' ? '/addresses' : '/onboard/private-key'}
	nextLabel={$t('common.continue')}
>
	<Card class="max-w-3xl mx-auto p-8">
		<div class="space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each blockchains as chain}
					<label
						class="flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 {selectedChains.has(chain.id) ? 'border-primary bg-primary/5' : 'border-border'}"
						for={chain.id}
					>
						<Checkbox
							id={chain.id}
							checked={selectedChains.has(chain.id)}
							onCheckedChange={() => toggleChain(chain.id)}
							class="mt-0.5"
						/>
						<div class="flex items-center space-x-3 flex-1">
							<span class="text-2xl">{chain.icon}</span>
							<Label for={chain.id} class="font-medium cursor-pointer">
								{chain.name}
							</Label>
						</div>
					</label>
				{/each}
			</div>

			<div class="text-center text-sm text-muted-foreground">
				{$t('onboarding.blockchains.selected', { count: selectedChains.size })}
			</div>
		</div>
	</Card>
</OnboardingLayout>