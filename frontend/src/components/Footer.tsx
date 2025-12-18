'use client';

import { useEffect, useState } from 'react';
import styles from './Footer.module.css';

interface TelemetryData {
    cpu_load: string;
    memory: string;
    latency: string;
    region: string;
    status: string;
    last_commit: string;
}

export default function Footer() {
    const [telemetry, setTelemetry] = useState<TelemetryData>({
        cpu_load: '12%',
        memory: '256MB',
        latency: '42ms',
        region: 'LOS',
        status: 'operational',
        last_commit: new Date().toISOString().split('T')[0],
    });
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        // Update time every second
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);

        // Fetch telemetry data
        const fetchTelemetry = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/telemetry`);
                if (response.ok) {
                    const data = await response.json();
                    setTelemetry(data);
                }
            } catch {
                // Use default values if API is unavailable
            }
        };

        fetchTelemetry();
        const telemetryTimer = setInterval(fetchTelemetry, 30000);

        return () => {
            clearInterval(timer);
            clearInterval(telemetryTimer);
        };
    }, []);

    return (
        <footer className={styles.footer} id="contact">
            {/* System Status Bar */}
            <div className={styles.statusBar}>
                <div className={styles.container}>
                    <div className={styles.statusGrid}>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>CPU</span>
                            <span className={styles.statusValue}>{telemetry.cpu_load}</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>MEM</span>
                            <span className={styles.statusValue}>{telemetry.memory}</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>LATENCY</span>
                            <span className={styles.statusValue}>{telemetry.latency}</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>REGION</span>
                            <span className={styles.statusValue}>{telemetry.region}</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>STATUS</span>
                            <span className={`${styles.statusValue} ${styles.online}`}>
                                <span className={styles.statusDot}></span>
                                {telemetry.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.grid}>
                        <div className={styles.brand}>
                            <div className={styles.logo}>
                                <span className={styles.logoIcon}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                                    </svg>
                                </span>
                                <span className={styles.logoText}>AYOMIDE ALLI</span>
                            </div>
                            <p className={styles.tagline}>
                                Engineering digital systems with physical precision.
                            </p>
                            <div className={styles.infrastructure}>
                                <span className={styles.infraLabel}>Running on</span>
                                <div className={styles.infraLogos}>
                                    <span className={styles.infraItem}>Fly.io</span>
                                    <span className={styles.infraSeparator}>+</span>
                                    <span className={styles.infraItem}>Supabase</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className={styles.links}>
                            <h4 className={styles.linksTitle}>NAVIGATION</h4>
                            <nav className={styles.nav}>
                                <a href="#hero" className={styles.navLink}>// Home</a>
                                <a href="#projects" className={styles.navLink}>// Projects</a>
                                <a href="#stack" className={styles.navLink}>// Stack</a>
                                <a href="#contact" className={styles.navLink}>// Contact</a>
                            </nav>
                        </div>

                        {/* Social Links */}
                        <div className={styles.social}>
                            <h4 className={styles.linksTitle}>CONNECT</h4>
                            <div className={styles.socialGrid}>
                                <a
                                    href="https://github.com/AAEO04"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.socialLink}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <span>GitHub</span>
                                </a>
                                <a
                                    href="https://linkedin.com/in/alli-ayomide-316a23178"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.socialLink}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    <span>LinkedIn</span>
                                </a>
                                <a
                                    href="mailto:allioladapo5@gmail.com"
                                    className={styles.socialLink}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <path d="M22 6l-10 7L2 6" />
                                    </svg>
                                    <span>Email</span>
                                </a>
                                <a
                                    href="https://pypi.org/project/charonfig/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.socialLink}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12.042 0l-8.12 4.52v9.17l5.07 2.83v-6.09l5.56-3.27v6.09l5.56-3.09V4.52L12.042 0zM6.95 19.6l5.08 2.88 8.05-4.52v-6.09l-5.04 2.83v6.09l-5.56-3.09v-6.09L4.44 14.48v5.14L9.5 22.5l.02-2.9H6.95z" />
                                    </svg>
                                    <span>PyPI</span>
                                </a>
                            </div>
                        </div>

                        {/* Maintenance Info */}
                        <div className={styles.maintenance}>
                            <h4 className={styles.linksTitle}>TELEMETRY</h4>
                            <div className={styles.maintenanceInfo}>
                                <div className={styles.maintenanceRow}>
                                    <span className={styles.maintenanceLabel}>System Time</span>
                                    <span className={styles.maintenanceValue}>{currentTime}</span>
                                </div>
                                <div className={styles.maintenanceRow}>
                                    <span className={styles.maintenanceLabel}>Last Maintenance</span>
                                    <span className={styles.maintenanceValue}>{telemetry.last_commit}</span>
                                </div>
                                <div className={styles.maintenanceRow}>
                                    <span className={styles.maintenanceLabel}>Version</span>
                                    <span className={styles.maintenanceValue}>1.0.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright Bar */}
            <div className={styles.copyright}>
                <div className={styles.container}>
                    <div className={styles.copyrightContent}>
                        <span>© {new Date().getFullYear()} Ayomide Alli. All rights reserved.</span>
                        <span className={styles.copyrightRight}>
                            Engineered with precision in Lagos, Nigeria
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
