'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CommandPalette.module.css';
import { useToast } from './Toast';

interface Command {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
    category: 'NAVIGATION' | 'ACTIONS' | 'SEARCH';
    preview?: string;
}

interface SearchResult {
    id: string;
    type: string;
    title: string;
    preview: string;
    href: string;
    score: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();
    const { showToast } = useToast();

    // Static commands
    const staticCommands: Command[] = [
        // Navigation
        {
            id: 'nav-home',
            label: 'Go to Home',
            category: 'NAVIGATION',
            icon: <HomeIcon />,
            action: () => router.push('/#hero'),
        },
        {
            id: 'nav-projects',
            label: 'Go to Projects',
            category: 'NAVIGATION',
            icon: <ProjectIcon />,
            action: () => router.push('/#projects'),
        },
        {
            id: 'nav-stack',
            label: 'Go to Stack',
            category: 'NAVIGATION',
            icon: <StackIcon />,
            action: () => router.push('/#stack'),
        },
        {
            id: 'nav-blog',
            label: 'Go to Blog',
            category: 'NAVIGATION',
            icon: <BlogIcon />,
            action: () => router.push('/#blog'),
        },
        // Actions
        {
            id: 'act-email',
            label: 'Copy Email Address',
            category: 'ACTIONS',
            icon: <CopyIcon />,
            action: () => {
                navigator.clipboard.writeText('hello@ayomide.dev');
                showToast('Email copied to clipboard', 'success');
            },
        },
        {
            id: 'act-cv',
            label: 'Download CV',
            category: 'ACTIONS',
            icon: <DownloadIcon />,
            action: () => {
                const link = document.createElement('a');
                link.href = '/ayomide-cv.pdf';
                link.download = 'Ayomide_Alli_CV.pdf';
                link.click();
                showToast('Downloading CV...', 'info');
            },
        },
        {
            id: 'act-chat',
            label: 'Ask AI Assistant',
            category: 'ACTIONS',
            icon: <ChatIcon />,
            action: () => {
                // Open chat with the current query
                window.dispatchEvent(new CustomEvent('openChat', { detail: query }));
            },
        },
    ];

    // Convert search results to commands
    const searchCommands: Command[] = searchResults.map(result => ({
        id: `search-${result.id}`,
        label: result.title,
        preview: result.preview,
        category: 'SEARCH' as const,
        icon: getIconForType(result.type),
        action: () => {
            router.push(result.href);
        },
    }));

    // Filter static commands based on query
    const filteredStaticCommands = staticCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    // Combine all commands: search results first (if any), then static
    const allCommands: Command[] = query.length >= 2
        ? [...searchCommands, ...filteredStaticCommands]
        : filteredStaticCommands;

    // Group commands by category
    const groupedCommands = allCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);

    // Debounced search function
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `${API_URL}/search?q=${encodeURIComponent(searchQuery)}&limit=5`
            );
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.results || []);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounce search on query change
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                performSearch(query);
            }, 300); // 300ms debounce
        } else {
            setSearchResults([]);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [query, performSearch]);

    // Open/Close logic
    const togglePalette = useCallback(() => setIsOpen(prev => !prev), []);
    const closePalette = useCallback(() => {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
        setSearchResults([]);
    }, []);

    // Keyboard Event Listeners for Open/Close
    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                togglePalette();
            }
            if (e.key === 'Escape') {
                closePalette();
            }
        };

        window.addEventListener('keydown', onKeydown);
        window.addEventListener('openCommandPalette', togglePalette);

        return () => {
            window.removeEventListener('keydown', onKeydown);
            window.removeEventListener('openCommandPalette', togglePalette);
        };
    }, [togglePalette, closePalette]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    // Keyboard Navigation inside palette
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % allCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + allCommands.length) % allCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (allCommands[selectedIndex]) {
                allCommands[selectedIndex].action();
                closePalette();
            }
        }
    };

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, searchResults]);

    // Scroll active item into view
    useEffect(() => {
        const activeItem = listRef.current?.querySelector(`.${styles.selected}`);
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => {
            if (e.target === e.currentTarget) closePalette();
        }}>
            <div className={styles.palette}>
                <div className={styles.header}>
                    <span className={styles.promptIcon}>&gt;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder="Search knowledge base or type a command..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {isSearching && <span className={styles.spinner}></span>}
                    <span className={styles.badge}>ESC</span>
                </div>

                <div className={styles.results} ref={listRef}>
                    {allCommands.length === 0 ? (
                        <div className={styles.empty}>
                            {query.length >= 2
                                ? 'No results found. Try asking the AI assistant.'
                                : 'Start typing to search...'}
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([category, cmds]) => (
                            <div key={category} className={styles.group}>
                                <div className={styles.groupTitle}>
                                    {category === 'SEARCH' ? '📚 FROM KNOWLEDGE BASE' : category}
                                </div>
                                {cmds.map(cmd => {
                                    const globalIndex = allCommands.indexOf(cmd);
                                    return (
                                        <button
                                            key={cmd.id}
                                            className={`${styles.item} ${globalIndex === selectedIndex ? styles.selected : ''}`}
                                            onClick={() => {
                                                cmd.action();
                                                closePalette();
                                            }}
                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                        >
                                            <span className={styles.itemIcon}>{cmd.icon}</span>
                                            <div className={styles.itemContent}>
                                                <span className={styles.itemLabel}>{cmd.label}</span>
                                                {cmd.preview && (
                                                    <span className={styles.itemPreview}>{cmd.preview}</span>
                                                )}
                                            </div>
                                            {globalIndex === selectedIndex && (
                                                <span className={styles.enterHint}>↵</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.footer}>
                    {query.length >= 2
                        ? `Searching "${query}" in knowledge base...`
                        : 'Type to search projects, skills, and experience'
                    }
                </div>
            </div>
        </div>
    );
}

// Helper function to get icon based on document type
function getIconForType(type: string): React.ReactNode {
    switch (type) {
        case 'project':
            return <ProjectIcon />;
        case 'skill':
        case 'stack':
            return <StackIcon />;
        case 'experience':
            return <ExperienceIcon />;
        default:
            return <DocumentIcon />;
    }
}

// Icons
const HomeIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ProjectIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const StackIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const BlogIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>;
const CopyIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>;
const DownloadIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const ChatIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ExperienceIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const DocumentIcon = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
