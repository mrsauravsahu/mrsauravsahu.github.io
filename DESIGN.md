# DESIGN.md — mrsauravsahu.github.io

A photographer-first portfolio for Saurav Sahu: photographer, software engineer, explorer, biker. Photographs lead; everything else supports them.

---

## Concept: "The Print Table"

The site should feel like a photographer's table — prints laid out, still warm from the darkroom, waiting to be picked up and looked at. Warm, quiet, generous with space. The images do the talking; the interface gets out of their way.

This is a deliberate repivot away from the previous "Living Terminal" concept. The green-phosphor terminal is gone from the surface — but it isn't deleted. It survives as a **hidden easter egg near the footer** (see below), a small wink to the engineer behind the camera. The public face is a gallery; the terminal is a secret handshake for people who look closely.

**The one thing someone will remember:** A warm, near-black table scattered with Polaroid prints you can pick up, straighten, and open full-size — the whole page opening *on the photographs*, no preamble.

---

## Voice

**Everything is Geist Mono — there is no second typeface.** The mono is retained from the old design because it's distinctive and it's the one thing worth keeping; it is simply *recast*. It is no longer a shell prompt — it's the language of the camera: names, titles, prose, captions, dates, locations, coordinates, EXIF-style metadata, all in the same precise monospace.

The distinction is now made with **size, weight, spacing, and colour**, not with a different family:
- **Display** (name, section titles): larger, heavier, warm off-white.
- **Camera metadata** (captions, dates, small labels, nav): small, uppercase-ish letter-spacing, `--text-muted` / amber.

No `$` prompts, no command lines, no traffic-light window chrome anywhere on the public page.

---

## Visual Identity

### Color Palette

A warm "gallery dark" — rich enough to make prints glow, warm enough to never feel like a code editor.

```
--bg:          #14110d   /* warm near-black — a dark gallery wall */
--surface:     #1b1712   /* alternating sections, cards */
--surface-alt: #221d17   /* subtle differentiation */
--mat:         #ede9e2   /* Polaroid / print mat — the cream that frames every photo */
--border:      #2c2620   /* warm hairlines — brown-grey, not green */
--text:        #f2ede4   /* warm off-white — the primary reading colour */
--text-muted:  #a2988a   /* captions, metadata, secondary labels */
--accent:      #d9a441   /* amber / safelight — film warmth, used sparingly */
--accent-dim:  #8a6a2e   /* accent at lower intensity — borders, hovers */
```

> Why amber, not green? Green read as "terminal." Amber reads as darkroom safelight and the warm cast of golden-hour film. It's the colour of the work itself, and it lets the cream Polaroid mats sit naturally against the background instead of fighting a cold green.

A light-mode variant can come later; the dark gallery is the default and the identity.

### Typography

Everything below is **Geist Mono** (loaded via Google Fonts, `display=swap`). Roles differ only in size / weight / spacing / colour.

| Role | Weight | Notes |
|------|--------|-------|
| Hero name | 600 | clamp(2.6rem, 7vw, 4.5rem) — large, confident |
| Section titles | 600 | clamp(1.8rem, 4vw, 2.8rem) |
| Body / prose | 400 | 1rem, line-height 1.7–1.8, `--text-muted` |
| Photo captions | 400 | 0.55–0.7rem, letter-spacing 0.08em, `--text-muted` |
| Metadata (date / place / coords) | 400 | 0.55–0.7rem, uppercase spacing |
| Nav / small labels | 400 | 0.7rem, letter-spacing 0.15–0.22em |

### Atmosphere

- **No scanlines.** The CRT overlay is removed — it belongs to the terminal era.
- **No CRT text glow.** Headings sit clean; warmth comes from colour, not phosphor bloom.
- **Grain (optional, subtle):** a very low-opacity film-grain texture over the background (`body::before`, opacity ≤ 0.04) is on-theme where scanlines were off-theme. Optional.
- **Scroll progress bar:** keep, but restyle to `--accent` amber, 2px.
- **Vignette:** a soft radial darkening at the page edges can help prints feel spotlit. Optional.

---

## Layout System

**Max content width:** 72rem
**Reading column (blog posts):** 42rem, centred
**Sections:** ~6rem vertical padding, alternating `--bg` / `--surface`
**Section labels:** small mono kicker (e.g. `photographs`, `writing`, `beyond the lens`) with **no `$` prefix**. The label is a quiet metadata tag, amber-tinted, not a command.

---

## Navigation

**Style:** Fixed top bar, minimal.
**Logo:** `SS` monogram — Geist Mono, warm off-white, amber on hover.
**Links:** Geist Mono, 0.7rem, amber underline/marker on active (no `▋` cursor).
**Mobile:** Hamburger → stacked overlay.
**Scroll behaviour:** subtle warm backdrop blur after ~80px.

---

## Homepage Sections

### 1. Hero — The Print Table (Polaroid grid)

**The photographs are the hero.** No terminal, no full-viewport gate. The page opens directly on the scattered prints.

- A **compact header** sits above the grid: the name **Sahu** in large Geist Mono, and a one-line intro — e.g. `photographer · explorer · engineer` or a short sentence. Kept short (~20–30vh) so prints appear almost immediately, even above the fold on desktop.
- Below it, the **Polaroid grid** — all photos from `data-store/photos/`, shuffled server-side, laid out as scattered prints.

**Polaroid tile details** (carried over, they were the best part):
- Cream mat `--mat` (`#ede9e2`), padding top/sides + generous bottom caption area
- 4:3 aspect via `padding-top: 75%`
- Per-tile `--rot` variable: `rotate(calc(var(--rot) * 1deg))` — randomised -4° to +4° at build/render
- Tiles overlap (`margin: -0.6rem`) with z-index management
- Hover: straightens to 0°, scales ~1.12, rises to top
- After hover: stays on top (`.on-top`) until the next hover
- Click: opens the photo modal
- Caption in Geist Mono (the camera voice)

**Mobile:** larger tiles (~33% width), more rotation, and the prints **still overlap** (negative margins) — the scattered-on-a-table look is kept on small screens, not spaced into a neat grid.

**Future:** a "view all →" link to a dedicated `/photos` gallery once the collection outgrows a single grid (see IDEAS.md).

---

### 2. Photo modal

- `zoomFromPhoto` transition — scales from the clicked tile's viewport centre via a dynamic `transform-origin`
- Cream mat frame, full-resolution image, caption in Geist Mono
- Room to add **metadata line** (place · date, later EXIF/coords) beneath the caption in the camera voice
- Dismiss: backdrop click or `Escape`

---

### 3. Writing / Recents

**Section label:** `writing` (mono kicker, no `$`)
**Heading:** display mono, e.g. "things I've been thinking about."
**Layout:** 3-column grid desktop, single column mobile.

**Post card:**
- Cover image when `coverImageUrl` present; no placeholder on the landing page
- Title in Geist Mono; a thin **amber** hairline grows under the title on hover
- Date + read time in Geist Mono `--text-muted`
- Card lifts `translateY(-4px)` on hover

**Read-more link:** `all posts →` (amber `→` slides right on hover). Lowercase, no `ls -la`, no `$`.

---

### 4. Beyond the Lens

(Renamed from "Beyond Code" — the framing now radiates out from photography.)

**Section label:** `beyond the lens`
**Layout:** short prose blocks — *creating*, *biking*, and the *engineer* note. Photography's own copy folds into the hero/gallery, so it isn't repeated here.

Labels in a simple mono tag (drop the JSON `{ "topic": … }` braces — that was terminal flavour). One warm paragraph each. This is where the "I also write code" truth lives, understated, so the terminal easter egg feels earned rather than random.

---

### 5. Contact

**Section label:** `contact`
**Heading:** display mono, "let's connect."
**Links:** flex row, Geist Mono. linkedin · github · instagram · email · unsplash · medium · dev.to
Each: amber underline grows from centre on hover. **Unsplash** gets a slightly stronger nudge ("prints & full-res on Unsplash →") since it's the natural next step for the photography audience.

---

### 6. Footer — and the hidden terminal

Geist Mono, `--text-muted`, small.
Left: a quiet credit line.
Right: `Sahu, S` with a small blinking amber cursor `▋`.

**Easter egg — the terminal lives here.** The old interactive terminal is preserved as a component and summoned only through a subtle affordance near the footer:

- **Trigger (pick one at build):** clicking the blinking `▋` cursor in the footer, or the `SS` monogram, or a keyboard sequence (e.g. typing `sudo` anywhere on the page, matching the old `sudo → Permission denied` gag).
- **Behaviour:** opens the original green-phosphor terminal as a centred **modal/overlay** over the darkened gallery — traffic-light chrome, `$ whoami → Sahu`, the full command set (`help`, `about`, `ls`, `blog`, `contact`, `clear`, `sudo`, …), typeable input, own scroll history.
- **Dismiss:** `Escape` or backdrop click.
- **Why:** it keeps the engineer's signature intact for those who go looking, without imposing it on visitors who came for the photographs. The green terminal palette is allowed to break the gallery palette *inside the modal only* — that contrast is the joke.

The terminal's command engine and styles from the current `+page.svelte` should be **extracted into a dedicated component** (e.g. `components/terminal.svelte`) rather than deleted, then mounted behind the easter-egg trigger.

---

## Section Labels

`.section-label` becomes a plain mono metadata kicker. **Remove** the injected `$` pseudo-element. Optionally tint the label text (or a leading `—`/`·`) with `--accent`. The label names the section (`photographs`, `writing`, `beyond the lens`, `contact`), it no longer names a shell command.

---

## Photo Strip Dividers

Between sections: full-width `div.photo-strip` with a personal photograph.
- Height ~35vh, min 220px
- Image at higher fidelity now (photography is the point): `filter: grayscale(20%)` lifting to `0%` on hover — or drop the grayscale entirely and let it be full colour
- Top/bottom fade to `--bg`

---

## Data Flow

Photos live in `apps/data-store/photos/` with `photos.csv` (`Filename,Caption,CaptionWithAccents`). A `prebuild` step copies them into `apps/portfolio/static/photos/`; optimised WebP derivatives are generated into `photos-opt/{thumb,full}/` at build time (see `docs/photo-optimization.md`). The server-side `load` reads and shuffles the CSV per render. `thumb` feeds the grid, `full` feeds the modal, with a fallback to the original in `npm run dev` where derivatives don't exist.

> **Caption encoding fix:** `photos.csv` currently mojibakes accented place names — the `ü` in Kitzbühel and the `ö` in Schönbrunn come through as replacement glyphs. Clean these to proper UTF-8 (`Kitzbühel`, `Schönbrunn`) — captions are now front-and-centre in the camera voice, so the glitches show.

---

## Micro-interactions & Motion

**Philosophy:** Motion is information. Prints behave like physical objects.

| Trigger | Effect |
|---------|--------|
| Page load | `.fade-up` — opacity + `translateY(16px→0)`, staggered |
| Nav scroll | Warm backdrop after ~80px |
| Blog card hover | Cover lifts, card `translateY(-4px)`, amber hairline extends |
| Photo tile hover | Straightens, scales ~1.12, rises to top |
| Photo tile click | Zoom-from-source modal transition |
| Contact links | Amber underline grows from centre |
| Read-more arrow | `→` slides right |
| Scroll progress | Amber 2px bar across the top |
| Easter-egg trigger | Terminal modal fades/scales in over the darkened page |

**Duration baseline:** 200ms ease-out for interactive states, 600ms for entrances. Deliberate, unhurried — a gallery pace.

---

## Migration Notes (old → new)

Removed from the public page: full-viewport terminal hero, scanline overlay, CRT text glow, `$` section-label prefix, green palette, JSON-brace topic labels, `ls -la posts/` styling.
Preserved: Polaroid grid + modal + all photo machinery, blog grid, contact row, scroll progress bar, photo-strip dividers, `.fade-up` entrances.
Relocated: the entire terminal → a component behind the footer easter egg.
Recast: Geist Mono from "shell" to "camera metadata"; "Beyond Code" → "Beyond the Lens".
