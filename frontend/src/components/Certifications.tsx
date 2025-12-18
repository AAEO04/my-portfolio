'use client';

import { useState, useEffect } from 'react';
import styles from './Certifications.module.css';
import { useScrollAnimation, useStaggerAnimation } from '@/lib/useScrollAnimation';

interface Badge {
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

interface CredlyResponse {
    badges: Badge[];
    username?: string;
    error?: string;
}

const CREDLY_PROFILE = 'https://www.credly.com/users/ayomide-alli.758389b9';

export default function Certifications() {
    const [ref, isVisible] = useScrollAnimation<HTMLElement>();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const visibleItems = useStaggerAnimation(isVisible, Math.max(badges.length, 3), 150);

    useEffect(() => {
        async function fetchBadges() {
            try {
                const response = await fetch('/api/credly');
                const data: CredlyResponse = await response.json();
                setBadges(data.badges || []);
            } catch (error) {
                console.error('Failed to fetch certifications:', error);
                setBadges([]);
            } finally {
                setLoading(false);
            }
        }

        fetchBadges();
    }, []);

    const hasBadges = badges.length > 0;

    return (
        <section ref={ref} className={styles.certifications} id="certifications">
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.sectionTag}>// VERIFIED CREDENTIALS</span>
                    <h2 className={styles.title}>CERTIFICATIONS</h2>
                    <p className={styles.subtitle}>
                        Industry-recognized certifications and credentials that validate my expertise.
                    </p>
                </div>

                {loading ? (
                    // Loading skeleton
                    <div className={styles.grid}>
                        {[1, 2, 3].map((i) => (
                            <article key={i} className={`${styles.card} ${styles.skeleton}`}>
                                <div className={styles.skeletonImage}></div>
                                <div className={styles.skeletonContent}>
                                    <div className={styles.skeletonTitle}></div>
                                    <div className={styles.skeletonIssuer}></div>
                                    <div className={styles.skeletonDate}></div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : hasBadges ? (
                    // Badges grid
                    <div className={styles.grid}>
                        {badges.map((badge, index) => (
                            <article
                                key={badge.id}
                                className={`${styles.card} ${visibleItems.includes(index) ? styles.visible : ''}`}
                            >
                                <div className={styles.badgeImage}>
                                    <img
                                        src={badge.imageUrl}
                                        alt={badge.name}
                                        loading="lazy"
                                    />
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.badgeName}>{badge.name}</h3>
                                    <p className={styles.issuer}>{badge.issuer}</p>
                                    <div className={styles.meta}>
                                        <span className={styles.date}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            {badge.issuedDate}
                                        </span>
                                        {badge.expiresAt && (
                                            <span className={styles.expires}>
                                                Expires: {badge.expiresAt}
                                            </span>
                                        )}
                                    </div>
                                    {badge.skills.length > 0 && (
                                        <div className={styles.skills}>
                                            {badge.skills.slice(0, 3).map(skill => (
                                                <span key={skill} className={styles.skill}>{skill}</span>
                                            ))}
                                        </div>
                                    )}
                                    <a
                                        href={badge.verifyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.verifyLink}
                                    >
                                        VERIFY CREDENTIAL
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                                        </svg>
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    // Coming Soon empty state
                    <div className={`${styles.emptyState} ${visibleItems.includes(0) ? styles.visible : ''}`}>
                        <div className={styles.emptyIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 15l-2 5l9-11h-6l2-5l-9 11h6z" />
                            </svg>
                        </div>
                        <h3 className={styles.emptyTitle}>CREDENTIALS IN PROGRESS</h3>
                        <p className={styles.emptyText}>
                            I&apos;m currently working on industry certifications in cloud computing,
                            machine learning, and software architecture. Check back soon!
                        </p>
                        <div className={styles.emptyTopics}>
                            <span className={styles.emptyTopic}>AWS</span>
                            <span className={styles.emptyTopic}>Google Cloud</span>
                            <span className={styles.emptyTopic}>TensorFlow</span>
                            <span className={styles.emptyTopic}>Kubernetes</span>
                        </div>
                        <a
                            href={CREDLY_PROFILE}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.followButton}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                            VIEW CREDLY PROFILE
                        </a>
                    </div>
                )}

                {hasBadges && (
                    <div className={styles.viewAll}>
                        <a href={CREDLY_PROFILE} target="_blank" rel="noopener noreferrer" className={styles.viewAllLink}>
                            VIEW ALL ON CREDLY
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                            </svg>
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
}
