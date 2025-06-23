<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { isValidEd25519PrivateKey } from '$lib/crypto/keys';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';

	let deploymentMethod = $derived(page.url.searchParams.get('method'));
	
	let privateKey = $state('');
	let isValid = $state(false);
	let error = $state('');

	function validateKey() {
		if (!privateKey) {
			isValid = false;
			error = '';
			return;
		}
		
		try {
			isValid = isValidEd25519PrivateKey(privateKey);
			error = isValid ? '' : 'Invalid Ed25519 private key format';
		} catch {
			isValid = false;
			error = 'Invalid private key';
		}
	}

	$effect(() => {
		validateKey();
	});

	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: 'privatekey'
		});
		goto(`/addresses?${params}`);
	}

	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: 'privatekey'
		});
		goto(`/onboard/private-key-choice?${params}`);
	}
</script>

<OnboardingLayout
	title="Import Private Key"
	subtitle="Enter your existing Ed25519 private key"
	currentStep={2}
	totalSteps={3}
	onNext={handleNext}
	nextDisabled={!isValid}
	backUrl="/onboard/private-key-choice?method={deploymentMethod || ''}"
	nextLabel={$t('common.continue')}
>
	<Card class="max-w-3xl mx-auto p-8">
		<div class="space-y-6">
			<div>
				<h2 class="text-2xl font-semibold mb-2">Enter Your Private Key</h2>
				<p class="text-muted-foreground">Paste your Ed25519 private key (64 hex characters)</p>
			</div>

			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="private-key">Private Key</Label>
					<Input
						id="private-key"
						type="password"
						placeholder="Enter your 64-character hex private key"
						bind:value={privateKey}
						class="font-mono"
					/>
					{#if error}
						<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
					{/if}
					{#if isValid}
						<p class="text-sm text-green-600 dark:text-green-400">Valid Ed25519 private key</p>
					{/if}
				</div>
			</div>

			<Card class="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
					</svg>
					<div class="space-y-1">
						<p class="text-sm font-medium text-blue-800 dark:text-blue-200">Private Key Format</p>
						<p class="text-sm text-blue-700 dark:text-blue-300">
							Your Ed25519 private key should be 64 hexadecimal characters (32 bytes).
							It should only contain numbers 0-9 and letters a-f.
						</p>
					</div>
				</div>
			</Card>

			<Card class="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
					</svg>
					<p class="text-sm text-amber-800 dark:text-amber-200">
						{$t('onboarding.privateKey.warning')}
					</p>
				</div>
			</Card>
		</div>
	</Card>
</OnboardingLayout>