<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group/index.js';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';

	let keyMethod = $state('mixin');
	
	let deploymentMethod = $derived(page.url.searchParams.get('method'));

	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: keyMethod
		});
		
		if (keyMethod === 'mixin') {
			goto(`/onboard/mixin-setup?${params}`);
		} else if (keyMethod === 'privatekey') {
			goto(`/onboard/private-key-choice?${params}`);
		}
	}
</script>

<OnboardingLayout
	title={$t('onboarding.welcome.title')}
	subtitle={$t('onboarding.welcome.subtitle')}
	currentStep={1}
	totalSteps={3}
	showBack={false}
	onNext={handleNext}
>
	<Card class="max-w-3xl mx-auto p-8">
		<h2 class="text-2xl font-semibold mb-6">{$t('onboarding.welcome.keyMethod')}</h2>
		
		<RadioGroup bind:value={keyMethod} class="space-y-4">
			<label 
				class="flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 {keyMethod === 'mixin' ? 'border-primary bg-primary/5' : 'border-border'}"
				for="r-mixin"
			>
				<RadioGroupItem value="mixin" id="r-mixin" class="mt-1" />
				<div class="flex-1">
					<div class="flex items-center space-x-2">
						<span class="font-semibold text-lg">{$t('onboarding.mixin.enable.title')}</span>
						<span class="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">{$t('common.recommended')}</span>
					</div>
					<p class="text-sm text-muted-foreground mt-1">
						{$t('onboarding.mixin.enable.description')}
					</p>
					<p class="text-xs text-muted-foreground mt-1">
						{$t('onboarding.mixin.enable.note')}
					</p>
				</div>
			</label>

			<label 
				class="flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 {keyMethod === 'privatekey' ? 'border-primary bg-primary/5' : 'border-border'}"
				for="r-privatekey"
			>
				<RadioGroupItem value="privatekey" id="r-privatekey" class="mt-1" />
				<div class="flex-1">
					<div class="font-semibold text-lg">{$t('onboarding.mixin.disable.title')}</div>
					<p class="text-sm text-muted-foreground mt-1">
						{$t('onboarding.mixin.disable.description')}
					</p>
				</div>
			</label>
		</RadioGroup>
	</Card>
</OnboardingLayout>