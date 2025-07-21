<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group/index.js';
	import { Key, Upload } from 'lucide-svelte';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';

	let keyOption = $state('generate');
	
	let deploymentMethod = $derived(page.url.searchParams.get('method'));

	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: 'privatekey'
		});
		
		if (keyOption === 'generate') {
			goto(`/onboard/private-key?${params}`);
		} else {
			goto(`/onboard/import-key?${params}`);
		}
	}

	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || ''
		});
		goto(`/onboard?${params}`);
	}
</script>

<OnboardingLayout
	title={$t('onboarding.privateKey.choice.title')}
	subtitle={$t('onboarding.privateKey.choice.subtitle')}
	currentStep={2}
	totalSteps={3}
	onNext={handleNext}
	backUrl="/onboard?method={deploymentMethod || ''}"
>
	<Card class="max-w-3xl mx-auto p-8">
		<RadioGroup bind:value={keyOption} class="space-y-4">
			<label 
				class="flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 {keyOption === 'generate' ? 'border-primary bg-primary/5' : 'border-border'}"
				for="r-generate"
			>
				<RadioGroupItem value="generate" id="r-generate" class="mt-1" />
				<div class="flex-1">
					<div class="flex items-center space-x-2">
						<Key class="w-5 h-5 text-primary" />
						<span class="font-semibold text-lg">{$t('onboarding.privateKey.choice.generate.title')}</span>
					</div>
					<p class="text-sm text-muted-foreground mt-1">
						{$t('onboarding.privateKey.choice.generate.description')}
					</p>
				</div>
			</label>

			<label 
				class="flex items-start space-x-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 {keyOption === 'import' ? 'border-primary bg-primary/5' : 'border-border'}"
				for="r-import"
			>
				<RadioGroupItem value="import" id="r-import" class="mt-1" />
				<div class="flex-1">
					<div class="flex items-center space-x-2">
						<Upload class="w-5 h-5 text-primary" />
						<span class="font-semibold text-lg">{$t('onboarding.privateKey.choice.import.title')}</span>
					</div>
					<p class="text-sm text-muted-foreground mt-1">
						{$t('onboarding.privateKey.choice.import.description')}
					</p>
				</div>
			</label>
		</RadioGroup>

		<Card class="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
			<div class="flex items-start space-x-3">
				<svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
				</svg>
				<div>
					<p class="text-sm font-semibold text-amber-800 dark:text-amber-200">
						{$t('onboarding.privateKey.generate.warningTitle')}
					</p>
					<p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
						{$t('onboarding.privateKey.generate.warningText')}
					</p>
				</div>
			</div>
		</Card>
	</Card>
</OnboardingLayout>