import { urqlClient } from '../setup/urql'
import type { Blog } from '../types/Blog'
import { loadPhotos } from '../lib/server/photos'

export const load = async () => {
  let blogs: Blog[] = []
  const photos = (await loadPhotos()).sort(() => Math.random() - 0.5)

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

      // urql resolves (rather than rejects) on network/GraphQL errors, so they
      // must be checked explicitly or they fail silently and blogs end up empty.
      if (allBlogsResponse.error) throw allBlogsResponse.error

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
