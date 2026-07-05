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
						<div class="terminal-window">
							<div class="terminal-bar">
								<span class="dot red"></span>
								<span class="dot yellow"></span>
								<span class="dot green"></span>
								<span class="terminal-title">{blog.id}.md</span>
							</div>
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
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.post-item { }

	.post-link {
		text-decoration: none;
		display: block;
		transform: translateY(0);
		transition: transform 0.2s ease-out;
	}

	.post-link:hover { transform: translateY(-3px); }

	.terminal-window {
		border: 1px solid var(--accent-dim);
		background: rgba(0, 0, 0, 0.85);
		box-shadow: 0 0 40px rgba(0, 255, 136, 0.08), inset 0 0 60px rgba(0, 0, 0, 0.5);
	}

	.terminal-bar {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--border);
		background: #0d0d0d;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.dot.red    { background: #ff5f57; }
	.dot.yellow { background: #febc2e; }
	.dot.green  { background: #28c840; }

	.terminal-title {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}

	.post-content {
		padding: 1.25rem 1.5rem 1.5rem;
	}

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
