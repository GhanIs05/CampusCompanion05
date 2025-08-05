# Authentication & Authorization System

## Overview

This document describes the comprehensive authentication and authorization system implemented for Campus Companion. The system provides server-side protection for all write operations and implements role-based access control.

## Architecture

### 1. Client-Side Authentication
- **AuthContext**: Manages user authentication state and provides role-checking utilities
- **Protected Components**: Wrapper components that conditionally render content based on user roles
- **Token Management**: Automatic token storage in secure HTTP-only cookies

### 2. Server-Side Protection
- **Middleware**: Intercepts API requests and validates authentication tokens
- **Firebase Admin SDK**: Server-side token verification and user management
- **Role-Based API Routes**: Protected endpoints that check user permissions

### 3. Database Security
- **Firestore Rules**: Comprehensive security rules that mirror server-side permissions
- **Resource Ownership**: Users can only modify their own content (unless admin/moderator)

## User Roles

### Student (Default)
- Create forum threads and replies
- Upload resources
- RSVP to events
- Upvote content
- Manage own profile

### Moderator
- All Student permissions
- Pin/unpin forum threads
- Lock/unlock threads
- Delete inappropriate content
- Access moderation panel

### Admin
- All Moderator permissions
- Create/edit/delete events
- Manage user roles
- Access system settings
- Full moderation capabilities

## Implementation Details

### Protected Routes

#### Server-Side API Protection
All write operations are protected at the API level:

```typescript
// Example: src/app/api/forums/route.ts
export async function POST(request: NextRequest) {
  // 1. Extract authentication token
  const token = request.cookies.get('auth-token')?.value;
  
  // 2. Verify token with Firebase Admin
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  // 3. Check user permissions
  const userProfile = await getUserProfile(decodedToken.uid);
  
  // 4. Process request if authorized
}
```

#### Client-Side Component Protection
Components are protected using wrapper components:

```tsx
// Protect entire pages
<ProtectedRoute requiredRoles={['Admin', 'Moderator']}>
  <AdminPanel />
</ProtectedRoute>

// Protect individual actions
<ProtectedButton 
  onClick={deleteThread}
  requiredRoles={['Admin', 'Moderator']}
>
  Delete
</ProtectedButton>
```

### Firestore Security Rules

```javascript
// Only authenticated users can create content
allow create: if isAuthenticated() && 
              request.resource.data.authorId == request.auth.uid;

// Only moderators can delete content
allow delete: if canModerate();

// Users can edit their own content, moderators can edit any
allow update: if isAuthenticated() && 
              (isOwner(resource.data) || canModerate());
```

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file with the following variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
```

### 2. Firebase Service Account
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Add the credentials to your environment variables

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## Protected Operations

### Forum Operations
- **Create Thread**: Requires authentication
- **Upvote**: Requires authentication
- **Delete/Moderate**: Requires Admin or Moderator role

### Resource Operations
- **Upload**: Requires authentication
- **Delete**: Requires Admin or Moderator role

### Event Operations
- **RSVP**: Requires authentication
- **Create/Edit**: Requires Admin role

### User Management
- **Profile Updates**: Users can only update their own profile
- **Role Changes**: Admin only

## API Endpoints

### Authentication Required
- `POST /api/forums` - Create forum thread
- `POST /api/resources` - Upload resource
- `POST /api/events/rsvp` - RSVP to event
- `PATCH /api/forums/[id]` - Upvote thread

### Admin/Moderator Required
- `DELETE /api/forums/[id]` - Delete thread
- `PATCH /api/forums/[id]` - Moderate thread (pin, lock)
- `DELETE /api/resources/[id]` - Delete resource

### Admin Only
- `POST /api/events` - Create event
- `PUT /api/users/[id]/role` - Change user role

## Components Reference

### Core Components
- `ProtectedRoute`: Wraps pages that require authentication/roles
- `ProtectedAction`: Conditionally renders content based on permissions
- `ProtectedButton`: Button that disables/hides based on permissions
- `AdminPanel`: Complete administration interface

### Hooks
- `useAuth()`: Access authentication state and role checking
- `useApiClient()`: Make authenticated API requests

### Utilities
- `apiClient`: Centralized API client with authentication
- `auth-admin.ts`: Server-side authentication utilities

## Security Best Practices

1. **Defense in Depth**: Protection at client, server, and database levels
2. **Principle of Least Privilege**: Users only get minimum required permissions
3. **Token Security**: Secure HTTP-only cookies with proper expiration
4. **Input Validation**: All user inputs are validated server-side
5. **Audit Trail**: All moderation actions are logged

## Testing Roles

### Creating Test Users
Use the Firebase Console to manually set user roles:

```javascript
// In Firestore, update user document
{
  "role": "Admin" // or "Moderator", "Student"
}
```

### Testing Permissions
1. Create users with different roles
2. Test each protected operation
3. Verify proper error messages for unauthorized access
4. Check that UI elements show/hide correctly

## Troubleshooting

### Common Issues

1. **"Authentication required" errors**
   - Check if auth token is being set in cookies
   - Verify Firebase Admin SDK configuration

2. **"Insufficient permissions" errors**
   - Check user role in Firestore
   - Verify role-checking logic

3. **Firestore permission denied**
   - Update and deploy Firestore rules
   - Check that rules match server-side logic

### Debug Tools
- Firebase Console for viewing user data
- Browser DevTools for checking cookies and network requests
- Server logs for authentication errors

## Future Enhancements

1. **Session Management**: Implement proper session handling
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Audit Logging**: Comprehensive logging of all actions
4. **2FA Support**: Two-factor authentication for admin accounts
5. **OAuth Integration**: Google/GitHub sign-in options
