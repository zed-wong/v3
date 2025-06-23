import { browser } from '$app/environment';
import { init, register, format, locale, locales } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('zh', () => import('./locales/zh.json'));
register('ja', () => import('./locales/ja.json'));
register('ko', () => import('./locales/ko.json'));

init({
	fallbackLocale: defaultLocale,
	initialLocale: browser ? window.navigator.language.split('-')[0] : defaultLocale,
});

// Export format as t for convenience
export const t = format;
export { locale, locales };