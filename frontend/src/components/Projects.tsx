'use client';

import { useState, useEffect } from 'react';
import styles from './Projects.module.css';

interface ProjectData {
    id: string;
    projectId: string;
    version?: string;
    name: string;
    description: string;
    material: string;
    tolerance: string;
    application: string;
    githubUrl?: string;
    liveUrl?: string;
    kaggleUrl?: string;
    stars?: number;
    forks?: number;
    votes?: number;
    language?: string;
    topics?: string[];
    source?: 'github' | 'kaggle';
    // Interactive elements - auto-generated from API
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

type FilterType = 'all' | 'github' | 'kaggle';

// Project type detection
type ProjectType = 'website' | 'bot' | 'ml' | 'cli' | 'api' | 'library' | 'default';

function getProjectType(project: ProjectData): ProjectType {
    const searchText = [
        project.name,
        project.description,
        ...(project.topics || [])
    ].join(' ').toLowerCase();

    // Library/Package detection (check first - more specific)
    if (/\b(library|package|pip|pypi|npm|module|sdk|wrapper|client)\b/.test(searchText)) {
        return 'library';
    }
    // Website detection
    if (/\b(web|website|react|nextjs|next\.js|frontend|vue|angular|html|css|tailwind|vite)\b/.test(searchText)) {
        return 'website';
    }
    // Bot detection
    if (/\b(bot|discord|telegram|slack|automation|chatbot|whatsapp)\b/.test(searchText)) {
        return 'bot';
    }
    // API detection
    if (/\b(api|fastapi|rest|graphql|backend|server|express|flask|django)\b/.test(searchText)) {
        return 'api';
    }
    // ML detection
    if (/\b(machine.?learning|ml|data.?science|kaggle|tensorflow|pytorch|model|neural|prediction|classification)\b/.test(searchText)) {
        return 'ml';
    }
    // CLI detection
    if (/\b(cli|terminal|command.?line|shell|bash|script)\b/.test(searchText)) {
        return 'cli';
    }
    return 'default';
}

// Type-specific preview components
function WebsitePreview({ project }: { project: ProjectData }) {
    return (
        <div className={styles.websitePreview}>
            <div className={styles.browserFrame}>
                <div className={styles.browserHeader}>
                    <span className={styles.browserDot} style={{ background: '#ef4444' }}></span>
                    <span className={styles.browserDot} style={{ background: '#f59e0b' }}></span>
                    <span className={styles.browserDot} style={{ background: '#10b981' }}></span>
                    <span className={styles.browserUrl}>{project.liveUrl || project.name.toLowerCase() + '.dev'}</span>
                </div>
                <div className={styles.browserContent}>
                    <div className={styles.websitePlaceholder}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                        </svg>
                        <span>Live Website</span>
                    </div>
                </div>
            </div>
            {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={styles.previewLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    VIEW LIVE
                </a>
            )}
        </div>
    );
}

function BotPreview({ project }: { project: ProjectData }) {
    return (
        <div className={styles.botPreview}>
            <div className={styles.chatFrame}>
                <div className={styles.chatMessage + ' ' + styles.botMessage}>
                    <span className={styles.chatAvatar}>🤖</span>
                    <div className={styles.chatBubble}>
                        Hello! I&apos;m {project.name}. How can I help you today?
                    </div>
                </div>
                <div className={styles.chatMessage + ' ' + styles.userMessage}>
                    <div className={styles.chatBubble}>
                        What can you do?
                    </div>
                </div>
                <div className={styles.chatMessage + ' ' + styles.botMessage}>
                    <span className={styles.chatAvatar}>🤖</span>
                    <div className={styles.chatBubble}>
                        {project.description.slice(0, 80)}...
                    </div>
                </div>
            </div>
        </div>
    );
}

function ApiPreview({ project }: { project: ProjectData }) {
    const endpoints = [
        { method: 'GET', path: '/api/status' },
        { method: 'POST', path: '/api/query' },
        { method: 'GET', path: '/api/data' },
    ];

    return (
        <div className={styles.apiPreview}>
            <div className={styles.apiHeader}>
                <span className={styles.apiTitle}>API Endpoints</span>
                <span className={styles.apiVersion}>v1.0</span>
            </div>
            <div className={styles.apiEndpoints}>
                {endpoints.map((ep, i) => (
                    <div key={i} className={styles.endpoint}>
                        <span className={`${styles.method} ${styles[ep.method.toLowerCase()]}`}>
                            {ep.method}
                        </span>
                        <span className={styles.path}>{ep.path}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LibraryPreview({ project }: { project: ProjectData }) {
    const packageName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const language = project.language?.toLowerCase() || 'python';

    const installCmd = language === 'javascript' || language === 'typescript'
        ? `npm install ${packageName}`
        : `pip install ${packageName}`;

    const usageCode = language === 'javascript' || language === 'typescript'
        ? `import { ${project.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} } from '${packageName}';

// Initialize
const client = new ${project.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}();`
        : `from ${packageName.replace(/-/g, '_')} import ${project.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}

# Initialize
client = ${project.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}()`;

    return (
        <div className={styles.libraryPreview}>
            <div className={styles.installSection}>
                <div className={styles.installHeader}>
                    <span className={styles.installIcon}>📦</span>
                    <span>Installation</span>
                </div>
                <div className={styles.installCommand}>
                    <code>{installCmd}</code>
                    <button
                        className={styles.copyBtn}
                        onClick={() => navigator.clipboard.writeText(installCmd)}
                        title="Copy to clipboard"
                    >
                        📋
                    </button>
                </div>
            </div>
            <div className={styles.usageSection}>
                <div className={styles.usageHeader}>Quick Start</div>
                <pre className={styles.usageCode}>
                    <code>{usageCode}</code>
                </pre>
            </div>
        </div>
    );
}

// Minimal fallback if APIs fail entirely
const fallbackProjects: ProjectData[] = [];



// Interactive Components
function TerminalSimulator({ commands }: { commands: string[] }) {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<string[]>([]);
    const [isInstalling, setIsInstalling] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim().startsWith('pip install') || input.trim().startsWith('cargo install')) {
            setIsInstalling(true);
            commands.forEach((cmd, i) => {
                setTimeout(() => {
                    setOutput(prev => [...prev, cmd]);
                    if (i === commands.length - 1) {
                        setIsInstalling(false);
                    }
                }, i * 500);
            });
        }
        setInput('');
    };

    return (
        <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
                <span className={styles.terminalDot} style={{ background: '#ef4444' }}></span>
                <span className={styles.terminalDot} style={{ background: '#f59e0b' }}></span>
                <span className={styles.terminalDot} style={{ background: '#10b981' }}></span>
                <span className={styles.terminalTitle}>terminal</span>
            </div>
            <div className={styles.terminalBody}>
                {output.map((line, i) => (
                    <div key={i} className={styles.terminalLine}>{line}</div>
                ))}
                <form onSubmit={handleSubmit} className={styles.terminalInput}>
                    <span className={styles.prompt}>$</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={commands[0]?.replace('$ ', '') || 'Type a command...'}
                        disabled={isInstalling}
                    />
                </form>
            </div>
        </div>
    );
}

function ImageSlider() {
    const [sliderPosition, setSliderPosition] = useState(50);

    return (
        <div className={styles.slider}>
            <div className={styles.sliderLabel}>
                <span>RAW IMAGE</span>
                <span>HEATMAP</span>
            </div>
            <div className={styles.sliderContainer}>
                <div
                    className={styles.sliderImage}
                    style={{
                        backgroundImage: 'linear-gradient(45deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
                        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                    }}
                >
                    <div className={styles.xrayOverlay}>X-RAY</div>
                </div>
                <div
                    className={styles.sliderImage}
                    style={{
                        backgroundImage: 'linear-gradient(45deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
                        clipPath: `inset(0 0 0 ${sliderPosition}%)`
                    }}
                >
                    <div className={styles.heatmapOverlay}>DEFECT MAP</div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className={styles.sliderRange}
                />
                <div
                    className={styles.sliderHandle}
                    style={{ left: `${sliderPosition}%` }}
                ></div>
            </div>
        </div>
    );
}

function CodeSection({ code, fileName }: { code: string; fileName: string }) {
    return (
        <div className={styles.codeSection}>
            <div className={styles.codeHeader}>
                <span className={styles.codeDot}></span>
                {fileName}
            </div>
            <pre className={styles.code}>
                <code>{code}</code>
            </pre>
        </div>
    );
}

interface ProjectCardProps {
    project: ProjectData;
}

function ProjectCard({ project }: ProjectCardProps) {
    const hasInteractiveElements = project.codeSnippet || project.terminalCommands || project.hasSlider;
    const projectType = getProjectType(project);

    // Render type-specific preview
    const renderTypePreview = () => {
        switch (projectType) {
            case 'website':
                return <WebsitePreview project={project} />;
            case 'bot':
                return <BotPreview project={project} />;
            case 'api':
                return <ApiPreview project={project} />;
            case 'library':
                return <LibraryPreview project={project} />;
            default:
                return null;
        }
    };

    return (
        <article className={`${styles.card} ${styles[`card${projectType.charAt(0).toUpperCase() + projectType.slice(1)}`]}`} id={project.id}>
            <header className={styles.cardHeader}>
                <div className={styles.projectId}>
                    PROJECT_ID: {project.projectId}
                </div>
                <div className={styles.headerRight}>
                    {project.stars !== undefined && project.stars > 0 && (
                        <div className={styles.stars}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {project.stars}
                        </div>
                    )}
                    <div className={styles.version}>
                        {project.language || 'v' + project.version}
                    </div>
                </div>
            </header>

            <div className={styles.cardBody}>
                <h3 className={styles.projectName}>{project.name}</h3>
                <p className={styles.projectDesc}>{project.description}</p>

                {/* Type-specific Preview */}
                {renderTypePreview()}

                {/* Interactive Visual Section (for ML/CLI projects without type preview) */}
                {hasInteractiveElements && !renderTypePreview() && (
                    <div className={styles.visual}>
                        {project.codeSnippet && (
                            <CodeSection
                                code={project.codeSnippet}
                                fileName={project.codeFileName || 'code.txt'}
                            />
                        )}
                        {project.terminalCommands && (
                            <TerminalSimulator commands={project.terminalCommands} />
                        )}
                        {project.hasSlider && <ImageSlider />}
                    </div>
                )}

                {/* Specs Table for ML projects */}
                {project.specs && (
                    <div className={styles.specsTable}>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>ACCURACY</span>
                            <span className={styles.specValue}>{project.specs.accuracy}</span>
                        </div>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>ARCHITECTURE</span>
                            <span className={styles.specValue}>{project.specs.architecture}</span>
                        </div>
                        <div className={styles.specRow}>
                            <span className={styles.specLabel}>STANDARD</span>
                            <span className={styles.specValue}>{project.specs.standard}</span>
                        </div>
                    </div>
                )}

                {/* Topics */}
                {project.topics && project.topics.length > 0 && (
                    <div className={styles.topics}>
                        {project.topics.slice(0, 5).map(topic => (
                            <span key={topic} className={styles.topic}>{topic}</span>
                        ))}
                    </div>
                )}

                {/* Mechanical Details */}
                <div className={styles.details}>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>MATERIAL:</span>
                        <span className={styles.detailValue}>{project.material}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>TOLERANCE:</span>
                        <span className={styles.detailValue}>{project.tolerance}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>APPLICATION:</span>
                        <span className={styles.detailValue}>{project.application}</span>
                    </div>
                </div>
            </div>

            <footer className={styles.cardFooter}>
                {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                        </svg>
                        SOURCE
                    </a>
                )}
                {project.kaggleUrl && (
                    <a href={project.kaggleUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.075.339" />
                        </svg>
                        NOTEBOOK
                    </a>
                )}
                {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                        LIVE
                    </a>
                )}
            </footer>
        </article>
    );
}

export default function Projects() {
    const [projects, setProjects] = useState<ProjectData[]>(fallbackProjects);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [hasKaggle, setHasKaggle] = useState(false);

    useEffect(() => {
        async function fetchAllProjects() {
            try {
                // Fetch GitHub projects
                const githubResponse = await fetch('/api/github');
                const githubData = await githubResponse.json();

                const githubProjects: ProjectData[] = (githubData.projects || []).map(
                    (p: ProjectData) => ({ ...p, source: 'github' as const })
                );

                // Fetch Kaggle notebooks
                let kaggleProjects: ProjectData[] = [];
                try {
                    const kaggleResponse = await fetch('/api/kaggle');
                    const kaggleData = await kaggleResponse.json();

                    if (kaggleData.configured && kaggleData.notebooks) {
                        setHasKaggle(true);
                        kaggleProjects = kaggleData.notebooks.map((n: ProjectData) => ({
                            ...n,
                            source: 'kaggle' as const,
                            version: '1.0.0',
                        }));
                    }
                } catch {
                    console.log('Kaggle integration not configured');
                }

                // Merge both sources
                setProjects([...githubProjects, ...kaggleProjects]);
            } catch (err) {
                console.error('Failed to fetch projects:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchAllProjects();
    }, []);

    // Filter projects based on selected filter
    const filteredProjects = filter === 'all'
        ? projects
        : projects.filter(p => p.source === filter);

    return (
        <section className={styles.projects} id="projects">
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>// THE WORKSHOP</span>
                    <h2 className={styles.title}>PROJECTS</h2>
                    <p className={styles.subtitle}>
                        Technical specifications of systems I&apos;ve engineered. Each project is built with precision and tested for reliability.
                    </p>
                </div>

                {/* Source Filter Tabs */}
                {hasKaggle && (
                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`${styles.filterTab} ${filter === 'github' ? styles.active : ''}`}
                            onClick={() => setFilter('github')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                        <button
                            className={`${styles.filterTab} ${filter === 'kaggle' ? styles.active : ''}`}
                            onClick={() => setFilter('kaggle')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.075.339" />
                            </svg>
                            Kaggle
                        </button>
                    </div>
                )}

                {loading && (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <span>Loading projects...</span>
                    </div>
                )}

                <div className={styles.grid}>
                    {filteredProjects.map((project, index) => (
                        <ProjectCard key={project.id || `project-${index}`} project={project} />
                    ))}
                </div>
            </div>
        </section>
    );
}

