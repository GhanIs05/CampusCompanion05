# CampusCompanion Deployment Guide

## Prerequisites

1. **Firebase CLI**: Install Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Ensure you have a Firebase project set up
   ```bash
   firebase login
   firebase init
   ```

## Production Build & Deployment

### 1. Environment Variables
Create a `.env.local` file based on `.env.local.example`:
```bash
cp .env.local.example .env.local
```

Fill in your Firebase configuration and any other required environment variables.

### 2. Build the Application
```bash
# Standard build
npm run build

# Build with bundle analysis (optional)
npm run build:analyze
```

### 3. Deploy to Firebase Hosting
```bash
# Deploy hosting only
npm run deploy:hosting

# Deploy everything (hosting, firestore, storage)
npm run deploy:full
```

### 4. Test Locally Before Deployment
```bash
# Serve locally using Firebase emulator
npm run serve
```

## Prerendering Configuration

The application is configured with static generation for optimal performance:

### Static Pages
- `/login` - Login page (prerendered)
- `/register` - Registration page (prerendered)
- `/404` - Not found page (prerendered)

### Dynamic Pages
- `/home` - Home dashboard (client-side rendered)
- `/events` - Events listing (client-side rendered)
- `/forums` - Forums (client-side rendered)
- `/profile` - User profile (client-side rendered)

## Performance Optimizations

### 1. Static Asset Caching
Firebase hosting is configured with aggressive caching for static assets:
- JS/CSS files: 1 year cache
- Images: 1 week cache
- JSON files: 1 hour cache

### 2. Security Headers
The following security headers are automatically added:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 3. PWA Features
- Service Worker for offline caching
- Web App Manifest for install prompts
- Optimized for mobile devices

## Monitoring & Error Tracking

### Sentry Configuration
1. Create a Sentry project at https://sentry.io
2. Add your Sentry DSN to environment variables:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
   ```

### Firebase Analytics
Analytics are automatically enabled through Firebase SDK integration.

## Build Optimization

### Bundle Analysis
To analyze your bundle size:
```bash
npm run build:analyze
```

This will generate a bundle analysis report showing:
- Largest packages
- Unused dependencies
- Code splitting effectiveness

### Performance Monitoring
- Use Chrome DevTools to monitor Core Web Vitals
- Firebase Performance Monitoring for real-time metrics
- Sentry for error tracking and performance insights

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Firebase project initialized
- [ ] Sentry DSN configured
- [ ] Build passes without errors
- [ ] Tests pass (if applicable)
- [ ] Security rules updated in Firestore
- [ ] Storage rules configured
- [ ] Domain configured (if using custom domain)

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check TypeScript errors: `npm run typecheck`
   - Check ESLint errors: `npm run lint`

2. **Firebase Deployment Fails**
   - Ensure Firebase CLI is logged in: `firebase login`
   - Check Firebase project is selected: `firebase use --add`

3. **Performance Issues**
   - Run bundle analysis to identify large dependencies
   - Enable service worker for caching
   - Optimize images and fonts

### Getting Help

- Firebase Console: Monitor deployments and errors
- Sentry Dashboard: Track application errors
- Next.js Documentation: For framework-specific issues
- Firebase Documentation: For hosting and backend issues
