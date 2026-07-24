# IDEAS.md — idea bank

Loose, unprioritised ideas for the portfolio. Not commitments. Promote to `DESIGN.md` when a direction is chosen.

---

## World map of trips (Polaroids pinned to places)

Highlight the various trips as a **world map with Polaroids pinned to the places they were shot**.

- Each photo (or a curated hero shot per trip) sits as a small print pinned to its location on a map.
- Group photos by trip / city — the `photos.csv` captions already carry places (Kitzbühel, Munich, Innsbruck, Vienna, …); a `location` / `lat,lng` column would drive placement.
- Interaction ideas: hover a pin → the Polaroid pops/straightens; click → opens the existing photo modal, or zooms into that trip's set.
- Could be its own page (`/travels` or `/map`) linked from the hero's "view all →", keeping the homepage grid curated.
- Fits the "camera voice" metadata theme — pins can show place · date · coordinates in Geist Mono.
- Map styling should match the warm gallery palette (custom muted/warm tiles or a hand-drawn/flat vector map), not a default blue Google/OSM look.

**Open questions:** static SVG world map vs. interactive tiles (Leaflet/MapLibre); how to store coordinates (extend `photos.csv` vs. a separate `trips.csv`); clustering when many photos share one city.

---

## Other seeds

- **Dedicated `/photos` gallery** for the full collection once the homegrid outgrows one screen; homepage stays curated.
- **Per-trip albums** — "Austria 2026", etc. — as filterable sets.
- **EXIF / camera metadata** on the modal (shutter, ISO, focal length, lens) in the camera voice.
- **Prints / Unsplash CTA** made more prominent for the photography audience.
- **Light-mode gallery variant** of the warm palette.
