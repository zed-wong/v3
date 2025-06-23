<script lang="ts">
	import { goto } from '$app/navigation';
	import { RadioGroup } from '$lib/components/ui/radio-group';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { _ } from 'svelte-i18n';
	import LanguageSwitcher from '$lib/components/language-switcher.svelte';

	let deploymentMethod = '';

	function handleNext() {
		if (deploymentMethod) {
			goto(`/onboard?method=${deploymentMethod}`);
		}
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<div class="flex justify-between items-start mb-8">
		<div>
			<h1 class="text-3xl font-bold mb-2">{$_('onboarding.deployment.title')}</h1>
			<p class="text-muted-foreground">{$_('onboarding.deployment.subtitle')}</p>
		</div>
		<LanguageSwitcher />
	</div>

	<div class="space-y-4">
		<RadioGroup bind:value={deploymentMethod}>
			<Card class="p-6 cursor-pointer hover:border-primary {deploymentMethod === 'serverless' ? 'border-primary' : ''}">
				<Label class="flex items-start space-x-3 cursor-pointer">
					<input type="radio" bind:group={deploymentMethod} value="serverless" class="mt-1" />
					<div class="space-y-1">
						<div class="font-semibold">{$_('onboarding.deployment.serverless.title')}</div>
						<div class="text-sm text-muted-foreground">
							{$_('onboarding.deployment.serverless.description')}
						</div>
					</div>
				</Label>
			</Card>

			<Card class="p-6 cursor-pointer hover:border-primary {deploymentMethod === 'docker' ? 'border-primary' : ''}">
				<Label class="flex items-start space-x-3 cursor-pointer">
					<input type="radio" bind:group={deploymentMethod} value="docker" class="mt-1" />
					<div class="space-y-1">
						<div class="font-semibold">{$_('onboarding.deployment.docker.title')}</div>
						<div class="text-sm text-muted-foreground">
							{$_('onboarding.deployment.docker.description')}
						</div>
					</div>
				</Label>
			</Card>

			<Card class="p-6 cursor-pointer hover:border-primary {deploymentMethod === 'script' ? 'border-primary' : ''}">
				<Label class="flex items-start space-x-3 cursor-pointer">
					<input type="radio" bind:group={deploymentMethod} value="script" class="mt-1" />
					<div class="space-y-1">
						<div class="font-semibold">{$_('onboarding.deployment.script.title')}</div>
						<div class="text-sm text-muted-foreground">
							{$_('onboarding.deployment.script.description')}
						</div>
					</div>
				</Label>
			</Card>
		</RadioGroup>

		<div class="flex justify-end pt-6">
			<Button onclick={handleNext} disabled={!deploymentMethod}>
				{$_('common.next')}
			</Button>
		</div>
	</div>
</div>