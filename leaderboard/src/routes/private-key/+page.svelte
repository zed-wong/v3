<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	
	let privateKey = '';
	let keyGenerated = false;
	
	$: deploymentMethod = $page.url.searchParams.get('method');
	$: keyMethod = $page.url.searchParams.get('keyMethod');
	
	function generatePrivateKey() {
		// Mock Ed25519 private key generation - 32 bytes = 64 hex characters
		// In real implementation this would use proper crypto for Ed25519
		privateKey = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
		keyGenerated = true;
	}
	
	function handleNext() {
		if (keyGenerated) {
			const params = new URLSearchParams({
				method: deploymentMethod || '',
				keyMethod: 'generate'
			});
			goto(`/addresses?${params}`);
		}
	}
	
	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod || ''
		});
		goto(`/onboard?${params}`);
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="text-3xl font-bold mb-2">Generate Private Key</h1>
	<p class="text-muted-foreground mb-8">Generate a free Ed25519 private key for your instance</p>

	<Card class="p-6">
		<div class="space-y-6">
			{#if !keyGenerated}
				<div class="text-center py-8">
					<p class="text-muted-foreground mb-6">
						Click the button below to generate a new private key
					</p>
					<Button on:click={generatePrivateKey} size="lg">
						Generate Private Key
					</Button>
				</div>
			{:else}
				<div class="space-y-4">
					<div>
						<h3 class="font-semibold mb-2">Your Ed25519 Private Key</h3>
						<div class="p-4 bg-muted rounded-lg font-mono text-sm break-all">
							{privateKey}
						</div>
						<p class="text-xs text-muted-foreground mt-2">32 bytes (64 hex characters)</p>
					</div>
					
					<div class="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
						<p class="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">
							⚠️ Important Security Notice
						</p>
						<p class="text-sm text-amber-700 dark:text-amber-300">
							Save this private key securely. It will be encrypted and stored in your local database.
							You will not be able to recover it if lost.
						</p>
					</div>
				</div>
			{/if}
		</div>

		<div class="flex justify-between pt-6">
			<Button variant="outline" on:click={handleBack}>
				Back
			</Button>
			<Button on:click={handleNext} disabled={!keyGenerated}>
				Continue
			</Button>
		</div>
	</Card>
</div>