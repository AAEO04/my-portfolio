'use client';

import { useState, useEffect } from 'react';
import styles from './KaggleStats.module.css';

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

interface KaggleData {
    profile: KaggleProfile | null;
    notebooks: unknown[];
    configured: boolean;
    error?: string;
}

// Tier colors for the badge
const tierColors: Record<string, string> = {
    'Grandmaster': '#d4af37',
    'Master': '#c0c0c0',
    'Expert': '#cd7f32',
    'Contributor': '#20beff',
    'Novice': '#5cb85c',
};

export default function KaggleStats() {
    const [data, setData] = useState<KaggleData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchKaggleData() {
            try {
                const response = await fetch('/api/kaggle');
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error('Failed to fetch Kaggle data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchKaggleData();
    }, []);

    // Don't render if not configured or no profile
    if (!loading && (!data?.configured || !data?.profile)) {
        return null;
    }

    if (loading) {
        return (
            <div className={styles.widget}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Loading Kaggle stats...</span>
                </div>
            </div>
        );
    }

    const { profile } = data!;
    if (!profile) return null;

    const totalMedals = profile.medals.gold + profile.medals.silver + profile.medals.bronze;
    const tierColor = tierColors[profile.tier] || tierColors['Contributor'];

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <svg className={styles.kaggleLogo} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.075.339" />
                </svg>
                <span className={styles.title}>Kaggle</span>
                <span
                    className={styles.tier}
                    style={{ backgroundColor: tierColor }}
                >
                    {profile.tier}
                </span>
            </div>

            <div className={styles.stats}>
                {profile.ranking > 0 && (
                    <div className={styles.stat}>
                        <span className={styles.statValue}>#{profile.ranking.toLocaleString()}</span>
                        <span className={styles.statLabel}>Global Rank</span>
                    </div>
                )}

                {profile.points > 0 && (
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{profile.points.toLocaleString()}</span>
                        <span className={styles.statLabel}>Points</span>
                    </div>
                )}

                {totalMedals > 0 && (
                    <div className={styles.medals}>
                        {profile.medals.gold > 0 && (
                            <div className={styles.medal} title="Gold Medals">
                                <span className={styles.medalIcon} style={{ color: '#d4af37' }}>🥇</span>
                                <span className={styles.medalCount}>{profile.medals.gold}</span>
                            </div>
                        )}
                        {profile.medals.silver > 0 && (
                            <div className={styles.medal} title="Silver Medals">
                                <span className={styles.medalIcon} style={{ color: '#c0c0c0' }}>🥈</span>
                                <span className={styles.medalCount}>{profile.medals.silver}</span>
                            </div>
                        )}
                        {profile.medals.bronze > 0 && (
                            <div className={styles.medal} title="Bronze Medals">
                                <span className={styles.medalIcon} style={{ color: '#cd7f32' }}>🥉</span>
                                <span className={styles.medalCount}>{profile.medals.bronze}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <a
                href={`https://www.kaggle.com/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.profileLink}
            >
                View Profile
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
            </a>
        </div>
    );
}
