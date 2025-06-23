<script lang="ts">
	import { page } from '$app/stores';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	
	$: deploymentMethod = $page.url.searchParams.get('method');
	
	let botId = '';
	let sessionId = '';
	let spendKey = '';
	
	$: nextParams = new URLSearchParams({
		method: deploymentMethod || '',
		keyMethod: 'mixin',
		botId,
		sessionId
	});
	
	$: backParams = new URLSearchParams({
		method: deploymentMethod || ''
	});
	
	$: canContinue = botId && sessionId && spendKey;
</script>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<div class="container mx-auto max-w-2xl px-4 py-16">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold mb-4">Mixin Bot Setup</h1>
			<p class="text-xl text-muted-foreground font-light">Configure your Mixin bot credentials</p>
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
					<h2 class="text-2xl font-semibold mb-2">Bot Credentials</h2>
					<p class="text-muted-foreground">Enter your Mixin bot information</p>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="bot-id">Bot ID</Label>
						<Input 
							id="bot-id"
							type="text" 
							placeholder="Enter your bot ID"
							bind:value={botId}
						/>
					</div>

					<div class="space-y-2">
						<Label for="session-id">Session ID</Label>
						<Input 
							id="session-id"
							type="text" 
							placeholder="Enter your session ID"
							bind:value={sessionId}
						/>
					</div>

					<div class="space-y-2">
						<Label for="spend-key">Spend Key</Label>
						<Input 
							id="spend-key"
							type="password" 
							placeholder="Enter your spend key"
							bind:value={spendKey}
							class="font-mono"
						/>
						<p class="text-xs text-muted-foreground">Your spend key will be used to derive addresses and will be encrypted</p>
					</div>
				</div>

				<Card class="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
					<div class="flex items-start space-x-3">
						<svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
						</svg>
						<div class="space-y-1">
							<p class="text-sm font-medium text-blue-800 dark:text-blue-200">How to get these credentials</p>
							<ol class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
								<li>1. Visit <a href="https://developers.mixin.one" target="_blank" class="underline">developers.mixin.one</a></li>
								<li>2. Create a new bot (costs $100 USD)</li>
								<li>3. Copy your bot credentials from the dashboard</li>
							</ol>
						</div>
					</div>
				</Card>
			</div>

			<!-- Actions -->
			<div class="flex justify-between pt-8">
				<Button variant="outline" size="lg" href="/onboard?{backParams}">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
					</svg>
					Back
				</Button>
				<Button 
					size="lg"
					href={canContinue ? `/addresses?${nextParams}` : undefined}
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