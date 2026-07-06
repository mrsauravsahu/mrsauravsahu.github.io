<script>
	import { DateTime, Duration } from 'luxon';
	export let blog;
	export let fallbackSrc = '/img/mrss-silhouette.svg';
	export let showCover = true;

	$: duration = Duration.fromISO(blog.approxTimeToRead);
	$: readTime = duration.minutes <= 1 ? 'less than a minute' : `${duration.toFormat('m')} min read`;
	$: date = DateTime.fromISO(blog.createdAt).toFormat('MMM yyyy');
</script>

<a class="card" href={`/blog/posts/${blog.id}`}>
	<div class="terminal-window">
		<div class="terminal-bar">
			<span class="dot red"></span>
			<span class="dot yellow"></span>
			<span class="dot green"></span>
			<span class="terminal-title">{blog.id}.md</span>
		</div>
		<div class="terminal-body">
			{#if showCover && (blog.coverImageUrl || fallbackSrc)}
				<div class="card-img-wrap">
					<img src={blog.coverImageUrl || fallbackSrc} alt={blog.title} loading="lazy" />
				</div>
			{/if}
			<p class="meta">{date} · {readTime}</p>
			<h3 class="title">{blog.title}</h3>
			<p class="desc">{blog.description}</p>
		</div>
	</div>
</a>

<style>
	.card {
		text-decoration: none;
		display: block;
		transform: translateY(0);
		transition: transform 0.2s ease-out;
	}

	.card:hover { transform: translateY(-4px); }

	.terminal-window {
		border: 1px solid var(--accent-dim);
		background: var(--surface-alt);
		box-shadow: 0 0 24px rgba(0, 255, 136, 0.06);
		height: 100%;
	}

	.terminal-bar {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--accent-dim);
		background: #050505;
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

	.terminal-body {
		padding: 1.25rem 1.5rem 1.5rem;
	}

	.card-img-wrap {
		width: 100%;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.card-img-wrap img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(100%);
		transition: filter 0.4s ease;
	}

	.card:hover .card-img-wrap img { filter: grayscale(0%); }

	.meta {
		font-family: var(--font-ui);
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 0.5rem;
	}

	.title {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text);
		line-height: 1.35;
		margin-bottom: 0.5rem;
		position: relative;
		padding-bottom: 0.5rem;
	}

	.title::after {
		content: '';
		position: absolute;
		bottom: 0; left: 0;
		width: 0;
		height: 1px;
		background: var(--accent);
		transition: width 0.3s ease;
	}

	.card:hover .title::after { width: 100%; }

	.desc {
		font-family: var(--font-ui);
		font-size: 0.8rem;
		line-height: 1.7;
		color: var(--text-muted);
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
