import { NextResponse } from 'next/server';

// Credly username from profile URL
const CREDLY_USERNAME = process.env.CREDLY_USERNAME || 'ayomide-alli.758389b9';

interface CredlyBadge {
    id: string;
    issued_at: string;
    issued_at_date: string;
    expires_at: string | null;
    badge_template: {
        id: string;
        name: string;
        description: string;
        image_url: string;
        issuer: {
            name: string;
            vanity_url: string;
        };
        skills: { name: string }[];
    };
    public_url: string;
}

interface CredlyResponse {
    data: CredlyBadge[];
    metadata?: {
        count: number;
        total_count: number;
    };
}

interface TransformedBadge {
    id: string;
    name: string;
    description: string;
    issuer: string;
    issuerUrl: string;
    imageUrl: string;
    issuedDate: string;
    expiresAt: string | null;
    verifyUrl: string;
    skills: string[];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
    });
}

function transformBadge(badge: CredlyBadge): TransformedBadge {
    return {
        id: badge.id,
        name: badge.badge_template.name,
        description: badge.badge_template.description || 'No description available',
        issuer: badge.badge_template.issuer.name,
        issuerUrl: badge.badge_template.issuer.vanity_url
            ? `https://www.credly.com/organizations/${badge.badge_template.issuer.vanity_url}`
            : '',
        imageUrl: badge.badge_template.image_url,
        issuedDate: formatDate(badge.issued_at_date || badge.issued_at),
        expiresAt: badge.expires_at ? formatDate(badge.expires_at) : null,
        verifyUrl: badge.public_url,
        skills: badge.badge_template.skills?.map(s => s.name).slice(0, 5) || [],
    };
}

export async function GET() {
    try {
        // Fetch from Credly's public badges endpoint
        const response = await fetch(
            `https://www.credly.com/users/${CREDLY_USERNAME}/badges.json`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Portfolio-App',
                },
                next: { revalidate: 3600 } // Cache for 1 hour (ISR)
            }
        );

        if (!response.ok) {
            // Profile might not exist or be private
            if (response.status === 404) {
                return NextResponse.json({
                    badges: [],
                    username: CREDLY_USERNAME,
                    message: 'Profile not found or no badges yet',
                    fetchedAt: new Date().toISOString(),
                });
            }
            throw new Error(`Credly API error: ${response.status}`);
        }

        const data: CredlyResponse = await response.json();
        const badges = (data.data || []).map(transformBadge);

        return NextResponse.json({
            badges,
            username: CREDLY_USERNAME,
            totalCount: data.metadata?.total_count || badges.length,
            fetchedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Credly API Error:', error);

        // Return empty badges on error (will show "Coming Soon")
        return NextResponse.json({
            badges: [],
            username: CREDLY_USERNAME,
            error: 'Failed to fetch from Credly',
            fetchedAt: new Date().toISOString(),
        }, { status: 200 }); // Return 200 so component handles gracefully
    }
}
