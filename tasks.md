# Tasks

## Gallery (3D tour)

- [ ] Mobile/tablet controls: `engine.ts` gates non-touch input on `isTouch()` but the
      commented "orbit otherwise" path is not implemented — touch users can only tap
      frames, not move through the rooms.
- [ ] Frame aspect refresh on texture load: `frameFor()` rebuilds only the print on load;
      the liner/frame are sized from the fixed 4:3 `PRINT_ASPECT` and do not rebuild to
      the true source aspect.
- [ ] Room wash light count is hard-coded to 4 (`setupLights`), while `roomCount` comes
      from `projects.length` — tours beyond four rooms get no wash, short tours waste it.
- [ ] Picture-light fixtures are created only when `setProjects()` runs; confirm they
      dispose cleanly if `setProjects()` is called again with a different room count.

## DESIGN.md follow-ups

- [ ] Light-mode gallery variant (dark gallery is current default).
- [ ] Photo modal metadata line (place · date, later EXIF/coords).
- [ ] Dedicated `/photos` gallery once the homepage grid outgrows one screen.
- [ ] Terminal easter egg: extract command engine/styles into `components/terminal.svelte`
      and mount behind the footer trigger.

## Polish

- [x] Confirm homepage gallery link copy reads well after removing "more to come soon ;)".
- [ ] Update the stale DESIGN.md note about mojibaked captions — `photos.csv` is already
      valid UTF-8 (`Kitzbühel`, `Schönbrunn` render correctly).

## Lighting research (three.js)

- [ ] Consider an HDRI environment (e.g. Poly Haven gallery HDR) instead of the
      procedural `RoomEnvironment` for truer warm IBL and window/softbox shapes.
- [x] Verify `environmentIntensity = 0.3` and `RectAreaLight` room panels in the
      browser; tune exposure (currently `1.0`) if the room still reads flat/grey.
- [ ] Add per-picture soft shadows once frames cast off the wall (optional; the
      flat corridor currently has nothing to shadow).
