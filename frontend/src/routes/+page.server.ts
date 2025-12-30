import type { PageServerLoad } from "./$types";
import { tokenize } from "$lib/text";
import { PrismaClient, ScanResult } from "@prisma/client";




export const load: PageServerLoad = async ({ url }) => {
		const query = url.searchParams.get('q');
		if (!query || typeof query !== "string") return { sites: [] };

		const terms = tokenize(query);

		const prisma = new PrismaClient();
		const sites = await prisma.site.findMany({
			where: {
				scanResult: ScanResult.Success,
				AND: [...terms].map((term) => ({
					terms: {
						some: {
							term,
						},
					},
				})),
			},
		});

		return { sites };
	}
