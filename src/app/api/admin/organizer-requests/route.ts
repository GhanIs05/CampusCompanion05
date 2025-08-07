import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, where, Timestamp, getDoc } from 'firebase/firestore';

// Get user ID from request headers
async function getUserId(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return null;
  }
  return userId;
}

// Check if user has admin/moderator permissions
async function checkAdminPermissions(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role === 'Admin' || userData.role === 'Moderator';
    }
    
    // For development, allow any user to be admin
    return true;
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    // For development, default to true
    return true;
  }
}

// GET - Fetch all organizer requests (for admins)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const hasPermission = await checkAdminPermissions(userId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    // Fetch all organizer requests
    const requestsRef = collection(db, 'organizerRequests');
    const requestsQuery = query(requestsRef, orderBy('createdAt', 'desc'));
    const requestsSnapshot = await getDocs(requestsQuery);

    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      requests
    });

  } catch (error) {
    console.error('Error fetching organizer requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Approve or reject organizer request
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const hasPermission = await checkAdminPermissions(userId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const { requestId, action, reviewerNotes } = await request.json();

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Update the organizer request
    const requestRef = doc(db, 'organizerRequests', requestId);
    await updateDoc(requestRef, {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: Timestamp.now(),
      reviewedBy: userId,
      reviewerNotes: reviewerNotes || ''
    });

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`
    });

  } catch (error) {
    console.error('Error updating organizer request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
