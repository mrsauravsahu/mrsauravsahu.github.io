<script lang="ts">
	import { DateTime, Duration } from 'luxon';
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

		<ul class="posts">
			{#each blogs as blog (blog.id)}
				<li class="post-item">
					<a href={`/blog/posts/${blog.id}`} class="post-link">
						<div class="bar"></div>
						<div class="post-content">
							<p class="post-meta">
								{DateTime.fromISO(blog.createdAt).toFormat('MMM dd, yyyy')}
								·
								{#if Duration.fromISO(blog.approxTimeToRead).minutes <= 1}
									less than a minute
								{:else}
									{Duration.fromISO(blog.approxTimeToRead).minutes} min read
								{/if}
							</p>
							<h2 class="post-title">{blog.title}</h2>
							{#if blog.description}
								<p class="post-desc">{blog.description}</p>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>

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

	.posts {
		list-style: none;
		margin-top: 4rem;
		border-top: 1px solid var(--border);
	}

	.post-item {
		border-bottom: 1px solid var(--border);
	}

	.post-link {
		display: flex;
		align-items: stretch;
		gap: 1.5rem;
		text-decoration: none;
		padding: 2rem 0;
		position: relative;
	}

	.bar {
		width: 3px;
		background: var(--accent);
		transform: scaleY(0);
		transform-origin: top;
		transition: transform 0.25s ease;
		flex-shrink: 0;
	}

	.post-link:hover .bar { transform: scaleY(1); }

	.post-content { flex: 1; }

	.post-meta {
		font-family: var(--font-ui);
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 0.5rem;
	}

	.post-title {
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--text);
		line-height: 1.3;
		margin-bottom: 0.5rem;
		transition: color 0.2s ease;
	}

	.post-link:hover .post-title { color: var(--accent); }

	.post-desc {
		font-family: var(--font-ui);
		font-size: 0.82rem;
		line-height: 1.7;
		color: var(--text-muted);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 4rem 0 2rem;
	}

	.page-link {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.page-link:hover { opacity: 0.7; }

	.page-count {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		color: var(--text-muted);
	}
</style>
