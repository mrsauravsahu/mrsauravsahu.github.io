<script lang="ts">
	import { onMount } from 'svelte';
	import { GalleryEngine } from './engine';
	import type { Photo, Project } from '$lib/server/photos';

	export let projects: Project[] = [];

	let canvas: HTMLCanvasElement;
	let engine: GalleryEngine | null = null;
	let hovered: Photo | null = null;
	let selected: Photo | null = null;
	let roomIndex = 0;

	function goRoom(i: number) {
		engine?.goToRoom(i);
	}

	function openPhoto(photo: Photo) {
		selected = photo;
	}

	function closePhoto() {
		selected = null;
	}

	onMount(() => {
		engine = new GalleryEngine(
			canvas,
			(p) => (hovered = p),
			(p) => openPhoto(p),
			(i) => (roomIndex = i)
		);
		engine.setProjects(projects);
		return () => {
			engine?.dispose();
			engine = null;
		};
	});
</script>

<div class="gallery">
	<canvas bind:this={canvas} class="view"></canvas>

	{#if hovered}
		<div class="hover-label">{hovered.caption}</div>
	{/if}

	{#if projects.length > 1}
		<div class="rooms">
			{#each projects as project, i}
				<button
					class="room"
					class:active={i === roomIndex}
					on:click={() => goRoom(i)}
					aria-label={project.title}
				>
					<span class="room-dot"></span>
					<span class="room-title">{project.title}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if selected}
		<button class="lightbox" on:click={closePhoto} aria-label="Close photograph">
			<img src={selected.full} alt={selected.caption} />
			<span class="lightbox-caption">{selected.caption}</span>
		</button>
	{/if}
</div>

<style>
	.gallery {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 100vh;
		background: var(--bg);
		overflow: hidden;
	}

	.view {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		outline: none;
	}

	.hover-label {
		position: absolute;
		left: 50%;
		bottom: 5.5rem;
		transform: translateX(-50%);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		background: rgba(10, 10, 10, 0.78);
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--border);
		pointer-events: none;
		white-space: nowrap;
		transition: opacity 0.2s ease;
	}

	.rooms {
		position: absolute;
		left: 1.5rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.room {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding: 0.25rem 0;
		transition: color 0.2s ease;
	}

	.room:hover { color: var(--text); }

	.room-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent-dim);
		transition: background 0.2s ease, transform 0.2s ease;
	}

	.room-title {
		text-align: left;
		line-height: 1.4;
	}

	@media (max-width: 600px) {
		.rooms {
			left: 0.75rem;
			gap: 1rem;
		}

		.room-title { display: none; }
	}

	.room.active { color: var(--accent); }
	.room.active .room-dot {
		background: var(--accent);
		transform: scale(1.4);
	}

	.lightbox {
		position: absolute;
		inset: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.9);
		border: none;
		cursor: zoom-out;
		padding: 3rem;
	}

	.lightbox img {
		max-width: 92%;
		max-height: 86%;
		object-fit: contain;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);
		background: var(--mat);
		padding: 0.5rem 0.5rem 2.8rem;
	}

	.lightbox-caption {
		position: absolute;
		bottom: 1.75rem;
		left: 50%;
		transform: translateX(-50%);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}
</style>
