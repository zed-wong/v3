<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="container mx-auto max-w-2xl p-6">
	<div class="text-center space-y-6">
		<div class="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
			<svg class="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>
		
		<h1 class="text-3xl font-bold">Setup Complete!</h1>
		<p class="text-muted-foreground max-w-md mx-auto">
			Your instance has been successfully configured. Data has been encrypted and stored in your local database.
		</p>
		
		<Card class="p-6 max-w-md mx-auto">
			<h3 class="font-semibold mb-3">Next Steps</h3>
			<ul class="text-sm text-left space-y-2 text-muted-foreground">
				<li>• Deploy your instance using the selected method</li>
				<li>• Monitor your instance from the dashboard</li>
				<li>• Configure additional strategies as needed</li>
			</ul>
		</Card>
		
		<div class="flex gap-4 justify-center pt-4">
			<Button variant="outline" on:click={() => goto('/')}>
				Go to Dashboard
			</Button>
			<Button on:click={() => goto('/')}>
				Deploy Another Instance
			</Button>
		</div>
	</div>
</div>