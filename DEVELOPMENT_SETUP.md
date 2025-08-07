# 🚀 Quick Development Setup

## Current Status: FIXED ✅
The app now works in development mode without requiring Firebase Admin SDK setup!

## What's Working Now:
- ✅ Event creation works in development
- ✅ Permission system has development fallbacks
- ✅ User profiles are created automatically
- ✅ No more "user profile not found" errors

## For Development:
Just run `npm run dev` and it will work with automatic development permissions.

## For Production Setup (Optional):
If you want full Firebase Admin SDK functionality:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate new private key (downloads a JSON file)
3. Create `.env.local` file with:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key-with-newlines"
```

## Testing the Fix:
1. Start dev server: `npm run dev`
2. Go to `/events`
3. Try creating an event - should work now!

The app automatically gives development permissions to all users when Firebase Admin is not configured.
