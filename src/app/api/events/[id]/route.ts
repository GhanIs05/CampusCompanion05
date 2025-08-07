// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Get user ID from headers (for development)
function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id') || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventRef = doc(db, 'events', params.id);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: eventDoc.id,
      ...eventDoc.data()
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from headers (development approach)
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the event to check if it exists
    const eventRef = doc(db, 'events', params.id);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    const isOrganizer = eventData?.organizerId === userId;
    
    // For development, allow any authenticated user to edit events
    // In production, you'd want proper role checking here

    // Parse the request body
    const { title, description, date, location, category, capacity, imageUrl, extendedDescription } = await request.json();

    if (!title || !description || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date is in the future (only if changing the date)
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return NextResponse.json(
        { error: 'Event date must be in the future' },
        { status: 400 }
      );
    }

    // Update the event
    const updateData = {
      title,
      description,
      extendedDescription: extendedDescription || null,
      imageUrl: imageUrl || null,
      date: eventDate.toISOString(),
      location,
      category: category || 'General',
      capacity: capacity || null,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    };

    await updateDoc(eventRef, updateData);

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from headers (development approach)
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the event to check if it exists
    const eventRef = doc(db, 'events', params.id);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    const isOrganizer = eventData?.organizerId === userId;
    
    // For development, allow any authenticated user to delete events
    // In production, you'd want proper role checking here

    // Delete the event
    await deleteDoc(eventRef);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
