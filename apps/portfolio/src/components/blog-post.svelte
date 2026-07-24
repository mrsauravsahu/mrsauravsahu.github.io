<script>
	import { DateTime, Duration } from 'luxon';
	export let blog;
	// Position in the grid — picks a fallback cover and seeds the tilt so each
	// card leans a little differently, like prints dropped on a table.
	export let index = 0;

	const COVERS = ['/img/blog-cover-1.svg', '/img/blog-cover-2.svg', '/img/blog-cover-3.svg'];

	// A stable-ish tilt per card (random at render/prerender time, like the photos).
	const rot = (Math.random() * 8 - 4).toFixed(2);

	$: cover = blog.coverImageUrl || COVERS[index % COVERS.length];
	$: duration = Duration.fromISO(blog.approxTimeToRead);
	$: readTime = duration.minutes <= 1 ? 'less than a minute' : `${duration.toFormat('m')} min read`;
	$: date = DateTime.fromISO(blog.createdAt).toFormat('MMM yyyy');
</script>

<a class="blog-polaroid" href={`/blog/posts/${blog.id}`} style="--rot: {rot}">
	<div class="inner">
		<div class="tile-frame">
			<img src={cover} alt={blog.title} loading="lazy" decoding="async" />
		</div>
		<span class="p-meta">{date} · {readTime}</span>
		<span class="p-title">{blog.title}</span>
	</div>
</a>

<style>
	.blog-polaroid {
		display: block;
		text-decoration: none;
		width: calc(33.33% - 0.75rem);
		margin: -0.4rem;
		position: relative;
		z-index: 1;
		transform: rotate(calc(var(--rot) * 1deg));
		transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s 0.2s;
	}

	.blog-polaroid:hover {
		transform: rotate(0deg) scale(1.06);
		z-index: 20;
		transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s;
	}

	.inner {
		background: var(--mat);
		padding: 0.6rem 0.6rem 1.1rem;
		box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.55);
		transition: box-shadow 0.2s ease;
		height: 100%;
	}

	.blog-polaroid:hover .inner {
		box-shadow: 10px 10px 28px rgba(0, 0, 0, 0.7);
	}

	.tile-frame {
		overflow: hidden;
		width: 100%;
		padding-top: 62.5%; /* 16:10 blog covers */
		position: relative;
		background: #d9d3c8;
	}

	.tile-frame img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
		opacity: 0.94;
		transition: opacity 0.3s ease, transform 0.3s ease;
	}

	.blog-polaroid:hover .tile-frame img { opacity: 1; }

	.p-meta {
		display: block;
		margin-top: 0.6rem;
		font-family: var(--font-mono);
		font-size: 0.52rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #8a8072;
	}

	.p-title {
		display: -webkit-box;
		margin-top: 0.25rem;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		font-weight: 600;
		line-height: 1.35;
		color: #2b2721;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.blog-polaroid {
			width: calc(70% - 0.5rem);
			margin: -0.3rem;
			transform: rotate(calc(var(--rot) * 2deg));
		}
	}
</style>
