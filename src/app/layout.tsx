import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusConnect',
  description: 'A Collaborative Platform for University Learning Communities',
  metadataBase: new URL('https://campus-companion.web.app'),
  keywords: ['education', 'university', 'campus', 'learning', 'collaboration', 'students'],
  authors: [{ name: 'CampusConnect Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'CampusConnect',
    description: 'A Collaborative Platform for University Learning Communities',
    url: 'https://campus-companion.web.app',
    siteName: 'CampusConnect',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusConnect',
    description: 'A Collaborative Platform for University Learning Communities',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://firebaseapp.com" />
        <link rel="dns-prefetch" href="https://googleapis.com" />
        
        {/* Preload critical fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" 
          rel="stylesheet"
        />
        
        {/* PWA and mobile optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CampusConnect" />
        
        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className="font-body antialiased">
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
