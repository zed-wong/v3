<script lang="ts">
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Info } from 'lucide-svelte';
	import OnboardingLayout from '$lib/components/onboarding-layout.svelte';
	
	let deploymentMethod = $derived(page.url.searchParams.get('method'));
	
	let botId = $state('');
	let sessionId = $state('');
	let spendKey = $state('');
	let serverPublicKey = $state('');
	let sessionPrivateKey = $state('');
	let oauthSecret = $state('');
	
	let canContinue = $derived(botId && sessionId && spendKey && serverPublicKey && sessionPrivateKey && oauthSecret);
	
	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			keyMethod: 'mixin',
			botId,
			sessionId
		});
		goto(`/addresses?${params}`);
	}
	
	function handleBack() {
		const params = new URLSearchParams({
			method: deploymentMethod || ''
		});
		goto(`/onboard?${params}`);
	}
</script>

<OnboardingLayout
	title={$t('onboarding.mixin.setup.title')}
	subtitle={$t('onboarding.mixin.setup.subtitle')}
	currentStep={2}
	totalSteps={3}
	onNext={handleNext}
	nextDisabled={!canContinue}
	backUrl="/onboard?method={deploymentMethod || ''}"
	nextLabel={$t('common.continue')}
>
	<Card class="max-w-3xl mx-auto p-8">
		<div class="space-y-6">
			<div>
				<h2 class="text-2xl font-semibold mb-2">{$t('onboarding.mixin.setup.botCredentials')}</h2>
				<p class="text-muted-foreground">{$t('onboarding.mixin.setup.enterInfo')}</p>
			</div>

			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="bot-id">{$t('onboarding.mixin.setup.botId')}</Label>
					<Input 
						id="bot-id"
						type="text" 
						placeholder={$t('onboarding.mixin.setup.botIdPlaceholder')}
						bind:value={botId}
					/>
				</div>

				<div class="space-y-2">
					<Label for="session-id">{$t('onboarding.mixin.setup.sessionId')}</Label>
					<Input 
						id="session-id"
						type="text" 
						placeholder={$t('onboarding.mixin.setup.sessionIdPlaceholder')}
						bind:value={sessionId}
					/>
				</div>

				<div class="space-y-2">
					<Label for="server-public-key">{$t('onboarding.mixin.setup.serverPublicKey')}</Label>
					<Input 
						id="server-public-key"
						type="text" 
						placeholder={$t('onboarding.mixin.setup.serverPublicKeyPlaceholder')}
						bind:value={serverPublicKey}
						class="font-mono"
					/>
				</div>

				<div class="space-y-2">
					<Label for="session-private-key">{$t('onboarding.mixin.setup.sessionPrivateKey')}</Label>
					<Input 
						id="session-private-key"
						type="password" 
						placeholder={$t('onboarding.mixin.setup.sessionPrivateKeyPlaceholder')}
						bind:value={sessionPrivateKey}
						class="font-mono"
					/>
				</div>

				<div class="space-y-2">
					<Label for="oauth-secret">{$t('onboarding.mixin.setup.oauthSecret')}</Label>
					<Input 
						id="oauth-secret"
						type="password" 
						placeholder={$t('onboarding.mixin.setup.oauthSecretPlaceholder')}
						bind:value={oauthSecret}
						class="font-mono"
					/>
				</div>

				<div class="space-y-2">
					<Label for="spend-key">{$t('onboarding.mixin.setup.spendKey')}</Label>
					<Input 
						id="spend-key"
						type="password" 
						placeholder={$t('onboarding.mixin.setup.spendKeyPlaceholder')}
						bind:value={spendKey}
						class="font-mono"
					/>
					<p class="text-xs text-muted-foreground">{$t('onboarding.mixin.setup.spendKeyHelp')}</p>
				</div>
			</div>

			<Card class="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
				<div class="flex items-start space-x-3">
					<Info class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
					<div class="space-y-1">
						<p class="text-sm font-medium text-blue-800 dark:text-blue-200">{$t('onboarding.mixin.setup.howToGet')}</p>
						<ol class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
							<li>1. Visit <a href="https://developers.mixin.one/dashboard" target="_blank" rel="noopener noreferrer" class="underline hover:text-blue-800 dark:hover:text-blue-200">developers.mixin.one/dashboard</a></li>
							<li>{$t('onboarding.mixin.setup.step2')}</li>
							<li>{$t('onboarding.mixin.setup.step3')}</li>
						</ol>
					</div>
				</div>
			</Card>
		</div>
	</Card>
</OnboardingLayout>