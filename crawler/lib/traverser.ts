import type { DefaultTreeAdapterTypes } from "parse5";

export type FindOptions = {
	depth?: number;
	nodeName?: string;
	tagName?: string;
	attrs?: (string | FindOptionsAttr)[];
};
export type FindOptionsAttr = {
	name: string;
	value: string;
};

export function find(
	node: DefaultTreeAdapterTypes.Document | DefaultTreeAdapterTypes.ChildNode,
	options: FindOptions,
): (DefaultTreeAdapterTypes.Document | DefaultTreeAdapterTypes.ChildNode)[] {
	const matches = [];
	let nodeIsMatch = true;
	if (options.nodeName && nodeIsMatch) {
		nodeIsMatch = Boolean(node.nodeName === options.nodeName);
	}
	if (options.tagName && nodeIsMatch) {
		nodeIsMatch = Boolean(
			"tagName" in node && node.tagName === options.tagName,
		);
	}
	if (options.attrs && options.attrs.length >= 1 && nodeIsMatch) {
		if ("attrs" in node) {
			for (const attr of options.attrs) {
				if (typeof attr === "string") {
					if (getAttr(node, attr) === undefined) {
						nodeIsMatch = false;
					}
				} else {
					const nodeAttr = getAttr(node, attr.name);
					if (nodeAttr !== attr.value) {
						nodeIsMatch = false;
					}
				}
			}
		} else {
			nodeIsMatch = false;
		}
	}
	if (nodeIsMatch) {
		matches.push(node);
	}
	if (options.depth !== undefined && options.depth <= 0) {
		return matches;
	}
	if ("childNodes" in node && node.childNodes?.length > 0) {
		const childOptions = options;
		if (childOptions.depth !== undefined) {
			childOptions.depth -= 1;
		}
		for (const childNode of node.childNodes) {
			const childMatches = find(childNode, childOptions);
			matches.push(...childMatches);
		}
	}
	return matches;
}

export function getAttr(
	node: DefaultTreeAdapterTypes.Document | DefaultTreeAdapterTypes.ChildNode,
	name: string,
): string | undefined {
	if ("attrs" in node) {
		return node.attrs.find((candidate) => candidate.name === name)?.value;
	}
}

export function getTextContent(
	node: DefaultTreeAdapterTypes.Document | DefaultTreeAdapterTypes.ChildNode,
): string {
	const nodes = find(node, { nodeName: "#text" }).filter(
		(node) =>
			"parentNode" in node &&
			node.parentNode &&
			!["script", "style"].includes(node.parentNode.nodeName),
	);
	return nodes
		.filter((node) => "value" in node)
		.map((node) => node.value)
		.join(" ")
		.replaceAll("  ", " ");
}
