<script lang="ts">
	import Gallery from '$lib/gallery/Gallery.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<svelte:head>
	<title>Sahu · gallery tour</title>
</svelte:head>

<Gallery projects={data.projects} />
