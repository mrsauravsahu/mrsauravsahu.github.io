/**
 * "Paper opening" motion — shared by the photo modal and the blog cards.
 *
 * The whole site is built out of paper: polaroids on a table, ruled index
 * cards, prints in a mat. Opening one should feel like picking that sheet up
 * off the table and bringing it right up to your face — it hinges up from
 * where it was lying, unfolds flat, and flies at the screen.
 *
 * Only photos get that treatment, though — they're the thing you came to look
 * at. Posts you came to *read*, so they get a quiet cross-fade instead.
 *
 *   - `paperOpen`    — a Svelte transition, for content that opens in place
 *                      (the photo modal).
 *   - `fadeNavigate` — a Svelte action, for links that should dim out and hand
 *                      over to the destination page.
 */
import { cubicOut } from 'svelte/easing';
import { goto, preloadData } from '$app/navigation';

const PERSPECTIVE = 1100;

export function prefersReducedMotion(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Centre of an element, in viewport coordinates. */
export function centreOf(el: Element): { x: number; y: number } {
	const r = el.getBoundingClientRect();
	return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

type PaperOpenOptions = {
	/** Viewport point the sheet is picked up from — usually the thumbnail's centre. */
	from?: { x: number; y: number };
	/** How wide the sheet is at rest, relative to its open size. */
	startScale?: number;
	duration?: number;
};

/**
 * Svelte transition: the node starts small, lying back on the table at the
 * `from` point, then hinges upright along its bottom edge as it flies forward
 * to its final size. Reversed on the way out, so closing lays it back down.
 */
export function paperOpen(
	node: Element,
	{ from, startScale = 0.16, duration = 460 }: PaperOpenOptions = {}
) {
	if (prefersReducedMotion()) {
		return { duration: 120, css: (t: number) => `opacity: ${t};` };
	}

	const here = centreOf(node);
	const dx = (from?.x ?? here.x) - here.x;
	const dy = (from?.y ?? here.y) - here.y;

	return {
		duration,
		easing: cubicOut,
		css: (t: number, u: number) =>
			`transform-origin: 50% 100%;
			 transform: perspective(${PERSPECTIVE}px)
				translate(${dx * u}px, ${dy * u}px)
				rotateX(${-74 * u}deg)
				rotate(${-4 * u}deg)
				scale(${startScale + (1 - startScale) * t});
			 opacity: ${Math.min(1, t * 2.2)};`
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
