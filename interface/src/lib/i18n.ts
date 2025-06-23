import { register, init, getLocaleFromNavigator, addMessages } from 'svelte-i18n';
import en from './locales/en.json';
import zh from './locales/zh.json';

// Add messages synchronously
addMessages('en', en);
addMessages('zh', zh);

// Also register for lazy loading
register('en', () => import('./locales/en.json'));
register('zh', () => import('./locales/zh.json'));

init({
	fallbackLocale: 'en',
	initialLocale: getLocaleFromNavigator() || 'en',
});