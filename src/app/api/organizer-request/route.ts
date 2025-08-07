import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { organizationType, organizationName, role, justification } = await request.json();

    if (!organizationType || !organizationName || !role || !justification) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user already has a pending or approved request using client SDK
    try {
      const requestsRef = collection(db, 'organizerRequests');
      const existingQuery = query(
        requestsRef,
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'approved'])
      );
      const existingRequests = await getDocs(existingQuery);

      if (!existingRequests.empty) {
        const existingRequest = existingRequests.docs[0].data();
        if (existingRequest.status === 'pending') {
          return NextResponse.json({ 
            error: 'You already have a pending organizer request' 
          }, { status: 400 });
        }
        if (existingRequest.status === 'approved') {
          return NextResponse.json({ 
            error: 'You already have organizer permissions' 
          }, { status: 400 });
        }
      }
    } catch (checkError) {
      console.warn('Could not check existing requests, proceeding:', checkError);
    }

    // Create organizer request using client SDK
    const requestData = {
      userId: userId,
      userEmail: `user-${userId}@campus.edu`, // We don't have email in headers, so generate one
      userName: `User ${userId.slice(-4)}`, // Use last 4 chars of userId for display
      organizationType,
      organizationName,
      role,
      justification,
      status: 'pending',
      createdAt: Timestamp.now(),
      reviewedBy: null,
      reviewedAt: null,
      reviewerNotes: ''
    };

    const requestsRef = collection(db, 'organizerRequests');
    const docRef = await addDoc(requestsRef, requestData);

    return NextResponse.json({
      success: true,
      message: 'Organizer request submitted successfully',
      requestId: docRef.id
    });

  } catch (error) {
    console.error('Error submitting organizer request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Get user's organizer request status using client SDK
    try {
      const requestsRef = collection(db, 'organizerRequests');
      const requestsQuery = query(
        requestsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const requestsSnapshot = await getDocs(requestsQuery);

      let requestStatus = null;
      if (!requestsSnapshot.empty) {
        const requestData = requestsSnapshot.docs[0].data();
        requestStatus = {
          status: requestData.status,
          organizationType: requestData.organizationType,
          organizationName: requestData.organizationName,
          role: requestData.role,
          createdAt: requestData.createdAt,
          reviewedAt: requestData.reviewedAt,
          reviewerNotes: requestData.reviewerNotes
        };
      }

      return NextResponse.json({
        success: true,
        requestStatus
      });
    } catch (fetchError) {
      console.warn('Could not fetch request status:', fetchError);
      return NextResponse.json({
        success: true,
        requestStatus: null
      });
    }

  } catch (error) {
    console.error('Error fetching organizer request status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
