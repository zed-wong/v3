<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Copy } from 'lucide-svelte';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';

	let deploymentMethod = $derived(page.url.searchParams.get('method'));
	let keyMethod = $derived(page.url.searchParams.get('keyMethod'));
	
	// Mock addresses - in real implementation, these would be derived from the private key
	const addresses = [
		{ chain: 'Ethereum', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f89d4d', icon: '⟠' },
		{ chain: 'Solana', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', icon: '◉' },
		{ chain: 'Bitcoin', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', icon: '₿' },
		{ chain: 'BNB Chain', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f89d4d', icon: '⬢' }
	];

	async function copyAddress(address: string) {
		await navigator.clipboard.writeText(address);
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
			method: deploymentMethod || ''
		});
		if (keyMethod === 'mixin') {
			goto(`/onboard/mixin-setup?${params}`);
		} else {
			goto(`/onboard/private-key?${params}`);
		}
	}
</script>

<OnboardingLayout
	title="Your Addresses"
	subtitle="These addresses have been derived from your key"
	currentStep={2}
	totalSteps={3}
	onNext={handleNext}
	backUrl={keyMethod === 'mixin' ? '/onboard/mixin-setup' : '/onboard/private-key'}
	nextLabel={$t('common.continue')}
>
	<Card class="max-w-3xl mx-auto p-8">
		<div class="space-y-6">
			<div>
				<h2 class="text-2xl font-semibold mb-2">Derived Addresses</h2>
				<p class="text-muted-foreground">
					These addresses are deterministically derived from your {keyMethod === 'mixin' ? 'Mixin bot' : 'private key'}
				</p>
			</div>

			<div class="space-y-3">
				{#each addresses as { chain, address, icon }}
					<Card class="p-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<span class="text-2xl">{icon}</span>
								<div>
									<p class="font-medium">{chain}</p>
									<p class="text-sm text-muted-foreground font-mono break-all">{address}</p>
								</div>
							</div>
							<Button
								size="sm"
								variant="ghost"
								onclick={() => copyAddress(address)}
								class="flex-shrink-0"
							>
								<Copy class="h-4 w-4" />
							</Button>
						</div>
					</Card>
				{/each}
			</div>

			<Card class="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
					</svg>
					<div class="space-y-1">
						<p class="text-sm font-medium text-blue-800 dark:text-blue-200">About These Addresses</p>
						<p class="text-sm text-blue-700 dark:text-blue-300">
							These addresses are derived using the drxa SDK, which ensures deterministic address generation across multiple blockchains from a single seed.
						</p>
					</div>
				</div>
			</Card>
		</div>
	</Card>
</OnboardingLayout>