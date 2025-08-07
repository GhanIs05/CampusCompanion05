// src/lib/dev-auth.ts
// Development-only authentication utilities that don't require Firebase Admin SDK

import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Simple function to get user ID from request headers (for development)
export function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id') || null;
}

// Get user document from Firestore using client SDK
export async function getUserFromRequest(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return { success: false, error: 'Authentication required', status: 401 };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: 'User not found', status: 404 };
    }

    return { 
      success: true, 
      user: { 
        id: userId, 
        ...userDoc.data() 
      } 
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Internal server error', status: 500 };
  }
}

// Check if user has required permissions
export function hasPermission(user: any, requiredRoles: string[] = []): boolean {
  if (!user || !user.role) return false;
  
  // Admin can do everything
  if (user.role === 'Admin') return true;
  
  // Check specific roles
  return requiredRoles.includes(user.role);
}

// Development helper to check admin/moderator permissions
export function canModerate(user: any): boolean {
  return hasPermission(user, ['Admin', 'Moderator']);
}

export function isAdmin(user: any): boolean {
  return hasPermission(user, ['Admin']);
}
