<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	
	$: deploymentMethod = $page.url.searchParams.get('method');
	
	function handleGenerate() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: 'privatekey'
		});
		goto(`/private-key?${params}`);
	}
	
	function handleImport() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: 'privatekey'
		});
		goto(`/onboard/import-key?${params}`);
	}
	
	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || ''
		});
		goto(`/onboard?${params}`);
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<div class="container mx-auto max-w-2xl px-4 py-16">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold mb-4">Private Key Setup</h1>
			<p class="text-xl text-muted-foreground font-light">Choose how you want to set up your private key</p>
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
		<div class="space-y-4">
			<Card 
				class="p-6 cursor-pointer transition-all hover:border-primary hover:shadow-md"
				on:click={handleGenerate}
			>
				<div class="flex items-start space-x-4">
					<div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
						<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold mb-1">Generate New Private Key</h3>
						<p class="text-sm text-muted-foreground">
							Create a fresh Ed25519 private key. Recommended for new users.
						</p>
						<div class="mt-3">
							<Button variant="outline" size="sm">
								Generate Key
								<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</Button>
						</div>
					</div>
				</div>
			</Card>

			<Card 
				class="p-6 cursor-pointer transition-all hover:border-primary hover:shadow-md"
				on:click={handleImport}
			>
				<div class="flex items-start space-x-4">
					<div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
						<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold mb-1">Import Existing Private Key</h3>
						<p class="text-sm text-muted-foreground">
							Already have an Ed25519 private key? Import it securely.
						</p>
						<div class="mt-3">
							<Button variant="outline" size="sm">
								Import Key
								<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</Button>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<!-- Actions -->
		<div class="flex justify-start pt-8">
			<Button variant="outline" size="lg" on:click={handleBack}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
				</svg>
				Back
			</Button>
		</div>
	</div>
</div>