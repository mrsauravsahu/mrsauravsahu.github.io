<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	// The terminal is the site's easter egg. It keeps the original green-phosphor
	// palette *locally* (see the scoped `.terminal-egg` tokens below) so it breaks
	// the warm gallery palette on purpose — that contrast is the joke.
	export let open = false;

	const dispatch = createEventDispatcher();

	type Entry = { cmd: string; output: string };
	let history: Entry[] = [];
	let input = '';
	let inputEl: HTMLInputElement;
	let terminalBody: HTMLElement;
	let composing = false;

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
		about:   () => 'photographer · software engineer · biker\nbuilding things at the intersection of code and craft.',
		ls:      () => 'about.txt  roles.txt  writing/  photos/  contact.md',
		date:    () => new Date().toString(),
		blog:    () => 'head to /blog/1',
		contact: () => 'linkedin · github · instagram · email\nscroll to the bottom for links',
	};

	function close() {
		open = false;
		dispatch('close');
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) close();
	}

	async function focusInput() {
		await tick();
		inputEl?.focus();
	}

	$: if (open) focusInput();

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') { close(); return; }
	}

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

{#if open}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="egg-backdrop" transition:fade={{ duration: 200 }} on:click={onBackdropClick}>
		<div
			class="terminal-egg"
			transition:scale={{ duration: 240, start: 0.94 }}
			role="dialog"
			aria-label="Terminal"
		>
			<div class="terminal-window">
				<div class="terminal-bar">
					<span class="dot red"></span>
					<span class="dot yellow"></span>
					<span class="dot green"></span>
					<span class="terminal-title">zsh</span>
					<button class="egg-close" aria-label="Close terminal" on:click={close}>×</button>
				</div>
				<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
				<div class="terminal-body" bind:this={terminalBody} on:click={() => inputEl?.focus()}>
					<p class="terminal-line"><span class="prompt">$</span> whoami</p>
					<h2 class="terminal-output name">Sahu</h2>
					<p class="terminal-line"><span class="prompt">$</span> cat roles.txt</p>
					<p class="terminal-output roles">
						the engineer behind the camera.<br />
						type <span class="hint">help</span> to look around.
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
	</div>
{/if}

<style>
	/* Local green-phosphor palette — intentionally NOT the gallery palette. */
	.terminal-egg {
		--t-bg:     #050505;
		--t-text:   #b8ffb8;
		--t-muted:  #3d7a3d;
		--t-accent: #00ff88;
		--t-dim:    #006633;
		--t-border: #1a2a1a;
		width: 100%;
		max-width: 640px;
	}

	.egg-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.82);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 400;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.terminal-window {
		border: 1px solid var(--t-dim);
		background: rgba(0, 0, 0, 0.92);
		box-shadow: 0 0 40px rgba(0, 255, 136, 0.12), inset 0 0 60px rgba(0, 0, 0, 0.5);
	}

	.terminal-bar {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--t-border);
		background: #0d0d0d;
	}

	.dot { width: 10px; height: 10px; border-radius: 50%; }
	.dot.red    { background: #ff5f57; }
	.dot.yellow { background: #febc2e; }
	.dot.green  { background: #28c840; }

	.terminal-title {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--t-muted);
		letter-spacing: 0.05em;
	}

	.egg-close {
		margin-left: 0.75rem;
		background: none;
		border: none;
		color: var(--t-muted);
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		padding: 0 0.25rem;
		transition: color 0.2s ease;
	}
	.egg-close:hover { color: var(--t-accent); }

	.terminal-body, .terminal-body * { font-family: var(--font-mono); }

	.terminal-body {
		padding: 1.5rem 1.75rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 55vh;
		overflow-y: auto;
		scrollbar-width: none;
		color: var(--t-text);
	}
	.terminal-body::-webkit-scrollbar { display: none; }

	.terminal-line {
		font-size: 0.85rem;
		color: var(--t-muted);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.prompt { color: var(--t-accent); font-weight: 600; }
	.hint { color: var(--t-accent); }

	.terminal-output {
		padding-left: 1.25rem;
		margin-bottom: 0.75rem;
	}

	.terminal-output.name {
		font-family: var(--font-mono);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		color: var(--t-text);
		line-height: 1.1;
		text-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
	}

	.terminal-output.roles {
		font-size: 0.9rem;
		color: var(--t-muted);
		line-height: 1.9;
	}

	.cursor-line { margin-top: 0.25rem; }

	.terminal-input-hidden {
		position: fixed;
		top: -200px;
		left: 0;
		width: 100%;
		height: 48px;
		opacity: 0;
		font-size: 16px;
		border: none;
		outline: none;
		background: transparent;
		color: transparent;
		caret-color: transparent;
		pointer-events: none;
	}

	.terminal-display {
		font-size: 0.85rem;
		color: var(--t-muted);
	}

	.cursor {
		color: var(--t-accent);
		animation: blink 1s step-end infinite;
		display: inline-block;
		transform: scaleX(2);
		transform-origin: left;
	}

	.history-output {
		font-size: 0.8rem;
		color: var(--t-muted);
		white-space: pre-wrap;
		padding-left: 1.25rem;
		margin-bottom: 0.5rem;
		line-height: 1.7;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0; }
	}

	@media (max-width: 600px) {
		.egg-backdrop { padding: 1rem; }
	}
</style>
