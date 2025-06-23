<script lang="ts">
	import { locale, locales } from 'svelte-i18n';
	import { Button } from '$lib/components/ui/button';
	
	const languages = [
		{ code: 'en', name: 'English', flag: '🇺🇸' },
		{ code: 'zh', name: '中文', flag: '🇨🇳' },
		{ code: 'ja', name: '日本語', flag: '🇯🇵' },
		{ code: 'ko', name: '한국어', flag: '🇰🇷' }
	];
	
	let showDropdown = $state(false);
	let currentLocale = $state($locale);
	
	$effect(() => {
		currentLocale = $locale;
	});
	
	function changeLocale(code: string) {
		$locale = code;
		showDropdown = false;
	}
	
	function toggleDropdown() {
		showDropdown = !showDropdown;
	}
	
	function getCurrentLanguage() {
		return languages.find(lang => lang.code === currentLocale) || languages[0];
	}
</script>

<div class="relative">
	<Button 
		variant="outline" 
		size="sm"
		onclick={toggleDropdown}
		class="flex items-center gap-2"
	>
		<span>{getCurrentLanguage().flag}</span>
		<span>{getCurrentLanguage().name}</span>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</Button>
	
	{#if showDropdown}
		<div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
			{#each languages as lang}
				<button
					class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 {lang.code === currentLocale ? 'bg-gray-50' : ''}"
					onclick={() => changeLocale(lang.code)}
				>
					<span>{lang.flag}</span>
					<span>{lang.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<svelte:window onclick={(e) => {
	const target = e.target as HTMLElement;
	if (showDropdown && !target?.closest('.relative')) {
		showDropdown = false;
	}
}} />