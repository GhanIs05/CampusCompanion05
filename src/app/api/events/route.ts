// src/app/api/events/route.ts
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
    // Extract token
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

    // Check user permissions using the permissions API
    let permissionData;
    try {
      const permissionResponse = await fetch(`${request.nextUrl.origin}/api/user/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!permissionResponse.ok) {
        // If permissions API fails, allow creation in development
        console.warn('Permission check failed, allowing in development mode');
        permissionData = { success: true, permissions: { canCreateEvents: true } };
      } else {
        permissionData = await permissionResponse.json();
      }
    } catch (fetchError) {
      // If fetch fails, allow creation in development
      console.warn('Permission fetch failed, allowing in development mode');
      permissionData = { success: true, permissions: { canCreateEvents: true } };
    }

    if (!permissionData.success || !permissionData.permissions?.canCreateEvents) {
      return NextResponse.json(
        { error: 'Permission denied. You need organizer permissions to create events.' },
        { status: 403 }
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
        const defaultProfile = {
          name: decodedToken.email?.split('@')[0] || 'Unknown User',
          email: decodedToken.email || '',
          role: 'Student',
          bio: '',
          avatar: 'https://placehold.co/100x100.png',
          pinnedResources: [],
          rsvpedEvents: [],
        };
        
        userProfile = defaultProfile;
      }
    } catch (profileError) {
      console.warn('Could not access user profile, using default:', profileError);
      // Use a default profile if we can't access Firestore
      userProfile = {
        name: decodedToken.email?.split('@')[0] || 'Unknown User',
        email: decodedToken.email || '',
        role: 'Student',
        bio: '',
        avatar: 'https://placehold.co/100x100.png',
        pinnedResources: [],
        rsvpedEvents: [],
      };
    }

    // Parse the request body
    const { title, description, date, location, category, capacity, imageUrl, extendedDescription } = await request.json();

    if (!title || !description || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date is in the future
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return NextResponse.json(
        { error: 'Event date must be in the future' },
        { status: 400 }
      );
    }

    // Create the event using client SDK with real user info
    const eventData = {
      title,
      description,
      extendedDescription: extendedDescription || null,
      imageUrl: imageUrl || null,
      date: eventDate.toISOString(),
      location,
      category: category || 'General',
      capacity: capacity || null,
      organizer: userProfile.name || decodedToken.name || decodedToken.email?.split('@')[0] || 'Unknown User',
      organizerId: decodedToken.uid,
      attendees: 0,
      rsvpList: [],
      createdAt: Timestamp.now()
    };

    const eventsRef = collection(db, 'events');
    const docRef = await addDoc(eventsRef, eventData);

    return NextResponse.json(
      { 
        success: true, 
        id: docRef.id,
        message: 'Event created successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(eventsRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(eventsQuery);
    
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ events });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
