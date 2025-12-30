<script lang="ts">
	import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

function humanLink(link: string): string {
	return decodeURIComponent(link).replaceAll("/", " > ");
}
</script>

<h1>Surfie</h1>

<main>
<search>
	<form action="/">
		<input name="q" type="search" />
		<button>Search</button>
		<output>
				{#each data?.sites || [] as site}
					<div class="site">
						<a href="https://{site.url}">{site.title}</a>
						<p>{humanLink(site.url)}</p>
						<p>{site.description || "No description"}</p>
					</div>
					{/each}
			
		</output>
	</form>
</search>
</main>

<style>

</style>
