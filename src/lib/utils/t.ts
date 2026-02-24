/**
 * Translation helper - returns the key if translation is missing
 * This makes missing translations immediately visible for debugging
 *
 * @param translations - The translations object from $page.data.translations
 * @param key - The translation key to look up
 * @returns The translated string, or the key itself if not found
 */
export function t(translations: Record<string, string> | undefined, key: string): string {
	return translations?.[key] ?? key;
}
