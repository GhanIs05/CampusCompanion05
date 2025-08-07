import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, where, Timestamp, getDoc, deleteDoc } from 'firebase/firestore';

// Get user ID from request headers
async function getUserId(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return null;
  }
  return userId;
}

// Check if user has admin permissions
async function checkAdminPermissions(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role === 'Admin' || userData.role === 'Moderator';
    }
    
    // For development, allow any user to be admin
    return true;
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return true;
  }
}

// GET - Fetch all users (for admins)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const hasPermission = await checkAdminPermissions(userId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    // Fetch all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Don't expose sensitive data
      password: undefined
    }));

    // Sort by role and name
    users.sort((a, b) => {
      const roleOrder = { 'Admin': 0, 'Moderator': 1, 'Student': 2 };
      const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
      const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
      
      if (aRole !== bRole) {
        return aRole - bRole;
      }
      
      return (a.name || '').localeCompare(b.name || '');
    });

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user (role, status, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const hasPermission = await checkAdminPermissions(userId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const { targetUserId, action, newRole, reason } = await request.json();

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);

    if (!targetUserDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'changeRole':
        if (!newRole || !['Student', 'Moderator', 'Admin'].includes(newRole)) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }
        updateData.role = newRole;
        updateData.roleChangedAt = Timestamp.now();
        updateData.roleChangedBy = userId;
        message = `User role changed to ${newRole}`;
        break;

      case 'suspend':
        updateData.status = 'suspended';
        updateData.suspendedAt = Timestamp.now();
        updateData.suspendedBy = userId;
        updateData.suspensionReason = reason || '';
        message = 'User suspended';
        break;

      case 'unsuspend':
        updateData.status = 'active';
        updateData.unsuspendedAt = Timestamp.now();
        updateData.unsuspendedBy = userId;
        updateData.suspendedAt = null;
        updateData.suspendedBy = null;
        updateData.suspensionReason = null;
        message = 'User unsuspended';
        break;

      case 'ban':
        updateData.status = 'banned';
        updateData.bannedAt = Timestamp.now();
        updateData.bannedBy = userId;
        updateData.banReason = reason || '';
        message = 'User banned';
        break;

      case 'unban':
        updateData.status = 'active';
        updateData.unbannedAt = Timestamp.now();
        updateData.unbannedBy = userId;
        updateData.bannedAt = null;
        updateData.bannedBy = null;
        updateData.banReason = null;
        message = 'User unbanned';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await updateDoc(targetUserRef, updateData);

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin (only admins can delete users)
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists() || userDoc.data()?.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const targetUserRef = doc(db, 'users', targetUserId);
    await deleteDoc(targetUserRef);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
