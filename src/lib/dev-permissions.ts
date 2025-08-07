// src/lib/dev-permissions.ts
// Temporary development permissions system that doesn't require Firebase Admin SDK

export interface DevPermissions {
  canCreateEvents: boolean;
  needsApproval: boolean;
  maxEventsPerWeek: number;
  requestStatus: string | null;
  organizerInfo: any;
}

export function getDevPermissions(userEmail?: string): DevPermissions {
  // In development, give admin permissions to certain email patterns
  const adminEmails = [
    'admin@test.com',
    'test@admin.com',
    'admin@example.com'
  ];
  
  const isDevAdmin = userEmail && (
    adminEmails.includes(userEmail.toLowerCase()) ||
    userEmail.toLowerCase().includes('admin') ||
    userEmail.toLowerCase().includes('test')
  );

  if (isDevAdmin) {
    return {
      canCreateEvents: true,
      needsApproval: false,
      maxEventsPerWeek: 20,
      requestStatus: 'approved',
      organizerInfo: {
        role: 'Admin',
        organizationType: 'admin',
        organizationName: 'Development Admin'
      }
    };
  }

  // Regular users in development get limited permissions
  return {
    canCreateEvents: true, // Allow in development for testing
    needsApproval: true,
    maxEventsPerWeek: 2,
    requestStatus: 'approved', // Auto-approve in development
    organizerInfo: {
      role: 'Student',
      organizationType: 'student',
      organizationName: 'Development User'
    }
  };
}
