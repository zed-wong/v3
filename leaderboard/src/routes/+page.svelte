<script lang="ts">
	import { goto } from '$app/navigation';
	import { RadioGroup } from '$lib/components/ui/radio-group';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';

	let deploymentMethod = '';

	function handleNext() {
		if (deploymentMethod) {
			goto(`/onboard?method=${deploymentMethod}`);
		}
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="text-3xl font-bold mb-2">Instance Deployer Setup</h1>
	<p class="text-muted-foreground mb-8">Choose your deployment method to get started</p>

	<div class="space-y-4">
		<RadioGroup bind:value={deploymentMethod}>
			<Card class="p-6 cursor-pointer hover:border-primary {deploymentMethod === 'serverless' ? 'border-primary' : ''}">
				<Label class="flex items-start space-x-3 cursor-pointer">
					<input type="radio" bind:group={deploymentMethod} value="serverless" class="mt-1" />
					<div class="space-y-1">
						<div class="font-semibold">Use serverless</div>
						<div class="text-sm text-muted-foreground">
							Click to deploy with serverless infrastructure
						</div>
					</div>
				</Label>
			</Card>

			<Card class="p-6 cursor-pointer hover:border-primary {deploymentMethod === 'docker' ? 'border-primary' : ''}">
				<Label class="flex items-start space-x-3 cursor-pointer">
					<input type="radio" bind:group={deploymentMethod} value="docker" class="mt-1" />
					<div class="space-y-1">
						<div class="font-semibold">Use docker</div>
						<div class="text-sm text-muted-foreground">
							Deploy using Docker containers
						</div>
					</div>
				</Label>
			</Card>

			<Card class="p-6 cursor-pointer hover:border-primary {deploymentMethod === 'script' ? 'border-primary' : ''}">
				<Label class="flex items-start space-x-3 cursor-pointer">
					<input type="radio" bind:group={deploymentMethod} value="script" class="mt-1" />
					<div class="space-y-1">
						<div class="font-semibold">Use deployment script</div>
						<div class="text-sm text-muted-foreground">
							Run custom deployment scripts
						</div>
					</div>
				</Label>
			</Card>
		</RadioGroup>

		<div class="flex justify-end pt-6">
			<Button on:click={handleNext} disabled={!deploymentMethod}>
				Continue
			</Button>
		</div>
	</div>
</div>