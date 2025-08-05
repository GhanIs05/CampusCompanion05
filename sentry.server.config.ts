import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configure the sample rate for transaction monitoring  
  tracesSampleRate: 1.0,
  
  // Set environment
  environment: process.env.NODE_ENV,
  
  // Filter out development errors
  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
