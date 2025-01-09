import "core-js/actual/regexp/escape";
import { urlPath } from "./url.js";

export type RobotsTagResult = {
	/**
	 * Whether or not the page can be included in the search index.
	 */
	index: boolean;
	/**
	 * Whether or not the crawler is allowed to follow links on the page and add them to the search index.
	 */
	follow: boolean;
	/**
	 * Whether or not the crawler is allowed to display a description of the page in search results.
	 */
	snippet: boolean;
};

export const defaultRobotsTagResult = {
	index: true,
	follow: true,
	snippet: true,
};

export function parseRobotsTag(valueString: string): RobotsTagResult {
	const result = structuredClone(defaultRobotsTagResult);
	const values = valueString.split(",").map((value) => value.trim());
	for (const value of values) {
		switch (value) {
			case "noindex": {
				result.index = false;
				break;
			}
			case "nofollow": {
				result.follow = false;
				break;
			}
			case "none": {
				result.index = false;
				result.follow = false;
				break;
			}
			case "nosnippet": {
				result.snippet = false;
				break;
			}
		}
		if (!result.index) {
			result.follow = false;
			result.snippet = false;
		}
	}
	return result;
}

export function parseRobotsTxt(raw: string): string {
	if (raw.length > 512000) {
		return "";
	}
	const lines = raw
		.split("\n")
		.map((line) => line.split("#")[0].trim())
		.filter((line) => line);
	let directives = "";
	let foundUserAgentMatch = false;
	let foundDirective = false;
	readLines: for (const line of lines) {
		const match = line.match(/^(?<name>.*?)\s*:\s*(?<value>.*)$/v);
		if (!match?.groups?.name || !match.groups.value) {
			continue;
		}
		switch (match.groups.name.toLowerCase()) {
			case "user-agent": {
				if (foundUserAgentMatch && foundDirective) {
					break readLines;
				} else {
					if (
						["*", "surfie", "Surfie"].includes(match.groups.value)
					) {
						foundUserAgentMatch = true;
					}
				}
				break;
			}
			case "allow": {
				if (foundUserAgentMatch) {
					foundDirective = true;
					directives += `${match.groups.value}\n`;
				}
				break;
			}
			case "disallow": {
				if (foundUserAgentMatch) {
					foundDirective = true;
					directives += `!${match.groups.value}\n`;
				}

				break;
			}
		}
	}
	return directives;
}

export function checkRobotsTxt(
	robots: string,
	url: string,
): { line: string; allowed: boolean } {
	const lines = robots.split("\n").filter((line) => line);
	const bestMatch = {
		length: 0,
		line: "",
		allowed: true,
	};
	for (let line of lines) {
		let isAllowed = true;
		let fullLine = false;
		if (line.startsWith("!")) {
			line = line.slice(1);
			isAllowed = false;
		}
		if (line.endsWith("$")) {
			line = line.slice(0, -1);
			fullLine = true;
		}
		let regexLine =
			"^" +
			line
				.split("*")
				.map((segment) => RegExp.escape(segment))
				.join(".*") +
			(fullLine ? "$" : "");
		const regex = new RegExp(regexLine, "v");
		const match = urlPath(url).match(regex);
		if (match?.[0]) {
			const length = match[0].length;
			if (
				(length === bestMatch.length && isAllowed === true) ||
				length > bestMatch.length
			) {
				bestMatch.length = length;
				bestMatch.line = line + (fullLine ? "$" : "");
				bestMatch.allowed = isAllowed;
			}
		}
	}
	return { line: bestMatch.line, allowed: bestMatch.allowed };
}
