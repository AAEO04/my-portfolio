import { NextResponse } from 'next/server';

// GitHub username - change this to your username
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'AAEO04';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional, for higher rate limits

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    topics: string[];
    fork: boolean;
    created_at: string;
    updated_at: string;
    pushed_at: string;
}

interface ProjectData {
    id: string;
    projectId: string;
    version: string;
    name: string;
    description: string;
    material: string;
    tolerance: string;
    application: string;
    githubUrl: string;
    liveUrl: string;
    stars: number;
    forks: number;
    language: string;
    topics: string[];
    updatedAt: string;
    // Interactive elements - auto-generated
    codeSnippet?: string;
    codeFileName?: string;
    terminalCommands?: string[];
    hasSlider?: boolean;
    specs?: {
        accuracy: string;
        architecture: string;
        standard: string;
    };
}

// Map languages to "material" style descriptions
function getMaterial(language: string | null, topics: string[]): string {
    const materials: string[] = [];

    if (language) materials.push(language);

    // Add relevant topics as materials
    const techTopics = topics.filter(t =>
        ['react', 'nextjs', 'typescript', 'python', 'fastapi', 'docker', 'postgresql', 'supabase', 'tailwindcss', 'rust', 'tensorflow', 'pytorch'].includes(t.toLowerCase())
    );
    materials.push(...techTopics.map(t => t.charAt(0).toUpperCase() + t.slice(1)));

    return materials.slice(0, 4).join(', ') || 'Various';
}

// Generate application based on topics
function getApplication(topics: string[], description: string): string {
    const desc = description.toLowerCase();

    if (topics.includes('machine-learning') || topics.includes('ai') || desc.includes('ml') || desc.includes('detection')) {
        return 'Machine Learning';
    }
    if (topics.includes('web') || topics.includes('frontend') || desc.includes('website') || desc.includes('portfolio')) {
        return 'Web Development';
    }
    if (topics.includes('api') || topics.includes('backend') || desc.includes('api')) {
        return 'Backend Systems';
    }
    if (topics.includes('cli') || topics.includes('tool') || desc.includes('tool')) {
        return 'Developer Tools';
    }
    if (topics.includes('library') || topics.includes('package')) {
        return 'Software Library';
    }
    return 'Software Engineering';
}

// Generate tolerance/metric based on project type
function getTolerance(repo: GitHubRepo): string {
    if (repo.stargazers_count > 100) {
        return `${repo.stargazers_count}+ GitHub Stars`;
    }
    if (repo.language === 'Python') {
        return 'Type-Checked & Tested';
    }
    if (repo.language === 'TypeScript') {
        return 'Strictly Typed';
    }
    if (repo.language === 'Rust') {
        return 'Memory Safe';
    }
    return 'Production Ready';
}

// Generate file extension based on language
function getFileExtension(language: string | null): string {
    const extensions: Record<string, string> = {
        'Python': 'py',
        'TypeScript': 'ts',
        'JavaScript': 'js',
        'Rust': 'rs',
        'Go': 'go',
        'Java': 'java',
        'C++': 'cpp',
        'C#': 'cs',
        'Ruby': 'rb',
        'PHP': 'php',
    };
    return extensions[language || ''] || 'txt';
}

// Generate terminal install commands based on language
function getTerminalCommands(repo: GitHubRepo): string[] | undefined {
    const name = repo.name.toLowerCase().replace(/-/g, '_');
    const language = repo.language;

    if (language === 'Python') {
        return [
            `$ pip install ${name}`,
            `Collecting ${name}`,
            `Installing collected packages: ${name}`,
            `Successfully installed ${name}-1.0.0`,
        ];
    }
    if (language === 'Rust') {
        return [
            `$ cargo install ${repo.name}`,
            `Downloading ${repo.name} v1.0.0`,
            `Compiling ${repo.name} v1.0.0`,
            `Installed package \`${repo.name}\` (executable)`,
        ];
    }
    if (language === 'TypeScript' || language === 'JavaScript') {
        return [
            `$ npm install ${repo.name}`,
            `added 1 package in 2s`,
            `npm WARN ${repo.name}@1.0.0 No description`,
        ];
    }
    if (language === 'Go') {
        return [
            `$ go install github.com/${process.env.GITHUB_USERNAME || 'user'}/${repo.name}@latest`,
            `go: downloading ${repo.name} v1.0.0`,
            `go: added ${repo.name} v1.0.0`,
        ];
    }

    return undefined;
}

// Generate code snippet based on language
function getCodeSnippet(repo: GitHubRepo): { code: string; fileName: string } | undefined {
    const name = repo.name;
    const moduleName = name.toLowerCase().replace(/-/g, '_');
    const language = repo.language;

    if (language === 'Python') {
        return {
            code: `from ${moduleName} import ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}

# Initialize and configure
client = ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}()
result = client.run()

print(result)`,
            fileName: `main.${getFileExtension(language)}`
        };
    }
    if (language === 'Rust') {
        return {
            code: `use ${moduleName}::prelude::*;

fn main() -> Result<(), Box<dyn Error>> {
    let config = Config::default();
    let result = ${moduleName}::run(&config)?;
    
    println!("{:?}", result);
    Ok(())
}`,
            fileName: `main.${getFileExtension(language)}`
        };
    }
    if (language === 'TypeScript') {
        return {
            code: `import { ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} } from '${repo.name}';

const client = new ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}();

async function main() {
    const result = await client.execute();
    console.log(result);
}`,
            fileName: `index.${getFileExtension(language)}`
        };
    }
    if (language === 'JavaScript') {
        return {
            code: `const { ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} } = require('${repo.name}');

const client = new ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}();

client.run().then(result => {
    console.log(result);
});`,
            fileName: `index.${getFileExtension(language)}`
        };
    }

    return undefined;
}

// Check if project is ML/AI related
function isMLProject(repo: GitHubRepo): boolean {
    const mlTopics = ['machine-learning', 'deep-learning', 'ai', 'artificial-intelligence',
        'computer-vision', 'neural-network', 'tensorflow', 'pytorch',
        'detection', 'classification', 'nlp'];
    const mlKeywords = ['detection', 'classifier', 'neural', 'model', 'cnn', 'rnn',
        'transformer', 'prediction', 'training', 'dataset'];

    const hasMLTopic = repo.topics.some(t => mlTopics.includes(t.toLowerCase()));
    const hasMLKeyword = mlKeywords.some(kw =>
        (repo.description || '').toLowerCase().includes(kw) ||
        repo.name.toLowerCase().includes(kw)
    );

    return hasMLTopic || hasMLKeyword;
}

// Get ML specs based on project
function getMLSpecs(repo: GitHubRepo): { accuracy: string; architecture: string; standard: string } | undefined {
    if (!isMLProject(repo)) return undefined;

    // Try to infer architecture from topics/description
    const desc = (repo.description || '').toLowerCase();
    let architecture = 'Neural Network';

    if (desc.includes('resnet') || repo.topics.includes('resnet')) architecture = 'ResNet';
    else if (desc.includes('yolo') || repo.topics.includes('yolo')) architecture = 'YOLO';
    else if (desc.includes('transformer')) architecture = 'Transformer';
    else if (desc.includes('cnn') || repo.topics.includes('cnn')) architecture = 'CNN';
    else if (desc.includes('lstm') || repo.topics.includes('lstm')) architecture = 'LSTM';
    else if (desc.includes('bert') || repo.topics.includes('bert')) architecture = 'BERT';
    else if (repo.topics.includes('tensorflow')) architecture = 'TensorFlow Model';
    else if (repo.topics.includes('pytorch')) architecture = 'PyTorch Model';

    return {
        accuracy: '~85%',  // Placeholder - could be fetched from README
        architecture,
        standard: 'Best Practices',
    };
}

function transformRepo(repo: GitHubRepo): ProjectData {
    const codeData = getCodeSnippet(repo);
    const mlSpecs = getMLSpecs(repo);

    return {
        id: repo.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        projectId: repo.name.toUpperCase().replace(/-/g, '_'),
        version: '1.0.0',
        name: repo.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: repo.description || 'A software project',
        material: getMaterial(repo.language, repo.topics),
        tolerance: getTolerance(repo),
        application: getApplication(repo.topics, repo.description || ''),
        githubUrl: repo.html_url,
        liveUrl: repo.homepage || '',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language || 'Unknown',
        topics: repo.topics,
        updatedAt: repo.pushed_at,
        // Auto-generated interactions
        codeSnippet: codeData?.code,
        codeFileName: codeData?.fileName,
        terminalCommands: getTerminalCommands(repo),
        hasSlider: isMLProject(repo),
        specs: mlSpecs,
    };
}

export async function GET() {
    try {
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Portfolio-App',
        };

        // Add auth token if available (increases rate limit from 60 to 5000 req/hr)
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        // Fetch repos sorted by recently pushed
        const response = await fetch(
            `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=30&type=owner`,
            {
                headers,
                next: { revalidate: 3600 } // Cache for 1 hour (ISR)
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos: GitHubRepo[] = await response.json();

        // Filter out forks, config repos, and transform
        const projects = repos
            .filter(repo => {
                // Skip forks
                if (repo.fork) return false;
                // Skip profile config repos
                if (repo.name.toLowerCase() === repo.full_name.split('/')[0].toLowerCase()) return false;
                if (repo.name.toLowerCase().includes('config')) return false;
                // Exclude portfolio site itself
                if (repo.name.toLowerCase().includes('portfolio')) return false;
                // Include all other repos (even without descriptions)
                return true;
            })
            .slice(0, 6) // Top 6 projects
            .map(transformRepo);

        return NextResponse.json({
            projects,
            username: GITHUB_USERNAME,
            fetchedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('GitHub API Error:', error);

        // Return fallback data on error
        return NextResponse.json({
            projects: [],
            error: 'Failed to fetch from GitHub',
            fetchedAt: new Date().toISOString(),
        }, { status: 500 });
    }
}
