'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface HealthData {
    api: string;
    database: string;
    ai: string;
    knowledge_base: string;
    overall: string;
    timestamp: string;
}

interface StatusData {
    status: string;
    version: string;
    uptime: string;
    metrics: {
        cpu_percent: number;
        memory_percent: number;
        memory_used_mb: number;
    };
    stats: {
        chat_messages: number;
        resume_downloads: number;
        contact_submissions: number;
        active_sessions: number;
    };
    region: string;
    last_sync: string;
}

interface AnalyticsData {
    chat_messages: number;
    resume_downloads: number;
    contact_submissions: number;
    page_views: Record<string, number>;
    popular_questions: string[];
    uptime_since: string;
}

export default function AdminDashboard() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [status, setStatus] = useState<StatusData | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [healthRes, statusRes, analyticsRes] = await Promise.all([
                fetch(`${API_URL}/health`),
                fetch(`${API_URL}/status`),
                fetch(`${API_URL}/analytics`),
            ]);

            if (healthRes.ok) setHealth(await healthRes.json());
            if (statusRes.ok) setStatus(await statusRes.json());
            if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
        } catch (err) {
            setError('Failed to connect to backend API');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const triggerSync = async (source: string = 'all') => {
        setSyncing(true);
        try {
            const response = await fetch(`${API_URL}/webhook/sync?source=${source}`, {
                method: 'POST',
            });
            if (response.ok) {
                alert(`Sync triggered for: ${source}`);
            } else {
                alert('Sync failed');
            }
        } catch {
            alert('Failed to trigger sync');
        } finally {
            setSyncing(false);
        }
    };

    const getStatusColor = (value: string) => {
        if (['operational', 'connected', 'ready', 'healthy'].includes(value.toLowerCase())) {
            return styles.statusGreen;
        }
        if (value.toLowerCase().includes('error')) {
            return styles.statusRed;
        }
        return styles.statusYellow;
    };

    if (loading && !health && !status) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>CHARON_ADMIN</h1>
                    <span className={styles.subtitle}>// SYSTEM DASHBOARD</span>
                </div>
                <div className={styles.headerRight}>
                    <button
                        className={styles.refreshButton}
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </header>

            {error && (
                <div className={styles.errorBanner}>
                    ⚠️ {error}
                </div>
            )}

            {/* Health Status */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>🔧</span>
                    SYSTEM HEALTH
                </h2>
                <div className={styles.healthGrid}>
                    {health && Object.entries(health).filter(([key]) => !['timestamp', 'overall'].includes(key)).map(([key, value]) => (
                        <div key={key} className={styles.healthCard}>
                            <span className={styles.healthLabel}>{key.toUpperCase().replace('_', ' ')}</span>
                            <span className={`${styles.healthValue} ${getStatusColor(String(value))}`}>
                                {String(value)}
                            </span>
                        </div>
                    ))}
                </div>
                {health && (
                    <div className={`${styles.overallStatus} ${getStatusColor(health.overall)}`}>
                        Overall: {health.overall?.toUpperCase()}
                    </div>
                )}
            </section>

            {/* System Metrics */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>📊</span>
                    SYSTEM METRICS
                </h2>
                {status && (
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>CPU</span>
                            <span className={styles.metricValue}>{status.metrics.cpu_percent}%</span>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${status.metrics.cpu_percent}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>MEMORY</span>
                            <span className={styles.metricValue}>{status.metrics.memory_percent}%</span>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${status.metrics.memory_percent}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>UPTIME</span>
                            <span className={styles.metricValue}>{status.uptime}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>REGION</span>
                            <span className={styles.metricValue}>{status.region}</span>
                        </div>
                    </div>
                )}
            </section>

            {/* Analytics */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>📈</span>
                    ANALYTICS
                </h2>
                {analytics && (
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{analytics.chat_messages}</span>
                            <span className={styles.statLabel}>Chat Messages</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{analytics.resume_downloads}</span>
                            <span className={styles.statLabel}>Resume Downloads</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{analytics.contact_submissions}</span>
                            <span className={styles.statLabel}>Contact Submissions</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{status?.stats.active_sessions || 0}</span>
                            <span className={styles.statLabel}>Active Sessions</span>
                        </div>
                    </div>
                )}

                {analytics && analytics.popular_questions.length > 0 && (
                    <div className={styles.popularQuestions}>
                        <h3>Recent Questions</h3>
                        <ul>
                            {analytics.popular_questions.slice(-5).reverse().map((q, i) => (
                                <li key={i}>{q}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {/* Sync Controls */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>🔄</span>
                    KNOWLEDGE BASE SYNC
                </h2>
                <div className={styles.syncInfo}>
                    <span>Last Sync: {status?.last_sync || 'Never'}</span>
                </div>
                <div className={styles.syncButtons}>
                    <button
                        className={styles.syncButton}
                        onClick={() => triggerSync('all')}
                        disabled={syncing}
                    >
                        {syncing ? 'Syncing...' : 'Sync All'}
                    </button>
                    <button
                        className={`${styles.syncButton} ${styles.secondary}`}
                        onClick={() => triggerSync('github')}
                        disabled={syncing}
                    >
                        GitHub Only
                    </button>
                    <button
                        className={`${styles.syncButton} ${styles.secondary}`}
                        onClick={() => triggerSync('kaggle')}
                        disabled={syncing}
                    >
                        Kaggle Only
                    </button>
                    <button
                        className={`${styles.syncButton} ${styles.secondary}`}
                        onClick={() => triggerSync('blog')}
                        disabled={syncing}
                    >
                        Blog Only
                    </button>
                </div>
            </section>

            <footer className={styles.footer}>
                <span>Charon API v{status?.version || '2.0.0'}</span>
                <span>•</span>
                <a href="/" className={styles.footerLink}>Back to Portfolio</a>
            </footer>
        </div>
    );
}
