/**
 * "Paper opening" motion — shared by the photo modal and the blog cards.
 *
 * The whole site is built out of paper: polaroids on a table, ruled index
 * cards, prints in a mat. Opening one should feel like picking that sheet up
 * off the table and bringing it right up to your face — it hinges up from
 * where it was lying, unfolds flat, and flies at the screen.
 *
 * Two entry points, because the two cases are structurally different:
 *   - `paperOpen`  — a Svelte transition, for content that opens in place
 *                    (the photo modal).
 *   - `paperFlight`— a Svelte action, for content that is a link and has to
 *                    finish its flight before the router swaps the page.
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
 * Svelte action for a link that behaves like a sheet of paper: on click the
 * card lifts off the page, unfolds flat, and flies into the screen; only once
 * it has filled the viewport do we navigate. A clone does the flying so the
 * real card (and the grid around it) is never disturbed.
 */
export function paperFlight(node: HTMLAnchorElement, href: string) {
	let current = href;
	let flying = false;
	let warmed = false;

	// Fetch the post's data and code while the pointer is still on the card, so
	// the `goto` at the end of the flight is a swap rather than a load. Without
	// this the paper lands and then the reader waits.
	function warm() {
		if (warmed) return;
		warmed = true;
		preloadData(current).catch(() => {
			warmed = false; // transient failure — worth retrying on the next hover
		});
	}

	async function onClick(e: MouseEvent) {
		if (!isPlainClick(e) || flying) return;
		if (prefersReducedMotion()) return; // let the browser navigate normally

		e.preventDefault();
		flying = true;

		const rect = node.getBoundingClientRect();
		const dx = window.innerWidth / 2 - (rect.left + rect.width / 2);
		const dy = window.innerHeight / 2 - (rect.top + rect.height / 2);
		// Grow until the sheet is comfortably past both viewport edges, so the
		// page swap happens behind solid paper rather than mid-air.
		const cover = Math.max(window.innerWidth / rect.width, window.innerHeight / rect.height) * 1.25;

		const backdrop = document.createElement('div');
		backdrop.style.cssText =
			'position:fixed;inset:0;z-index:300;pointer-events:none;background:var(--bg, #14110d);opacity:0;';

		const clone = node.cloneNode(true) as HTMLElement;
		clone.removeAttribute('href');
		clone.style.cssText =
			`position:fixed;left:${rect.left}px;top:${rect.top}px;` +
			`width:${rect.width}px;height:${rect.height}px;margin:0;z-index:301;` +
			`pointer-events:none;transform-origin:50% 100%;will-change:transform,opacity;`;

		document.body.append(backdrop, clone);

		const easing = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
		const duration = 520;

		const flight = clone.animate(
			[
				{
					transform: `perspective(${PERSPECTIVE}px) translate(0px, 0px) rotateX(0deg) scale(1)`,
					offset: 0
				},
				{
					// picked up off the table — tips back and lifts before it commits
					transform: `perspective(${PERSPECTIVE}px) translate(${dx * 0.35}px, ${dy * 0.35 - 14}px) rotateX(-16deg) scale(1.18)`,
					offset: 0.38
				},
				{
					transform: `perspective(${PERSPECTIVE}px) translate(${dx}px, ${dy}px) rotateX(0deg) scale(${cover})`,
					opacity: 0.35,
					offset: 1
				}
			],
			{ duration, easing, fill: 'forwards' }
		);
		backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration,
			easing: 'cubic-bezier(0.4, 0, 1, 1)',
			fill: 'forwards'
		});

		try {
			await flight.finished;
		} catch {
			/* animation cancelled — navigate anyway */
		}

		await goto(current);
		// One frame on the new page before we lift the paper away, so the reader
		// never sees a flash of the old page underneath.
		requestAnimationFrame(() => {
			backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished
				.catch(() => {})
				.finally(() => {
					backdrop.remove();
					clone.remove();
					flying = false;
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
