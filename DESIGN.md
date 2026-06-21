# DESIGN.md — mrsauravsahu.github.io

A redesign direction for the personal portfolio of Saurav Sahu: software engineer, photographer, creator, biker.

---

## Concept: "Field Notes"

The site should feel like a well-worn field notebook — the kind you carry in a jacket pocket on a bike ride or trek. Dark, tactile, deliberate. Not a corporate portfolio. Not a sterile dev blog. A living record of a person who codes, shoots, builds, and rides.

The duality is the point: monospace precision of an engineer next to the grain and motion of a photographer. These aren't contradictions — they're the same person paying obsessive attention to detail in different mediums.

**The one thing someone will remember:** A dark, almost-black site where photography bleeds edge-to-edge between sections, and every piece of text feels like it was typed on a good machine.

---

## Visual Identity

### Color Palette

```
--bg:           #0d0d0d   /* near-black, warm undertone */
--surface:      #161616   /* cards, code blocks, raised elements */
--surface-alt:  #1e1e1e   /* hover states, subtle differentiation */
--border:       #2a2a2a   /* hairlines, dividers */
--text:         #e8e4dc   /* warm off-white — not pure white, feels analog */
--text-muted:   #6b6560   /* metadata, secondary labels */
--accent:       #c8a96e   /* aged brass / golden tan — a biker's compass */
--accent-dim:   #7a6540   /* accent at lower intensity */
```

> Why brass/gold? It reads as warmth against the dark base. It evokes adventure equipment — a worn compass, a camera dial, a handlebar stem. It's uncommon on dev sites. It works beautifully with GeistMono.

### Typography

| Role | Font | Notes |
|------|------|-------|
| **Display / headings** | [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) | Serif with editorial weight. Dramatic at large sizes. Signals "this person has taste." |
| **UI / navigation / labels** | [DM Mono](https://fonts.google.com/specimen/DM+Mono) | Monospace but softer than typical terminal fonts. Used for nav links, tags, metadata. |
| **Blog post body** | [Geist Mono](https://vercel.com/font) | Required. All blog content — headings, body, code — uses GeistMono. Feels like reading a well-formatted commit message. |
| **Code blocks** | Geist Mono | Consistent with blog body. Differentiated only by background and color. |

**Scale (blog post):**
- Body: 1.05rem / line-height 1.9 — generous, meditative
- H1: 2.8rem, Playfair Display (post title on index/home)
- GeistMono body inside post: 1rem / line-height 1.85

**Scale (UI):**
- Nav: 0.75rem uppercase DM Mono with 0.15em letter-spacing
- Section labels: 0.65rem DM Mono, uppercase, brass accent color

---

## Layout System

**Max content width:** 72rem  
**Reading column width (blog posts):** 42rem, centered  
**Grid:** 12-column baseline. Sections break the grid intentionally — photography panels bleed full-width.

### Spatial Rhythm
- Sections separated by full-width image bleeds (not `<hr>` dividers)
- Generous vertical padding: 6rem+ between major sections
- No card borders — use background differentiation (`--surface`) instead
- Asymmetric layouts preferred: a heading offset left, content offset right

---

## Navigation

**Style:** Fixed top bar, ultra-minimal.  
**Height:** 3.5rem  
**Background:** `--bg` with a subtle `backdrop-filter: blur(12px)` when scrolled  
**Logo:** `S—` in DM Mono, brass color. The em-dash is the detail.  
**Links:** DM Mono, uppercase, 0.7rem. Spaced out with generous padding. Active link gets a brass underline (2px, offset).  
**Mobile:** Full-screen overlay on hamburger. Links stack vertically in large Playfair Display — feels intentional, not just functional.

---

## Homepage Sections

### 1. Hero

**Layout:** Full viewport height. Dark background. Text anchored bottom-left.  
**Content:**
```
[large Playfair Display — 5rem+]
software engineer.
photographer.
creator. biker.

[DM Mono, brass, small]
@mrsauravsahu
```
**Visual:** A large, slightly desaturated personal photo (you on a ride, or shooting something) fills the right 55% of the viewport. It fades into the dark background at its left edge using a gradient mask — not a hard crop. The photo is decorative, atmospheric.

**On mobile:** Photo becomes a full-bleed background at reduced opacity (0.25), text overlaid.

---

### 2. Writing / Recents

**Transition from hero:** A full-width strip — a landscape photo (road, mountains, city at night, anything atmospheric) at ~30vh height. No caption. Just a moment.

**Layout:** The 3 most recent posts in a horizontal row on desktop, stacked on mobile.

**Post card design:**
- No box, no border-radius, no shadow
- Cover image at top, full-width within card, desaturated by default — color on hover
- Title in Playfair Display, 1.1rem
- Date + read time in DM Mono, `--text-muted`, 0.7rem
- Thin brass hairline (1px) appears under title on hover
- Entire card lifts with `translateY(-4px)` on hover, no scale

**"Read more" link:** DM Mono, brass, with a `→` that slides right on hover. No button styling.

---

### 3. Beyond Code *(photography + creator + biker)*

This section is woven into the homepage, not siloed.

**Layout:** Asymmetric. Two columns, unequal.  
- Left (40%): stacked text blocks — short, punchy statements about who you are beyond the terminal. No headers. Just small DM Mono labels ("photographer", "creator", "biker") followed by one sentence each.
- Right (60%): a mosaic of 3–4 photos arranged in a slight overlap/offset grid. Think contact sheet aesthetic. Each photo has a thin brass border (1px). Hover on each photo reveals a caption in DM Mono.

**Background:** `--surface` to differentiate from the blog section.

---

### 4. Contact

**Layout:** Full-width, centered.  
**Style:** Minimal. Icons replaced with text links in DM Mono. No icon grid.

```
[Playfair Display, large]
Let's connect.

[DM Mono, --text-muted, links in --accent]
linkedin  ·  github  ·  instagram  ·  email  ·  unsplash
```

Each link has a subtle brass underline that grows from center on hover.

---

### 5. Footer / About

**Not a separate section** — integrated into a slim footer.  
DM Mono, `--text-muted`, 0.7rem. One line: the stack (`SvelteKit · .NET · Node.js`), then `Made with care — Sahu`.

---

## Blog List Page (`/blog/[page]`)

**Layout:** Single column, generous width (64rem max).  
**Each entry:**
```
[DM Mono, --text-muted, 0.65rem]  2024 · 4 min

[Playfair Display, 1.4rem]
Post Title Here

[--text-muted, 0.85rem]
Short description of the post...
```
- Entries separated by a single `1px` line in `--border`
- No cards, no shadows
- Title turns brass on hover
- A thin brass bar (3px wide, 1.2rem tall) appears on the left edge of the hovered entry

**Pagination:** DM Mono. `← prev · 2 of 6 · next →`. Centered. Generous padding.

---

## Blog Post Page (`/blog/posts/[id]`)

This is the most important page to get right. It should feel like reading a well-typeset article.

**Font:** GeistMono for everything inside the post body. Playfair Display for the post title only.

**Layout:**
- Post title: Playfair Display, 2.6rem, `--text`, max-width 56rem
- Metadata: DM Mono, `--text-muted`, 0.75rem — `Published · Monday, June 20 2026 · 6 min read`
- Thin brass `<hr>` (1px, 4rem wide, left-aligned) between title block and body
- Body column: 42rem, centered
- Line height: 1.9
- Font size: 1rem GeistMono
- Paragraph spacing: 1.6rem

**In-post elements:**
- `<code>` inline: brass text on `--surface` background, no border, slight padding
- `<pre>` blocks: `--surface` background, brass left border (3px), GeistMono, overflow scroll
- `<blockquote>`: left border brass 3px, `--text-muted`, italic, indented
- `<h2>`, `<h3>`: GeistMono, `--accent`, uppercase, 0.8em letter-spacing — they feel like section markers in a terminal log
- `<table>`: minimal, hairline `--border` borders, `--surface` header row
- Images: full column width, no border-radius, a subtle `box-shadow: 0 4px 24px rgba(0,0,0,0.5)`

**Reading progress:** A thin brass progress bar at the very top of the viewport (above the nav), CSS-only via `animation-timeline: scroll()`.

---

## Micro-interactions & Motion

**Philosophy:** Motion is information. Nothing animates for decoration alone.

| Trigger | Effect |
|---------|--------|
| Page load | Content fades in with `opacity: 0 → 1` + `translateY(12px → 0)`, staggered per section (CSS `animation-delay`) |
| Nav scroll | Nav gains `backdrop-filter: blur` after 80px scroll |
| Blog card hover | Image desaturation lifts, card `translateY(-4px)`, brass hairline appears |
| Blog list item hover | Brass left bar slides in from left (`scaleX(0 → 1)`, transform-origin: left) |
| Photo mosaic hover | Individual photo scales 1.02, caption fades in |
| Link hover | Underline grows from center (`scaleX` trick) |
| Reading progress | Brass bar at top tracks scroll position via `animation-timeline: scroll()` |

**Duration baseline:** 200ms ease-out for interactive states, 400ms ease-out for entrance animations.  
**No bounce, no spring, no elastic** — deliberate and mechanical, like a good camera shutter.

---

## Textures & Atmosphere

- **Grain overlay:** A subtle CSS noise texture (`opacity: 0.035`) over the entire page via a `::before` pseudo-element on `body`. Adds analog warmth without visual noise.
- **Photo gradients:** All edge-fading photos use a `mask-image: linear-gradient()` to dissolve into the dark background — no hard crops.
- **Surface differentiation:** Sections alternate between `--bg` and `--surface` (a 2% lightness step). Enough to signal change, not enough to feel "card-y".

---

## Implementation Notes (SvelteKit)

- Import GeistMono via `@fontsource/geist-mono` (npm package — no Google Fonts dependency, loads locally)
- Import Playfair Display via Google Fonts (`display=swap`)
- Import DM Mono via Google Fonts
- CSS custom properties defined in `:root` inside `+layout.svelte`
- Grain overlay: `body::before` with an SVG `feTurbulence` filter as background-image
- Reading progress bar: a single `<div class="progress">` in the layout, styled with `animation-timeline: scroll()` (check browser support — add JS fallback)
- Photo mosaic in "Beyond Code": static images from `/static/img/` — you'll want to add 3–4 lifestyle photos (bike, camera, outdoors)
- Blog desaturation: CSS `filter: grayscale(100%)` with `transition` to `grayscale(0%)` on hover

---

## What Makes This Unforgettable

1. **The brass accent** — warm, uncommon, reads as craftsmanship
2. **GeistMono on blog posts** — code-adjacent but not intimidating. Your writing feels like it was composed in a great editor.
3. **Photography as punctuation** — not a gallery section, not a sidebar. Full-bleed images that break the layout rhythm, like turning a page and finding a photo spread.
4. **Field notes identity** — the entire site implies a person who is paying attention: to code, to light, to roads, to details.
5. **No rounded corners, no gradients, no purple** — every cliché deliberately avoided.
