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

export type Origin = { x: number; y: number; width: number; height: number; rotation: number };

/**
 * The angle an element is currently drawn at, in degrees, read back out of its
 * computed transform matrix. The tiles sit at a few degrees of scatter, and the
 * zoom has to start at that same angle or the print visibly snaps upright on
 * its first frame instead of straightening as it grows.
 */
function transformOf(el: HTMLElement): { rotation: number; scale: number } {
	const t = getComputedStyle(el).transform;
	if (!t || t === 'none') return { rotation: 0, scale: 1 };
	const m = new DOMMatrixReadOnly(t);
	return {
		rotation: (Math.atan2(m.b, m.a) * 180) / Math.PI,
		scale: Math.hypot(m.a, m.b) || 1
	};
}

/**
 * Where an element sits and how big it really is, in viewport coordinates.
 *
 * `getBoundingClientRect` alone won't do: the tiles are rotated a few degrees,
 * and it returns the axis-aligned box *around* the rotation, which is several
 * percent wider and taller than the tile itself. Its centre is still correct,
 * so take the position from there and the size from the layout box — scaled by
 * whatever transform is in play, since a tile is under the pointer (and so
 * hover-scaled) at the moment it's clicked.
 *
 * `el` is the thing being measured; `transformFrom` is where the rotation and
 * scale are read from, for when the two differ — the photo window is measured,
 * but it's the card around it that carries the transform.
 */
export function rectOf(el: HTMLElement, transformFrom: HTMLElement = el): Origin {
	const r = el.getBoundingClientRect();
	const { rotation, scale } = transformOf(transformFrom);
	return {
		x: r.left + r.width / 2,
		y: r.top + r.height / 2,
		width: el.offsetWidth * scale,
		height: el.offsetHeight * scale,
		rotation
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

type ZoomOpenOptions = {
	/** The tile's *photo window* — centre and true size (see `rectOf`). */
	from?: Origin | null;
	/** Selector for the matching photo window inside the node being zoomed. */
	anchor?: string;
	duration?: number;
};

/**
 * Svelte transition: the node grows out of `from` — starting at that tile's
 * exact position, size and angle — up to its own final size and position.
 * Reversed on the way out, so closing shrinks it back into the tile it came
 * from.
 *
 * This is a FLIP, not a zoom-in-spirit: the start state is measured off the tile
 * rather than guessed, so the first frame of the modal lands on the tile that
 * was clicked. That's what makes it read as one card expanding instead of a new
 * card appearing. The rotation unwinds over the move too, so the print
 * straightens as it grows rather than snapping upright at frame one.
 *
 * The scale is deliberately *uniform*, and it's the photo window — not the card
 * — that the motion is anchored on.
 *
 * Matching the two cards edge-to-edge instead would mean scaling x and y by
 * different factors, because the mat and caption around the photo are sized in
 * rem and so aren't proportional between a thumbnail and a full plate. Any such
 * difference is a squash: the card visibly stretches along one axis and relaxes
 * over the flight, which is what reads as jagged. The photo window is a true
 * 4:3 in both, so anchoring there gives one honest scale factor, the photo
 * itself tracks perfectly, and the only thing that doesn't match exactly is the
 * width of the paper border — a couple of pixels, against distortion across the
 * whole card.
 *
 * Keeping the photo pinned while the scale is uniform means the translation has
 * to be solved per frame rather than lerped: the node scales about its own
 * centre, which is not the photo's centre, so the offset that holds the photo in
 * place changes as the scale does.
 *
 * Opacity deliberately stays at 1 throughout: the modal is standing in for a
 * tile that's already been hidden, and anything less than opaque shows the empty
 * gap in the grid through it.
 */
export function zoomOpen(node: Element, { from, anchor, duration = 420 }: ZoomOpenOptions = {}) {
	if (prefersReducedMotion()) {
		return { duration: 120, css: (t: number) => `opacity: ${t};` };
	}

	const here = node.getBoundingClientRect();
	const anchorEl = anchor ? node.querySelector(anchor) : null;
	const target = (anchorEl ?? node).getBoundingClientRect();

	if (!from || target.width === 0 || here.width === 0) {
		return { duration, easing: cubicOut, css: (t: number) => `opacity: ${t};` };
	}

	// Node centre (what `transform-origin: 50% 50%` scales about), the photo
	// window's centre, and the offset between them.
	const cx = here.left + here.width / 2;
	const cy = here.top + here.height / 2;
	const px = target.left + target.width / 2;
	const py = target.top + target.height / 2;
	const vx = px - cx;
	const vy = py - cy;

	const s0 = from.width / target.width;

	return {
		duration,
		easing: cubicOut,
		css: (t: number, u: number) => {
			const s = s0 + (1 - s0) * t;
			const rad = (from.rotation * u * Math.PI) / 180;
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);

			// Where the photo's centre should be right now: from the tile's photo
			// window at t=0 to the plate's at t=1.
			const wantX = from.x + (px - from.x) * t;
			const wantY = from.y + (py - from.y) * t;

			// The photo's centre lands at `c + T + R(rot)·(s·v)`, so solve for the
			// T that puts it on `want`. At t=1 this is exactly zero.
			const tx = wantX - cx - s * (vx * cos - vy * sin);
			const ty = wantY - cy - s * (vx * sin + vy * cos);

			return `transform-origin: 50% 50%;
			        transform: translate(${tx}px, ${ty}px)
			                   rotate(${from.rotation * u}deg)
			                   scale(${s});`;
		}
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
