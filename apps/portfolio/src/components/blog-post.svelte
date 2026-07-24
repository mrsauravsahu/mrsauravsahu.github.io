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
	<div class="card-inner">
		{#if showCover && (blog.coverImageUrl || fallbackSrc)}
			<div class="card-img-wrap">
				<img src={blog.coverImageUrl || fallbackSrc} alt={blog.title} loading="lazy" />
			</div>
		{/if}
		<div class="card-body">
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

	.card-inner {
		border: 1px solid var(--border);
		background: var(--surface-alt);
		height: 100%;
		overflow: hidden;
		transition: border-color 0.2s ease;
	}

	.card:hover .card-inner { border-color: var(--accent-dim); }

	.card-body {
		padding: 1.25rem 1.5rem 1.5rem;
	}

	.card-img-wrap {
		width: 100%;
		aspect-ratio: 16 / 10;
		overflow: hidden;
	}

	.card-img-wrap img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: saturate(0.9);
		transition: filter 0.4s ease, transform 0.4s ease;
	}

	.card:hover .card-img-wrap img { filter: saturate(1.05); transform: scale(1.03); }

	.meta {
		font-family: var(--font-mono);
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
