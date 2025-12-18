'use client';

import { useState, useEffect } from 'react';
import styles from './Blog.module.css';
import { useScrollAnimation, useStaggerAnimation } from '@/lib/useScrollAnimation';

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

interface HashnodeResponse {
    posts: BlogPost[];
    publicationHost?: string;
    error?: string;
}

// Hashnode profile URL
const HASHNODE_PROFILE = 'https://hashnode.com/@AAEO';
const HASHNODE_BLOG = 'https://aaeo.hashnode.dev';

export default function Blog() {
    const [ref, isVisible] = useScrollAnimation<HTMLElement>();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const visibleItems = useStaggerAnimation(isVisible, Math.max(posts.length, 3), 150);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const response = await fetch('/api/hashnode');
                const data: HashnodeResponse = await response.json();
                setPosts(data.posts || []);
            } catch (error) {
                console.error('Failed to fetch blog posts:', error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, []);

    const hasPosts = posts.length > 0;

    return (
        <section ref={ref} className={styles.blog} id="blog">
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>// TECHNICAL WRITINGS</span>
                    <h2 className={styles.title}>BLOG</h2>
                    <p className={styles.subtitle}>
                        Thoughts on engineering, software development, and the intersection of mechanical and digital systems.
                    </p>
                </div>

                {loading ? (
                    // Loading skeleton
                    <div className={styles.grid}>
                        {[1, 2, 3].map((i) => (
                            <article key={i} className={`${styles.card} ${styles.skeleton}`}>
                                <div className={styles.skeletonHeader}></div>
                                <div className={styles.skeletonTitle}></div>
                                <div className={styles.skeletonExcerpt}></div>
                                <div className={styles.skeletonTags}></div>
                            </article>
                        ))}
                    </div>
                ) : hasPosts ? (
                    // Blog posts grid
                    <div className={styles.grid}>
                        {posts.map((post, index) => (
                            <article
                                key={post.id}
                                className={`${styles.card} ${visibleItems.includes(index) ? styles.visible : ''}`}
                            >
                                <div className={styles.cardHeader}>
                                    <span className={styles.date}>{post.date}</span>
                                    <span className={styles.readTime}>{post.readTime} read</span>
                                </div>

                                <h3 className={styles.postTitle}>{post.title}</h3>
                                <p className={styles.excerpt}>{post.excerpt}</p>

                                <div className={styles.tags}>
                                    {post.tags.map(tag => (
                                        <span key={tag} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>

                                <a href={post.url} target="_blank" rel="noopener noreferrer" className={styles.readMore}>
                                    READ ARTICLE
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </article>
                        ))}
                    </div>
                ) : (
                    // Coming Soon empty state
                    <div className={`${styles.emptyState} ${visibleItems.includes(0) ? styles.visible : ''}`}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </div>
                        <h3 className={styles.emptyTitle}>ARTICLES INCOMING</h3>
                        <p className={styles.emptyText}>
                            I&apos;m currently crafting technical articles on AI/ML, backend systems,
                            and the fascinating parallels between mechanical and software engineering.
                        </p>
                        <div className={styles.emptyTopics}>
                            <span className={styles.emptyTopic}>RAG Systems</span>
                            <span className={styles.emptyTopic}>FastAPI</span>
                            <span className={styles.emptyTopic}>Computer Vision</span>
                            <span className={styles.emptyTopic}>System Design</span>
                        </div>
                        <a
                            href={HASHNODE_PROFILE}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.followButton}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                            </svg>
                            FOLLOW ON HASHNODE
                        </a>
                    </div>
                )}

                {hasPosts && (
                    <div className={styles.viewAll}>
                        <a href={HASHNODE_BLOG} target="_blank" rel="noopener noreferrer" className={styles.viewAllLink}>
                            VIEW ALL ARTICLES
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}
