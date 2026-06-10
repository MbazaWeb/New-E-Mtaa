// main.tsx
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer; // Required by @react-pdf/renderer

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App.tsx';
import './index.css';

import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Create a single QueryClient instance (best practice)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 45,     // 45 seconds
      gcTime: 1000 * 60 * 10,   // 10 minutes (replaces cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (auth/permission issues)
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>

    </QueryClientProvider>
  </StrictMode>,
);