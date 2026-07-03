<script lang="ts">
	import { DateTime, Duration } from 'luxon';
	import Utterance from '../../../../components/utterance.svelte';
	import type { PageData } from './$types';
	import SvelteMarkdown from 'svelte-markdown';

	export let data: PageData;
	$: ({ blog, blogContent } = data);
	$: duration = Duration.fromISO(blog.approxTimeToRead);
	$: durationText =
		duration.minutes <= 1 ? 'less than a minute' : `${duration.toFormat('m')} minutes`;
</script>

<svelte:head>
	<title>{blog?.title} — @mrsauravsahu</title>
</svelte:head>

<article class="post-page">
	<div class="post-inner">
		<a href="/blog/1" class="back-link">← all posts</a>

		<header class="post-header">
			<h1 class="post-title">{blog.title}</h1>
			<p class="post-meta">
				{DateTime.fromISO(blog.createdAt).toFormat('EEEE, MMMM dd yyyy')}
				<span class="dot">·</span>
				{durationText} read
			</p>
			<div class="post-divider"></div>
		</header>

		<div class="post-body">
			<SvelteMarkdown source={blogContent} />
		</div>

		<div class="post-footer">
			<Utterance />
		</div>
	</div>
</article>

<style>
	.post-page {
		background: var(--surface);
		min-height: 100vh;
		padding: 8rem 2rem 6rem;
	}

	.post-inner {
		max-width: var(--reading-w);
		margin: 0 auto;
	}

	.back-link {
		display: inline-block;
		font-family: var(--font-ui);
		font-size: 0.68rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--text-muted);
		text-decoration: none;
		margin-bottom: 3rem;
		transition: color 0.2s ease;
	}

	.back-link:hover { color: var(--accent); }

	.post-header { margin-bottom: 3rem; }

	.post-title {
		font-family: var(--font-display);
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		font-weight: 700;
		color: var(--text);
		line-height: 1.2;
		margin-bottom: 1rem;
	}

	.post-meta {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin-bottom: 1.5rem;
	}

	.dot { margin: 0 0.5rem; color: var(--border); }

	.post-divider {
		width: 4rem;
		height: 1px;
		background: var(--accent);
	}

	/* Body — everything in GeistMono */
	.post-body {
		font-family: var(--font-mono);
		font-size: 1rem;
		line-height: 1.9;
		color: var(--text);
		user-select: none;
		-webkit-user-select: none;
	}

	:global(.post-body p) {
		font-family: var(--font-mono);
		margin-bottom: 1.6rem;
		line-height: 1.9;
	}

	:global(.post-body h1),
	:global(.post-body h2),
	:global(.post-body h3),
	:global(.post-body h4) {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--accent);
		margin: 2.5rem 0 1rem;
	}

	:global(.post-body a) {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.post-body code) {
		font-family: var(--font-mono);
		font-size: 0.88em;
		color: var(--accent);
		background: var(--surface-alt);
		padding: 0.1em 0.4em;
	}

	:global(.post-body pre) {
		background: var(--surface-alt);
		border-left: 3px solid var(--accent);
		padding: 1.25rem 1.5rem;
		margin: 2rem 0;
		overflow-x: auto;
		line-height: 1.7;
	}

	:global(.post-body pre code) {
		background: none;
		padding: 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	:global(.post-body blockquote) {
		border-left: 3px solid var(--accent);
		padding-left: 1.5rem;
		margin: 2rem 0;
		font-style: italic;
		color: var(--text-muted);
	}

	:global(.post-body img) {
		width: 100%;
		margin: 2rem 0;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
	}

	:global(.post-body ul),
	:global(.post-body ol) {
		padding-left: 1.5rem;
		margin-bottom: 1.6rem;
	}

	:global(.post-body li) {
		font-family: var(--font-mono);
		margin-bottom: 0.4rem;
		line-height: 1.8;
	}

	:global(.post-body table) {
		width: 100%;
		border-collapse: collapse;
		margin: 2rem 0;
		font-size: 0.875em;
	}

	:global(.post-body th),
	:global(.post-body td) {
		border: 1px solid var(--border);
		padding: 0.6rem 0.75rem;
		text-align: left;
	}

	:global(.post-body thead th) {
		background: var(--surface-alt);
		color: var(--accent);
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	:global(.post-body hr) {
		border: none;
		border-top: 1px solid var(--border);
		margin: 3rem 0;
	}

	.post-footer {
		margin-top: 5rem;
		padding-top: 3rem;
		border-top: 1px solid var(--border);
	}
</style>
