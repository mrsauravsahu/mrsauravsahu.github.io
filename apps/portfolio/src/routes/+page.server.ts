import { urqlClient } from '../setup/urql'
import type { Blog } from '../types/Blog'

export const load = async () => {
  let blogs: Blog[] = []

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

  return { blogs, totalCount: blogs.length }
}
