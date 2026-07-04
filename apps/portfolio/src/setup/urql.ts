import { Client, fetchExchange } from '@urql/core'
import { env } from '$env/dynamic/private'

const blogsApiUrl = env.BLOGS_API_URL ?? 'http://localhost:30001'

export const urqlClient = new Client({
  url: `${blogsApiUrl}/graphql`,
  exchanges: [fetchExchange],
})
