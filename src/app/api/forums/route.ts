// src/app/api/forums/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getUserProfile } from '@/lib/auth-admin';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Extract token from cookie or header
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

    // Get user profile to check permissions
    const userProfile = await getUserProfile(decodedToken.uid);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Parse the request body
    const { title, course, tags, body } = await request.json();

    if (!title || !course || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the forum thread
    const threadData = {
      title,
      course,
      tags: tags || [],
      body,
      author: userProfile.name,
      authorId: decodedToken.uid,
      upvotes: 0,
      replies: 0,
      upvotedBy: [],
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('forumThreads').add(threadData);

    return NextResponse.json(
      { 
        success: true, 
        id: docRef.id,
        message: 'Forum thread created successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating forum thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // For reading, we might allow public access or require minimal auth
    const threadsRef = adminDb.collection('forumThreads');
    const snapshot = await threadsRef.orderBy('timestamp', 'desc').get();
    
    const threads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ threads });

  } catch (error) {
    console.error('Error fetching forum threads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
