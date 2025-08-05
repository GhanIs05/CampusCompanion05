import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configure the sample rate for transaction monitoring
  tracesSampleRate: 1.0,
  
  // Configure sampling rate for session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Configure integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content and inputs
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Filter out common development errors
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Filter out common browser extension errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('Non-Error promise rejection')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Set environment
  environment: process.env.NODE_ENV,
});