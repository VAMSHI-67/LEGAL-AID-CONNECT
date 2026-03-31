import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <div className="min-h-screen flex flex-col bg-[var(--background)]">
                <header className="w-full bg-[var(--card)] border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
                  <div className="font-serif font-bold text-[var(--foreground)] tracking-tight">LegalAid Connect</div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <NotificationDropdown />
                  </div>
                </header>
                <main className="flex-1">
                  <Component {...pageProps} />
                </main>
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 