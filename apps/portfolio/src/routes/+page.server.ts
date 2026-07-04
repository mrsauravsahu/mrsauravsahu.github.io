import { readFile } from 'fs/promises'
import { join } from 'path'
import { urqlClient } from '../setup/urql'
import type { Blog } from '../types/Blog'

type Photo = { filename: string; caption: string }

function parseCsv(content: string): Photo[] {
  const [, ...rows] = content.trim().split('\n')
  return rows.map(row => {
    const comma = row.indexOf(',')
    return {
      filename: row.slice(0, comma).trim(),
      caption: row.slice(comma + 1).trim().replace(/^"|"$/g, ''),
    }
  })
}

export const load = async () => {
  let blogs: Blog[] = []
  let photos: Photo[] = []

  try {
    const csv = await readFile(join(process.cwd(), 'static/photos/photos.csv'), 'utf-8')
    photos = parseCsv(csv).sort(() => Math.random() - 0.5)
  } catch (e) {
    console.warn('Could not read photos.csv:', e)
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
