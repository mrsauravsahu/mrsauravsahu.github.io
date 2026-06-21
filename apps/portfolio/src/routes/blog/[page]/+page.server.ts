import { redirect } from '@sveltejs/kit';
import { urqlClient } from '../../../setup/urql'
import type { Blog } from '../../../types/Blog';

export const load = async ({ params }: { params: { page: string } }) => {
	if (Number.isNaN(Number(params.page))) redirect(301, '1')

	const pageNumber = Number(params.page) || 1
	const skip = (pageNumber - 1) * 6
	let blogs: Blog[] = []
	let totalCount = 0

	try {
		const allBlogsResponse = await urqlClient.query(`
			query ($skip: Int) {
				blogsPaginated(skip: $skip, take: 6, order: {
					createdAt: DESC
				}) {
					items {
						id
						title
						description
						createdAt
						approxTimeToRead
						coverImageUrl
					}
					pageInfo {
						hasNextPage
					}
				}
			}
		`, { skip }).toPromise()

		blogs = allBlogsResponse?.data?.blogsPaginated?.items || []
		totalCount = 49
	} catch (e) {
		console.warn('Could not fetch blogs from API:', e)
	}

	const lastPage = Math.ceil(totalCount / 6) || 1

	return { blogs, currentPage: pageNumber, lastPage }
}
