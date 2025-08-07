// src/app/api/events/rsvp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Simple function to get user ID from headers (for development)
function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id') || null;
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from headers (development approach)
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
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

    // Get user document using client SDK
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const rsvpedEvents = userData?.rsvpedEvents || [];

    if (rsvpedEvents.includes(eventId)) {
      // Remove RSVP
      await updateDoc(userRef, {
        rsvpedEvents: arrayRemove(eventId)
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'RSVP removed successfully'
      });
    } else {
      // Add RSVP
      await updateDoc(userRef, {
        rsvpedEvents: arrayUnion(eventId)
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
