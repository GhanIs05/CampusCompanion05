// src/app/api/resources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { Timestamp, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

// Simple token verification that extracts real user info from Firebase token
async function verifyToken(token: string) {
  try {
    if (!token || token.length < 10) {
      throw new Error('Invalid token format');
    }
    
    // Firebase tokens are JWTs with 3 parts separated by dots
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token structure');
    }
    
    // Decode the payload (middle part) of the JWT
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      
      return {
        uid: payload.user_id || payload.sub, // Firebase user ID
        email: payload.email || 'unknown@campus.edu',
        name: payload.name || payload.email?.split('@')[0] || 'Unknown User'
      };
    } catch (decodeError) {
      // If token decoding fails, fall back to development user
      console.warn('Token decode failed, using development user:', decodeError);
      return {
        uid: 'dev-user-' + Date.now(),
        email: 'user@campus.edu',
        name: 'Development User'
      };
    }
  } catch (error) {
    throw new Error('Token verification failed');
  }
}

export async function POST(request: NextRequest) {
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

    // Verify token
    let decodedToken;
    try {
      decodedToken = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { name, category, fileType, url } = await request.json();

    if (!name || !category || !fileType || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the resource using client SDK with real user info
    const resourceData = {
      name,
      category,
      fileType,
      url,
      uploader: decodedToken.name || decodedToken.email?.split('@')[0] || 'Anonymous User',
      uploaderId: decodedToken.uid,
      uploaderEmail: decodedToken.email,
      date: new Date().toISOString(),
      timestamp: Timestamp.now(),
      downloads: 0
    };

    const resourcesRef = collection(db, 'resources');
    const docRef = await addDoc(resourcesRef, resourceData);

    return NextResponse.json(
      { 
        success: true, 
        id: docRef.id,
        message: 'Resource uploaded successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error uploading resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const resourcesRef = collection(db, 'resources');
    const resourcesQuery = query(resourcesRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(resourcesQuery);
    
    const resources = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ resources });

  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
