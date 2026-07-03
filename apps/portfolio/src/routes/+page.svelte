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
	<div class="hero-content">
		<div class="terminal-window">
			<div class="terminal-bar">
				<span class="dot red"></span>
				<span class="dot yellow"></span>
				<span class="dot green"></span>
				<span class="terminal-title">mrsauravsahu — bash</span>
			</div>
			<div class="terminal-body">
				<p class="terminal-line"><span class="prompt">~</span> whoami</p>
				<h1 class="terminal-output name fade-up">Saurav Sahu</h1>
				<p class="terminal-line"><span class="prompt">~</span> cat roles.txt</p>
				<p class="terminal-output roles fade-up">
					software engineer by profession,<br />
					photographer &amp; explorer,<br />
					biker at heart.
				</p>
				<p class="terminal-line cursor-line"><span class="prompt">~</span> <span class="cursor">▋</span></p>
			</div>
		</div>
	</div>
</section>

<!-- ── Divider strip ──────────────────────────────────────── -->
<div class="photo-strip">
	<img src="/photos/20260423_211201.jpg" alt="" aria-hidden="true" class="rotated-strip" />
	<div class="strip-overlay">
		<span class="strip-tag">// EOF hero section</span>
	</div>
</div>

<!-- ── Writing / Recents ──────────────────────────────────── -->
<section class="writing" id="writing">
	<div class="section-inner">
		<p class="section-label">cat writing.md</p>
		<h2 class="section-title">// things I've been<br />thinking about.</h2>
		<p class="section-body">
			A decade of shipping software, riding roads, and making photographs. These are the notes from
			the journey — mostly technical, always honest.
		</p>

		<div class="blog-grid">
			{#each (data.blogs ?? []).slice(0, 3) as blog (blog.id)}
				<BlogPost {blog} />
			{:else}
				<p class="no-posts"><span class="prompt">!</span> blogs API offline. run docker-compose up to load posts.</p>
			{/each}
		</div>

		<a class="read-more" href="/blog/1">ls -la posts/ <span class="arrow">→</span></a>
	</div>
</section>

<!-- ── Divider strip 2 ────────────────────────────────────── -->
<div class="photo-strip">
	<img src="/photos/20260428_190024.jpg" alt="" aria-hidden="true" />
	<div class="strip-overlay">
		<span class="strip-tag">// EOF writing section</span>
	</div>
</div>

<!-- ── Beyond Code ────────────────────────────────────────── -->
<section class="beyond" id="beyond">
	<div class="section-inner">
		<p class="section-label">cat beyond-code.json</p>
		<h2 class="section-title">// the rest of the picture.</h2>

		<div class="beyond-grid">
			<div class="beyond-text">
				<div class="beyond-block">
					<p class="beyond-block-label"><span class="brace">{"{"}</span> "photographer" <span class="brace">{"}"}</span></p>
					<p class="beyond-block-body">
						I shoot with available light and bad timing. The interesting frames are always the ones
						you nearly missed.
					</p>
				</div>
				<div class="beyond-block">
					<p class="beyond-block-label"><span class="brace">{"{"}</span> "creator" <span class="brace">{"}"}</span></p>
					<p class="beyond-block-body">
						Notebooks, tools, side projects — I make things because I can't help it. Half of them
						ship. The other half teach me more.
					</p>
				</div>
				<div class="beyond-block">
					<p class="beyond-block-label"><span class="brace">{"{"}</span> "biker" <span class="brace">{"}"}</span></p>
					<p class="beyond-block-body">
						Long roads clear the mind. There's something about committing to a direction and just
						riding that solves problems code can't.
					</p>
				</div>
			</div>

			<div class="mosaic">
				<div class="mosaic-item wide">
					<img src="/photos/20260425_124242.jpg" alt="Photography" class="rotated" />
					<span class="mosaic-caption">// through the lens</span>
				</div>
				<div class="mosaic-item">
					<img src="/photos/20260421_200511.jpg" alt="On the road" class="rotated" />
					<span class="mosaic-caption">// on the road</span>
				</div>
				<div class="mosaic-item">
					<img src="/photos/20260430_183200.jpg" alt="Making things" />
					<span class="mosaic-caption">// making things</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── Contact ────────────────────────────────────────────── -->
<section class="contact" id="contact">
	<div class="section-inner">
		<h2 class="contact-heading">// let's connect.</h2>
		<p class="contact-prompt"><span class="prompt">~</span> open --channel</p>
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
	<p>// SvelteKit · .NET · Node.js</p>
	<p>Made with care — Sahu <span class="cursor-sm">▋</span></p>
</footer>

<style>
	/* ── Hero ─────────────────────────────────────────── */
	.hero {
		position: relative;
		height: 100vh;
		min-height: 640px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 2rem;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		opacity: 0.06;
		filter: grayscale(100%) sepia(20%);
		pointer-events: none;
		transform: rotate(90deg) scale(1.8);
	}

	.hero-content {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 640px;
	}

	/* ── Terminal window ──────────────────────────────── */
	.terminal-window {
		border: 1px solid var(--accent-dim);
		background: rgba(0, 0, 0, 0.85);
		box-shadow: 0 0 40px rgba(0, 255, 136, 0.08), inset 0 0 60px rgba(0, 0, 0, 0.5);
	}

	.terminal-bar {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--border);
		background: #0d0d0d;
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
		padding: 1.5rem 1.75rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.terminal-line {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.prompt {
		color: var(--accent);
		font-weight: 600;
	}

	.terminal-output {
		font-family: var(--font-mono);
		padding-left: 1.25rem;
		margin-bottom: 0.75rem;
	}

	.terminal-output.name {
		font-size: clamp(2rem, 5vw, 3.2rem);
		font-weight: 700;
		color: var(--text);
		line-height: 1.1;
		animation-delay: 0.1s;
		text-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
	}

	.terminal-output.roles {
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.9;
		animation-delay: 0.25s;
	}

	.cursor-line { margin-top: 0.25rem; }

	.cursor {
		color: var(--accent);
		animation: blink 1s step-end infinite;
		font-weight: 300;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0; }
	}

	/* ── Photo strips ─────────────────────────────────── */
	.photo-strip {
		width: 100%;
		height: 22vh;
		min-height: 120px;
		position: relative;
		overflow: hidden;
	}

	.photo-strip img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		opacity: 0.25;
		filter: grayscale(80%) sepia(20%);
		transition: opacity 0.6s ease, filter 0.6s ease;
	}

	.photo-strip:hover img {
		opacity: 0.4;
		filter: grayscale(60%) sepia(10%);
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

	.strip-overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		align-items: flex-end;
		padding: 0.75rem 1.5rem;
	}

	.strip-tag {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}

	/* ── Writing ──────────────────────────────────────── */
	.writing {
		background: var(--surface);
	}

	.section-title {
		font-family: var(--font-mono);
		font-size: clamp(1.5rem, 3.5vw, 2.4rem);
		font-weight: 600;
		color: var(--text);
		line-height: 1.2;
		margin-bottom: 1.25rem;
		letter-spacing: -0.02em;
	}

	.section-body {
		font-family: var(--font-ui);
		font-size: 0.85rem;
		line-height: 1.85;
		color: var(--text-muted);
		max-width: 48rem;
	}

	.no-posts {
		font-family: var(--font-ui);
		font-size: 0.8rem;
		color: var(--text-muted);
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--accent);
		margin-bottom: 0.5rem;
	}

	.brace {
		color: var(--text-muted);
	}

	.beyond-block-body {
		font-family: var(--font-ui);
		font-size: 0.85rem;
		color: var(--text-muted);
		line-height: 1.75;
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

	.mosaic-item::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 1px solid transparent;
		transition: border-color 0.3s ease;
		z-index: 2;
		pointer-events: none;
	}

	.mosaic-item:hover::before {
		border-color: var(--accent-dim);
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
		opacity: 0.5;
		filter: grayscale(80%) sepia(20%);
		transition: opacity 0.4s ease, filter 0.4s ease, transform 0.4s ease;
	}

	.mosaic-item img.rotated {
		width: 200%;
		height: 200%;
		margin: -50%;
		transform: rotate(90deg);
		transform-origin: center center;
	}

	.mosaic-item:hover img {
		opacity: 0.75;
		filter: grayscale(40%) sepia(10%);
		transform: scale(1.03);
	}

	.mosaic-item:hover img.rotated {
		transform: rotate(90deg) scale(1.03);
	}

	.mosaic-caption {
		position: absolute;
		bottom: 0; left: 0; right: 0;
		padding: 0.75rem 1rem;
		background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.05em;
		color: var(--accent);
		opacity: 0;
		transform: translateY(4px);
		transition: opacity 0.3s ease, transform 0.3s ease;
		z-index: 3;
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
		font-family: var(--font-mono);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		color: var(--text);
		margin-bottom: 1rem;
		text-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
	}

	.contact-prompt {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.contact-links {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0;
	}

	.contact-links a {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.1em;
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
		content: '|';
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
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.cursor-sm {
		color: var(--accent);
		animation: blink 1s step-end infinite;
	}

	/* ── Responsive ───────────────────────────────────── */
	@media (max-width: 768px) {
		.hero { padding: 0 1rem; align-items: flex-end; padding-bottom: 4rem; }

		.blog-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.beyond-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.mosaic { grid-template-columns: 1fr; }

		.mosaic-item.wide {
			grid-column: 1;
			aspect-ratio: 16 / 9;
		}

		footer { flex-direction: column; gap: 0.5rem; text-align: center; }
	}
</style>
