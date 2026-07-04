<script>
	import { onMount } from 'svelte';

	let scrolled = false;
	let menuOpen = false;

	onMount(() => {
		const onScroll = () => { scrolled = window.scrollY > 60; };
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<nav class:scrolled>
	<a href="/" class="logo">SS</a>

	<button class="hamburger" aria-label="Menu" on:click={() => (menuOpen = !menuOpen)}>
		<span></span><span></span>
	</button>

	<ul class="links" class:open={menuOpen}>
		<li><a href="/#writing" on:click={() => (menuOpen = false)}>writing</a></li>
		<li><a href="/#beyond" on:click={() => (menuOpen = false)}>beyond</a></li>
		<li><a href="/blog/1" on:click={() => (menuOpen = false)}>all posts</a></li>
		<li><a href="/#contact" on:click={() => (menuOpen = false)}>contact</a></li>
	</ul>
</nav>

<style>
	nav {
		position: fixed;
		top: 0; left: 0; right: 0;
		height: 3.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 2rem;
		z-index: 100;
		transition: background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease;
		border-bottom: 1px solid transparent;
	}

	nav.scrolled {
		background: rgba(13, 13, 13, 0.88);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-color: var(--border);
	}

	.logo {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 1rem;
		letter-spacing: 0.05em;
		color: var(--accent);
		text-decoration: none;
		line-height: 1;
		text-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
	}

	ul.links {
		display: flex;
		gap: 2.5rem;
		list-style: none;
	}

	ul.links a {
		font-family: var(--font-ui);
		font-size: 0.7rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--text-muted);
		text-decoration: none;
		position: relative;
		transition: color 0.2s ease;
	}

	ul.links a::after {
		content: '';
		position: absolute;
		bottom: -3px;
		left: 50%; right: 50%;
		height: 1px;
		background: var(--accent);
		transition: left 0.2s ease, right 0.2s ease;
	}

	ul.links a:hover { color: var(--text); }
	ul.links a:hover::after { left: 0; right: 0; }

	.hamburger {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
	}

	.hamburger span {
		display: block;
		width: 22px;
		height: 1px;
		background: var(--text-muted);
		transition: background 0.2s;
	}

	.hamburger:hover span { background: var(--accent); }

	@media (max-width: 600px) {
		.hamburger { display: flex; }

		ul.links {
			display: none;
			position: absolute;
			top: 3.5rem; left: 0; right: 0;
			flex-direction: column;
			gap: 0;
			background: rgba(13, 13, 13, 0.97);
			backdrop-filter: blur(12px);
			border-bottom: 1px solid var(--border);
			padding: 1rem 0 2rem;
		}

		ul.links.open { display: flex; }

		ul.links a {
			display: block;
			padding: 1rem 2rem;
			font-size: 0.8rem;
		}

		ul.links a::after { display: none; }
	}
</style>
