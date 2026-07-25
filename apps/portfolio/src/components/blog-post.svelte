<script>
	import { DateTime, Duration } from 'luxon';
	import { fadeNavigate, imageState } from './paper';
	export let blog;

	$: href = `/blog/posts/${blog.id}`;

	// A card with a cover waits for that cover before it appears, like the photo
	// tiles do. Note cards have no image to wait on, so they show immediately.
	let coverLoaded = false;

	// A stable-ish tilt per card (random at render/prerender time, like the photos).
	const rot = (Math.random() * 8 - 4).toFixed(2);

	// A cover only "counts" if the static site can actually serve it. Many older
	// posts point at a `/store/...` path (served only by the API, 404 on Pages) or
	// have no cover at all — those render as a written note instead of a photo.
	$: hasCover = !!blog.coverImageUrl && !blog.coverImageUrl.startsWith('/store/');
	let imgFailed = false;
	$: showNote = !hasCover || imgFailed;

	$: duration = Duration.fromISO(blog.approxTimeToRead);
	$: readTime = duration.minutes <= 1 ? 'less than a minute' : `${duration.toFormat('m')} min read`;
	$: date = DateTime.fromISO(blog.createdAt).toFormat('MMM yyyy');
</script>

<a
	class="card"
	class:note={showNote}
	class:shown={showNote || coverLoaded}
	{href}
	use:fadeNavigate={href}
	style="--rot: {rot}"
>
	{#if showNote}
		<div class="note-inner">
			<span class="note-meta">{date} · {readTime}</span>
			<span class="note-title">{blog.title}</span>
			{#if blog.description}
				<span class="note-desc">{blog.description}</span>
			{/if}
			<span class="note-read">read →</span>
		</div>
	{:else}
		<div class="inner">
			<div class="tile-frame">
				<img src={blog.coverImageUrl} alt={blog.title} loading="lazy" decoding="async" use:imageState={{ ready: () => (coverLoaded = true), failed: () => (imgFailed = true) }} />
			</div>
			<div class="caption">
				<span class="p-title">{blog.title}</span>
				<span class="p-meta">{date} · {readTime}</span>
			</div>
		</div>
	{/if}
</a>

<style>
	.card {
		display: block;
		text-decoration: none;
		width: calc(33.33% - 0.75rem);
		margin: -0.4rem;
		position: relative;
		z-index: 1;
		transform: rotate(calc(var(--rot) * 1deg));
		opacity: 0;
		transition: opacity 0.45s ease, transform 0.2s ease, box-shadow 0.2s ease, z-index 0s 0.2s;
	}

	/* Held back until the cover has downloaded — see `coverLoaded`. */
	.card.shown { opacity: 1; }

	.card:hover {
		transform: rotate(0deg) scale(1.06);
		z-index: 20;
		transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s;
	}

	/* ── Polaroid (has a real cover) ─────────────────────── */
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

	.card:hover .inner {
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

	.card:hover .tile-frame img { opacity: 1; }

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

	/* ── Note (no servable cover) ────────────────────────── */
	/* A written index-card: manila paper, a red margin rule, faint horizontal
	   ruling behind the text, and a folded dog-ear corner. Sits among the
	   Polaroids as a hand-written note rather than a placeholder image. */
	/* One ruling rhythm (`--rule`) drives BOTH the horizontal lines and the
	   text line-height, so every line of text sits on a ruled line — like
	   writing on real ruled paper. Padding-top is a whole rule and all vertical
	   gaps are rule-multiples, so nothing knocks the text off the lines. */
	.note-inner {
		--rule: 1.75rem;
		position: relative;
		min-height: calc(var(--rule) * 9);
		padding: var(--rule) 1rem 0.4rem 1.6rem;
		line-height: var(--rule);
		background-color: #f4ecd6;
		/* rule sits at the bottom of each line-box */
		background-image: repeating-linear-gradient(
			to bottom,
			transparent 0,
			transparent calc(var(--rule) - 1px),
			rgba(70, 90, 130, 0.2) calc(var(--rule) - 1px),
			rgba(70, 90, 130, 0.2) var(--rule)
		);
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			3px 4px 14px rgba(0, 0, 0, 0.5);
		transition: box-shadow 0.2s ease;
		overflow: hidden;
	}

	.card:hover .note-inner {
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			10px 12px 30px rgba(0, 0, 0, 0.68);
	}

	/* red margin rule */
	.note-inner::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 1.1rem;
		width: 1px;
		background: rgba(190, 70, 60, 0.5);
	}

	/* folded dog-ear, top-right */
	.note-inner::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		border-width: 0 0.85rem 0.85rem 0;
		border-style: solid;
		border-color: transparent #e3d9bd transparent transparent;
		filter: drop-shadow(-1px 1px 1px rgba(0, 0, 0, 0.15));
	}

	/* Every text element keeps line-height: var(--rule) (inherited) and uses
	   only rule-multiple margins so it stays locked to the ruling. */
	.note-meta {
		display: block;
		font-family: var(--font-mono);
		font-size: 0.5rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #a08a5e;
	}

	.note-title {
		display: -webkit-box;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		font-weight: 600;
		color: #2b2721;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.note-desc {
		display: -webkit-box;
		margin-top: var(--rule);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		color: #6a5f4a;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.note-read {
		display: block;
		margin-top: var(--rule);
		font-family: var(--font-mono);
		font-size: 0.58rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #be463c;
	}

	@media (max-width: 768px) {
		.card {
			width: calc(70% - 0.5rem);
			margin: -0.3rem;
			transform: rotate(calc(var(--rot) * 2deg));
		}
	}
</style>
