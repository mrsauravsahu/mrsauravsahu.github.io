import { urqlClient } from '../../../../setup/urql.js';
import { env } from '$env/dynamic/private'

export const load = async ({ params, fetch }) => {
  const blogsApiUrl = env.BLOGS_API_URL ?? 'http://localhost:30001'
  // console.log(`Running Load Function for /blog/posts/${params.blogId}`)

  let blogContentRespose = await fetch(`${blogsApiUrl}/api/blogs/${params.blogId}/file`)
  let blogContent = await blogContentRespose.text()

  let blogResponse = await urqlClient
    .query(
      `
    		query ($blogId: Int!) {
    		blogById(input: {
    			id: $blogId
    		}) {
    			id
    			title
    			description
    			createdAt
    			approxTimeToRead
    			coverImageUrl
    		}
    		}`,
      { blogId: +params.blogId }
    )
    .toPromise();

    let blog = blogResponse.data.blogById;

  return {
    blog,
    blogId: params.blogId,
    blogContent
  }
}
