<script lang="ts">
	import { fade } from 'svelte/transition';
	import { zoomOpen, rectOf, imageState, type Origin } from '../components/paper';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { faLinkedin, faGithub, faInstagram, faUnsplash, faMedium, faDev } from '@fortawesome/free-brands-svg-icons';
	import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
	import BlogPost from '../components/blog-post.svelte';
	import Terminal from '../components/terminal.svelte';
	import type { PageData } from './$types';
	export let data: PageData;

	type Photo = { filename: string; caption: string; thumb: string; full: string };
	let selectedPhoto: Photo | null = null;

	// Optimized derivatives are generated at build time only. In `npm run dev`
	// they don't exist, so fall back to the original once.
	function fallbackToOriginal(img: HTMLImageElement, photo: Photo | null) {
		if (!photo) return;
		const original = `/photos/${photo.filename}`;
		if (!img.src.endsWith(original)) img.src = original;
	}
	let topPhoto: number | null = null;
	// The tile the print zooms out of — its rect gives the zoom both its
	// starting position and its starting size.
	let origin: Origin | null = null;

	// The full-res file is much heavier than the thumb, so fetching it only on
	// click means the paper finishes flying before there is anything to show.
	// Hovering (or touching, or tabbing to) a tile is a strong enough signal of
	// intent to start the download early — by the time the click lands the file
	// is usually in cache and the modal opens against a decoded image.
	const warmed = new Set<string>();

	function preloadPhoto(photo: Photo) {
		if (warmed.has(photo.full)) return;
		warmed.add(photo.full);
		const img = new Image();
		img.decoding = 'async';
		// Same dev-mode caveat as the <img> tags: derivatives don't exist until
		// build, so fall back to the original rather than warming a 404.
		img.onerror = () => { img.onerror = null; img.src = `/photos/${photo.filename}`; };
		img.src = photo.full;
	}

	// Has the full-res arrived for the print that's currently open?
	let fullReady = false;

	// A print only appears once its thumbnail has actually downloaded — the grid
	// is a scattered pile, and half-drawn tiles popping in one by one reads as
	// broken rather than as a stack of photos on a table. The tile keeps its
	// space in the layout while it waits, so nothing reflows underneath.
	let tileLoaded: Record<string, boolean> = {};

	function markTileLoaded(photo: Photo) {
		tileLoaded[photo.filename] = true;
		tileLoaded = tileLoaded;
	}

	function openPhoto(e: MouseEvent, photo: Photo) {
		origin = rectOf(e.currentTarget as HTMLElement);
		fullReady = false;
		selectedPhoto = photo;
	}

	// ── Terminal easter egg ────────────────────────────────
	// The terminal lives here now, summoned two ways: clicking the footer
	// cursor, or typing the magic word `sudo` anywhere on the page.
	let terminalOpen = false;
	let keyBuffer = '';
	const MAGIC = 'sudo';

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') { selectedPhoto = null; return; }
		if (terminalOpen) return;

		const target = e.target as HTMLElement;
		const typingInField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
		if (!typingInField && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
			keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-MAGIC.length);
			if (keyBuffer === MAGIC) { terminalOpen = true; keyBuffer = ''; }
		}
	}
</script>

<svelte:window on:keydown={onKeydown} />

<svelte:head>
	<title>Sahu — photographs</title>
</svelte:head>

<!-- ── Hero — The Print Table ─────────────────────────────── -->
<section class="hero">
	<div class="section-inner">
		<header class="hero-head">
			<h1 class="hero-name fade-up">Sahu</h1>
			<p class="hero-tagline fade-up">photographer · explorer · engineer</p>
			<p class="hero-intro fade-up">
				Available light and bad timing. The frames I keep are usually the ones I nearly missed —
				mountains, streets, and the odd machine, from wherever the road went.
			</p>
		</header>

		<div class="photo-dump">
			{#each (data.photos ?? []) as photo, i}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<button class="dump-item" class:on-top={topPhoto === i} class:loaded={tileLoaded[photo.filename]} style="--rot: {(Math.random() * 8 - 4).toFixed(2)}" on:mouseenter={() => { topPhoto = i; preloadPhoto(photo); }} on:focus={() => preloadPhoto(photo)} on:touchstart={() => preloadPhoto(photo)} on:click={(e) => openPhoto(e, photo)}>
					<div class="inner">
						<div class="tile-frame">
							<img src={photo.thumb} alt={photo.caption} loading="lazy" decoding="async" use:imageState={{ ready: () => markTileLoaded(photo), failed: (img) => fallbackToOriginal(img, photo) }} />
						</div>
						<span class="tile-label">{photo.caption}</span>
					</div>
				</button>
			{/each}
		</div>
		<p class="photo-collection-note">my most recent adventure — germany and austria, april 2026. more to come soon ;)</p>
	</div>
</section>

<!-- ── Writing / Recents ──────────────────────────────────── -->
<section class="writing" id="writing">
	<div class="section-inner">
		<p class="section-label">writing</p>
		<h2 class="section-title">things I've been thinking about.</h2>
		<p class="section-body">
			A decade of shipping software, riding roads, and making photographs. These are the notes from
			the journey — mostly technical, always honest.
		</p>

		<div class="blog-dump">
			{#each (data.blogs ?? []).slice(0, 3) as blog (blog.id)}
				<BlogPost {blog} />
			{:else}
				<p class="no-posts">blogs API offline. run docker-compose up to load posts.</p>
			{/each}
		</div>

		<a class="read-more" href="/blog/1">all posts <span class="arrow">→</span></a>
	</div>
</section>

<!-- ── Beyond the Lens ────────────────────────────────────── -->
<section class="beyond" id="beyond">
	<div class="section-inner">
		<p class="section-label">beyond the lens</p>
		<h2 class="section-title">the rest of the picture.</h2>

		<div class="beyond-topics">
			<div class="beyond-block">
				<p class="beyond-block-label">creating</p>
				<p class="beyond-block-body">
					Notebooks, tools, side projects — I make things because I can't help it. Half of them
					ship. The other half teach me more.
				</p>
			</div>
			<div class="beyond-block">
				<p class="beyond-block-label">on two wheels</p>
				<p class="beyond-block-body">
					Long roads clear the mind. There's something about committing to a direction and just
					riding that solves problems no screen can.
				</p>
			</div>
			<div class="beyond-block">
				<p class="beyond-block-label">and, yes, code</p>
				<p class="beyond-block-body">
					By day I build software. The same attention that frames a photograph goes into a clean
					system. If you go looking, there's a terminal around here somewhere.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- ── Photo modal ───────────────────────────────────────── -->
{#if selectedPhoto}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="modal-backdrop" transition:fade={{ duration: 260 }} on:click={() => selectedPhoto = null}>
		<div class="modal-frame" transition:zoomOpen={{ from: origin }} on:click|stopPropagation>
			<!-- The thumb is already decoded (it's the tile you just clicked), so it
			     paints instantly and gives the plate its height. The full-res fades
			     in on top once ready — warm from hover, that swap is invisible.
			     Both need the failure fallback: in `npm run dev` the optimizer
			     hasn't run, so *both* derivative paths 404 and only the original
			     exists. Without it on the thumb the plate collapses to zero height
			     and takes the absolutely-positioned full-res down with it. -->
			{#key selectedPhoto.full}
				<div class="modal-plate">
					<img
						src={selectedPhoto.thumb}
						alt=""
						class="modal-thumb"
						aria-hidden="true"
						decoding="async"
						use:imageState={{ failed: (img) => fallbackToOriginal(img, selectedPhoto) }}
					/>
					<img
						src={selectedPhoto.full}
						alt={selectedPhoto.caption}
						class="modal-img"
						class:ready={fullReady}
						decoding="async"
						use:imageState={{
							ready: () => (fullReady = true),
							failed: (img) => fallbackToOriginal(img, selectedPhoto)
						}}
					/>
				</div>
			{/key}
			{#if selectedPhoto.caption}
				<p class="modal-caption">{selectedPhoto.caption}</p>
			{/if}
		</div>
	</div>
{/if}

<!-- ── Contact ────────────────────────────────────────────── -->
<section class="contact" id="contact">
	<div class="section-inner">
		<p class="section-label">contact</p>
		<h2 class="contact-heading">let's connect.</h2>
		<p class="contact-lead">
			<a href="https://unsplash.com/@mrsauravsahu" target="_blank" rel="noopener">prints &amp; full-res on Unsplash <span class="arrow">→</span></a>
		</p>
		<div class="contact-links">
			<a href="https://www.linkedin.com/in/mrsauravsahu" target="_blank" rel="noopener"><Icon data={faLinkedin} />linkedin</a>
			<a href="https://github.com/mrsauravsahu" target="_blank" rel="noopener"><Icon data={faGithub} />github</a>
			<a href="https://instagram.com/explorewithsahu" target="_blank" rel="noopener"><Icon data={faInstagram} />instagram</a>
			<a href="mailto:mrsauravsahu@outlook.com"><Icon data={faEnvelope} />email</a>
			<a href="https://unsplash.com/@mrsauravsahu" target="_blank" rel="noopener"><Icon data={faUnsplash} />unsplash</a>
			<a href="https://mrsauravsahu.medium.com" target="_blank" rel="noopener"><Icon data={faMedium} />medium</a>
			<a href="https://dev.to/mrsauravsahu" target="_blank" rel="noopener"><Icon data={faDev} />dev.to</a>
		</div>
	</div>
</section>

<!-- ── Footer (with hidden terminal trigger) ──────────────── -->
<footer>
	<p>photographs made with light · site built with SvelteKit</p>
	<p>
		Keep on shooting — Sahu, S
		<button class="egg-trigger" on:click={() => terminalOpen = true} title="psst — try typing 'sudo'" aria-label="Open terminal">▋</button>
	</p>
</footer>

<Terminal bind:open={terminalOpen} />

<style>
	/* ── Hero ─────────────────────────────────────────── */
	.hero {
		padding-top: 8rem;
		padding-bottom: 5rem;
	}

	.hero-head {
		max-width: 40rem;
		margin-bottom: 3.5rem;
	}

	.hero-name {
		font-family: var(--font-display);
		font-size: clamp(2.6rem, 7vw, 4.5rem);
		font-weight: 600;
		color: var(--text);
		line-height: 1;
		letter-spacing: 0;
	}

	.hero-tagline {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--accent);
		margin-top: 1rem;
		animation-delay: 0.1s;
	}

	.hero-intro {
		font-family: var(--font-ui);
		font-size: 1.05rem;
		line-height: 1.7;
		color: var(--text-muted);
		margin-top: 1.5rem;
		animation-delay: 0.2s;
	}

	/* ── Writing ──────────────────────────────────────── */
	.writing {
		background: var(--surface);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: clamp(1.8rem, 4vw, 2.8rem);
		font-weight: 600;
		color: var(--text);
		line-height: 1.15;
		margin-bottom: 1.25rem;
		letter-spacing: 0;
	}

	.section-body {
		font-family: var(--font-ui);
		font-size: 1rem;
		line-height: 1.8;
		color: var(--text-muted);
		max-width: 48rem;
	}

	.no-posts {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--text-muted);
		width: 100%;
		text-align: center;
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

	/* ── Beyond the Lens ──────────────────────────────── */
	.beyond {
		background: var(--bg);
	}

	.beyond-topics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 3rem;
		margin-top: 3rem;
	}

	.beyond-block-label {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.75rem;
	}

	.beyond-block-body {
		font-family: var(--font-ui);
		font-size: 1rem;
		color: var(--text-muted);
		line-height: 1.7;
	}

	/* ── Photo dump ───────────────────────────────────── */
	.photo-dump {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 1rem;
		padding: 1.5rem;
		overflow: hidden;
	}

	.dump-item {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		width: calc(20% - 1rem);
		margin: -0.6rem;
		position: relative;
		z-index: 1;
		transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s 0.2s;
	}

	.dump-item { transform: rotate(calc(var(--rot) * 1deg)); }

	/* Held back until the thumbnail is decoded — see `tileLoaded`. */
	.dump-item {
		opacity: 0;
		transition: opacity 0.45s ease, transform 0.2s ease, box-shadow 0.2s ease, z-index 0s 0.2s;
	}

	.dump-item.loaded { opacity: 1; }

	.dump-item:hover {
		transform: rotate(0deg) scale(1.12) !important;
		z-index: 20;
		transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s;
	}

	.dump-item.on-top {
		z-index: 10;
	}

	.dump-item .inner {
		background: var(--mat);
		padding: 0.5rem 0.5rem 1.75rem;
		box-shadow: 3px 3px 12px rgba(0,0,0,0.55);
		transition: box-shadow 0.2s ease;
	}

	.dump-item:hover .inner {
		box-shadow: 10px 10px 28px rgba(0,0,0,0.7);
	}

	.tile-frame {
		overflow: hidden;
		width: 100%;
		padding-top: 75%;
		position: relative;
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

	.dump-item:hover .tile-frame img {
		opacity: 1;
	}

	.tile-label {
		display: block;
		text-align: center;
		margin-top: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.55rem;
		letter-spacing: 0.08em;
		color: #6b6257;
	}

	.photo-collection-note {
		text-align: center;
		margin-top: 3rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		color: var(--text-muted);
	}

	/* ── Photo modal ──────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.9);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		cursor: zoom-out;
	}

	.modal-frame {
		background: var(--mat);
		padding: 0.75rem 0.75rem 2.5rem;
		box-shadow: 0 20px 60px rgba(0,0,0,0.8);
		/* The last term keeps the 4:3 plate inside the viewport height, so the
		   print never has to be squeezed out of its aspect ratio to fit. */
		max-width: min(90vw, 800px, calc(62vh * 4 / 3));
		width: 100%;
		cursor: default;
	}

	/* Same 4:3 window as the tiles in the grid (`.tile-frame`, padding-top 75%)
	   and the same `cover` crop, so opening a print is a straight scale-up of
	   what you clicked — the framing never shifts on the way to the screen.
	   Fixing the ratio also means the plate has its full size before either
	   image has loaded, so nothing reflows as they arrive. */
	.modal-plate {
		position: relative;
		aspect-ratio: 4 / 3;
		width: 100%;
		overflow: hidden;
		background: #cfc9bd;
		line-height: 0;
	}

	.modal-plate img {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.modal-thumb {
		/* A tile-sized file blown up to plate size — a touch of blur reads as a
		   print still developing rather than as a low-quality image. */
		filter: blur(6px) saturate(0.92);
		transform: scale(1.03); /* hides the blur bleeding past the edges */
	}

	.modal-img {
		opacity: 0;
		transition: opacity 0.28s ease;
	}

	.modal-img.ready { opacity: 1; }

	@media (prefers-reduced-motion: reduce) {
		.modal-img { transition: none; }
	}

	/* ── Contact ──────────────────────────────────────── */
	.contact {
		background: var(--surface);
	}

	.contact-heading {
		font-family: var(--font-display);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 600;
		color: var(--text);
		margin-bottom: 0.75rem;
		letter-spacing: 0;
	}

	.contact-lead {
		margin-bottom: 2rem;
	}

	.contact-lead a {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		color: var(--accent);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		transition: gap 0.2s ease;
	}

	.contact-lead a:hover { gap: 0.75rem; }
	.contact-lead .arrow { display: inline-block; }

	.contact-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0;
	}

	.contact-links a {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		text-decoration: none;
		padding: 0.25rem 1.5rem 0.25rem 0;
		margin-right: 1.5rem;
		position: relative;
		transition: color 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.contact-links a::before {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0; right: 100%;
		height: 1px;
		background: var(--accent);
		transition: right 0.25s ease;
	}

	.contact-links a:not(:last-child)::after {
		content: '|';
		position: absolute;
		right: 0;
		color: var(--border);
	}

	.contact-links a:hover { color: var(--accent); }
	.contact-links a:hover::before { right: 1.5rem; }

	/* ── Footer ───────────────────────────────────────── */
	footer {
		border-top: 1px solid var(--border);
		padding: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.egg-trigger {
		background: none;
		border: none;
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 0.65rem;
		cursor: pointer;
		padding: 0 0.15rem;
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0; }
	}

	/* ── Responsive ───────────────────────────────────── */
	@media (max-width: 768px) {
		.hero { padding-top: 6.5rem; }

		.beyond-topics { grid-template-columns: 1fr; gap: 2rem; }

		.dump-item {
			width: calc(33.33% - 1rem);
			margin: -0.5rem;
			transform: rotate(calc(var(--rot) * 2deg));
		}

		footer { flex-direction: column; gap: 0.5rem; text-align: center; }
	}
</style>
