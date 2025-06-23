<script lang="ts">
    import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group/index.js';

	let keyMethod = 'mixin'; // 'mixin' or 'privatekey'
	

	$: deploymentMethod = page.url.searchParams.get('method');

	$: nextUrl = (() => {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod
		});
		
		if (keyMethod === 'mixin') {
			return `/onboard/mixin-setup?${params}`;
		} else if (keyMethod === 'privatekey') {
			return `/onboard/private-key-choice?${params}`;
		}
		return '#';
	})();
</script>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<div class="container mx-auto max-w-4xl px-4 py-16">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold mb-4">{$_('onboarding.welcome.title')}</h1>
			<p class="text-xl text-muted-foreground font-light">{$_('onboarding.welcome.subtitle')}</p>
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
		<Card class="max-w-3xl mx-auto p-8">
				<h2 class="text-2xl font-semibold mb-6">{$_('onboarding.welcome.keyMethod')}</h2>
				
				<RadioGroup bind:value={keyMethod} class="space-y-4">
					<!-- Mixin Option -->
					<label 
						class="flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 {keyMethod === 'mixin' ? 'border-primary bg-primary/5' : 'border-border'}"
						for="r-mixin"
					>
						<RadioGroupItem value="mixin" id="r-mixin" class="mt-1" />
						<div class="flex-1">
							<div class="flex items-center space-x-2">
								<span class="font-semibold text-lg">{$_('onboarding.mixin.enable.title')}</span>
								<span class="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">{$_('common.recommended')}</span>
							</div>
							<p class="text-sm text-muted-foreground mt-1">
								{$_('onboarding.mixin.enable.description')}
							</p>
							<p class="text-xs text-muted-foreground mt-1">
								{$_('onboarding.mixin.enable.note')}
							</p>
						</div>
					</label>

					<!-- Private Key Option -->
					<label 
						class="flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 {keyMethod === 'privatekey' ? 'border-primary bg-primary/5' : 'border-border'}"
						for="r-privatekey"
					>
						<RadioGroupItem value="privatekey" id="r-privatekey" class="mt-1" />
						<div class="flex-1">
							<div class="font-semibold text-lg">{$_('onboarding.mixin.disable.title')}</div>
							<p class="text-sm text-muted-foreground mt-1">
								{$_('onboarding.mixin.disable.description')}
							</p>
						</div>
					</label>
				</RadioGroup>

				<!-- Actions -->
				<div class="flex justify-end pt-8">
					<Button 
						size="lg"
						href={nextUrl}
					>
						{$_('common.next')}
						<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
						</svg>
					</Button>
				</div>
		</Card>
	</div>
</div>