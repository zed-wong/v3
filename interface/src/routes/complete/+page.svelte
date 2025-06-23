<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle2, Rocket } from 'lucide-svelte';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';

	let deploymentMethod = $derived(page.url.searchParams.get('method'));
	let keyMethod = $derived(page.url.searchParams.get('keyMethod'));
	let chains = $derived(page.url.searchParams.get('chains')?.split(',') || []);

	function handleDeploy() {
		// TODO: Implement deployment logic
		console.log('Deploy with:', { deploymentMethod, keyMethod, chains });
	}

	function handleBack() {
		goto('/exchanges');
	}
</script>

<OnboardingLayout
	title={$t('onboarding.complete.title')}
	subtitle={$t('onboarding.complete.subtitle')}
	currentStep={3}
	totalSteps={3}
	showNext={false}
	backUrl="/exchanges"
>
	<Card class="max-w-3xl mx-auto p-8">
		<div class="space-y-6">
			<div class="flex justify-center">
				<div class="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
					<CheckCircle2 class="w-12 h-12 text-green-600 dark:text-green-400" />
				</div>
			</div>

			<div class="text-center space-y-2">
				<h2 class="text-2xl font-semibold">{$t('onboarding.complete.summary')}</h2>
				<p class="text-muted-foreground">Your configuration has been saved and is ready for deployment</p>
			</div>

			<Card class="p-6 bg-muted/50">
				<div class="space-y-4">
					<div>
						<p class="text-sm font-medium text-muted-foreground">Deployment Method</p>
						<p class="font-medium capitalize">{deploymentMethod || 'Not selected'}</p>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Key Management</p>
						<p class="font-medium">{keyMethod === 'mixin' ? 'Mixin Integration' : 'Private Key'}</p>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Selected Blockchains</p>
						<p class="font-medium">{chains.length} blockchain{chains.length !== 1 ? 's' : ''} selected</p>
					</div>
					<div>
						<p class="text-sm font-medium text-muted-foreground">Exchange APIs</p>
						<p class="font-medium">Configured and ready</p>
					</div>
				</div>
			</Card>

			<div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
				<Button size="lg" onclick={handleDeploy} class="flex-1 sm:flex-initial">
					<Rocket class="mr-2 h-5 w-5" />
					{$t('onboarding.complete.deploy')}
				</Button>
				<Button size="lg" variant="outline" href="/settings" class="flex-1 sm:flex-initial">
					{$t('onboarding.complete.configure')}
				</Button>
			</div>
		</div>
	</Card>
</OnboardingLayout>