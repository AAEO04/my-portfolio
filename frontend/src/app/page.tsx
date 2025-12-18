import { Hero, Projects, Stack, ChatInterface, Footer } from '@/components';
import Header from '@/components/Header';
import LoadingScreen from '@/components/LoadingScreen';
import Blog from '@/components/Blog';
import Certifications from '@/components/Certifications';
import Contact from '@/components/Contact';
import BackToTop from '@/components/BackToTop';
import ErrorBoundary from '@/components/ErrorBoundary';
import CommandPalette from '@/components/CommandPalette';

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <Header />
      <main>
        <ErrorBoundary>
          <Hero />
        </ErrorBoundary>
        <ErrorBoundary>
          <Projects />
        </ErrorBoundary>
        <ErrorBoundary>
          <Stack />
        </ErrorBoundary>
        <ErrorBoundary>
          <Certifications />
        </ErrorBoundary>
        <ErrorBoundary>
          <Blog />
        </ErrorBoundary>
        <ErrorBoundary>
          <Contact />
        </ErrorBoundary>
        <Footer />
      </main>
      <ChatInterface />
      <BackToTop />
      <CommandPalette />
    </>
  );
}
