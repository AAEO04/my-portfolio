import { NextResponse } from 'next/server';

// Kaggle API Configuration
const KAGGLE_USERNAME = process.env.KAGGLE_USERNAME || 'allieniola';
const KAGGLE_KEY = process.env.KAGGLE_KEY || '';

// Kaggle API base URL
const KAGGLE_API_URL = 'https://www.kaggle.com/api/v1';

interface KaggleKernel {
    ref: string;
    title: string;
    author: string;
    slug: string;
    lastRunTime: string;
    totalVotes: number;
    language: string;
    kernelType: string;
}

interface KaggleProfile {
    username: string;
    displayName: string;
    tier: string;
    points: number;
    ranking: number;
    medals: {
        gold: number;
        silver: number;
        bronze: number;
    };
}

interface KaggleNotebook {
    id: string;
    projectId: string;
    name: string;
    description: string;
    kaggleUrl: string;
    votes: number;
    language: string;
    kernelType: string;
    lastRun: string;
    // For projects integration
    material: string;
    tolerance: string;
    application: string;
    source: 'kaggle';
}

// Create Base64 auth header for Kaggle API
function getAuthHeader(): string {
    const credentials = `${KAGGLE_USERNAME}:${KAGGLE_KEY}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
}

// Transform Kaggle kernel to notebook format
function transformKernel(kernel: KaggleKernel): KaggleNotebook {
    const languageMap: Record<string, string> = {
        'python': 'Python, Jupyter',
        'r': 'R, RMarkdown',
        'julia': 'Julia',
    };

    const typeMap: Record<string, string> = {
        'notebook': 'Jupyter Notebook',
        'script': 'Python Script',
    };

    return {
        id: kernel.slug.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        projectId: `KAGGLE_${kernel.slug.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
        name: kernel.title,
        description: `A ${kernel.kernelType} written in ${kernel.language}`,
        kaggleUrl: `https://www.kaggle.com/code/${kernel.ref}`,
        votes: kernel.totalVotes,
        language: kernel.language,
        kernelType: kernel.kernelType,
        lastRun: kernel.lastRunTime,
        // Project-compatible fields
        material: languageMap[kernel.language.toLowerCase()] || kernel.language,
        tolerance: kernel.totalVotes > 10 ? `${kernel.totalVotes}+ Votes` : 'Published',
        application: typeMap[kernel.kernelType.toLowerCase()] || 'Data Science',
        source: 'kaggle',
    };
}

export async function GET() {
    // Check if credentials are configured
    if (!KAGGLE_USERNAME || !KAGGLE_KEY) {
        return NextResponse.json({
            profile: null,
            notebooks: [],
            error: 'Kaggle credentials not configured',
            configured: false,
        });
    }

    try {
        const headers: HeadersInit = {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
        };

        // Fetch user's kernels/notebooks
        const kernelsResponse = await fetch(
            `${KAGGLE_API_URL}/kernels/list?user=${KAGGLE_USERNAME}&pageSize=10`,
            {
                headers,
                next: { revalidate: 3600 } // Cache for 1 hour
            }
        );

        let notebooks: KaggleNotebook[] = [];

        if (kernelsResponse.ok) {
            const kernels: KaggleKernel[] = await kernelsResponse.json();
            notebooks = kernels.map(transformKernel);
        }

        // Note: Kaggle doesn't have a direct profile endpoint via REST API
        // Profile data would need to be scraped or manually configured
        // For now, return a placeholder that can be updated in env
        const profile: KaggleProfile = {
            username: KAGGLE_USERNAME,
            displayName: process.env.KAGGLE_DISPLAY_NAME || KAGGLE_USERNAME,
            tier: process.env.KAGGLE_TIER || 'Contributor',
            points: parseInt(process.env.KAGGLE_POINTS || '0'),
            ranking: parseInt(process.env.KAGGLE_RANKING || '0'),
            medals: {
                gold: parseInt(process.env.KAGGLE_GOLD_MEDALS || '0'),
                silver: parseInt(process.env.KAGGLE_SILVER_MEDALS || '0'),
                bronze: parseInt(process.env.KAGGLE_BRONZE_MEDALS || '0'),
            },
        };

        return NextResponse.json({
            profile,
            notebooks,
            configured: true,
            fetchedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Kaggle API Error:', error);

        return NextResponse.json({
            profile: null,
            notebooks: [],
            error: 'Failed to fetch from Kaggle API',
            configured: true,
            fetchedAt: new Date().toISOString(),
        }, { status: 500 });
    }
}
