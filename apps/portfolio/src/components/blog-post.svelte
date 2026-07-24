<script>
	import { DateTime, Duration } from 'luxon';
	export let blog;
	// Position in the grid — picks a fallback cover and seeds the tilt so each
	// card leans a little differently, like prints dropped on a table.
	export let index = 0;

	const COVERS = ['/img/blog-cover-1.svg', '/img/blog-cover-2.svg', '/img/blog-cover-3.svg'];

	// A stable-ish tilt per card (random at render/prerender time, like the photos).
	const rot = (Math.random() * 8 - 4).toFixed(2);

	$: fallback = COVERS[index % COVERS.length];
	$: cover = blog.coverImageUrl || fallback;

	// Some posts point coverImageUrl at a `/store/...` path the static site can't
	// serve; degrade to the SVG fallback instead of a blank frame.
	/** @param {Event} e */
	function onCoverError(e) {
		const img = /** @type {HTMLImageElement} */ (e.currentTarget);
		if (!img.src.endsWith(fallback)) img.src = fallback;
	}
	$: duration = Duration.fromISO(blog.approxTimeToRead);
	$: readTime = duration.minutes <= 1 ? 'less than a minute' : `${duration.toFormat('m')} min read`;
	$: date = DateTime.fromISO(blog.createdAt).toFormat('MMM yyyy');
</script>

<a class="blog-polaroid" href={`/blog/posts/${blog.id}`} style="--rot: {rot}">
	<div class="inner">
		<div class="tile-frame">
			<img src={cover} alt={blog.title} loading="lazy" decoding="async" on:error={onCoverError} />
		</div>
		<div class="caption">
			<span class="p-title">{blog.title}</span>
			<span class="p-meta">{date} · {readTime}</span>
		</div>
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

	/* Polaroid paper: thin even border on 3 sides, a heavy bottom "chin",
	   warm off-white stock with a faint edge and a soft real-world shadow. */
	.inner {
		background:
			linear-gradient(160deg, #f4f1ea 0%, var(--mat) 45%, #e4dfd5 100%);
		padding: 0.7rem 0.7rem 2.4rem;
		border: 1px solid rgba(0, 0, 0, 0.06);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			3px 4px 14px rgba(0, 0, 0, 0.55);
		transition: box-shadow 0.2s ease;
		height: 100%;
	}

	.blog-polaroid:hover .inner {
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			10px 12px 30px rgba(0, 0, 0, 0.72);
	}

	.tile-frame {
		overflow: hidden;
		width: 100%;
		padding-top: 100%; /* square image window, like real Polaroid film */
		position: relative;
		background: #cfc9bd;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35) inset;
	}

	.tile-frame img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
		opacity: 0.95;
		transition: opacity 0.3s ease, transform 0.3s ease;
	}

	.blog-polaroid:hover .tile-frame img { opacity: 1; }

	/* The chin — caption centred in the wide bottom border. */
	.caption {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.3rem;
		padding: 0.75rem 0.4rem 0;
	}

	.p-title {
		display: -webkit-box;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		font-weight: 600;
		line-height: 1.35;
		color: #2b2721;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.p-meta {
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #9a8f7f;
	}

	@media (max-width: 768px) {
		.blog-polaroid {
			width: calc(70% - 0.5rem);
			margin: -0.3rem;
			transform: rotate(calc(var(--rot) * 2deg));
		}
	}
</style>
