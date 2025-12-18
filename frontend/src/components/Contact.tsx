'use client';

import { useState } from 'react';
import styles from './Contact.module.css';
import { useScrollAnimation } from '@/lib/useScrollAnimation';
import { useToast } from './Toast';
import { trackEvent } from './Analytics';

export default function Contact() {
    const [ref, isVisible] = useScrollAnimation<HTMLElement>();
    const [email] = useState('allioladapo5@gmail.com');
    const { showToast } = useToast();

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(email);
            showToast('Email copied to clipboard!', 'success');
            trackEvent('copy_email', 'contact', email);
        } catch {
            showToast('Failed to copy email', 'error');
        }
    };

    const handleEmailClick = () => {
        trackEvent('click_email', 'contact', email);
    };

    const handleResumeDownload = () => {
        trackEvent('download_resume', 'contact', 'CV Download');
    };

    return (
        <section
            ref={ref}
            className={`${styles.contact} ${isVisible ? styles.visible : ''}`}
            id="contact"
        >
            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Section Tag */}
                    <span className={styles.sectionTag}>// INITIATE CONTACT</span>

                    {/* Heading */}
                    <h2 className={styles.title}>
                        LET&apos;S BUILD <span className={styles.highlight}>SOMETHING</span> TOGETHER
                    </h2>

                    {/* Description */}
                    <p className={styles.description}>
                        Have a project in mind? Looking for a Systems Engineer who bridges the gap between
                        mechanical precision and software innovation? I&apos;m always interested in discussing
                        new opportunities and challenging problems.
                    </p>

                    {/* Contact Methods */}
                    <div className={styles.methods}>
                        {/* Email */}
                        <div className={styles.method}>
                            <div className={styles.methodIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <path d="M22 6l-10 7L2 6" />
                                </svg>
                            </div>
                            <div className={styles.methodInfo}>
                                <span className={styles.methodLabel}>EMAIL</span>
                                <button className={styles.methodValue} onClick={handleCopyEmail}>
                                    {email}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Location */}
                        <div className={styles.method}>
                            <div className={styles.methodIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <div className={styles.methodInfo}>
                                <span className={styles.methodLabel}>LOCATION</span>
                                <span className={styles.methodValue}>Lagos, Nigeria</span>
                            </div>
                        </div>

                        {/* Availability */}
                        <div className={styles.method}>
                            <div className={styles.methodIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div className={styles.methodInfo}>
                                <span className={styles.methodLabel}>AVAILABILITY</span>
                                <span className={`${styles.methodValue} ${styles.available}`}>
                                    <span className={styles.statusDot}></span>
                                    Open to opportunities
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className={styles.actions}>
                        <a href={`mailto:${email}`} className={styles.btnPrimary} onClick={handleEmailClick}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <path d="M22 6l-10 7L2 6" />
                            </svg>
                            SEND EMAIL
                        </a>
                        <a
                            href="/ayomide-cv.pdf"
                            download
                            className={styles.btnOutline}
                            onClick={handleResumeDownload}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            DOWNLOAD CV
                        </a>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className={styles.decoration}>
                    <div className={styles.circuitLines}>
                        <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M100 0 L100 50 L150 50 L150 100" className={styles.line1} />
                            <path d="M0 100 L50 100 L50 150 L100 150" className={styles.line2} />
                            <path d="M100 200 L100 150 L50 150 L50 100" className={styles.line3} />
                            <circle cx="100" cy="50" r="4" fill="currentColor" />
                            <circle cx="150" cy="100" r="4" fill="currentColor" />
                            <circle cx="50" cy="100" r="4" fill="currentColor" />
                            <circle cx="100" cy="150" r="4" fill="currentColor" />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}
