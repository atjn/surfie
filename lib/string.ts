export function maxLength(
	string: string,
	maxLength: number,
	addDots?: boolean,
): string {
	if (string.length > maxLength) {
		if (addDots) {
			return string.slice(0, maxLength - 4) + "...";
		} else {
			return string.slice(0, maxLength - 1);
		}
	}
	return string;
}

export function singleLine(string: string) {
	return string.replaceAll("\n", "").trim();
}
