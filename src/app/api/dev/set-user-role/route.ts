import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Development endpoint to set user role (remove in production)
export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role || !['Admin', 'Moderator', 'Student'].includes(role)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Check if user document exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Update existing user
      await setDoc(userRef, {
        ...userDoc.data(),
        role: role
      }, { merge: true });
    } else {
      // Create new user document
      await setDoc(userRef, {
        name: `User ${userId.slice(-4)}`,
        email: `user-${userId}@campus.edu`,
        role: role,
        bio: '',
        avatar: '',
        pinnedResources: [],
        rsvpedEvents: []
      });
    }

    return NextResponse.json({
      success: true,
      message: `User role set to ${role}`
    });

  } catch (error) {
    console.error('Error setting user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
