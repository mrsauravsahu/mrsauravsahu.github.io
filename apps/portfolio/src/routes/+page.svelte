<script lang="ts">
	import { crossfade, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { veil, paperGrow, imageState, prefersReducedMotion, type PhotoOrigin } from '../components/paper';
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

	// The print flying between the grid and the modal is one `crossfade` pair:
	// the tile's photo hands off to the plate on the way in, and back again on
	// the way out. Svelte measures both ends and does the FLIP itself.
	//
	// The pair is deliberately the *photo windows* rather than the whole cards.
	// crossfade scales x and y independently, so pairing the cards would squash
	// the print — their aspect ratios differ by 15%, because the mat and caption
	// are sized in rem and don't stay proportional between a thumbnail and a full
	// plate. The photo windows are 4:3 at both ends, so that same independent
	// scale comes out uniform on its own.
	//
	// Rotation needs no handling here: a tile is unrotated by `:hover` (and by
	// `:focus`) before it can be clicked, so the rect crossfade measures is
	// square-on and already includes the hover scale.
	//
	// Everything inside the modal is marked `|global`. Transitions are local by
	// default in Svelte 4, meaning they're skipped when it's an enclosing block
	// rather than the element's own that appears — and the plate's enclosing
	// blocks (the `{#if selectedPhoto}` and the `{#key}`) are created by the same
	// click. Without it the print doesn't fly at all; it simply appears.
	const [send, receive] = crossfade({
		duration: () => (prefersReducedMotion() ? 0 : 420),
		easing: cubicOut,
		// No counterpart on screen — the tile was never rendered, or the grid
		// re-ordered underneath. Grow gently in place rather than flying from
		// nowhere.
		fallback: () => ({
			duration: prefersReducedMotion() ? 0 : 240,
			easing: cubicOut,
			css: (t: number) => `opacity: ${t}; transform: scale(${0.94 + 0.06 * t});`
		})
	});

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

	// Which tile has had its print lifted out. That photo leaves the grid so it
	// can be the `send` half of the pair — the empty mat stays behind, which is
	// what a print actually leaves on the table.
	//
	// It has to flip in the same tick as `selectedPhoto`, in both directions:
	// crossfade only pairs a `send` with a `receive` that happen together, and
	// deferring the restore to the modal's outroend would leave the print with
	// nothing to fly home to.
	let liftedFrom: string | null = null;

	// The same key, but deliberately *not* cleared on close. Svelte re-evaluates
	// a transition's parameters as the modal is torn down, and reading
	// `selectedPhoto.filename` at that point throws — by then it's null. This
	// outlives the close so the departing print still knows which tile it
	// belongs to.
	let openKey = '';

	// The clicked tile's photo window, which the paper grows out of and shrinks
	// back into. Deliberately not cleared on close, for the same reason as
	// `openKey` — the closing transition still needs it. `:hover` has already
	// squared the tile up by the time it can be clicked, so this rect is the
	// photo's true size with the hover scale in it, not a rotated bounding box.
	let photoOrigin: PhotoOrigin | null = null;

	function openPhoto(e: MouseEvent, photo: Photo) {
		const win = (e.currentTarget as HTMLElement).querySelector('.tile-frame');
		if (win) {
			const r = win.getBoundingClientRect();
			photoOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width };
		}
		fullReady = false;
		selectedPhoto = photo;
		liftedFrom = photo.filename;
		openKey = photo.filename;
	}

	function closePhoto() {
		selectedPhoto = null;
		liftedFrom = null;
	}

	// ── Terminal easter egg ────────────────────────────────
	// The terminal lives here now, summoned two ways: clicking the footer
	// cursor, or typing the magic word `sudo` anywhere on the page.
	let terminalOpen = false;
	let keyBuffer = '';
	const MAGIC = 'sudo';

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') { closePhoto(); return; }
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
							<!-- The photo is the `send`/`receive` half that flies. It's absolutely
							     positioned inside the frame, so taking it out leaves the card's
							     size — and the pile's layout — completely untouched. -->
							{#if liftedFrom !== photo.filename}
								<img src={photo.thumb} alt={photo.caption} loading="lazy" decoding="async" in:receive={{ key: photo.filename }} out:send={{ key: photo.filename }} use:imageState={{ ready: () => markTileLoaded(photo), failed: (img) => fallbackToOriginal(img, photo) }} />
							{/if}
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
	<div class="modal-backdrop" transition:veil={{ duration: 420 }} on:click={closePhoto}>
		<div class="modal-frame" on:click|stopPropagation>
			<!-- The paper: the mat behind the print and the caption below it, as one
			     layer so they grow together. It sits *beside* the plate rather than
			     around it — an ancestor's scale would multiply into crossfade's and
			     the photo would grow quadratically. -->
			<div class="modal-chrome" transition:paperGrow|global={{ from: photoOrigin }}>
				<div class="mat-sheet"></div>
				{#if selectedPhoto.caption}
					<p class="modal-caption">{selectedPhoto.caption}</p>
				{/if}
			</div>
			<!-- The thumb is already decoded (it's the tile you just clicked), so it
			     paints instantly and gives the plate its height. The full-res fades
			     in on top once ready — warm from hover, that swap is invisible.
			     Both need the failure fallback: in `npm run dev` the optimizer
			     hasn't run, so *both* derivative paths 404 and only the original
			     exists. Without it on the thumb the plate collapses to zero height
			     and takes the absolutely-positioned full-res down with it. -->
			{#key selectedPhoto.full}
				<div
					class="modal-plate"
					in:receive|global={{ key: openKey }}
					out:send|global={{ key: openKey }}
				>
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

	/* Focus lifts the tile exactly as hover does. Beyond matching the pointer,
	   it's what squares the tile up before it can be activated — the crossfade
	   measures whatever rect is on screen at that moment, and a rotated one
	   reports its inflated bounding box. */
	.dump-item:hover,
	.dump-item:focus-visible {
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

	.dump-item:hover .inner,
	.dump-item:focus-visible .inner {
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

	.dump-item:hover .tile-frame img,
	.dump-item:focus-visible .tile-frame img {
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
		background: rgba(0, 0, 0, 0.9);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		cursor: zoom-out;
	}

	.modal-frame {
		position: relative;
		padding: 0.75rem 0.75rem 2.5rem;
		/* The last term keeps the 4:3 plate inside the viewport height, so the
		   print never has to be squeezed out of its aspect ratio to fit. */
		max-width: min(90vw, 800px, calc(62vh * 4 / 3));
		width: 100%;
		cursor: default;
	}

	/* The paper layer: mat plus caption, transformed as one so the card grows at
	   the print's rate. Absolute, so it can carry that transform without the
	   frame's layout — which is what fixes the plate's size — moving with it. */
	.modal-chrome {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.mat-sheet {
		position: absolute;
		inset: 0;
		background: var(--mat);
		box-shadow: 0 20px 60px rgba(0,0,0,0.8);
	}

	/* Above the mat, and establishing the stacking order the flying print needs
	   to stay on top of the paper it lands on. */
	.modal-plate {
		position: relative;
		z-index: 1;
	}

	/* crossfade dissolves as well as moves, and there's no option to turn that
	   off — so overrule it. An `!important` declaration outranks an animated
	   value, which leaves crossfade's transform intact and drops only its
	   opacity ramp.
	   That ramp is wrong here: the two halves only sum back to a solid image if
	   both are visible, and the tile half is behind a backdrop that's busy
	   darkening to near-black. What you actually saw was the pile and the hero
	   text straight through the print. */
	.modal-plate {
		opacity: 1 !important;
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
		   print still developing rather than as a low-quality image.

		   The blur arrives over the zoom rather than being there from the first
		   frame. At tile size this file is sharp — it *is* the tile, and starting
		   it blurred breaks the illusion at the exact moment the two are meant to
		   be the same object. Letting it soften as the card outgrows its own
		   resolution is both continuous and what actually enlarging a print
		   looks like.

		   Everything else this image does has to arrive the same way, for the
		   same reason: the slight overscale that hides the blur bleeding past the
		   edges, and the desaturation. Held from the first frame they'd make the
		   photo 3% larger and duller than the tile it's supposed to *be* — a
		   mismatch in both size and colour at the one moment the two are
		   overlaid. */
		filter: blur(0) saturate(1);
		transform: scale(1);
		animation: thumb-enlarge 420ms cubic-bezier(0.33, 1, 0.68, 1) forwards;
	}

	@keyframes thumb-enlarge {
		to {
			filter: blur(6px) saturate(0.92);
			transform: scale(1.03);
		}
	}

	.modal-img {
		opacity: 0;
		transition: opacity 0.28s ease;
	}

	.modal-img.ready { opacity: 1; }

	@media (prefers-reduced-motion: reduce) {
		.modal-img { transition: none; }
		.modal-thumb {
			animation: none;
			filter: blur(6px) saturate(0.92);
			transform: scale(1.03);
		}
	}

	/* The zoomed print is the one place the reader is looking at paper rather
	   than at the dark table, so its caption is black on the mat instead of the
	   warm grey used on the tiles. */
	.modal-caption {
		position: absolute;
		left: 0;
		right: 0;
		/* Sits in the frame's bottom padding, which the plate's layout still
		   reserves even though the caption no longer takes part in it. */
		bottom: 0.85rem;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		color: #000000;
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
