import { NextResponse } from 'next/server';

// Hashnode publication host - change this to your blog
const HASHNODE_HOST = process.env.HASHNODE_PUBLICATION_HOST || 'aaeo.hashnode.dev';

interface HashnodePost {
    id: string;
    title: string;
    brief: string;
    slug: string;
    publishedAt: string;
    readTimeInMinutes: number;
    url: string;
    tags: { name: string }[];
    coverImage?: { url: string };
}

interface HashnodeResponse {
    data?: {
        publication?: {
            posts: {
                edges: {
                    node: HashnodePost;
                }[];
            };
        };
    };
    errors?: { message: string }[];
}

interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    tags: string[];
    url: string;
    coverImage?: string;
}

const HASHNODE_QUERY = `
    query GetPosts($host: String!) {
        publication(host: $host) {
            posts(first: 6) {
                edges {
                    node {
                        id
                        title
                        brief
                        slug
                        publishedAt
                        readTimeInMinutes
                        url
                        tags {
                            name
                        }
                        coverImage {
                            url
                        }
                    }
                }
            }
        }
    }
`;

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function transformPost(post: HashnodePost): BlogPost {
    return {
        id: post.id,
        title: post.title,
        excerpt: post.brief || 'No description available',
        date: formatDate(post.publishedAt),
        readTime: `${post.readTimeInMinutes} min`,
        tags: post.tags.map(tag => tag.name).slice(0, 3), // Max 3 tags
        url: post.url,
        coverImage: post.coverImage?.url,
    };
}

export async function GET() {
    try {
        const response = await fetch('https://gql.hashnode.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: HASHNODE_QUERY,
                variables: {
                    host: HASHNODE_HOST,
                },
            }),
            next: { revalidate: 3600 } // Cache for 1 hour (ISR)
        });

        if (!response.ok) {
            throw new Error(`Hashnode API error: ${response.status}`);
        }

        const result: HashnodeResponse = await response.json();

        if (result.errors) {
            console.error('Hashnode GraphQL errors:', result.errors);
            throw new Error(result.errors[0]?.message || 'GraphQL error');
        }

        const posts = result.data?.publication?.posts?.edges || [];
        const blogPosts = posts.map(edge => transformPost(edge.node));

        return NextResponse.json({
            posts: blogPosts,
            publicationHost: HASHNODE_HOST,
            fetchedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Hashnode API Error:', error);

        // Return empty posts on error (will show "Coming Soon")
        return NextResponse.json({
            posts: [],
            error: 'Failed to fetch from Hashnode',
            fetchedAt: new Date().toISOString(),
        }, { status: 200 }); // Return 200 so component handles gracefully
    }
}
