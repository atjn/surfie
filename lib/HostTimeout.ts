import { urlHost } from "./url.js";

class HostTimeout {
	constructor() {
		this.cleanMap();
	}
	#minTimeout = 3000;
	map = new Map<string, number>();
	ping(url: string): void {
		this.map.set(urlHost(url), Date.now());
	}
	lastPinged(url: string): number {
		return this.map.get(urlHost(url)) || 0;
	}
	hasTimeout(url: string): boolean {
		const lastPing = this.lastPinged(url);
		if (Date.now() - lastPing > this.#minTimeout) {
			this.map.delete(urlHost(url));
			return false;
		} else {
			return true;
		}
	}
	cleanMap(): void {
		for (const key of this.map.keys()) {
			this.hasTimeout(key);
		}
		setTimeout(() => {
			this.cleanMap();
		}, 5000);
	}
}

export const hostTimeout = new HostTimeout();
