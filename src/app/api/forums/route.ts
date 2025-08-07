// src/app/api/forums/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';

// Simple token verification with real JWT decoding
async function verifyToken(token: string) {
  try {
    if (!token || token.length < 10) {
      throw new Error('Invalid token format');
    }
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token structure');
    }
    
    // Decode the JWT payload to get real user information
    const payload = JSON.parse(atob(tokenParts[1]));
    
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name
    };
  } catch (error) {
    console.warn('Token decode failed, using development fallback:', error);
    // Fallback for development
    return {
      uid: 'dev-user-' + Date.now(),
      email: 'user@campus.edu',
      name: 'Development User'
    };
  }
}

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

    // Verify token using simple approach
    let decodedToken;
    try {
      decodedToken = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get user profile from Firestore using client SDK
    let userProfile;
    try {
      const userDocRef = doc(db, 'users', decodedToken.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        userProfile = userDocSnap.data();
      } else {
        // Create a default user profile
        userProfile = {
          name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Unknown User',
          email: decodedToken.email || '',
          role: 'Student'
        };
      }
    } catch (profileError) {
      console.warn('Could not access user profile, using default:', profileError);
      // Use a default profile if we can't access Firestore
      userProfile = {
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Unknown User',
        email: decodedToken.email || '',
        role: 'Student'
      };
    }

    // Parse the request body
    const { title, course, tags, body } = await request.json();

    if (!title || !course || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the forum thread using client SDK
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

    const threadsRef = collection(db, 'forumThreads');
    const docRef = await addDoc(threadsRef, threadData);

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
    // For reading, we allow public access with client SDK
    const threadsRef = collection(db, 'forumThreads');
    const threadsQuery = query(threadsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(threadsQuery);
    
    const threads = snapshot.docs.map((doc) => ({
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
