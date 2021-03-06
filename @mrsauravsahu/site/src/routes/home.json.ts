import { urqlClient } from "../setup/urql";

const superagent = require('superagent');

export const get = async (_, res) => {

    // Get highlights
    const highlightsUrl = `${process.env.BLOGS_BASE_URL}/api/Highlights?Sorts=-createdAt`;
    console.log(`Fetching highlights from: ${highlightsUrl}`)
    const allHighlightsResponse = await urqlClient.query(`
    {
        highlights {
            id
            title
            url
            description
        }
    }
    `).toPromise()

    // Get latest blog post
    const dataUrl = `${process.env.BLOGS_BASE_URL}/api/Blogs?Sorts=-createdAt&Page=1&PageSize=1`;
    console.log(`Fetching latest blog from: ${dataUrl}`)
    const latestBlogResponse = await urqlClient.query(`
    {   
        blogs(first: 1, order: {
            createdAt: DESC
        }) {
            nodes {
                id
                title
                description
                createdAt
                approxTimeToRead
            }
        }
    }
    `).toPromise()

    const { data: { blogs: { nodes: [latestBlog] } } } = latestBlogResponse

    // Return all data
    const jsonString = JSON.stringify({ ...allHighlightsResponse.data, latestBlog });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(jsonString);
}