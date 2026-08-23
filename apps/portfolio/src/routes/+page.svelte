<script lang="ts">
	import { veil, imageState } from '../components/paper';
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

	// Opening a print doesn't build a new element — the tile you clicked *is*
	// the thing that opens. It stays exactly where it is in the pile and is
	// translated, rotated and scaled up until it's filling the screen in front
	// of you, then handed back the same way.
	//
	// That's what makes it read as one physical object: there is no handoff
	// between a card and its stand-in, so there's nothing to line up and nothing
	// that can drift. The mat, the print and the caption keep their proportions
	// on the way because a single uniform scale carries all three.
	//
	// The two things standing in the card's way are both solved in CSS: the pile
	// clips (`.photo-dump` is `overflow: hidden`) and the backdrop is painted
	// over it. `.lifted` lifts the card above the veil, and `.photo-dump.opened`
	// stops the clipping while one is out. No ancestor of a tile creates a
	// stacking context, so raising it is enough to bring it to the front.

	/** The transform that takes the clicked card to the middle of the screen. */
	let liftStyle = '';

	/** Which card is flying — drives the transform. Cleared on close. */
	let liftedKey: string | null = null;

	/**
	 * Which card is painted above the veil. Deliberately outlives `liftedKey`:
	 * the return flight has to stay on top all the way home, so this is only
	 * dropped once the card has actually landed back in the pile.
	 */
	let elevatedKey: string | null = null;

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

	/**
	 * How far a tile sits off square in the pile, in degrees, from its filename.
	 *
	 * Derived rather than drawn. `Math.random()` in the markup is re-run every
	 * time Svelte re-evaluates that attribute — so lifting one print gave every
	 * other tile in the pile a brand new angle, and the whole table twitched
	 * around the one card that was meant to be moving. It also differed between
	 * the server render and the client's, which is a hydration mismatch.
	 *
	 * A hash of the filename is stable in both directions: the same tile keeps
	 * the same angle for the life of the page, and the pile still looks dropped
	 * rather than laid out.
	 */
	function tiltOf(filename: string): string {
		let h = 0;
		for (let i = 0; i < filename.length; i++) h = (h * 31 + filename.charCodeAt(i)) | 0;
		return ((((h % 800) + 800) % 800) / 100 - 4).toFixed(2); // -4deg … +4deg
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

	/**
	 * Work out where the clicked card has to go, and how much bigger it has to
	 * get, to sit centred in front of the reader.
	 *
	 * The size is set by the *photo window* rather than the card: the print is
	 * what you came to look at, and pinning the mat instead would leave the
	 * picture a different size depending on how chunky the border happened to
	 * be. The card is then held back if the whole of it — caption and all —
	 * wouldn't fit on screen.
	 *
	 * Sizes come from the layout box (`offsetWidth`) and the position from the
	 * rendered rect. That split matters: by the time a tile can be clicked,
	 * `:hover` has already scaled it up 12%, so its rect is not its layout size
	 * — but its centre is unaffected by a scale about that same centre, so the
	 * centre is still exactly right.
	 */
	function liftTransform(card: HTMLElement): string {
		const frame = card.querySelector('.tile-frame') as HTMLElement | null;
		const printWidth = frame?.offsetWidth ?? card.offsetWidth;
		if (printWidth === 0) return '';

		const vw = window.innerWidth;
		const vh = window.innerHeight;

		// Same ceiling the open print has always had: never wider than the
		// viewport or 800px, and short enough that a 4:3 frame clears the height.
		const target = Math.min(vw * 0.9, 800, ((vh * 0.62) * 4) / 3);
		const scale = Math.min(
			target / printWidth,
			(vw * 0.92) / card.offsetWidth,
			(vh * 0.92) / card.offsetHeight
		);

		const r = card.getBoundingClientRect();
		const dx = vw / 2 - (r.left + r.width / 2);
		const dy = vh / 2 - (r.top + r.height / 2);

		return `--lift-x: ${dx.toFixed(2)}px; --lift-y: ${dy.toFixed(2)}px; --lift-scale: ${scale.toFixed(4)};`;
	}

	function openPhoto(e: MouseEvent, photo: Photo) {
		liftStyle = liftTransform(e.currentTarget as HTMLElement);
		fullReady = false;
		selectedPhoto = photo;
		liftedKey = photo.filename;
		elevatedKey = photo.filename;
	}

	function closePhoto() {
		selectedPhoto = null;
		liftedKey = null;
		// `elevatedKey` is left alone — see `onCardLanded`.
	}

	/**
	 * The card has finished a transform transition. Only the *return* leg is
	 * interesting: once the card is back in its slot it can drop out of the
	 * raised layer and rejoin the pile's own stacking order.
	 *
	 * `transitionend` fires per property, and the card animates its shadow
	 * alongside its transform, so the property is checked.
	 */
	function onCardLanded(e: TransitionEvent) {
		if (e.propertyName === 'transform' && !liftedKey) elevatedKey = null;
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

		<div class="photo-dump" class:opened={elevatedKey !== null}>
			{#each (data.photos ?? []) as photo, i}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<button class="dump-item" class:on-top={topPhoto === i} class:loaded={tileLoaded[photo.filename]} class:lifted={elevatedKey === photo.filename} class:flying={liftedKey === photo.filename} style="--rot: {tiltOf(photo.filename)}; {elevatedKey === photo.filename ? liftStyle : ''}" on:transitionend={onCardLanded} on:mouseenter={() => { topPhoto = i; preloadPhoto(photo); }} on:focus={() => preloadPhoto(photo)} on:touchstart={() => preloadPhoto(photo)} on:click={(e) => openPhoto(e, photo)}>
					<div class="inner">
						<div class="tile-frame">
							<img src={photo.thumb} alt={photo.caption} loading="lazy" decoding="async" use:imageState={{ ready: () => markTileLoaded(photo), failed: (img) => fallbackToOriginal(img, photo) }} />
							<!-- Blown up to fill the screen, a thumbnail is no longer enough
							     resolution. The full-res file is laid over the top of it and
							     faded in the moment it's decoded — warm from the hover
							     preload, so in practice it's already there. Cross-fading in
							     place keeps the print continuous; swapping the `src` would
							     blank the card mid-flight. -->
							{#if elevatedKey === photo.filename}
								<img src={photo.full} alt="" aria-hidden="true" class="tile-full" class:ready={fullReady} decoding="async" use:imageState={{ ready: () => (fullReady = true), failed: (img) => fallbackToOriginal(img, photo) }} />
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

<!-- ── Photo backdrop ────────────────────────────────────
     There is no modal any more. The print you clicked comes to you instead, so
     all this has to do is darken the room behind it and give you somewhere to
     click to send it back. -->
{#if selectedPhoto}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="modal-backdrop" transition:veil={{ duration: 420 }} on:click={closePhoto}></div>
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

	/* Spelled out as translate/rotate/scale, even at rest, so every state of the
	   card is the same list of functions. Browsers interpolate matching lists
	   component by component; mismatched ones get decomposed into a matrix,
	   which turns a clean rotate-and-grow into a wobble. */
	.dump-item { transform: translate(0px, 0px) rotate(calc(var(--rot) * 1deg)) scale(1); }

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
		transform: translate(0px, 0px) rotate(0deg) scale(1.12) !important;
		z-index: 20;
		transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s;
	}

	.dump-item.on-top {
		z-index: 10;
	}

	/* ── The lift ──────────────────────────────────────
	   A card on its way out to the reader and back. Raised above the backdrop
	   (z-index 200) for the whole round trip, not just the outward leg, so it
	   doesn't sink behind the veil halfway home.

	   `pointer-events` go with it: the pointer is left sitting wherever the card
	   used to be, and without this the tile underneath would light up on hover
	   the moment the print leaves — and the flying card would fight its own
	   `:hover` transform on the way back. */
	.photo-dump .dump-item.lifted {
		z-index: 250;
		pointer-events: none;
		transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 480ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* Out to the middle of the screen, square-on, and big. Beats `:hover`, which
	   is also `!important` and still matches while the pointer sits over the
	   card's old slot — later rule of equal weight, plus a class more. */
	.photo-dump .dump-item.flying {
		transform: translate(var(--lift-x), var(--lift-y)) rotate(0deg) scale(var(--lift-scale)) !important;
		cursor: zoom-out;
	}

	/* The shadow is *not* scaled with the card — it's declared on the flying
	   card itself, so these lengths are multiplied by the lift scale as they
	   land. Kept small for that reason: at 4x it's already a deep, soft pool
	   under a print held up close. */
	.photo-dump .dump-item.flying .inner {
		box-shadow: 3px 6px 14px rgba(0, 0, 0, 0.75);
	}

	/* The pile clips, to keep the scattered tiles' negative margins off the
	   section's edges. That clip would cut the flying card in half, so it comes
	   off while one is out — safe, because everything it was hiding is behind a
	   near-black backdrop by then. */
	.photo-dump.opened {
		overflow: visible;
	}

	@media (prefers-reduced-motion: reduce) {
		.photo-dump .dump-item.lifted { transition: none; }
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

	/* The full-res print, over the thumbnail rather than replacing it.
	   It doesn't fade in: it isn't a new picture arriving, it's the same one at
	   a resolution that holds up close, so there's nothing to announce. It's
	   simply not on screen until it can be drawn in full (see `imageState`),
	   and then it is.

	   Hidden with `visibility` rather than `opacity` on purpose — the hover rule
	   above sets `opacity: 1` on every image in a frame, and outranks anything
	   sane a class selector can say here. `visibility` is untouched by it, so a
	   print that isn't ready cannot be revealed by accident. */
	.tile-frame .tile-full {
		visibility: hidden;
		/* Fully opaque, unlike the tiles: `.tile-frame img` holds them at 0.94 to
		   sit back into the mat, and inheriting that here would blend the sharp
		   print with the blurred thumbnail underneath it. */
		opacity: 1;
		transition: none;
	}

	.tile-frame .tile-full.ready {
		visibility: visible;
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
			transform: translate(0px, 0px) rotate(calc(var(--rot) * 2deg)) scale(1);
		}

		footer { flex-direction: column; gap: 0.5rem; text-align: center; }
	}
</style>
