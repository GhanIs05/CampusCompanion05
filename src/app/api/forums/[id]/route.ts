// src/app/api/forums/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, checkUserRole } from '@/lib/auth-admin';

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

    // Check if user has admin or moderator role
    const hasPermission = await checkUserRole(decodedToken.uid, ['Admin', 'Moderator']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin or Moderator role required.' },
        { status: 403 }
      );
    }

    // Delete the forum thread
    await adminDb.collection('forumThreads').doc(params.id).delete();

    return NextResponse.json(
      { success: true, message: 'Forum thread deleted successfully' }
    );

  } catch (error) {
    console.error('Error deleting forum thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { action } = await request.json();

    // Handle upvoting (all authenticated users can upvote)
    if (action === 'upvote') {
      const threadRef = adminDb.collection('forumThreads').doc(params.id);
      const threadDoc = await threadRef.get();
      
      if (!threadDoc.exists) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }

      const threadData = threadDoc.data();
      const upvotedBy = threadData?.upvotedBy || [];
      
      if (upvotedBy.includes(decodedToken.uid)) {
        // Remove upvote
        await threadRef.update({
          upvotes: Math.max(0, (threadData?.upvotes || 0) - 1),
          upvotedBy: upvotedBy.filter((id: string) => id !== decodedToken.uid)
        });
      } else {
        // Add upvote
        await threadRef.update({
          upvotes: (threadData?.upvotes || 0) + 1,
          upvotedBy: [...upvotedBy, decodedToken.uid]
        });
      }

      return NextResponse.json({ success: true });
    }

    // Handle moderation actions (admin/moderator only)
    if (['pin', 'unpin', 'lock', 'unlock'].includes(action)) {
      const hasPermission = await checkUserRole(decodedToken.uid, ['Admin', 'Moderator']);
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Admin or Moderator role required.' },
          { status: 403 }
        );
      }

      const updateData: any = {};
      if (action === 'pin') updateData.pinned = true;
      if (action === 'unpin') updateData.pinned = false;
      if (action === 'lock') updateData.locked = true;
      if (action === 'unlock') updateData.locked = false;

      await adminDb.collection('forumThreads').doc(params.id).update(updateData);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating forum thread:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
