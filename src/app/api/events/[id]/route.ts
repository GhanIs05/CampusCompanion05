// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, checkUserRole } from '@/lib/auth-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventDoc = await adminDb.collection('events').doc(params.id).get();
    
    if (!eventDoc.exists) {
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

    // Get the event to check ownership
    const eventDoc = await adminDb.collection('events').doc(params.id).get();
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    const isOrganizer = eventData?.organizerId === decodedToken.uid;
    const isAdmin = await checkUserRole(decodedToken.uid, ['Admin', 'Moderator']);

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied. You can only edit events you organize.' },
        { status: 403 }
      );
    }

    // Parse the request body
    const { title, description, date, location, category, capacity } = await request.json();

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
      date: eventDate.toISOString(),
      location,
      category: category || 'General',
      capacity: capacity || null,
      updatedAt: new Date().toISOString(),
      updatedBy: decodedToken.uid
    };

    await adminDb.collection('events').doc(params.id).update(updateData);

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

    // Get the event to check ownership
    const eventDoc = await adminDb.collection('events').doc(params.id).get();
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    const isOrganizer = eventData?.organizerId === decodedToken.uid;
    const isAdmin = await checkUserRole(decodedToken.uid, ['Admin', 'Moderator']);

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied. You can only delete events you organize.' },
        { status: 403 }
      );
    }

    // Delete the event
    await adminDb.collection('events').doc(params.id).delete();

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
