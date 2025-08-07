// src/app/api/resources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, checkUserRole } from '@/lib/auth-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceDoc = await adminDb.collection('resources').doc(params.id).get();
    
    if (!resourceDoc.exists) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: resourceDoc.id,
      ...resourceDoc.data()
    });

  } catch (error) {
    console.error('Error fetching resource:', error);
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

    // Get the resource to check ownership
    const resourceDoc = await adminDb.collection('resources').doc(params.id).get();
    if (!resourceDoc.exists) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    const resourceData = resourceDoc.data();
    const isOwner = resourceData?.uploaderId === decodedToken.uid;
    const isAdmin = await checkUserRole(decodedToken.uid, ['Admin', 'Moderator']);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied. You can only edit your own resources.' },
        { status: 403 }
      );
    }

    // Parse the request body
    const { name, category } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    // Update the resource
    const updateData = {
      name,
      category,
      updatedAt: new Date().toISOString(),
      updatedBy: decodedToken.uid
    };

    await adminDb.collection('resources').doc(params.id).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Resource updated successfully'
    });

  } catch (error) {
    console.error('Error updating resource:', error);
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

    // Get the resource to check ownership
    const resourceDoc = await adminDb.collection('resources').doc(params.id).get();
    if (!resourceDoc.exists) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    const resourceData = resourceDoc.data();
    const isOwner = resourceData?.uploaderId === decodedToken.uid;
    const isAdmin = await checkUserRole(decodedToken.uid, ['Admin', 'Moderator']);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied. You can only delete your own resources.' },
        { status: 403 }
      );
    }

    // Delete the resource
    await adminDb.collection('resources').doc(params.id).delete();

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
