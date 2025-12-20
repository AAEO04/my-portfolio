'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ChatInterface.module.css';
import { trackEvent } from './Analytics';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
}

interface Citation {
    type: string;
    name: string;
    ref: string;
    url?: string;
}

const STORAGE_KEY = 'charon_chat_history';
const DEFAULT_MESSAGE: Message = {
    id: '1',
    role: 'assistant',
    content: 'Hello, I am Charon, your guide through the depths of Ayomide\'s work. What would you like to explore?',
};

export default function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load messages from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Save messages to localStorage when they change
    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape to close chat
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
            // Slash to open and focus chat
            if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const clearHistory = useCallback(() => {
        setMessages([DEFAULT_MESSAGE]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const handleCitationClick = (ref: string) => {
        const element = document.getElementById(ref);
        if (element) {
            setIsOpen(false);
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight');
                setTimeout(() => element.classList.remove('highlight'), 2000);
            }, 300);
        }
    };

    const simulateTypingEffect = async (text: string, messageId: string) => {
        setIsTyping(true);
        const words = text.split(' ');
        let currentText = '';

        for (let i = 0; i < words.length; i++) {
            currentText += (i === 0 ? '' : ' ') + words[i];
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId ? { ...msg, content: currentText } : msg
                )
            );
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        setIsTyping(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        // Track chat message in GA
        trackEvent('chat_message', 'engagement', input.trim().substring(0, 50));

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Create placeholder for assistant message
        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [
            ...prev,
            { id: assistantId, role: 'assistant', content: '' },
        ]);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage.content,
                    conversation_history: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();

            // Update message with citations
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantId
                        ? { ...msg, citations: data.citations }
                        : msg
                )
            );

            // Simulate typewriter effect
            await simulateTypingEffect(data.response, assistantId);
        } catch {
            // Fallback response if API is not available
            const fallbackResponse = `I'm currently unable to access my knowledge base. This might be temporary. Please try again in a moment, or feel free to contact Ayomide directly via the contact form below.`;

            await simulateTypingEffect(fallbackResponse, assistantId);
        } finally {
            setIsLoading(false);
        }
    };

    // Parse citations from text [REF: xxx]
    const parseContent = (content: string, citations?: Citation[]) => {
        const parts = content.split(/(\[REF: [^\]]+\])/g);

        return parts.map((part, i) => {
            const refMatch = part.match(/\[REF: ([^\]]+)\]/);
            if (refMatch) {
                const refId = refMatch[1].toLowerCase().replace(/ /g, '_');
                const citation = citations?.find(c => c.ref === refId);
                return (
                    <button
                        key={i}
                        className={styles.citation}
                        onClick={() => handleCitationClick(refId)}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                        </svg>
                        {citation?.name || refMatch[1]}
                    </button>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                <div className={styles.fabIcon}>
                    {isOpen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    ) : (
                        <>
                            <span className={styles.gearIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                                </svg>
                            </span>
                            <span className={styles.promptIcon}>&gt;_</span>
                        </>
                    )}
                </div>
            </button>

            {/* Chat Window */}
            <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
                {/* Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.headerLeft}>
                        <span className={styles.statusDot}></span>
                        <span className={styles.headerTitle}>CHARON</span>
                    </div>
                    <div className={styles.headerRight}>
                        {messages.length > 1 && (
                            <button
                                className={styles.clearButton}
                                onClick={clearHistory}
                                title="Clear chat history"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                            </button>
                        )}
                        <span className={styles.connectionStatus}>// SECURE</span>
                    </div>
                </div>

                {/* Messages */}
                <div className={styles.messages}>
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`${styles.message} ${styles[message.role]}`}
                        >
                            <div className={styles.messageContent}>
                                {message.role === 'assistant' ? (
                                    <>
                                        {parseContent(message.content, message.citations)}
                                        {isTyping && message.id === messages[messages.length - 1]?.id && (
                                            <span className={styles.cursor}>▊</span>
                                        )}
                                    </>
                                ) : (
                                    message.content
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && !messages[messages.length - 1]?.content && (
                        <div className={`${styles.message} ${styles.assistant}`}>
                            <div className={styles.loadingDots}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className={styles.inputForm}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter query..."
                        disabled={isLoading}
                        className={styles.input}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className={styles.sendButton}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </form>

                {/* Footer */}
                <div className={styles.chatFooter}>
                    <span>Powered by RAG + Gemini 1.5</span>
                </div>
            </div>
        </>
    );
}
