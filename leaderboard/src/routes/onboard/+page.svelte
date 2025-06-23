<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let useMixin = false;
	let paymentConfirmed = false;
	
	$: deploymentMethod = $page.url.searchParams.get('method');

	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			mixin: useMixin.toString()
		});
		
		if (useMixin && paymentConfirmed) {
			goto(`/addresses?${params}`);
		} else if (!useMixin) {
			goto(`/private-key?${params}`);
		}
	}

	function handleBack() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<div class="container mx-auto max-w-4xl px-4 py-16">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold tracking-tight mb-4">Welcome to Your Instance Setup</h1>
			<p class="text-xl text-muted-foreground">Let's configure your deployment in just a few steps</p>
		</div>

		<!-- Progress Indicator -->
		<div class="flex justify-center mb-12">
			<div class="flex items-center space-x-2">
				<div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">1</div>
				<div class="w-24 h-1 bg-primary"></div>
				<div class="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">2</div>
				<div class="w-24 h-1 bg-muted"></div>
				<div class="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">3</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="grid lg:grid-cols-2 gap-8 items-start">
			<!-- Left Panel - Information -->
			<div class="space-y-6">
				<Card class="p-6 bg-primary/5 border-primary/20">
					<div class="flex items-center space-x-3 mb-4">
						<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
							<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
							</svg>
						</div>
						<div>
							<h3 class="font-semibold">Selected Method</h3>
							<p class="text-sm text-muted-foreground capitalize">{deploymentMethod || 'Not selected'}</p>
						</div>
					</div>
				</Card>

				<div class="space-y-4">
					<h2 class="text-2xl font-semibold">Why Choose Mixin?</h2>
					<div class="space-y-3">
						<div class="flex items-start space-x-3">
							<div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
								<svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
								</svg>
							</div>
							<div>
								<p class="font-medium">Enhanced Security</p>
								<p class="text-sm text-muted-foreground">Leverage Mixin's secure infrastructure for key management</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
								<svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
								</svg>
							</div>
							<div>
								<p class="font-medium">Seamless Integration</p>
								<p class="text-sm text-muted-foreground">Built-in support for Mixin ecosystem features</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
								<svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
								</svg>
							</div>
							<div>
								<p class="font-medium">Professional Features</p>
								<p class="text-sm text-muted-foreground">Access advanced trading and management capabilities</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Panel - Configuration -->
			<Card class="p-8">
				<h2 class="text-2xl font-semibold mb-6">Configuration Options</h2>
				
				<div class="space-y-6">
					<!-- Mixin Option -->
					<div class="relative">
						<label 
							for="use-mixin" 
							class="flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 {useMixin ? 'border-primary bg-primary/5' : 'border-border'}"
						>
							<Checkbox bind:checked={useMixin} id="use-mixin" class="mt-1" />
							<div class="flex-1">
								<div class="flex items-center space-x-2">
									<span class="font-semibold text-lg">Enable Mixin Integration</span>
									<span class="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">Recommended</span>
								</div>
								<p class="text-sm text-muted-foreground mt-1">
									Unlock professional features with Mixin's secure infrastructure
								</p>
							</div>
						</label>
					</div>

					<!-- Conditional Mixin Details -->
					{#if useMixin}
						<div class="ml-12 space-y-4 animate-in slide-in-from-top-2 duration-300">
							<Card class="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
								<div class="flex items-start space-x-3">
									<svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
									</svg>
									<div class="space-y-2">
										<p class="font-medium text-amber-800 dark:text-amber-200">One-time Setup Fee Required</p>
										<ul class="text-sm text-amber-700 dark:text-amber-300 space-y-1">
											<li>• $100 USD payment to obtain Mixin credentials</li>
											<li>• Addresses will be derived from your Mixin spend key</li>
											<li>• This is a one-time fee for lifetime access</li>
										</ul>
									</div>
								</div>
							</Card>

							<label 
								for="payment-confirm" 
								class="flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50"
							>
								<Checkbox bind:checked={paymentConfirmed} id="payment-confirm" />
								<span class="text-sm">
									I understand and accept the one-time $100 USD setup fee
								</span>
							</label>
						</div>
					{:else}
						<div class="ml-12 animate-in slide-in-from-top-2 duration-300">
							<Card class="p-4 bg-muted">
								<div class="flex items-center space-x-3">
									<svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
									</svg>
									<p class="text-sm text-muted-foreground">
										A free private key will be generated for your instance
									</p>
								</div>
							</Card>
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex justify-between pt-8">
					<Button variant="outline" size="lg" on:click={handleBack}>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
						</svg>
						Back
					</Button>
					<Button 
						size="lg"
						on:click={handleNext} 
						disabled={useMixin && !paymentConfirmed}
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
</div>