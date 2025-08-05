/**
 * Performance optimization utilities for CampusCompanion
 */

import { memo } from 'react';

// Higher-order component for memoization
export const withMemo = <P extends object>(Component: React.ComponentType<P>) => {
  return memo(Component);
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;
  
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);
};

// Image optimization helper
export const getOptimizedImageProps = (src: string, alt: string, priority = false) => ({
  src,
  alt,
  priority,
  sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality: 85,
});

// Service Worker registration for caching
export const registerServiceWorker = async () => {
  if (typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Debounce utility for search inputs
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for scroll events
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
