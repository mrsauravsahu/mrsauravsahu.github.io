import { readFile, readdir } from 'fs/promises'
import { join } from 'path'

// `thumb`/`full` point at the build-time WebP derivatives (see
// scripts/optimize-photos.js). `filename` is the original, kept as an on:error
// fallback so the grid still works in `npm run dev`, which skips the optimizer.
export type Photo = {
  filename: string
  caption: string
  project: string
  thumb: string
  full: string
}

export type Project = {
  slug: string
  title: string
  photos: Photo[]
}

function parseCsvRow(row: string): string[] {
  const fields: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { fields.push(field); field = '' }
      else field += ch
    }
  }
  fields.push(field)
  return fields
}

// The `Project` column is optional: photos without one keep their previous
// behaviour (a flat, shuffled list captioned from `Caption`). Supplying it
// groups the prints into rooms for the 3D gallery without breaking the grid.
function parseCsv(content: string): Map<string, { caption: string; project: string }> {
  const [header, ...rows] = content.trim().split('\n')
  const cols = parseCsvRow(header).map((h) => h.trim())
  const filenameIdx = cols.indexOf('Filename')
  const captionIdx = cols.indexOf('Caption')
  const projectIdx = cols.indexOf('Project')
  const map = new Map<string, { caption: string; project: string }>()
  for (const row of rows) {
    const fields = parseCsvRow(row)
    const filename = fields[filenameIdx]?.trim()
    if (!filename) continue
    map.set(filename, {
      caption: fields[captionIdx]?.trim() ?? '',
      project: (projectIdx >= 0 ? fields[projectIdx]?.trim() : '') ?? ''
    })
  }
  return map
}

export async function loadPhotos(): Promise<Photo[]> {
  try {
    const photosDir = join(process.cwd(), 'static/photos')
    const files = (await readdir(photosDir)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    let meta = new Map<string, { caption: string; project: string }>()
    try {
      const csv = await readFile(join(photosDir, 'photos.csv'), 'utf-8')
      meta = parseCsv(csv)
    } catch { /* captions optional */ }
    return files.map((filename) => {
      const base = filename.replace(/\.[^.]+$/, '')
      const entry = meta.get(filename)
      return {
        filename,
        caption: entry?.caption ?? '',
        project: entry?.project ?? '',
        thumb: `/photos-opt/thumb/${base}.webp`,
        full: `/photos-opt/full/${base}.webp`,
      }
    })
  } catch (e) {
    console.warn('Could not load photos:', e)
    return []
  }
}

// Grouped rooms, in a stable order — not shuffled, so a tour walks the walls in
// the order the photographs belong together. Photos without a `Project` are
// omitted from the tour but still appear in the flat home grid.
export function groupPhotos(photos: Photo[]): Project[] {
  const order: string[] = []
  const byProject = new Map<string, Photo[]>()
  for (const photo of photos) {
    if (!photo.project) continue
    if (!byProject.has(photo.project)) { byProject.set(photo.project, []); order.push(photo.project) }
    byProject.get(photo.project)!.push(photo)
  }
  return order.map((slug) => ({ slug, title: slug, photos: byProject.get(slug)! }))
}
