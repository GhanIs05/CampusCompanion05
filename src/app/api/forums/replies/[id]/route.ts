// src/app/api/forums/replies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, checkUserRole } from '@/lib/auth-admin';
import { increment, arrayUnion, arrayRemove } from 'firebase/firestore';

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

    // Get the reply to check ownership
    const replyDoc = await adminDb.collection('forumReplies').doc(params.id).get();
    if (!replyDoc.exists) {
      return NextResponse.json(
        { error: 'Reply not found' },
        { status: 404 }
      );
    }

    const replyData = replyDoc.data();
    if (!replyData) {
      return NextResponse.json(
        { error: 'Reply data not found' },
        { status: 404 }
      );
    }

    const isOwner = replyData.authorId === decodedToken.uid;
    const isAdmin = await checkUserRole(decodedToken.uid, ['Admin', 'Moderator']);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied. You can only delete your own replies.' },
        { status: 403 }
      );
    }

    // Delete the reply
    await adminDb.collection('forumReplies').doc(params.id).delete();

    // Decrement the thread's reply count
    await adminDb.collection('forumThreads').doc(replyData.threadId).update({
      replies: increment(-1)
    });

    return NextResponse.json({
      success: true,
      message: 'Reply deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting reply:', error);
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

    const { action, body } = await request.json();

    // Handle upvoting replies
    if (action === 'upvote') {
      const replyRef = adminDb.collection('forumReplies').doc(params.id);
      const replyDoc = await replyRef.get();
      
      if (!replyDoc.exists) {
        return NextResponse.json(
          { error: 'Reply not found' },
          { status: 404 }
        );
      }

      const replyData = replyDoc.data();
      const upvotedBy = replyData?.upvotedBy || [];
      
      if (upvotedBy.includes(decodedToken.uid)) {
        // Remove upvote
        await replyRef.update({
          upvotes: Math.max(0, (replyData?.upvotes || 0) - 1),
          upvotedBy: arrayRemove(decodedToken.uid)
        });
      } else {
        // Add upvote
        await replyRef.update({
          upvotes: (replyData?.upvotes || 0) + 1,
          upvotedBy: arrayUnion(decodedToken.uid)
        });
      }

      return NextResponse.json({ success: true });
    }

    // Handle editing replies
    if (action === 'edit') {
      const replyDoc = await adminDb.collection('forumReplies').doc(params.id).get();
      if (!replyDoc.exists) {
        return NextResponse.json(
          { error: 'Reply not found' },
          { status: 404 }
        );
      }

      const replyData = replyDoc.data();
      if (!replyData) {
        return NextResponse.json(
          { error: 'Reply data not found' },
          { status: 404 }
        );
      }

      const isOwner = replyData.authorId === decodedToken.uid;
      const isAdmin = await checkUserRole(decodedToken.uid, ['Admin', 'Moderator']);

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Permission denied. You can only edit your own replies.' },
          { status: 403 }
        );
      }

      if (!body || body.trim().length === 0) {
        return NextResponse.json(
          { error: 'Reply body is required' },
          { status: 400 }
        );
      }

      await adminDb.collection('forumReplies').doc(params.id).update({
        body: body.trim(),
        updatedAt: new Date().toISOString(),
        edited: true
      });

      return NextResponse.json({
        success: true,
        message: 'Reply updated successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
