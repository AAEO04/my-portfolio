'use client';

import { useState } from 'react';
import styles from './Stack.module.css';
import { toolIcons, GearIcon } from './ui/Icons';

interface Tool {
    id: string;
    name: string;
    description: string;
}

interface Category {
    id: string;
    name: string;
    subtitle: string;
    tools: Tool[];
}

const stackData: Category[] = [
    {
        id: 'heavy-machinery',
        name: 'HEAVY MACHINERY',
        subtitle: 'Backend Systems',
        tools: [
            {
                id: 'python',
                name: 'Python',
                description: 'My primary language. I use Python for everything from REST APIs to ML pipelines. Clean, readable, and powerful.',
            },
            {
                id: 'fastapi',
                name: 'FastAPI',
                description: 'The modern Python web framework. I build async APIs with automatic OpenAPI docs and type validation.',
            },
            {
                id: 'docker',
                name: 'Docker',
                description: 'I containerize environments ensuring my code runs the same on my laptop as on the production server.',
            },
            {
                id: 'kafka',
                name: 'Kafka',
                description: 'For event-driven architectures and real-time data streaming. Essential for high-throughput systems.',
            },
        ],
    },
    {
        id: 'precision-tools',
        name: 'PRECISION TOOLS',
        subtitle: 'ML & Computer Vision',
        tools: [
            {
                id: 'tensorflow',
                name: 'TensorFlow',
                description: 'My go-to for deep learning. From CNNs for image classification to custom model architectures.',
            },
            {
                id: 'opencv',
                name: 'OpenCV',
                description: 'Computer vision workhorse. Image processing, feature detection, and real-time video analysis.',
            },
            {
                id: 'gemini',
                name: 'Gemini API',
                description: 'Google\'s multimodal AI. I use it for embeddings, RAG systems, and intelligent assistants.',
            },
            {
                id: 'pytorch',
                name: 'PyTorch',
                description: 'For research-oriented ML work. Dynamic computation graphs and intuitive debugging.',
            },
        ],
    },
    {
        id: 'storage',
        name: 'STORAGE',
        subtitle: 'Databases',
        tools: [
            {
                id: 'postgresql',
                name: 'PostgreSQL',
                description: 'The reliable workhorse. ACID compliance, powerful extensions, and rock-solid performance.',
            },
            {
                id: 'supabase',
                name: 'Supabase',
                description: 'PostgreSQL with superpowers. Real-time subscriptions, auth, and pgvector for AI applications.',
            },
            {
                id: 'redis',
                name: 'Redis',
                description: 'In-memory data structure store. Caching, session management, and pub/sub messaging.',
            },
            {
                id: 'mongodb',
                name: 'MongoDB',
                description: 'For document-oriented data. Flexible schemas when the data model is still evolving.',
            },
        ],
    },
];

// Helper to get icon component for a tool
const getToolIcon = (toolId: string) => {
    const IconComponent = toolIcons[toolId];
    return IconComponent ? <IconComponent size={28} /> : <GearIcon size={28} />;
};

export default function Stack() {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [isPickedUp, setIsPickedUp] = useState(false);

    const handleToolClick = (tool: Tool) => {
        if (selectedTool?.id === tool.id) {
            setIsPickedUp(false);
            setTimeout(() => setSelectedTool(null), 300);
        } else {
            setSelectedTool(tool);
            setIsPickedUp(true);
        }
    };

    return (
        <section className={styles.stack} id="stack">
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>// THE TOOL BOARD</span>
                    <h2 className={styles.title}>STACK</h2>
                    <p className={styles.subtitle}>
                        Every engineer needs the right tools. Click on a tool to inspect it.
                    </p>
                </div>

                {/* Tool Description Panel */}
                <div className={`${styles.descriptionPanel} ${isPickedUp ? styles.active : ''}`}>
                    {selectedTool && (
                        <>
                            <div className={styles.toolIcon}>{getToolIcon(selectedTool.id)}</div>
                            <div className={styles.toolInfo}>
                                <h4 className={styles.toolName}>{selectedTool.name}</h4>
                                <p className={styles.toolDesc}>{selectedTool.description}</p>
                            </div>
                            <button
                                className={styles.closeBtn}
                                onClick={() => {
                                    setIsPickedUp(false);
                                    setTimeout(() => setSelectedTool(null), 300);
                                }}
                            >
                                ×
                            </button>
                        </>
                    )}
                </div>

                {/* Tool Board */}
                <div className={styles.board}>
                    {stackData.map((category) => (
                        <div key={category.id} className={styles.category}>
                            <div className={styles.categoryHeader}>
                                <h3 className={styles.categoryName}>{category.name}</h3>
                                <span className={styles.categorySubtitle}>{category.subtitle}</span>
                            </div>
                            <div className={styles.toolGrid}>
                                {category.tools.map((tool) => (
                                    <button
                                        key={tool.id}
                                        className={`${styles.tool} ${selectedTool?.id === tool.id ? styles.selected : ''}`}
                                        onClick={() => handleToolClick(tool)}
                                    >
                                        <div className={styles.toolShadow}></div>
                                        <div className={styles.toolBody}>
                                            <span className={styles.toolIconSmall}>{getToolIcon(tool.id)}</span>
                                            <span className={styles.toolLabel}>{tool.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Board Legend */}
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: 'var(--color-primary)' }}></span>
                        <span>Selected</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: 'var(--color-border)' }}></span>
                        <span>Available</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
