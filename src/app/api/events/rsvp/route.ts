// src/app/api/events/rsvp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getUserProfile } from '@/lib/auth-admin';

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

    // Parse the request body
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get user document
    const userRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const rsvpedEvents = userData?.rsvpedEvents || [];

    if (rsvpedEvents.includes(eventId)) {
      // Remove RSVP
      await userRef.update({
        rsvpedEvents: rsvpedEvents.filter((id: string) => id !== eventId)
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'RSVP removed successfully'
      });
    } else {
      // Add RSVP
      await userRef.update({
        rsvpedEvents: [...rsvpedEvents, eventId]
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        message: 'RSVP added successfully'
      });
    }

  } catch (error) {
    console.error('Error handling RSVP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
