/**
 * Checks to see if the reported language is english.
 *
 * If no language is submitted, we assume that it is good.
 */
export function isSupportedLanguage(lang: string | undefined): boolean {
	return !lang || ["en", "en-US", "en-GB"].includes(lang);
}
