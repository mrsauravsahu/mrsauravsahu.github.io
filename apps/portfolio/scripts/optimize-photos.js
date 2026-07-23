// Build-time photo optimizer.
//
// The homepage photo dump previously served the original ~4000px, multi-MB
// phone photos straight from static/photos/ for BOTH the grid thumbnails and
// the modal — ~82 MB downloaded on page load. This generates small,
// display-sized WebP derivatives that the page references instead:
//
//   static/photos-opt/thumb/<name>.webp   grid tiles  (~200-320px on screen)
//   static/photos-opt/full/<name>.webp    modal view  (max ~800px wide)
//
// Sizes are 2x the max on-screen size to stay crisp on HiDPI displays.
// Output is gitignored and regenerated on every `npm run build`. Idempotent:
// a derivative is only re-encoded when the source is newer.
//
// EXIF orientation matters here — several originals carry an orientation tag
// (e.g. Galaxy "upper-right"). sharp().rotate() with no args bakes that
// rotation into the pixels and drops the tag, so the re-encoded WebP looks the
// same as the browser-auto-oriented JPEG. Without it, some photos come out
// sideways.

import { readdir, mkdir, stat } from 'fs/promises';
import { join, parse } from 'path';
import sharp from 'sharp';

const SRC_DIR = join(process.cwd(), 'static/photos');
const OUT_DIR = join(process.cwd(), 'static/photos-opt');

const VARIANTS = [
	{ name: 'thumb', width: 640, quality: 72 },
	{ name: 'full', width: 1600, quality: 80 },
];

const IMAGE_RE = /\.(jpe?g|png)$/i;

async function mtimeMs(path) {
	try {
		return (await stat(path)).mtimeMs;
	} catch {
		return -Infinity; // missing => always older than source
	}
}

async function run() {
	let files;
	try {
		files = (await readdir(SRC_DIR)).filter((f) => IMAGE_RE.test(f));
	} catch (e) {
		console.warn(`[optimize-photos] no source dir at ${SRC_DIR}, skipping`, e.message);
		return;
	}

	for (const variant of VARIANTS) {
		await mkdir(join(OUT_DIR, variant.name), { recursive: true });
	}

	let generated = 0;
	let skipped = 0;

	for (const file of files) {
		const src = join(SRC_DIR, file);
		const base = parse(file).name;
		const srcMtime = await mtimeMs(src);

		for (const variant of VARIANTS) {
			const out = join(OUT_DIR, variant.name, `${base}.webp`);
			if ((await mtimeMs(out)) >= srcMtime) {
				skipped++;
				continue;
			}
			await sharp(src)
				.rotate() // bake in EXIF orientation, then strip the tag
				.resize({ width: variant.width, withoutEnlargement: true })
				.webp({ quality: variant.quality })
				.toFile(out);
			generated++;
		}
	}

	console.log(
		`[optimize-photos] ${files.length} source photo(s): ${generated} generated, ${skipped} up-to-date`
	);
}

run().catch((e) => {
	console.error('[optimize-photos] failed:', e);
	process.exit(1);
});
