// src/app/api/forums/[id]/replies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getUserProfile } from '@/lib/auth-admin';
import { Timestamp, increment } from 'firebase/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract token
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const userProfile = await getUserProfile(decodedToken.uid);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if the thread exists
    const threadDoc = await adminDb.collection('forumThreads').doc(params.id).get();
    if (!threadDoc.exists) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Parse the request body
    const { body } = await request.json();

    if (!body || body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply body is required' },
        { status: 400 }
      );
    }

    // Create the reply
    const replyData = {
      body: body.trim(),
      author: userProfile.name,
      authorId: decodedToken.uid,
      threadId: params.id,
      upvotes: 0,
      upvotedBy: [],
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('forumReplies').add(replyData);

    // Increment the thread's reply count
    await adminDb.collection('forumThreads').doc(params.id).update({
      replies: increment(1)
    });

    return NextResponse.json(
      { 
        success: true, 
        id: docRef.id,
        message: 'Reply created successfully',
        reply: {
          id: docRef.id,
          ...replyData
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repliesRef = adminDb.collection('forumReplies');
    const snapshot = await repliesRef
      .where('threadId', '==', params.id)
      .orderBy('timestamp', 'asc')
      .get();
    
    const replies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ replies });

  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
