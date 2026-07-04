# DESIGN.md — mrsauravsahu.github.io

A terminal/hacker aesthetic for the personal portfolio of Saurav Sahu: software engineer, photographer, creator, biker.

---

## Concept: "Living Terminal"

The site should feel like a terminal session that never closed — the kind of environment a developer actually lives in. Dark, precise, monospace. Not a corporate portfolio. Not a sterile dev blog. A system that reflects the person running it.

The duality is the point: the discipline and grain of a terminal window next to the warmth of physical photographs scattered like prints on a desk. These aren't contradictions — they're the same person paying obsessive attention to detail in different mediums.

**The one thing someone will remember:** An almost-black site with green phosphor text, a terminal you can actually type into, and photos scattered like Polaroids on a dark table.

---

## Visual Identity

### Color Palette

```
--bg:           #050505   /* near-black — deeper than any dark mode default */
--surface:      #0a0a0a   /* writing section, contact */
--surface-alt:  #111      /* subtle differentiation */
--border:       #1a2a1a   /* hairlines — green-tinted, not grey */
--text:         #b8ffb8   /* phosphor green — warm, not neon */
--text-muted:   #3d7a3d   /* secondary labels, metadata */
--accent:       #00ff88   /* bright terminal green — prompts, cursors, highlights */
--accent-dim:   #006633   /* accent at lower intensity — borders, glows */
```

> Why terminal green? It reads as deliberate and earned. It evokes the CRT monitors of the machines that shaped software culture. It's uncommon on personal sites. And it works beautifully against near-black.

### Typography

Everything is **Geist Mono** — there is no second typeface. This is a feature, not a constraint. The entire site reads like a well-formatted terminal session.

| Role | Font | Size |
|------|------|------|
| Hero name | Geist Mono 700 | clamp(2rem, 5vw, 3.2rem) |
| Section titles | Geist Mono 600 | clamp(1.5rem, 3.5vw, 2.4rem) |
| UI / labels | Geist Mono 400 | 0.72–0.85rem |
| Body / descriptions | Geist Mono 400 | 0.85–0.9rem, line-height 1.8 |
| Terminal output | Geist Mono 400 | 0.85rem |
| Metadata / captions | Geist Mono 400 | 0.55–0.7rem |

Loaded via Google Fonts with `display=block` to prevent FOUT.

### Atmosphere

- **Scanlines:** `body::before` repeating linear gradient at 0.015 opacity — subtle CRT texture
- **CRT glow:** `text-shadow: 0 0 20px rgba(0, 255, 136, 0.25)` on `h1`, `h2`
- **Scroll progress bar:** 2px accent-green bar fixed at top of viewport

---

## Layout System

**Max content width:** 72rem  
**Reading column (blog posts):** 42rem, centered  
**Sections:** 6rem vertical padding, alternate between `--bg` and `--surface`

---

## Navigation

**Style:** Fixed top bar.  
**Logo:** `SS` in Geist Mono. Monogram, nothing more.  
**Links:** Geist Mono, 0.7rem, with a `▋` cursor accent on active. Spaced with generous padding.  
**Mobile:** Hamburger opens an overlay. Links stack vertically.  
**Scroll behaviour:** Nav gains a subtle backdrop treatment after scrolling.

---

## Homepage Sections

### 1. Hero — Interactive Terminal

Full viewport height. A personal photo sits as a background at `opacity: 0.06`, heavily desaturated. The terminal window is centred.

**Terminal window anatomy:**
- macOS-style traffic light dots (red / yellow / green) + `zsh` title in the bar
- `$ whoami` → large phosphor-green name: **Sahu**
- `$ cat roles.txt` → roles in muted green, line-height 1.9
- Live input line with a `▋` blinking cursor — the user can actually type commands

**Available commands:** `hi`, `hello`, `help`, `whoami`, `about`, `ls`, `date`, `blog`, `contact`, `clear`, `sudo`

The terminal scrolls its own history. Clicking anywhere in the terminal body focuses the hidden input.

---

### 2. Writing / Recents

**Section label:** `$ cat writing.md` (via `.section-label`)  
**Layout:** 3-column grid on desktop, single column on mobile.

**Post card design:**
- Image shown only when `coverImageUrl` is present — no placeholder fallback on the landing page
- Title in Geist Mono, thin brass hairline appears under title on hover (`::after` scaleX trick)
- Date + read time in Geist Mono `--text-muted`, 0.65rem
- Card lifts `translateY(-4px)` on hover

**Read-more link:** `$ ls -la posts/` with a `→` that slides right on hover. Lowercase, no text-transform.

---

### 3. Beyond Code

**Section label:** `$ cat beyond-code.json`  
**Layout:** 3-column equal grid on desktop, single column on mobile.

Each block has a JSON-style label:
```
{ "topic": "photography" }
{ "topic": "creating" }
{ "topic": "biking" }
```

Label in `--accent`, braces in `--text-muted`. One paragraph of body copy per topic.

**Photo dump** below the text blocks: all photos from `data-store/photos/` loaded from `photos.csv`, shuffled server-side, displayed as scattered Polaroid prints.

**Polaroid tile details:**
- White mat background `#ede9e2`, padding top/sides + generous bottom (caption area)
- 4:3 aspect ratio via `padding-top: 75%` trick
- Per-tile CSS `--rot` variable: `rotate(calc(var(--rot) * 1deg))` — randomised -4° to +4° at build time
- Tiles overlap (`margin: -0.6rem`, `z-index` management)
- Hover: straightens to 0°, scales 1.12, z-index 20
- After hover: tile stays on top (`z-index: 10` via `.on-top` class) until next hover
- Click: opens photo modal

**Photo modal:**
- `zoomFromPhoto` custom Svelte transition — scales from the clicked tile's centre coordinates in viewport space using `transform-origin` set dynamically
- Light mat frame `#ede9e2`, full image, caption in Geist Mono
- Dismiss: click backdrop or `Escape`

**Mobile:** tiles slightly larger (33% width), more rotation (×2), more margin spacing

---

### 4. Contact

**Section label:** `$ cat contact.md`  
**Heading:** `let's connect.` — left-aligned  
**Links:** Left-aligned flex row, Geist Mono 0.78rem. Separated by `|` pseudo-elements.  
Each link: underline grows from centre on hover (left/right inset CSS transition).

Links: linkedin · github · instagram · email · unsplash · medium · dev.to

---

### 5. Footer

DM Mono / Geist Mono, `--text-muted`, 0.65rem.  
Left: tech stack `SvelteKit · .NET · Node.js`  
Right: `Keep on coding — Sahu, S ▋` (blinking cursor)

---

## Section Labels

All section labels use the `.section-label` class. The `$` prompt is injected via CSS:

```css
.section-label::before {
  content: '$';
  color: var(--accent);
}
```

This means markup never contains the `$` — it's purely presentational. The label text is the "command" being run (e.g. `cat writing.md`, `cat contact.md`).

---

## Photo Strip Dividers

Between sections: a full-width `div.photo-strip` with a personal photograph.  
- Height: `22vh`, min `120px`
- Image: `opacity: 0.25`, `grayscale(80%) sepia(20%)` — lifts slightly on hover  
- Top and bottom fade to `--bg` via `::before`/`::after` gradients

---

## Blog Cover SVG Illustrations

Three SVG illustrations (`/img/blog-cover-1.svg`, `2`, `3`) serve as per-position fallbacks for blog cards that have no `coverImageUrl`. Each is 800×500 (16:10) and uses the site palette.

| Cover | Theme |
|-------|-------|
| 1 | Terminal window with `cat writing.md`, file listing, blinking cursor |
| 2 | Network graph — glowing centre node, grid dot background |
| 3 | Sine wave visualiser with axis labels and `signal --freq 1hz` label |

All share: scanline overlay, corner bracket accents, Courier New monospace, glow SVG filter.

---

## Data Flow

Photos are managed in `apps/data-store/photos/` alongside `photos.csv` (filename + caption). During `npm run build`, a `prebuild` script copies them into `apps/portfolio/static/photos/`. The server-side `load` function reads the CSV, parses it, and shuffles the order on every request/prerender.

---

## Micro-interactions & Motion

**Philosophy:** Motion is information. Nothing animates for decoration alone.

| Trigger | Effect |
|---------|--------|
| Page load | `.fade-up` — `opacity: 0 → 1`, `translateY(16px → 0)`, staggered with `animation-delay` |
| Nav scroll | Background treatment after 80px |
| Blog card hover | Image colour lifts, card `translateY(-4px)`, brass hairline extends |
| Photo tile hover | Straightens, scales 1.12, comes to top |
| Photo tile click | Zoom-from-source modal scale transition |
| Terminal cursor | `▋` blinks at 1s `step-end` — feels like a real terminal |
| Contact links | Underline grows from centre |
| Read-more arrow | `→` slides 3px right |
| Scroll progress | Green 2px bar grows across top of viewport |

**Duration baseline:** 200ms ease-out for interactive states, 600ms for entrance animations. No spring, no bounce — deliberate and mechanical.
