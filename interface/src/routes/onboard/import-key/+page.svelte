<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	
	$: deploymentMethod = $page.url.searchParams.get('method');
	
	let privateKey = '';
	let confirmKey = '';
	
	function handleNext() {
		if (privateKey && privateKey === confirmKey) {
			const params = new URLSearchParams({
				method: deploymentMethod || '',
				keyMethod: 'existing'
			});
			// In real implementation, privateKey would be encrypted before navigation
			goto(`/addresses?${params}`);
		}
	}
	
	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || ''
		});
		goto(`/onboard?${params}`);
	}
	
	$: isValidKey = /^[a-fA-F0-9]{64}$/.test(privateKey);
	$: keysMatch = privateKey && privateKey === confirmKey;
	$: canContinue = isValidKey && keysMatch;
</script>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<div class="container mx-auto max-w-2xl px-4 py-16">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold mb-4">Import Private Key</h1>
			<p class="text-xl text-muted-foreground font-light">Use your existing Ed25519 private key</p>
		</div>

		<!-- Progress Indicator -->
		<div class="flex justify-center mb-12">
			<div class="flex items-center space-x-2">
				<div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">2</div>
				<div class="w-24 h-1 bg-primary"></div>
				<div class="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">3</div>
			</div>
		</div>

		<!-- Main Content -->
		<Card class="p-8">
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-semibold mb-2">Enter Your Private Key</h2>
					<p class="text-muted-foreground">Your key will be encrypted and stored securely</p>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="private-key">Ed25519 Private Key</Label>
						<Input 
							id="private-key"
							type="password" 
							placeholder="Enter your 64-character hex private key"
							bind:value={privateKey}
							class="font-mono"
							maxlength="64"
							pattern="[a-fA-F0-9]{64}"
						/>
						{#if privateKey && !isValidKey}
							<p class="text-sm text-destructive">Invalid key format. Must be 64 hex characters</p>
						{:else if isValidKey}
							<p class="text-sm text-green-600 dark:text-green-400">✓ Valid Ed25519 key format</p>
						{:else}
							<p class="text-xs text-muted-foreground">32 bytes (64 hex characters)</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="confirm-key">Confirm Private Key</Label>
						<Input 
							id="confirm-key"
							type="password" 
							placeholder="Re-enter your private key"
							bind:value={confirmKey}
							class="font-mono"
							maxlength="64"
						/>
						{#if confirmKey && !keysMatch}
							<p class="text-sm text-destructive">Keys do not match</p>
						{:else if keysMatch}
							<p class="text-sm text-green-600 dark:text-green-400">✓ Keys match</p>
						{/if}
					</div>
				</div>

				<Card class="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
					<div class="flex items-start space-x-3">
						<svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
						</svg>
						<div class="space-y-1">
							<p class="text-sm font-medium text-amber-800 dark:text-amber-200">Security Notice</p>
							<ul class="text-sm text-amber-700 dark:text-amber-300 space-y-1">
								<li>• Never share your private key with anyone</li>
								<li>• Make sure you have a backup before proceeding</li>
								<li>• Your key will be encrypted before storage</li>
							</ul>
						</div>
					</div>
				</Card>
			</div>

			<!-- Actions -->
			<div class="flex justify-between pt-8">
				<Button variant="outline" size="lg" onclick={handleBack}>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
					</svg>
					Back
				</Button>
				<Button 
					size="lg"
					onclick={handleNext} 
					disabled={!canContinue}
				>
					Continue
					<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
					</svg>
				</Button>
			</div>
		</Card>
	</div>
</div>