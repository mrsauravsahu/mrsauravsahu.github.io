<script lang="ts">
	import BlogPost from '../components/blog-post.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<svelte:head>
	<title>@mrsauravsahu</title>
</svelte:head>

<!-- ── Hero ──────────────────────────────────────────────── -->
<section class="hero">
	<img class="hero-bg" src="/photos/20260427_163003.jpg" alt="" aria-hidden="true" />
	<img class="hero-silhouette" src="/img/mrss-silhouette.svg" alt="" aria-hidden="true" />
	<div class="hero-content">
		<h1 class="hero-name fade-up">Saurav<br />Sahu.</h1>
		<p class="hero-roles fade-up">
			software engineer by profession,<br />
			<span>photographer</span> explorer<br />
			and <span>biker</span> at heart.
		</p>
	</div>
</section>

<!-- ── Divider strip ──────────────────────────────────────── -->
<div class="photo-strip">
	<img src="/photos/20260423_211201.jpg" alt="" aria-hidden="true" class="rotated-strip" />
</div>

<!-- ── Writing / Recents ──────────────────────────────────── -->
<section class="writing" id="writing">
	<div class="section-inner">
		<p class="section-label">writing</p>
		<h2 class="section-title">Things I've been<br />thinking about.</h2>
		<p class="section-body">
			A decade of shipping software, riding roads, and making photographs. These are the notes from
			the journey — mostly technical, always honest.
		</p>

		<div class="blog-grid">
			{#each (data.blogs ?? []).slice(0, 3) as blog (blog.id)}
				<BlogPost {blog} />
			{:else}
				<p class="no-posts">Start the blogs API to load posts.</p>
			{/each}
		</div>

		<a class="read-more" href="/blog/1">all posts <span class="arrow">→</span></a>
	</div>
</section>

<!-- ── Divider strip 2 ────────────────────────────────────── -->
<div class="photo-strip">
	<img src="/photos/20260428_190024.jpg" alt="" aria-hidden="true" />
</div>

<!-- ── Beyond Code ────────────────────────────────────────── -->
<section class="beyond" id="beyond">
	<div class="section-inner">
		<p class="section-label">beyond code</p>
		<h2 class="section-title">The rest of the picture.</h2>

		<div class="beyond-grid">
			<div class="beyond-text">
				<div class="beyond-block">
					<p class="beyond-block-label">photographer</p>
					<p class="beyond-block-body">
						I shoot with available light and bad timing. The interesting frames are always the ones
						you nearly missed.
					</p>
				</div>
				<div class="beyond-block">
					<p class="beyond-block-label">creator</p>
					<p class="beyond-block-body">
						Notebooks, tools, side projects — I make things because I can't help it. Half of them
						ship. The other half teach me more.
					</p>
				</div>
				<div class="beyond-block">
					<p class="beyond-block-label">biker</p>
					<p class="beyond-block-body">
						Long roads clear the mind. There's something about committing to a direction and just
						riding that solves problems code can't.
					</p>
				</div>
			</div>

			<div class="mosaic">
				<div class="mosaic-item wide">
					<img src="/photos/20260425_124242.jpg" alt="Photography" class="rotated" />
					<span class="mosaic-caption">through the lens</span>
				</div>
				<div class="mosaic-item">
					<img src="/photos/20260421_200511.jpg" alt="On the road" class="rotated" />
					<span class="mosaic-caption">on the road</span>
				</div>
				<div class="mosaic-item">
					<img src="/photos/20260430_183200.jpg" alt="Making things" />
					<span class="mosaic-caption">making things</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── Contact ────────────────────────────────────────────── -->
<section class="contact" id="contact">
	<div class="section-inner">
		<h2 class="contact-heading">Let's connect.</h2>
		<div class="contact-links">
			<a href="https://www.linkedin.com/in/mrsauravsahu" target="_blank" rel="noopener">linkedin</a>
			<a href="https://github.com/mrsauravsahu" target="_blank" rel="noopener">github</a>
			<a href="https://instagram.com/explorewithsahu" target="_blank" rel="noopener">instagram</a>
			<a href="mailto:mrsauravsahu@outlook.com">email</a>
			<a href="https://unsplash.com/@mrsauravsahu" target="_blank" rel="noopener">unsplash</a>
			<a href="https://mrsauravsahu.medium.com" target="_blank" rel="noopener">medium</a>
			<a href="https://dev.to/mrsauravsahu" target="_blank" rel="noopener">dev.to</a>
		</div>
	</div>
</section>

<!-- ── Footer ─────────────────────────────────────────────── -->
<footer>
	<p>SvelteKit · .NET · Node.js</p>
	<p>Made with care — Sahu</p>
</footer>

<style>
	/* ── Hero ─────────────────────────────────────────── */
	.hero {
		position: relative;
		height: 100vh;
		min-height: 640px;
		display: flex;
		align-items: flex-end;
		padding: 0 3rem 5rem;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		opacity: 0.18;
		filter: grayscale(60%);
		pointer-events: none;
		transform: rotate(90deg) scale(1.8);
	}

	.hero-silhouette {
		position: absolute;
		left: 40%;
		bottom: 0;
		height: 92%;
		width: auto;
		opacity: 0.15;
		pointer-events: none;
		filter: invert(1);
		mask-image: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 88%);
		-webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 88%);
	}

	.hero-content {
		position: relative;
		z-index: 2;
		max-width: var(--max-w);
		width: 100%;
		margin: 0 auto;
	}

	.hero-name {
		font-family: var(--font-display);
		font-size: clamp(3rem, 7vw, 5.5rem);
		font-weight: 700;
		line-height: 1.05;
		color: var(--text);
		margin-bottom: 1rem;
		animation-delay: 0.1s;
	}

	.hero-roles {
		font-family: var(--font-display);
		font-size: clamp(1.1rem, 2.5vw, 1.5rem);
		font-weight: 400;
		font-style: italic;
		color: var(--text-muted);
		line-height: 1.9;
		animation-delay: 0.25s;
	}

	.hero-roles :global(span) {
		color: var(--accent);
		font-style: normal;
	}

	/* ── Photo strips ─────────────────────────────────── */
	.photo-strip {
		width: 100%;
		height: 28vh;
		min-height: 160px;
		position: relative;
		overflow: hidden;
	}

	.photo-strip img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		opacity: 0.55;
		filter: grayscale(40%);
		transition: opacity 0.6s ease, filter 0.6s ease;
	}

	.photo-strip:hover img {
		opacity: 0.75;
		filter: grayscale(0%);
	}

	.photo-strip img.rotated-strip {
		width: 100%;
		height: 400%;
		margin-top: -150%;
		transform: rotate(90deg);
		transform-origin: center center;
		object-fit: cover;
	}

	.photo-strip::before,
	.photo-strip::after {
		content: '';
		position: absolute;
		left: 0; right: 0;
		height: 40%;
		pointer-events: none;
		z-index: 1;
	}

	.photo-strip::before {
		top: 0;
		background: linear-gradient(to bottom, var(--bg), transparent);
	}

	.photo-strip::after {
		bottom: 0;
		background: linear-gradient(to top, var(--bg), transparent);
	}

	/* ── Writing ──────────────────────────────────────── */
	.no-posts {
		font-family: var(--font-ui);
		font-size: 0.8rem;
		color: var(--text-muted);
		grid-column: 1 / -1;
	}

	.writing {
		background: var(--surface);
	}

	.blog-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		margin-top: 3rem;
	}

	/* ── Beyond ───────────────────────────────────────── */
	.beyond {
		background: var(--bg);
	}

	.beyond-grid {
		display: grid;
		grid-template-columns: 2fr 3fr;
		gap: 5rem;
		align-items: center;
		margin-top: 3rem;
	}

	.beyond-text {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.beyond-block-label {
		font-family: var(--font-ui);
		font-size: 0.6rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.4rem;
	}

	.beyond-block-body {
		font-family: var(--font-display);
		font-size: 1rem;
		font-style: italic;
		color: var(--text-muted);
		line-height: 1.7;
	}

	/* ── Mosaic ───────────────────────────────────────── */
	.mosaic {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.mosaic-item {
		position: relative;
		overflow: hidden;
		background: var(--surface-alt);
		border: 1px solid var(--border);
	}

	.mosaic-item.wide {
		grid-column: 1 / -1;
		aspect-ratio: 16 / 7;
	}

	.mosaic-item:not(.wide) { aspect-ratio: 4 / 3; }

	.mosaic-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		opacity: 0.7;
		filter: grayscale(60%);
		transition: opacity 0.4s ease, filter 0.4s ease, transform 0.4s ease;
	}

	.mosaic-item img.rotated {
		/* source is portrait shot rotated 90° — expand and re-center */
		width: 200%;
		height: 200%;
		margin: -50%;
		transform: rotate(90deg);
		transform-origin: center center;
	}

	.mosaic-item:hover img {
		opacity: 1;
		filter: grayscale(0%);
		transform: scale(1.03);
	}

	.mosaic-item:hover img.rotated {
		transform: rotate(90deg) scale(1.03);
	}

	.mosaic-caption {
		position: absolute;
		bottom: 0; left: 0; right: 0;
		padding: 0.75rem 1rem;
		background: linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 100%);
		font-family: var(--font-ui);
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		opacity: 0;
		transform: translateY(4px);
		transition: opacity 0.3s ease, transform 0.3s ease;
	}

	.mosaic-item:hover .mosaic-caption {
		opacity: 1;
		transform: translateY(0);
	}

	/* ── Contact ──────────────────────────────────────── */
	.contact {
		background: var(--surface);
		text-align: center;
	}

	.contact-heading {
		font-family: var(--font-display);
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 700;
		color: var(--text);
		margin-bottom: 2.5rem;
	}

	.contact-links {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0;
	}

	.contact-links a {
		font-family: var(--font-ui);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-muted);
		text-decoration: none;
		padding: 0.25rem 1.5rem;
		position: relative;
		transition: color 0.2s ease;
	}

	.contact-links a::before {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 50%; right: 50%;
		height: 1px;
		background: var(--accent);
		transition: left 0.25s ease, right 0.25s ease;
	}

	.contact-links a:not(:last-child)::after {
		content: '·';
		position: absolute;
		right: -0.1rem;
		color: var(--border);
	}

	.contact-links a:hover { color: var(--accent); }
	.contact-links a:hover::before { left: 1.5rem; right: 1.5rem; }

	/* ── Footer ───────────────────────────────────────── */
	footer {
		border-top: 1px solid var(--border);
		padding: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: var(--font-ui);
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		color: var(--text-muted);
	}

	/* ── Responsive ───────────────────────────────────── */
	@media (max-width: 768px) {
		.hero { padding: 0 1.5rem 4rem; }

		.blog-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.beyond-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.mosaic {
			grid-template-columns: 1fr;
		}

		.mosaic-item.wide {
			grid-column: 1;
			aspect-ratio: 16 / 9;
		}

		footer { flex-direction: column; gap: 0.5rem; text-align: center; }
	}
</style>
