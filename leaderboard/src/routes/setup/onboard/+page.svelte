<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Separator } from '$lib/components/ui/separator';

	let useMixin = false;
	let paymentConfirmed = false;
	
	$: deploymentMethod = $page.url.searchParams.get('method');

	function handleNext() {
		const params = new URLSearchParams({
			method: deploymentMethod || '',
			mixin: useMixin.toString()
		});
		
		if (useMixin && paymentConfirmed) {
			goto(`/setup/addresses?${params}`);
		} else if (!useMixin) {
			goto(`/setup/private-key?${params}`);
		}
	}

	function handleBack() {
		goto('/setup');
	}
</script>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="text-3xl font-bold mb-2">Onboard to our friendly setup UI</h1>
	<p class="text-muted-foreground mb-8">Configure your instance deployment</p>

	<Card class="p-6">
		<div class="space-y-6">
			<div>
				<h2 class="text-lg font-semibold mb-3">Deployment Method</h2>
				<p class="text-sm text-muted-foreground">
					Selected: <span class="font-medium">{deploymentMethod}</span>
				</p>
			</div>

			<Separator />

			<div class="space-y-4">
				<div class="flex items-start space-x-3">
					<Checkbox bind:checked={useMixin} id="use-mixin" />
					<div class="space-y-1">
						<Label for="use-mixin" class="font-medium cursor-pointer">
							Use Mixin
						</Label>
						<p class="text-sm text-muted-foreground">
							Integrate with Mixin for enhanced functionality
						</p>
					</div>
				</div>

				{#if useMixin}
					<div class="mt-4 p-4 bg-muted rounded-lg space-y-3">
						<p class="text-sm font-medium">Mixin Integration Requirements:</p>
						<ul class="text-sm text-muted-foreground space-y-1 list-disc list-inside">
							<li>Pay 100 USD to obtain credentials</li>
							<li>Derive addresses based on Mixin spend key</li>
						</ul>
						
						<div class="flex items-start space-x-3 pt-2">
							<Checkbox bind:checked={paymentConfirmed} id="payment-confirm" />
							<Label for="payment-confirm" class="text-sm cursor-pointer">
								I understand and confirm the payment requirement
							</Label>
						</div>
					</div>
				{:else}
					<div class="mt-4 p-4 bg-muted rounded-lg">
						<p class="text-sm text-muted-foreground">
							Skip Mixin integration and generate a free private key
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="flex justify-between pt-6">
			<Button variant="outline" on:click={handleBack}>
				Back
			</Button>
			<Button 
				on:click={handleNext} 
				disabled={useMixin && !paymentConfirmed}
			>
				Continue
			</Button>
		</div>
	</Card>
</div>
</script>