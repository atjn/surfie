import { parse } from "parse5";
import { find, getAttr, getTextContent } from "./lib/traverser.js";
import { isProbablyDocument, sanitizeUrl, urlHost } from "./lib/url.js";
import { Prisma, PrismaClient, ScanResult } from "@prisma/client";
import { maxLength, singleLine } from "./lib/string.js";
import { createPool } from "./lib/pool.js";
import { hostTimeout } from "./lib/HostTimeout.js";
import { isSupportedLanguage } from "./lib/lang.js";
import {
	checkRobotsTxt,
	defaultRobotsTagResult,
	parseRobotsTag,
	parseRobotsTxt,
} from "./lib/robots.js";

const prisma = new PrismaClient();

await prisma.site.upsert({
	where: {
		url: "en.wikipedia.org",
	},
	update: {},
	create: {
		url: "en.wikipedia.org",
	},
});

createPool(scan, { size: 2 });

export async function scan(): Promise<void> {
	let url;
	const triedUrls: string[] = [];
	while (!url) {
		await prisma.$transaction(async (prisma) => {
			let site = await prisma.site.findFirst({
				where: {
					scanResult: ScanResult.Waiting,
					url: {
						notIn: triedUrls,
					},
				},
			});

			if (!site) {
				site = await prisma.site.findFirst({
					where: {
						scanResult: { not: ScanResult.Scanning },
					},
					orderBy: {
						scanTime: "asc",
					},
				});
			}

			if (!site) {
				console.error("No sites to scan!");
				return;
			}
			if (hostTimeout.hasTimeout(site.url)) {
				triedUrls.push(site.url);
			} else {
				prisma.site.update({
					where: { url: site.url },
					data: { scanResult: ScanResult.Scanning },
				});
				url = site.url;
			}
		});
	}

	return await scanUrl(url);
}

export async function scanUrl(url: string): Promise<void> {
	const sanitizedUrl = sanitizeUrl(url);
	if (sanitizedUrl) {
		url = sanitizedUrl;
	} else {
		return;
	}
	hostTimeout.ping(url);
	const hostData = await getHostData(url);
	const robotsCheck = checkRobotsTxt(hostData.robots, url);
	if (!robotsCheck.allowed) {
		const data = {
			url,
			scanResult: ScanResult.Blocked,
			scanTime: new Date(),
			error: maxLength(
				`Blocked by robots.txt - Disallow: ${robotsCheck.line}`,
				60,
			),
		};
		await prisma.site.upsert({
			where: {
				url,
			},
			update: data,
			create: data,
		});
		return;
	}
	let response;
	try {
		response = await fetch(`https://${url}`, {
			headers: {
				"Accept-Language": "en-US,en;q=0.9",
			},
		});
	} catch (error) {
		const data = {
			url,
			scanResult: ScanResult.Error,
			scanTime: new Date(),
			error: maxLength(`Could not fetch - ${error}`, 60),
		};
		await prisma.site.upsert({
			where: {
				url,
			},
			update: data,
			create: data,
		});
		return;
	}
	const responseUrl = sanitizeUrl(response.url);
	if (responseUrl && url !== responseUrl) {
		const responseSiteData = { url: responseUrl, scanTime: new Date() };
		const responseSite = await prisma.site.upsert({
			where: {
				url: responseUrl,
			},
			update: responseSiteData,
			create: responseSiteData,
		});
		const newSiteData = {
			url,
			scanResult: ScanResult.FoundCanonical,
			scanTime: new Date(),
			canonical: { connect: responseSite },
		};
		await prisma.site.upsert({
			where: {
				url,
			},
			update: newSiteData,
			create: newSiteData,
		});
		url = responseUrl;
		hostTimeout.ping(url);
	}
	const result:
		| (Prisma.Without<
				Prisma.SiteCreateInput,
				Prisma.SiteUncheckedCreateInput
		  > &
				Prisma.SiteUncheckedCreateInput)
		| (Prisma.Without<
				Prisma.SiteUncheckedCreateInput,
				Prisma.SiteCreateInput
		  > &
				Prisma.SiteCreateInput) = {
		url,
		scanResult: ScanResult.Success,
		scanTime: new Date(),
	};
	if (!response.ok) {
		result.scanResult = ScanResult.Error;
		result.error = maxLength(`Bad response code - ${response.status}`, 60);
		return await saveScanResult();
	}
	if (!response.headers.get("content-type")?.includes("text/html")) {
		result.scanResult = ScanResult.Error;
		result.error = maxLength(
			`Bad content type - ${response.headers.get("content-type")}`,
			60,
		);
		return await saveScanResult();
	}
	const text = await response.text();
	const document = parse(text, {
		scriptingEnabled: false,
	});
	const htmlTag = find(document, { tagName: "html", depth: 1 })[0];
	const head = find(htmlTag, { tagName: "head", depth: 1 })[0];
	let robots = structuredClone(defaultRobotsTagResult);
	if (head) {
		const robotsTag = find(head, {
			tagName: "meta",
			attrs: [{ name: "name", value: "robots" }, "content"],
			depth: 1,
		})[0];
		if (robotsTag) {
			const robotsTagValue = getAttr(robotsTag, "content") || "";
			robots = parseRobotsTag(robotsTagValue);

			if (!robots.index) {
				result.scanResult = ScanResult.Blocked;
				result.error = maxLength(
					`Blocked by robots tag: ${robotsTagValue}`,
					60,
				);
				return await saveScanResult();
			}
		}
	}
	const docLang = getAttr(htmlTag, "lang");
	if (!isSupportedLanguage(docLang)) {
		result.scanResult = ScanResult.WrongLanguage;
		result.error = maxLength(
			`Document is in wrong language - ${docLang}`,
			60,
		);
		return await saveScanResult();
	}
	if (head) {
		const canonicalTag = find(head, {
			tagName: "link",
			attrs: [{ name: "rel", value: "canonical" }, "href"],
		})[0];
		if (canonicalTag) {
			const canonical = sanitizeUrl(getAttr(canonicalTag, "href"));
			if (canonical && canonical !== url) {
				result.scanResult = ScanResult.FoundCanonical;
				result.canonical = {
					connectOrCreate: {
						where: { url: canonical },
						create: { url: canonical },
					},
				};
				return await saveScanResult();
			}
		}
		const titleTag = find(head, { tagName: "title", depth: 1 })[0];
		if (titleTag) {
			result.title = maxLength(singleLine(getTextContent(titleTag)), 60);
		}
		if (robots.snippet) {
			const metaTag = find(head, {
				tagName: "meta",
				attrs: [{ name: "name", value: "description" }, "content"],
				depth: 1,
			})[0];
			if (metaTag) {
				const description = getAttr(metaTag, "content");
				if (description) {
					result.description = maxLength(
						singleLine(description),
						160,
						true,
					);
				}
			}
		}
	}
	const links = new Set(
		robots.follow
			? find(document, { tagName: "a", attrs: ["href"] })
					.filter((a) => isSupportedLanguage(getAttr(a, "hreflang")))
					.map((a) => getAttr(a, "href"))
					.filter((href) => href !== undefined)
					.filter((href) => isProbablyDocument(href))
					.map((href) => sanitizeUrl(href, url))
					.filter((href) => href !== undefined)
					.filter((href) => href.length <= 200)
			: [],
	);
	result.LinksTo = {
		connectOrCreate: [...links].map((url) => {
			return { where: { url }, create: { url } };
		}),
	};
	return await saveScanResult();
	async function saveScanResult() {
		await prisma.site.upsert({
			where: {
				url,
			},
			update: result,
			create: result,
		});
	}
}

async function getHostData(url: string): Promise<{ robots: string }> {
	const host = urlHost(url);
	const data = await prisma.host.findUnique({
		where: {
			host,
		},
	});
	if (data) {
		return { robots: data.robots };
	} else {
		try {
			const response = await fetch(`https://${host}/robots.txt`);
			const parsedRobots = parseRobotsTxt(await response.text());
			const hostData = {
				host,
				robots: parsedRobots,
			};
			await prisma.host.upsert({
				where: { host },
				update: hostData,
				create: hostData,
			});
			return { robots: parsedRobots };
		} catch (error) {
			await prisma.host.upsert({
				where: {
					host,
				},
				update: {},
				create: {
					host,
					robots: "",
				},
			});
		}
	}
	return { robots: "" };
}
