<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-svelte';
	import { generateEd25519PrivateKey } from '$lib/crypto/keys';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';

	let deploymentMethod = $derived(page.url.searchParams.get('method'));
	
	let privateKey = $state('');
	let showPrivateKey = $state(false);
	let copied = $state(false);

	// Initialize the private key on mount
	$effect(() => {
		if (!privateKey) {
			generateEd25519PrivateKey().then(key => {
				privateKey = key;
			});
		}
	});

	async function regenerateKey() {
		privateKey = await generateEd25519PrivateKey();
		copied = false;
	}

	async function copyToClipboard() {
		await navigator.clipboard.writeText(privateKey);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

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
	title="Generate Private Key"
	subtitle="Your new Ed25519 private key has been generated"
	currentStep={2}
	totalSteps={3}
	onNext={handleNext}
	backUrl="/onboard/private-key-choice?method={deploymentMethod || ''}"
	nextLabel={$t('common.continue')}
>
	<Card class="max-w-3xl mx-auto p-8">
		<div class="space-y-6">
			<div>
				<h2 class="text-2xl font-semibold mb-2">Your Private Key</h2>
				<p class="text-muted-foreground">Save this key securely. You'll need it to manage your instance.</p>
			</div>

			<div class="space-y-4">
				<div class="relative">
					<div class="p-4 bg-muted rounded-lg font-mono text-sm break-all">
						{showPrivateKey ? privateKey : '•'.repeat(64)}
					</div>
					<div class="absolute right-2 top-2 flex space-x-2">
						<Button
							size="sm"
							variant="ghost"
							onclick={() => showPrivateKey = !showPrivateKey}
							class="h-8 w-8 p-0"
						>
							{#if showPrivateKey}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onclick={copyToClipboard}
							class="h-8 w-8 p-0"
						>
							<Copy class="h-4 w-4" />
						</Button>
					</div>
				</div>
				
				{#if copied}
					<p class="text-sm text-green-600 dark:text-green-400">Copied to clipboard!</p>
				{/if}

				<Button variant="outline" onclick={regenerateKey} class="w-full">
					<RefreshCw class="mr-2 h-4 w-4" />
					Generate New Key
				</Button>
			</div>

			<Card class="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
					</svg>
					<div class="space-y-1">
						<p class="text-sm font-medium text-amber-800 dark:text-amber-200">Important Security Notice</p>
						<ul class="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
							<li>Save this key in a secure password manager</li>
							<li>Never share this key with anyone</li>
							<li>You cannot recover this key if lost</li>
						</ul>
					</div>
				</div>
			</Card>
		</div>
	</Card>
</OnboardingLayout>