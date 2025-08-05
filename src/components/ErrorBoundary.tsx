'use client';

import React, { Component } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    // Define a state variable to track whether there is an error or not
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can use your own error logging service here
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log the error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          errorInfo: errorInfo
        }
      }
    });
  }
  
  render() {
    // If there was an error, render a fallback UI
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            We've been notified about this issue and we'll take a look at it shortly.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    
    // Return children if there's no error
    return this.props.children;
  }
}

export default ErrorBoundary;
