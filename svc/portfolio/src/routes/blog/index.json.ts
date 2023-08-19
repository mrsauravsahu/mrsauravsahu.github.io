import {urqlClient} from '../../setup/urql'
import {variables} from '$lib/variables'

export const get = async () => {
  let state = {
    endCursor: undefined,
    hasNextPage: true,
  }

  let blogs = []

  do {
    // eslint-disable-next-line no-await-in-loop
    try {
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
                    startCursor
                    hasNextPage
                }
            }
        }
    `, {after: state.endCursor}).toPromise()

    console.log('resp', allBlogsResponse)
    
    blogs = [...blogs, ...(allBlogsResponse.data.blogs.nodes || [])]
    state = {
      hasNextPage: allBlogsResponse.data.blogs.pageInfo.hasNextPage,
      endCursor: allBlogsResponse.data.blogs.pageInfo.endCursor,
    }}
    catch(error) {
      console.log(error)
    }
  } while (state.hasNextPage)

  return {
    body: {
      blogs,
      totalCount: blogs.length,
    },
    status: 200,
    headers: {'Content-Type': 'application/json'},
  }
}
