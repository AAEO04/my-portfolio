'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Hero.module.css';

// P&ID Symbol skill mappings
const skills = [
    { id: 'pump', symbol: '⇌', name: 'Kafka', description: 'Stream Processing', x: 15, y: 25 },
    { id: 'tank', symbol: '▢', name: 'PostgreSQL', description: 'Data Storage', x: 80, y: 30 },
    { id: 'valve', symbol: '◇', name: 'FastAPI', description: 'API Gateway', x: 45, y: 60 },
    { id: 'sensor', symbol: '○', name: 'TensorFlow', description: 'ML Pipeline', x: 25, y: 70 },
    { id: 'controller', symbol: '□', name: 'Docker', description: 'Containerization', x: 70, y: 75 },
    { id: 'actuator', symbol: '△', name: 'Python', description: 'Core Logic', x: 55, y: 35 },
];

export default function Hero() {
    const [isDrawn, setIsDrawn] = useState(false);
    const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Trigger drawing animation after component mounts
        const timer = setTimeout(() => setIsDrawn(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Draw connecting lines between skills
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        skills.forEach((skill, i) => {
            if (i < skills.length - 1) {
                const x1 = (skill.x / 100) * canvas.width;
                const y1 = (skill.y / 100) * canvas.height;
                const x2 = (skills[i + 1].x / 100) * canvas.width;
                const y2 = (skills[i + 1].y / 100) * canvas.height;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        });
    }, []);

    return (
        <section className={styles.hero} id="hero">
            {/* Animated Isometric Grid */}
            <div className={styles.gridBackground}></div>

            {/* P&ID Background Canvas */}
            <canvas ref={canvasRef} className={styles.canvas}></canvas>

            {/* P&ID Skill Symbols */}
            <div className={styles.skillsOverlay}>
                {skills.map((skill) => (
                    <div
                        key={skill.id}
                        className={`${styles.skillNode} ${hoveredSkill === skill.id ? styles.active : ''}`}
                        style={{ left: `${skill.x}%`, top: `${skill.y}%` }}
                        onMouseEnter={() => setHoveredSkill(skill.id)}
                        onMouseLeave={() => setHoveredSkill(null)}
                    >
                        <span className={styles.symbol}>{skill.symbol}</span>
                        {hoveredSkill === skill.id && (
                            <div className={styles.tooltip}>
                                <span className={styles.tooltipName}>{skill.name}</span>
                                <span className={styles.tooltipDesc}>{skill.description}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className={styles.heroGrid}>
                {/* Visual Content (Right Side on large screens, Top on mobile) */}
                <div className={styles.visualContent}>
                    <div className={styles.profileContainer}>
                        <div className={styles.profileFrame}>
                            <img
                                src="/profile.jpg"
                                alt="Ayomide Alli"
                                className={styles.profilePhoto}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <div className={styles.frameBorder}></div>
                            <div className={styles.frameCorner} data-corner="tl"></div>
                            <div className={styles.frameCorner} data-corner="tr"></div>
                            <div className={styles.frameCorner} data-corner="bl"></div>
                            <div className={styles.frameCorner} data-corner="br"></div>
                        </div>
                    </div>
                </div>

                {/* Text Content (Left Side) */}
                <div className={styles.textContent}>
                    <div className={styles.statusBar}>
                        <span className={styles.statusDot}></span>
                        <span>STATUS: ONLINE</span>
                        <span className={styles.separator}>|</span>
                        <span>REGION: LAGOS (LOS)</span>
                    </div>

                    <h1 className={`${styles.name} ${isDrawn ? styles.drawn : ''}`}>
                        <span className={styles.nameText}>AYOMIDE ALLI</span>
                    </h1>

                    <div className={styles.roleContainer}>
                        <span className={styles.role}>SYSTEMS ENGINEER</span>
                        <span className={styles.transition}>(MECH → SOFT)</span>
                    </div>

                    <p className={styles.hook}>
                        &quot;I build software with <span className={styles.highlight}>Industrial Precision</span>.
                        My codebases are designed with the same tolerance and reliability as industrial machinery.&quot;
                    </p>

                    <div className={styles.actions}>
                        <a href="#projects" className={styles.btnPrimary}>
                            <span>VIEW WORKSHOP</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M7 17L17 7M17 7H7M17 7V17" />
                            </svg>
                        </a>
                        <a href="#stack" className={styles.btnOutline}>
                            <span>INSPECT TOOLS</span>
                        </a>
                    </div>
                </div>

                {/* Scroll Indicator (Absolute) */}
                <div className={styles.scrollIndicator}>
                    <div className={styles.scrollLine}></div>
                    <span>SCROLL</span>
                </div>
            </div>
        </section>
    );
}
