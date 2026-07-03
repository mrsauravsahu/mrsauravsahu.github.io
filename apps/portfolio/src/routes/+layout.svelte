<script>
	import { onMount } from 'svelte';
	import Nav from '../components/nav-bar.svelte';

	let progress = 0;

	onMount(() => {
		const onScroll = () => {
			const doc = document.documentElement;
			const h = doc.scrollHeight - window.innerHeight;
			progress = h > 0 ? (window.scrollY / h) * 100 : 0;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<div class="progress-bar" style="width: {progress}%"></div>
<Nav />
<main>
	<slot />
</main>

<style>
	/* ── Tokens ───────────────────────────────────────── */
	:root {
		--bg:          #050505;
		--surface:     #0a0a0a;
		--surface-alt: #111;
		--border:      #1a2a1a;
		--text:        #b8ffb8;
		--text-muted:  #3d7a3d;
		--accent:      #00ff88;
		--accent-dim:  #006633;

		--font-display: 'Geist Mono', 'Courier New', monospace;
		--font-ui:      'Geist Mono', 'Courier New', monospace;
		--font-mono:    'Geist Mono', 'Courier New', monospace;

		--max-w:     72rem;
		--reading-w: 42rem;
	}

	/* ── Reset ────────────────────────────────────────── */
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(html) {
		background: var(--bg);
		color: var(--text);
		font-family: var(--font-ui);
		font-size: 16px;
		overflow-x: hidden;
	}

	:global(body) {
		overflow-x: hidden;
	}

	/* ── Scanlines overlay ────────────────────────────── */
	:global(body::before) {
		content: '';
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 9999;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 255, 136, 0.015) 2px,
			rgba(0, 255, 136, 0.015) 4px
		);
	}

	/* ── CRT glow on text ─────────────────────────────── */
	:global(h1, h2) {
		text-shadow: 0 0 20px rgba(0, 255, 136, 0.25);
	}

	/* ── Typography globals ───────────────────────────── */
	:global(h1, h2, h3, h4, h5, h6) {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--text);
		line-height: 1.15;
	}

	:global(a) { color: inherit; }
	:global(img) { display: block; max-width: 100%; }

	/* ── Progress bar ─────────────────────────────────── */
	.progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 2px;
		background: var(--accent);
		z-index: 10000;
		transition: width 0.1s linear;
		pointer-events: none;
	}

	/* ── Main ─────────────────────────────────────────── */
	main {
		background: var(--bg);
	}

	/* ── Section base ─────────────────────────────────── */
	:global(section) {
		padding: 6rem 2rem;
	}

	:global(.section-inner) {
		max-width: var(--max-w);
		margin: 0 auto;
	}

	:global(.section-label) {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 2rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.section-label::before) {
		content: '$';
		color: var(--accent);
	}

	:global(.section-title) {
		font-family: var(--font-display);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		color: var(--text);
		line-height: 1.15;
		margin-bottom: 1.25rem;
	}

	:global(.section-body) {
		font-family: var(--font-ui);
		font-size: 0.9rem;
		line-height: 1.8;
		color: var(--text-muted);
		max-width: 48rem;
	}

	/* ── Photo strip ──────────────────────────────────── */
	:global(.photo-strip) {
		width: 100%;
		height: 35vh;
		min-height: 220px;
		overflow: hidden;
		position: relative;
	}

	:global(.photo-strip img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 40%;
		filter: grayscale(20%);
		transition: filter 0.6s ease;
	}

	:global(.photo-strip:hover img) { filter: grayscale(0%); }

	:global(.photo-strip::after) {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			var(--bg) 0%,
			transparent 18%,
			transparent 82%,
			var(--bg) 100%
		);
		pointer-events: none;
	}

	/* ── Read-more link ───────────────────────────────── */
	:global(.read-more) {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 3rem;
		font-family: var(--font-ui);
		font-size: 0.75rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
		transition: gap 0.2s ease;
	}

	:global(.read-more:hover) { gap: 0.9rem; }

	:global(.read-more .arrow) {
		display: inline-block;
		transition: transform 0.2s ease;
	}

	:global(.read-more:hover .arrow) { transform: translateX(3px); }

	/* ── Entrance animation ───────────────────────────── */
	:global(.fade-up) {
		opacity: 0;
		transform: translateY(16px);
		animation: fadeUp 0.6s ease-out forwards;
	}

	@keyframes fadeUp {
		to { opacity: 1; transform: translateY(0); }
	}
</style>
