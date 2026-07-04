<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import BlogPost from '../components/blog-post.svelte';
	import type { PageData } from './$types';
	export let data: PageData;

	type Photo = { filename: string; caption: string };
	let selectedPhoto: Photo | null = null;
	let topPhoto: number | null = null;
	let origin = { x: '50%', y: '50%' };

	function zoomFromPhoto(node: Element, { duration = 320 }: { duration?: number } = {}) {
		const ox = origin.x, oy = origin.y;
		return {
			duration,
			easing: cubicOut,
			css: (t: number) => `transform: scale(${t}); transform-origin: ${ox} ${oy}; opacity: ${t};`
		};
	}

	function openPhoto(e: MouseEvent, photo: Photo) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		origin = {
			x: `${rect.left + rect.width / 2}px`,
			y: `${rect.top + rect.height / 2}px`,
		};
		selectedPhoto = photo;
	}

	function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') selectedPhoto = null; }

	type Entry = { cmd: string; output: string };
	let history: Entry[] = [];
	let input = '';
	let inputEl: HTMLInputElement;
	let terminalBody: HTMLElement;

	const COMMANDS: Record<string, () => string> = {
		hi:      () => 'hey there',
		hello:   () => 'hey there',
		help:    () => [
			'available commands:',
			'  hi / hello    say hello',
			'  whoami        who is this person',
			'  about         short intro',
			'  ls            list things',
			'  date          current date',
			'  blog          go to writing',
			'  contact       ways to reach me',
			'  clear         clear the terminal',
		].join('\n'),
		whoami:  () => 'Sahu',
		about:   () => 'software engineer · photographer · biker\nbuilding things at the intersection of code and craft.',
		ls:      () => 'about.txt  roles.txt  writing/  photos/  contact.md',
		date:    () => new Date().toString(),
		blog:    () => 'head to /blog/1 — or scroll up ↑',
		contact: () => 'linkedin · github · instagram · email\nscroll to the bottom for links',
	};

	let composing = false;

	function run(e: KeyboardEvent) {
		if (composing) return;
		if (e.key !== 'Enter') return;
		e.preventDefault();
		const cmd = input.trim();
		input = '';
		if (!cmd) return;

		if (cmd.toLowerCase() === 'clear') { history = []; return; }

		if (cmd.toLowerCase().startsWith('sudo')) {
			history = [...history, { cmd, output: 'Permission denied.' }];
		} else {
			const handler = COMMANDS[cmd.toLowerCase()];
			const output = handler ? handler() : `command not found: ${cmd}. try 'help'.`;
			history = [...history, { cmd, output }];
		}

		setTimeout(() => terminalBody?.scrollTo({ top: terminalBody.scrollHeight, behavior: 'smooth' }), 10);
	}
</script>

<svelte:window on:keydown={onKeydown} />

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
				<span class="terminal-title">zsh</span>
			</div>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<div class="terminal-body" bind:this={terminalBody} on:click={() => inputEl?.focus()}>
				<p class="terminal-line"><span class="prompt">$</span> whoami</p>
				<h1 class="terminal-output name fade-up">Sahu</h1>
				<p class="terminal-line"><span class="prompt">$</span> cat roles.txt</p>
				<p class="terminal-output roles fade-up">
					software engineer by profession,<br />
					photographer &amp; explorer,<br />
					biker at heart.
				</p>

				{#each history as entry}
					<p class="terminal-line"><span class="prompt">$</span> {entry.cmd}</p>
					<pre class="terminal-output history-output">{entry.output}</pre>
				{/each}

				<div class="terminal-line cursor-line">
					<span class="prompt">$</span>
					<span class="terminal-display">{input}<span class="cursor">▋</span></span>
					<input
						bind:this={inputEl}
						bind:value={input}
						on:keydown={run}
						on:compositionstart={() => composing = true}
						on:compositionend={() => composing = false}
						class="terminal-input-hidden"
						type="text"
						autocomplete="off"
						autocorrect="off"
						autocapitalize="none"
						spellcheck="false"
						inputmode="text"
						enterkeyhint="send"
					/>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── Writing / Recents ──────────────────────────────────── -->
<section class="writing" id="writing">
	<div class="section-inner">
		<p class="section-label">cat writing.md</p>
		<h2 class="section-title">things I've been<br />thinking about.</h2>
		<p class="section-body">
			A decade of shipping software, riding roads, and making photographs. These are the notes from
			the journey — mostly technical, always honest.
		</p>

		<div class="blog-grid">
			{#each (data.blogs ?? []).slice(0, 3) as blog (blog.id)}
				<BlogPost {blog} fallbackSrc={null} showCover={false} />
			{:else}
				<p class="no-posts"><span class="prompt">!</span> blogs API offline. run docker-compose up to load posts.</p>
			{/each}
		</div>

		<a class="read-more" href="/blog/1"><span class="prompt">$</span> ls -la posts/ <span class="arrow">→</span></a>
	</div>
</section>

<!-- ── Divider strip 2 ────────────────────────────────────── -->
<div class="photo-strip">
	<img src="/photos/20260428_190024.jpg" alt="" aria-hidden="true" />
</div>

<!-- ── Beyond Code ────────────────────────────────────────── -->
<section class="beyond" id="beyond">
	<div class="section-inner">
		<p class="section-label">cat beyond-code.json</p>
		<h2 class="section-title">the rest of the picture.</h2>

		<div class="beyond-topics">
			<div class="beyond-block">
				<p class="beyond-block-label"><span class="brace">{"{"}</span> "topic": "photography" <span class="brace">{"}"}</span></p>
				<p class="beyond-block-body">
					I shoot with available light and bad timing. The interesting frames are always the ones
					you nearly missed.
				</p>
			</div>
			<div class="beyond-block">
				<p class="beyond-block-label"><span class="brace">{"{"}</span> "topic": "creating" <span class="brace">{"}"}</span></p>
				<p class="beyond-block-body">
					Notebooks, tools, side projects — I make things because I can't help it. Half of them
					ship. The other half teach me more.
				</p>
			</div>
			<div class="beyond-block">
				<p class="beyond-block-label"><span class="brace">{"{"}</span> "topic": "biking" <span class="brace">{"}"}</span></p>
				<p class="beyond-block-body">
					Long roads clear the mind. There's something about committing to a direction and just
					riding that solves problems code can't.
				</p>
			</div>
		</div>

		<div class="photo-dump">
			{#each (data.photos ?? []) as photo, i}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<button class="dump-item" class:on-top={topPhoto === i} style="--rot: {(Math.random() * 8 - 4).toFixed(2)}" on:mouseenter={() => topPhoto = i} on:click={(e) => openPhoto(e, photo)}>
					<div class="inner">
						<div class="tile-frame">
							<img src="/photos/{photo.filename}" alt={photo.caption} />
						</div>
						<span class="tile-label">{photo.caption}</span>
					</div>
				</button>
			{/each}
		</div>
	</div>
</section>

<!-- ── Photo modal ───────────────────────────────────────── -->
{#if selectedPhoto}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="modal-backdrop" transition:zoomFromPhoto={{ duration: 320 }} on:click={() => selectedPhoto = null}>
		<div class="modal-frame" on:click|stopPropagation>
			<img src="/photos/{selectedPhoto.filename}" alt={selectedPhoto.caption} class="modal-img" />
			{#if selectedPhoto.caption}
				<p class="modal-caption">{selectedPhoto.caption}</p>
			{/if}
		</div>
	</div>
{/if}

<!-- ── Contact ────────────────────────────────────────────── -->
<section class="contact" id="contact">
	<div class="section-inner">
		<p class="section-label">cat contact.md</p>
		<h2 class="contact-heading">let's connect.</h2>
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
	<p>Keep on coding — Sahu, S <span class="cursor-sm">▋</span></p>
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
	.terminal-body, .terminal-body * {
		font-family: var(--font-mono);
	}

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
		max-height: 55vh;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.terminal-body::-webkit-scrollbar { display: none; }

	.terminal-line {
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

	.terminal-input-hidden {
		position: fixed;
		top: -200px;
		left: 0;
		width: 100%;
		height: 48px;
		opacity: 0;
		font-size: 16px; /* prevents iOS auto-zoom on focus */
		border: none;
		outline: none;
		background: transparent;
		color: transparent;
		caret-color: transparent;
		pointer-events: none;
	}

	.terminal-display {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.cursor {
		color: var(--accent);
		animation: blink 1s step-end infinite;
	}

	.history-output {
		font-size: 0.8rem;
		color: var(--text-muted);
		white-space: pre-wrap;
		padding-left: 1.25rem;
		margin-bottom: 0.5rem;
		line-height: 1.7;
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

	.beyond-topics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 3rem;
		margin-top: 3rem;
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

	/* ── Photo dump ───────────────────────────────────── */
	.photo-dump {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 4rem;
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

	.dump-item:hover {
		transform: rotate(0deg) scale(1.12) !important;
		z-index: 20;
		transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s;
	}

	.dump-item.on-top {
		z-index: 10;
	}

	.dump-item .inner {
		background: #ede9e2;
		padding: 0.5rem 0.5rem 1.75rem;
		box-shadow: 3px 3px 10px rgba(0,0,0,0.5);
		transition: box-shadow 0.2s ease;
	}

	.dump-item:hover .inner {
		box-shadow: 8px 8px 24px rgba(0,0,0,0.7);
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
		opacity: 0.88;
		filter: sepia(12%);
		transition: opacity 0.3s ease, filter 0.3s ease;
	}

	.dump-item:hover .tile-frame img {
		opacity: 1;
		filter: sepia(0%);
	}

	.tile-label {
		display: block;
		text-align: center;
		margin-top: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.55rem;
		letter-spacing: 0.08em;
		color: #555;
	}

	/* ── Photo modal ──────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.88);
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		cursor: zoom-out;
	}

	.modal-frame {
		background: #ede9e2;
		padding: 0.75rem 0.75rem 2.5rem;
		box-shadow: 0 20px 60px rgba(0,0,0,0.8);
		max-width: min(90vw, 800px);
		width: 100%;
		cursor: default;
	}

	.modal-img {
		display: block;
		width: 100%;
		height: auto;
		max-height: 70vh;
		object-fit: contain;
	}

	.modal-caption {
		text-align: center;
		margin-top: 0.75rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		color: #555;
	}

	/* ── Contact ──────────────────────────────────────── */
	.contact {
		background: var(--surface);
	}

	.contact-heading {
		font-family: var(--font-mono);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		color: var(--text);
		margin-bottom: 1rem;
		text-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
	}

	.contact-links {
		display: flex;
		justify-content: flex-start;
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
		.hero { padding: 0 1rem; align-items: center; }

		.blog-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.beyond-topics { grid-template-columns: 1fr; gap: 2rem; }

		.dump-item {
			width: calc(33.33% - 1rem);
			margin: 0.5rem;
			transform: rotate(calc(var(--rot) * 2deg));
		}

		footer { flex-direction: column; gap: 0.5rem; text-align: center; }
	}
</style>
