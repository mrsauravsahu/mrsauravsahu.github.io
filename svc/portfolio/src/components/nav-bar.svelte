<script>
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';

	let isNavOpen = false;
</script>

<nav class:nav__open={isNavOpen}>
	<div class="navmain">
		<a href="/#home" class="brand" on:click={() => isNavOpen=false}>
			<img src="/img/brand.svg" alt="brand" />
		</a>
		<button
			on:click={() => {
				isNavOpen = !isNavOpen;
			}}
		>
			<Icon data={faEllipsisV} scale={1} style="color: white" />
		</button>
	</div>
	<ul class="navlinks" class:navlinks__closed={!isNavOpen}>
		<li class="navlink"><a  on:click={() => isNavOpen=false} href="/#blog">recent blogs</a></li>
		<li class="navlink"><a  on:click={() => isNavOpen=false} href="/#contact">contact</a></li>
		<li class="navlink"><a  on:click={() => isNavOpen=false} href="/#about">about</a></li>
		<li class="navlink"><a  on:click={() => isNavOpen=false} href="https://poly.mrsauravsahu.tech">polywork</a></li>
	</ul>
</nav>

<style>
	nav {
		position: fixed;
		width: calc(100% - 1rem);
		display: flex;
		align-items: center;
		background-color: var(--accent);
		padding: 0;
		margin: 0.5rem;
		border-radius: 1rem;
		height: 4rem;
		transition: 0.2s ease-in-out height;
		z-index: 100;
	}

	.brand {
		padding: 0 1rem;
	}

	button {
		display: none;
		border: none;
		background: none;
		padding: 0 2rem;
	}

	.navlinks {
		list-style-type: none;
		display: flex;
		height: 100%;
		margin: 0;
	}

	.navlink {
		display: flex;
		align-items: center;
	}

	a,
	a:visited {
		color: var(--bg);
		text-decoration: none;
		padding: 0 2rem;
		cursor: pointer;
		transform: translateY(0);
		transition: transform 0.3s ease-in-out;
	}

	a:hover {
		transform: translateY(-0.15rem);
	}

	@media (max-width: 40rem) {
		nav {
			flex-direction: column;
			width: calc(100% - 1rem);
		}
		/* show the ellipsis button */
		button {
			display: initial;
		}

		.navlinks {
			flex-direction: column;
		}

		.navmain {
			align-self: stretch;
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 4rem;
		}

		.navlinks__closed {
			display: none;
		}

		ul {
			padding: 0;
			align-items: center;
			justify-content: center;
		}

		li {
			padding: 2rem;
			text-transform: uppercase;
		}

		.nav__open {
			height: calc(100% - 1rem);
		}
	}
</style>
