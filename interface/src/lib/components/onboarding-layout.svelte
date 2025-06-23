<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, ArrowRight } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import { goto } from '$app/navigation';

	interface Props {
		title: string;
		subtitle?: string;
		currentStep: number;
		totalSteps: number;
		showBack?: boolean;
		showNext?: boolean;
		backUrl?: string;
		nextUrl?: string;
		onNext?: () => void | Promise<void>;
		nextDisabled?: boolean;
		nextLabel?: string;
		children?: import('svelte').Snippet;
	}

	let {
		title,
		subtitle,
		currentStep,
		totalSteps,
		showBack = true,
		showNext = true,
		backUrl,
		nextUrl,
		onNext,
		nextDisabled = false,
		nextLabel,
		children
	}: Props = $props();

	const progressValue = $derived((currentStep / totalSteps) * 100);

	async function handleNext() {
		if (onNext) {
			await onNext();
		}
		if (nextUrl) {
			goto(nextUrl);
		}
	}

	function handleBack() {
		if (backUrl) {
			goto(backUrl);
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<div class="container mx-auto max-w-4xl px-4 py-16">
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-bold tracking-tight">{title}</h1>
			{#if subtitle}
				<p class="text-xl font-light text-muted-foreground">{subtitle}</p>
			{/if}
		</div>

		<div class="mb-12">
			<div class="mb-4 flex justify-between text-sm">
				<span class="text-muted-foreground">
					{$t('common.step')} {currentStep} / {totalSteps}
				</span>
				<span class="font-medium">{Math.round(progressValue)}%</span>
			</div>
			<Progress value={progressValue} class="h-2" />
		</div>

		{#if children}
			{@render children()}
		{/if}

		<div class="mt-8 flex justify-between">
			{#if showBack}
				<Button
					variant="outline"
					size="lg"
					onclick={handleBack}
					disabled={!backUrl}
				>
					<ArrowLeft class="mr-2 h-5 w-5" />
					{$t('common.back')}
				</Button>
			{:else}
				<div></div>
			{/if}

			{#if showNext}
				<Button
					size="lg"
					onclick={handleNext}
					disabled={nextDisabled || (!nextUrl && !onNext)}
				>
					{nextLabel || $t('common.next')}
					<ArrowRight class="ml-2 h-5 w-5" />
				</Button>
			{/if}
		</div>
	</div>
</div>