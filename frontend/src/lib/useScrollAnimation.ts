'use client';

import { useEffect, useRef, useState, RefObject } from 'react';

interface UseScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

export function useScrollAnimation<T extends HTMLElement>(
    options: UseScrollAnimationOptions = {}
): [RefObject<T | null>, boolean] {
    const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce]);

    return [ref, isVisible];
}

// Hook for staggered children animations
export function useStaggerAnimation(
    isVisible: boolean,
    itemCount: number,
    staggerDelay: number = 100
): number[] {
    const [visibleItems, setVisibleItems] = useState<number[]>([]);

    useEffect(() => {
        if (!isVisible) {
            setVisibleItems([]);
            return;
        }

        const timeouts: NodeJS.Timeout[] = [];

        for (let i = 0; i < itemCount; i++) {
            const timeout = setTimeout(() => {
                setVisibleItems(prev => [...prev, i]);
            }, i * staggerDelay);
            timeouts.push(timeout);
        }

        return () => timeouts.forEach(clearTimeout);
    }, [isVisible, itemCount, staggerDelay]);

    return visibleItems;
}
