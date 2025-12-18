import type { Metadata } from "next";
import { Oswald, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import Analytics from "@/components/Analytics";

// Optimized font loading with next/font
const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ayomide.dev"),
  title: "Ayomide Alli | Systems Engineer",
  description: "Portfolio of Ayomide Alli - Systems Engineer combining Mechanical Engineering and Software Development.",
  keywords: ["Software Engineer", "Systems Engineer", "Full Stack", "React", "Python", "Rust", "Mechanical Engineering"],
  authors: [{ name: "Ayomide Alli" }],
  creator: "Ayomide Alli",
  openGraph: {
    title: "Ayomide Alli | Systems Engineer",
    description: "Combining Mechanical Engineering and Software Development. Codebases designed with the same tolerance and reliability as industrial machinery.",
    url: "https://ayomidealli.com",
    siteName: "Ayomide Alli Portfolio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ayomide Alli - Systems Engineer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ayomide Alli | Systems Engineer",
    description: "Combining Mechanical Engineering and Software Development.",
    images: ["/og-image.png"],
    creator: "@ayomide",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${oswald.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0F172A" />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>
          {/* Isometric Grid Background */}
          <div className="isometric-grid" aria-hidden="true"></div>
          {children}
          <Analytics />
        </ToastProvider>
      </body>
    </html>
  );
}
