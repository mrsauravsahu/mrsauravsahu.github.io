import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { urqlClient } from '../setup/urql'
import type { Blog } from '../types/Blog'

type Photo = { filename: string; caption: string }

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

function parseCsvCaptions(content: string): Map<string, string> {
  const [header, ...rows] = content.trim().split('\n')
  const cols = parseCsvRow(header).map(h => h.trim())
  const filenameIdx = cols.indexOf('Filename')
  const captionIdx = cols.indexOf('Caption')
  const map = new Map<string, string>()
  for (const row of rows) {
    const fields = parseCsvRow(row)
    const filename = fields[filenameIdx]?.trim()
    if (filename) map.set(filename, fields[captionIdx]?.trim() ?? '')
  }
  return map
}

export const load = async () => {
  let blogs: Blog[] = []
  let photos: Photo[] = []

  try {
    const photosDir = join(process.cwd(), 'static/photos')
    const files = (await readdir(photosDir)).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
    let captions = new Map<string, string>()
    try {
      const csv = await readFile(join(photosDir, 'photos.csv'), 'utf-8')
      captions = parseCsvCaptions(csv)
    } catch { /* captions optional */ }
    photos = files.map(filename => ({ filename, caption: captions.get(filename) ?? '' }))
      .sort(() => Math.random() - 0.5)
  } catch (e) {
    console.warn('Could not load photos:', e)
  }

  try {
    let state = {
      endCursor: undefined as string | undefined,
      hasNextPage: true,
    }

    do {
      // eslint-disable-next-line no-await-in-loop
      const allBlogsResponse = await urqlClient.query(`
          query ($after: String) {
              blogs(first: 1, after: $after, order: {
                  createdAt: DESC
              }) {
                  nodes {
                      id
                      title
                      description
                      createdAt
                      approxTimeToRead
                      coverImageUrl
                  }
                  pageInfo {
                      endCursor
                      hasNextPage
                  }
              }
          }
      `, { after: state.endCursor }).toPromise()

      blogs = [...blogs, ...(allBlogsResponse?.data?.blogs?.nodes || [])]
      state = {
        hasNextPage: allBlogsResponse?.data?.blogs?.pageInfo?.hasNextPage || false,
        endCursor: allBlogsResponse?.data?.blogs?.pageInfo?.endCursor || undefined,
      }
    } while (state.hasNextPage)
  } catch (e) {
    console.warn('Could not fetch blogs from API:', e)
  }

  return { blogs, totalCount: blogs.length, photos }
}
