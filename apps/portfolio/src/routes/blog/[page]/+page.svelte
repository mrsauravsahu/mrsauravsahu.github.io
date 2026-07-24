<script lang="ts">
	import BlogPost from '../../../components/blog-post.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ blogs, currentPage, lastPage } = data);
</script>

<svelte:head>
	<title>Blog — @mrsauravsahu</title>
</svelte:head>

<section class="blog-list">
	<div class="section-inner">
		<p class="section-label">writing</p>
		<h1 class="section-title">All posts.</h1>
		<p class="section-body">
			A decade of shipping software, riding roads, and making photographs.<br />
			These are the notes from the journey.
		</p>

		<div class="blog-dump">
			{#each blogs as blog (blog.id)}
				<BlogPost {blog} />
			{/each}
		</div>

		<div class="pagination">
			{#if currentPage !== 1}
				<a href={`${currentPage - 1}`} class="page-link">← prev</a>
			{/if}
			<span class="page-count">{currentPage} / {lastPage}</span>
			{#if currentPage !== lastPage}
				<a href={`${currentPage + 1}`} class="page-link">next →</a>
			{/if}
		</div>
	</div>
</section>

<style>
	.blog-list {
		padding-top: 8rem;
		background: var(--bg);
		min-height: 100vh;
	}

	.blog-dump {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: flex-start;
		margin-top: 3.5rem;
		padding: 1rem;
		overflow: hidden;
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 4rem 0 2rem;
	}

	.page-link {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.page-link:hover { opacity: 0.7; }

	.page-count {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		color: var(--text-muted);
	}
</style>
