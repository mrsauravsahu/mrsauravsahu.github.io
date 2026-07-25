/**
 * Opening motion — shared by the photo modal and the blog cards.
 *
 * A print opens by zooming: it grows out of the exact tile you clicked, from
 * that tile's size and position, straight up to full size. Because the modal
 * plate carries the same 4:3 crop as the tile, that's one continuous move on
 * the same image rather than a cut to a differently-framed one.
 *
 * Photos zoom because they're the thing you came to look at. Posts you came to
 * *read*, so they get a quiet cross-fade instead.
 *
 *   - `zoomOpen`     — a Svelte transition, for content that opens in place
 *                      (the photo modal).
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

export type Origin = { x: number; y: number; width: number; height: number };

/**
 * Where an element sits and how big it really is, in viewport coordinates.
 *
 * `getBoundingClientRect` alone won't do: the tiles are rotated a few degrees,
 * and it returns the axis-aligned box *around* the rotation, which is several
 * percent wider and taller than the tile itself. Its centre is still correct,
 * so take the position from there and the size from the layout box.
 */
export function rectOf(el: HTMLElement): Origin {
	const r = el.getBoundingClientRect();
	return {
		x: r.left + r.width / 2,
		y: r.top + r.height / 2,
		width: el.offsetWidth,
		height: el.offsetHeight
	};
}

type ZoomOpenOptions = {
	/** The tile the print is growing out of — centre and true size (see `rectOf`). */
	from?: Origin | null;
	duration?: number;
};

/**
 * Svelte transition: the node grows out of `from` — starting at that rect's
 * size and centred on it — up to its own final size and position. Reversed on
 * the way out, so closing shrinks it back into the tile it came from.
 *
 * The start scale is measured rather than guessed: the tile's width over the
 * node's own width, so the first frame of the zoom is exactly the size of the
 * thumbnail underneath it and the two read as the same object.
 */
export function zoomOpen(node: Element, { from, duration = 420 }: ZoomOpenOptions = {}) {
	if (prefersReducedMotion()) {
		return { duration: 120, css: (t: number) => `opacity: ${t};` };
	}

	const here = node.getBoundingClientRect();
	const dx = from ? from.x - (here.left + here.width / 2) : 0;
	const dy = from ? from.y - (here.top + here.height / 2) : 0;
	// Guard the degenerate cases: no origin rect, or a node with no layout yet.
	const s0 = from && here.width > 0 ? Math.min(0.9, from.width / here.width) : 0.2;

	return {
		duration,
		easing: cubicOut,
		css: (t: number, u: number) =>
			`transform-origin: 50% 50%;
			 transform: translate(${dx * u}px, ${dy * u}px) scale(${s0 + (1 - s0) * t});
			 opacity: ${Math.min(1, t * 3)};`
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
			'position:fixed;inset:0;z-index:300;pointer-events:none;background:var(--bg, #14110d);opacity:0;';
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
