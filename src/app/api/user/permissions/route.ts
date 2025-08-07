import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

// Get user ID from request headers or cookies
async function getUserId(request: NextRequest): Promise<string | null> {
  // In a real Firebase setup, you'd verify the ID token here
  // For now, we'll look for the user ID in headers or cookies
  const userId = request.headers.get('x-user-id') || 
                 request.cookies.get('user-id')?.value;
  
  if (!userId) {
    return null;
  }
  
  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user profile from Firestore using client SDK
    let userData: any = {};
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      userData = userDocSnap.exists() ? userDocSnap.data() : {};
    } catch (firestoreError) {
      console.warn('Could not fetch user profile from Firestore:', firestoreError);
      // Continue with empty userData - will get default permissions
    }

    // Check for organizer requests using client SDK
    let hasApprovedRequest = false;
    let hasPendingRequest = false;
    let requestData: any = null;

    try {
      // Check for approved organizer request
      const approvedQuery = query(
        collection(db, 'organizerRequests'),
        where('userId', '==', userId),
        where('status', '==', 'approved'),
        limit(1)
      );
      const approvedSnapshot = await getDocs(approvedQuery);
      
      if (!approvedSnapshot.empty) {
        hasApprovedRequest = true;
        requestData = approvedSnapshot.docs[0].data();
      } else {
        // Check for pending request
        const pendingQuery = query(
          collection(db, 'organizerRequests'),
          where('userId', '==', userId),
          where('status', '==', 'pending'),
          limit(1)
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        hasPendingRequest = !pendingSnapshot.empty;
      }
    } catch (queryError) {
      console.warn('Could not check organizer requests:', queryError);
      // Continue without organizer request data
    }

    // Build permissions based on user role and organizer status
    let permissions = {
      canCreateEvents: false,
      needsApproval: true,
      maxEventsPerWeek: 0,
      requestStatus: null as string | null,
      organizerInfo: null as any
    };

    // Check if user is admin/moderator (gets permissions from user profile in database)
    if (userData.role === 'Admin' || userData.role === 'Moderator') {
      permissions = {
        canCreateEvents: true,
        needsApproval: false,
        maxEventsPerWeek: 20,
        requestStatus: 'approved',
        organizerInfo: {
          role: userData.role,
          organizationType: 'admin',
          organizationName: 'Campus Administration'
        }
      };
    }
    // Check if user has approved organizer request
    else if (hasApprovedRequest && requestData) {
      permissions = {
        canCreateEvents: true,
        needsApproval: getApprovalRequirement(requestData.organizationType),
        maxEventsPerWeek: getMaxEventsForType(requestData.organizationType),
        requestStatus: 'approved',
        organizerInfo: {
          role: requestData.role,
          organizationType: requestData.organizationType,
          organizationName: requestData.organizationName,
          approvedAt: requestData.reviewedAt
        }
      };
    }
    // Check if user has pending request
    else if (hasPendingRequest) {
      permissions.requestStatus = 'pending';
    }

    return NextResponse.json({
      success: true,
      permissions
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    
    // Return default permissions for development
    return NextResponse.json({
      success: true,
      permissions: {
        canCreateEvents: true, // Allow in development
        needsApproval: false,
        maxEventsPerWeek: 5,
        requestStatus: 'approved',
        organizerInfo: {
          role: 'Student',
          organizationType: 'development',
          organizationName: 'Development Mode'
        }
      }
    });
  }
}

function getApprovalRequirement(organizationType: string): boolean {
  const approvalMap: Record<string, boolean> = {
    'student_club': false,
    'academic_dept': false,
    'student_govt': false,
    'academic_role': false,
    'general_organizer': true
  };
  return approvalMap[organizationType] ?? true;
}

function getMaxEventsForType(organizationType: string): number {
  const maxEventsMap: Record<string, number> = {
    'student_club': 8,
    'academic_dept': 10,
    'student_govt': 15,
    'academic_role': 5,
    'general_organizer': 3
  };
  return maxEventsMap[organizationType] ?? 2;
}
