// src/app/api/resources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getUserProfile } from '@/lib/auth-admin';
import { Timestamp } from 'firebase/firestore';

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

    // Parse the request body
    const { name, category, fileType, url } = await request.json();

    if (!name || !category || !fileType || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the resource
    const resourceData = {
      name,
      category,
      fileType,
      url,
      uploader: userProfile.name,
      uploaderId: decodedToken.uid,
      date: new Date().toISOString(),
      timestamp: Timestamp.now(),
      downloads: 0
    };

    const docRef = await adminDb.collection('resources').add(resourceData);

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
    const resourcesRef = adminDb.collection('resources');
    const snapshot = await resourcesRef.orderBy('timestamp', 'desc').get();
    
    const resources = snapshot.docs.map(doc => ({
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
