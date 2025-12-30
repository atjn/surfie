/**
 * This will detect a file extension at the end of a url, such as ".png".
 * If the extension is "html" or "htm", it will return true, otherwise false.
 * If there is no extension or it is unclear if there is an extension,
 * it will return true.
 *
 * When in doubt, this function will return true.
 */
export function isProbablyDocument(url: string): boolean {
	const match = url.match(/(^|\/)[^.]*\.(?<extension>\w{1,4})$/v);
	if (match && !match.groups?.extension.startsWith("htm")) {
		return false;
	}
	return true;
}

/**
 * Ensures that the URL is a valid absolute URL and that it is in its normal form without any
 * unnecessary formatting or scheme.
 *
 * If the URL is not valid, undefined is returned.
 */
export function sanitizeUrl(
	url: string | undefined,
	base?: string,
): string | undefined {
	if (!url) return undefined;
	let parsed = URL.parse(url, base);
	if (parsed) {
		return finalFormat(parsed);
	}
	if (base) {
		parsed = URL.parse(url, `https://${base}`);
	}
	if (parsed) {
		return finalFormat(parsed);
	}
	parsed = URL.parse(`https://${url}`, base);
	return finalFormat(parsed);

	function finalFormat(parsed: URL | null): string | undefined {
		if (!parsed) return undefined;
		if (!["http:", "https:"].includes(parsed.protocol)) {
			return undefined;
		}
		const final =
			parsed.host + (parsed.pathname === "/" ? "" : parsed.pathname);
		if (final.length > 200) {
			return undefined;
		}
		return final;
	}
}

export function urlHost(url: string) {
	return new URL(`https://${sanitizeUrl(url)}`).host;
}

export function urlPath(url: string) {
	return new URL(`https://${sanitizeUrl(url)}`).pathname;
}
