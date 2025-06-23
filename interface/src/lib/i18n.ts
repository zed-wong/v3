import { register, init, getLocaleFromNavigator, addMessages } from 'svelte-i18n';
import en from './i18n/locales/en.json';
import zh from './i18n/locales/zh.json';
import ja from './i18n/locales/ja.json';
import ko from './i18n/locales/ko.json';

// Add messages synchronously
addMessages('en', en);
addMessages('zh', zh);
addMessages('ja', ja);
addMessages('ko', ko);

// Also register for lazy loading
register('en', () => import('./i18n/locales/en.json'));
register('zh', () => import('./i18n/locales/zh.json'));
register('ja', () => import('./i18n/locales/ja.json'));
register('ko', () => import('./i18n/locales/ko.json'));

init({
	fallbackLocale: 'en',
	initialLocale: getLocaleFromNavigator() || 'en',
});