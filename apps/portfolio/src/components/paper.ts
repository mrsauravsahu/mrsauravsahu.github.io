/**
 * Opening motion — shared by the photo modal and the blog cards.
 *
 * Photos are the thing you came to look at, so a print flies: it travels from
 * the tile you clicked to the open plate as one object. That motion is Svelte's
 * own `crossfade`, set up in the page itself — the pieces here are the
 * supporting cast around it.
 *
 * Posts you came to *read*, so they get a quiet cross-fade to the next page
 * instead.
 *
 *   - `veil`         — a Svelte transition for the modal's backing sheet, which
 *                      darkens without fading what sits on top of it.
 *   - `imageState`   — a Svelte action reporting when an image really has pixels.
 *   - `fadeNavigate` — a Svelte action, for links that should dim out and hand
 *                      over to the destination page.
 */
import { cubicOut } from 'svelte/easing';
import { goto, preloadData } from '$app/navigation';

export function prefersReducedMotion(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type ImageHandlers = {
	ready?: (img: HTMLImageElement) => void;
	/** Typically swaps in a fallback src — the `load` from that retry still fires. */
	failed?: (img: HTMLImageElement) => void;
};

/**
 * Svelte action: report when an image has pixels, or has definitively failed.
 *
 * Plain `on:load` / `on:error` handlers are not enough here. The markup is
 * server-rendered, so the browser starts fetching during parse and the image
 * has usually settled — loaded *or* 404'd — before Svelte hydrates and attaches
 * its listeners. Those events have been and gone, so neither handler fires:
 * a card gated on `load` stays hidden forever, and a src gated on `error` never
 * gets swapped for its fallback. Both halves have to be checked up front.
 *
 * `complete` alone doesn't distinguish the two — a broken image is also
 * complete — so `naturalWidth` is what actually separates loaded from failed.
 *
 * Listeners stay attached after firing: `failed` typically swaps in a fallback
 * src, and we need the `load` from that second attempt.
 */
export function imageState(node: HTMLImageElement, handlers: ImageHandlers) {
	let current = handlers;

	const onLoad = () => current.ready?.(node);
	const onError = () => current.failed?.(node);

	node.addEventListener('load', onLoad);
	node.addEventListener('error', onError);

	if (node.complete) {
		if (node.naturalWidth > 0) onLoad();
		else onError();
	}

	return {
		update(next: ImageHandlers) {
			current = next;
		},
		destroy() {
			node.removeEventListener('load', onLoad);
			node.removeEventListener('error', onError);
		}
	};
}

/**
 * Svelte transition for the modal's backing sheet: the darkness comes up, but
 * the element itself never drops below full opacity.
 *
 * A plain `fade` here would be wrong. The print is a child of this node, so the
 * backdrop's opacity multiplies into it — a card that's meant to read as the
 * physical tile you just picked up spends its whole flight semi-transparent,
 * with the grid showing through it. Animating only the colour leaves the print
 * solid from the first frame.
 */
export function veil(node: Element, { duration = 420 }: { duration?: number } = {}) {
	return {
		duration,
		easing: cubicOut,
		css: (t: number) => `background-color: rgba(0, 0, 0, ${0.9 * t});`
	};
}

/** A photo window's centre and width, in viewport coordinates. */
export type PhotoOrigin = { x: number; y: number; width: number };

/**
 * Svelte transition for the paper a print is mounted on — the mat and the
 * caption — growing in step with the print itself.
 *
 * crossfade moves the photo, but it can only move the one element it's paired
 * to. Left alone the paper just fades in at full size while the photo flies into
 * it, so the two travel at visibly different rates and the polaroid stops
 * reading as a single object.
 *
 * The paper can't simply be crossfaded too: it's a different shape at each end
 * (the mat and caption are sized in rem, so a thumbnail's border is
 * proportionally much chunkier than a full plate's), and crossfade scales x and
 * y independently, so pairing them would squash it.
 *
 * So it's driven off the photo instead. Same easing and duration as the
 * crossfade, scaled about the photo's own centre and translated so that centre
 * tracks the print — which makes the whole card one object moving at one rate,
 * while the photo keeps crossfade's exact landing.
 *
 * This has to live on a *sibling* of the plate. On an ancestor it would multiply
 * into crossfade's own scale and the photo would grow quadratically.
 */
export function paperGrow(
	node: Element,
	{ from, duration = 420 }: { from?: PhotoOrigin | null; duration?: number } = {}
) {
	if (prefersReducedMotion()) {
		return { duration: 120, css: (t: number) => `opacity: ${t};` };
	}

	const plate = node.parentElement?.querySelector('.modal-plate');
	const p = plate?.getBoundingClientRect();
	if (!from || !p || p.width === 0) {
		return { duration, easing: cubicOut, css: (t: number) => `opacity: ${t};` };
	}

	const n = node.getBoundingClientRect();
	const px = p.left + p.width / 2;
	const py = p.top + p.height / 2;

	const s0 = from.width / p.width;
	// The photo's centre, in this node's own coordinates — what the paper scales
	// about, so it grows around the print rather than away from it.
	const ox = px - n.left;
	const oy = py - n.top;
	const dx = from.x - px;
	const dy = from.y - py;

	return {
		duration,
		easing: cubicOut,
		css: (t: number, u: number) =>
			`transform-origin: ${ox}px ${oy}px;
			 transform: translate(${dx * u}px, ${dy * u}px) scale(${s0 + (1 - s0) * t});`
	};
}

/** Plain left-click with no modifiers — anything else is the browser's business. */
function isPlainClick(e: MouseEvent): boolean {
	return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * Svelte action for a link that should cross-fade to its destination: the
 * current page dims out, the router swaps, and the new page comes up. Used for
 * blog posts, where the reader is going somewhere to *read* — a quiet handoff
 * suits that better than throwing the page at them.
 */
export function fadeNavigate(node: HTMLAnchorElement, href: string) {
	let current = href;
	let leaving = false;
	let warmed = false;

	// Fetch the post's data and code while the pointer is still on the card, so
	// the `goto` is a swap rather than a load and the fade isn't holding on an
	// empty screen.
	function warm() {
		if (warmed) return;
		warmed = true;
		preloadData(current).catch(() => {
			warmed = false; // transient failure — worth retrying on the next hover
		});
	}

	async function onClick(e: MouseEvent) {
		if (!isPlainClick(e) || leaving) return;
		if (prefersReducedMotion()) return; // let the browser navigate normally

		e.preventDefault();
		leaving = true;

		const veil = document.createElement('div');
		veil.style.cssText =
			'position:fixed;inset:0;z-index:300;pointer-events:none;background:var(--bg, #0a0a0a);opacity:0;';
		document.body.append(veil);

		const out = veil.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 220,
			easing: 'ease-out',
			fill: 'forwards'
		});

		try {
			await out.finished;
		} catch {
			/* animation cancelled — navigate anyway */
		}

		await goto(current);
		// One frame on the new page before lifting the veil, so the reader never
		// catches a flash of the old page underneath.
		requestAnimationFrame(() => {
			veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' })
				.finished.catch(() => {})
				.finally(() => {
					veil.remove();
					leaving = false;
				});
		});
	}

	node.addEventListener('click', onClick);
	node.addEventListener('mouseenter', warm);
	node.addEventListener('focus', warm);
	node.addEventListener('touchstart', warm, { passive: true });

	return {
		update(next: string) {
			if (next !== current) warmed = false;
			current = next;
		},
		destroy() {
			node.removeEventListener('click', onClick);
			node.removeEventListener('mouseenter', warm);
			node.removeEventListener('focus', warm);
			node.removeEventListener('touchstart', warm);
		}
	};
}
