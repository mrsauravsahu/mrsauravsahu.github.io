<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { GalleryEngine } from './engine';
	import type { Project } from '$lib/server/photos';

	export let projects: Project[] = [];

	let canvas: HTMLCanvasElement;
	let minimap: HTMLCanvasElement;
	let engine: GalleryEngine | null = null;

	onMount(() => {
		engine = new GalleryEngine(
			canvas,
			() => {},
			() => {},
			() => {},
			() => goto('/'),
			(state) => drawMinimap(state)
		);
		engine.setProjects(projects);

		const onKeydown = (event: KeyboardEvent) => {
			if (event.code === 'Escape') goto('/');
		};
		window.addEventListener('keydown', onKeydown);

		return () => {
			window.removeEventListener('keydown', onKeydown);
			engine?.dispose();
			engine = null;
		};
	});

	function drawMinimap(state: {
		x: number;
		z: number;
		dirX: number;
		dirZ: number;
		totalDepth: number;
		wallOffset: number;
		roomDepth: number;
		rooms: number;
		doorHalfWidth: number;
		paintings: { x: number; z: number }[];
	}) {
		if (!minimap) return;
		const ctx = minimap.getContext('2d');
		if (!ctx) return;

		const w = minimap.clientWidth;
		const h = minimap.clientHeight;
		if (!w || !h) return;

		const dpr = window.devicePixelRatio || 1;
		if (minimap.width !== w * dpr || minimap.height !== h * dpr) {
			minimap.width = w * dpr;
			minimap.height = h * dpr;
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);

		const pad = 14;
		const depth = Math.max(state.totalDepth, 1);
		const roomW = state.wallOffset * 2;
		const usableW = w - pad * 2;
		const usableH = h - pad * 2;
		const sx = usableW / roomW;
		const sy = usableH / depth;
		const s = Math.min(sx, sy);
		const px = (x: number) => pad + (w - roomW * s) / 2 + (x + state.wallOffset) * s;
		const py = (z: number) => pad + (h - depth * s) / 2 + z * s;

		const wallColor = 'rgba(232, 223, 201, 0.6)';
		const lineW = 3;
		ctx.lineWidth = lineW;
		ctx.lineCap = 'round';
		ctx.strokeStyle = wallColor;

		// Outer walls. Draw two long side edges, and let the minimap border
		// (CSS) carry the far/near short edges so they read as bounds.
		const leftX = px(-state.wallOffset);
		const rightX = px(state.wallOffset);
		const topZ = py(0);
		const bottomZ = py(depth);
		ctx.beginPath();
		ctx.moveTo(leftX, topZ);
		ctx.lineTo(leftX, bottomZ);
		ctx.moveTo(rightX, topZ);
		ctx.lineTo(rightX, bottomZ);
		// Front and back walls.
		ctx.moveTo(leftX, topZ);
		ctx.lineTo(rightX, topZ);
		ctx.moveTo(leftX, bottomZ);
		ctx.lineTo(rightX, bottomZ);
		ctx.stroke();

		// Partition walls between rooms, with the central doorway gap.
		for (let i = 1; i < state.rooms; i++) {
			const z = i * state.roomDepth;
			const zy = py(z);
			const gapHalf = state.doorHalfWidth;
			const gapL = px(-gapHalf);
			const gapR = px(gapHalf);
			ctx.beginPath();
			ctx.moveTo(leftX, zy);
			ctx.lineTo(gapL, zy);
			ctx.moveTo(gapR, zy);
			ctx.lineTo(rightX, zy);
			ctx.stroke();
		}

		// Paintings as small wall ticks.
		ctx.fillStyle = 'rgba(232, 223, 201, 0.85)';
		for (const p of state.paintings) {
			const x = px(p.x);
			const z = py(p.z);
			ctx.fillRect(x - 2, z - 1, 4, 2);
			ctx.fillRect(x - 1, z - 2, 2, 4);
		}

		// Player marker + heading.
		const mx = px(state.x);
		const mz = py(state.z);
		const ang = Math.atan2(state.dirZ, state.dirX);
		ctx.save();
		ctx.translate(mx, mz);
		ctx.rotate(ang);
		ctx.fillStyle = '#d9a441';
		ctx.beginPath();
		ctx.moveTo(8, 0);
		ctx.lineTo(-5, -4);
		ctx.lineTo(-2, 0);
		ctx.lineTo(-5, 4);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
</script>

<div class="gallery">
	<canvas bind:this={canvas} class="view"></canvas>

	<canvas bind:this={minimap} class="minimap"></canvas>

	<div class="walk-hint">
		<span>move with <b>WASD</b> · look with <b>mouse</b> · <b>esc</b> to exit</span>
	</div>
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

	.walk-hint {
		position: absolute;
		left: 50%;
		bottom: 1.5rem;
		transform: translateX(-50%);
		padding: 0.4rem 0.8rem;
		border: 1px solid rgba(232, 223, 201, 0.25);
		border-radius: 999px;
		background: rgba(12, 12, 14, 0.55);
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.03em;
		white-space: nowrap;
		pointer-events: none;
		text-transform: lowercase;
	}

	.walk-hint b {
		color: var(--text-1);
		font-weight: 500;
	}

	.minimap {
		position: absolute;
		left: 1rem;
		bottom: 1rem;
		width: 150px;
		height: 110px;
		border-radius: 8px;
		border: 1px solid rgba(232, 223, 201, 0.18);
		background: rgba(12, 12, 14, 0.55);
		pointer-events: none;
	}

</style>
