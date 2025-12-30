import { availableParallelism } from "node:os";

type PoolOptions = {
	size?: number;
};

export function createPool(
	worker: () => Promise<unknown>,
	options: PoolOptions = {},
) {
	async function runJob() {
		try {
			await worker();
		} catch (error) {
			console.error(error);
		} finally {
			runJob();
		}
	}
	for (let j = 0; j < (options.size || availableParallelism()); j++) {
		runJob();
	}
}
