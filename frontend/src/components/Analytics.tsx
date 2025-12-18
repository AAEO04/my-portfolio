'use client';

import Script from 'next/script';

export default function Analytics() {
    const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

    // Only render if Google Analytics ID is configured
    if (!GA_MEASUREMENT_ID) {
        return null;
    }

    return (
        <>
            {/* Google Analytics */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
            </Script>
        </>
    );
}

// Optional: Custom event tracking function
export function trackEvent(action: string, category: string, label?: string, value?: number) {
    if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as Window & { gtag: (...args: unknown[]) => void }).gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
}
