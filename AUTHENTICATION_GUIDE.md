# Quick Start Guide - Authentication & Authorization

## ✅ What's Been Implemented

### 1. Server-Side Protection
- ✅ Middleware that validates authentication tokens for all API routes
- ✅ Protected API endpoints for forums, resources, and events
- ✅ Role-based access control (Student, Moderator, Admin)
- ✅ Firebase Admin SDK integration for server-side auth

### 2. Client-Side Protection
- ✅ Enhanced AuthContext with role checking
- ✅ ProtectedRoute wrapper for page-level protection
- ✅ ProtectedButton and ProtectedAction components
- ✅ Automatic token management with secure cookies

### 3. Database Security
- ✅ Comprehensive Firestore security rules
- ✅ Resource ownership validation
- ✅ Role-based read/write permissions

### 4. Admin Interface
- ✅ Admin panel with moderation tools
- ✅ Role-based navigation menu
- ✅ Content management interface

## 🚀 How to Use

### Protecting Pages
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Require authentication
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>

// Require specific roles
<ProtectedRoute requiredRoles={['Admin', 'Moderator']}>
  <AdminPanel />
</ProtectedRoute>
```

### Protecting Actions
```tsx
import { ProtectedButton } from '@/components/ProtectedActions';

// Only admins can delete
<ProtectedButton 
  onClick={handleDelete}
  requiredRoles={['Admin']}
  variant="destructive"
>
  Delete
</ProtectedButton>
```

### Making API Calls
```tsx
import { useApiClient } from '@/lib/api';

function MyComponent() {
  const apiClient = useApiClient();
  
  const handleCreatePost = async () => {
    const response = await apiClient.createForumThread({
      title: "My Post",
      course: "CS101",
      tags: ["help"],
      body: "Need help with assignment"
    });
    
    if (response.success) {
      // Handle success
    } else {
      // Handle error: response.error
    }
  };
}
```

### Checking User Roles
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, userProfile, isAdmin, canModerate } = useAuth();
  
  return (
    <div>
      {user && <p>Welcome, {user.displayName}!</p>}
      {userProfile && <p>Role: {userProfile.role}</p>}
      {isAdmin() && <AdminButton />}
      {canModerate() && <ModerateButton />}
    </div>
  );
}
```

## 🔧 Setup Steps

### 1. Environment Variables
Create `.env.local`:
```env
FIREBASE_PROJECT_ID=campusconnect-ee87d
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
```

### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Set Up First Admin
```bash
node scripts/setup-admin.js your-email@example.com
```

## 📋 Protected Operations

### ✅ Forums
- **Create Thread**: Requires authentication
- **Upvote**: Requires authentication  
- **Pin/Lock**: Requires Admin or Moderator
- **Delete**: Requires Admin or Moderator

### ✅ Resources
- **Upload**: Requires authentication
- **Delete**: Requires Admin or Moderator

### ✅ Events
- **RSVP**: Requires authentication
- **Create/Edit**: Requires Admin

## 🛡️ Security Features

1. **Token Validation**: All API requests verified server-side
2. **Role Checking**: Granular permissions based on user roles
3. **Database Rules**: Firestore rules mirror server-side logic
4. **Input Validation**: All user inputs sanitized
5. **Secure Cookies**: HTTP-only cookies with proper expiration

## 🔗 Key Files Created/Modified

### New Files
- `src/lib/auth-admin.ts` - Server-side authentication utilities
- `src/components/ProtectedRoute.tsx` - Route protection wrapper
- `src/components/ProtectedActions.tsx` - Action protection components
- `src/components/AdminPanel.tsx` - Administration interface
- `src/lib/api.ts` - Authenticated API client
- `middleware.ts` - API route protection
- `src/app/api/forums/route.ts` - Protected forum API
- `src/app/api/events/rsvp/route.ts` - Protected RSVP API
- `src/app/admin/page.tsx` - Admin panel page

### Modified Files
- `src/contexts/AuthContext.tsx` - Enhanced with role checking
- `src/components/SidebarNav.tsx` - Added admin navigation
- `firestore.rules` - Comprehensive security rules

## 🎯 Next Steps

1. **Set up Firebase Admin credentials** for full functionality
2. **Create test users** with different roles
3. **Test all protected operations**
4. **Customize admin panel** for your needs
5. **Add audit logging** for moderation actions

## 📞 Support

Check the detailed documentation in `docs/authentication.md` for troubleshooting and advanced configuration options.
