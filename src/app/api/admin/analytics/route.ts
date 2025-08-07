import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

// Get user ID from request headers
async function getUserId(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return null;
  }
  return userId;
}

// Check if user has admin/moderator permissions
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

// GET - Fetch analytics data (for admins)
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

    // Fetch analytics data in parallel
    const [
      usersSnapshot,
      eventsSnapshot,
      forumsSnapshot,
      resourcesSnapshot,
      organizerRequestsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'forums')),
      getDocs(collection(db, 'resources')),
      getDocs(collection(db, 'organizerRequests'))
    ]);

    // Process users data
    const users = usersSnapshot.docs.map(doc => doc.data());
    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.role === 'Admin').length;
    const moderatorUsers = users.filter(user => user.role === 'Moderator').length;
    const studentUsers = users.filter(user => user.role === 'Student' || !user.role).length;
    const suspendedUsers = users.filter(user => user.status === 'suspended').length;
    const bannedUsers = users.filter(user => user.status === 'banned').length;

    // Process events data
    const events = eventsSnapshot.docs.map(doc => doc.data());
    const totalEvents = events.length;
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate > new Date();
    }).length;
    const pastEvents = totalEvents - upcomingEvents;

    // Process forums data
    const forums = forumsSnapshot.docs.map(doc => doc.data());
    const totalForums = forums.length;
    const pinnedForums = forums.filter(forum => forum.pinned).length;
    const lockedForums = forums.filter(forum => forum.locked).length;

    // Process resources data
    const resources = resourcesSnapshot.docs.map(doc => doc.data());
    const totalResources = resources.length;

    // Process organizer requests data
    const organizerRequests = organizerRequestsSnapshot.docs.map(doc => doc.data());
    const totalOrganizerRequests = organizerRequests.length;
    const pendingRequests = organizerRequests.filter(req => req.status === 'pending').length;
    const approvedRequests = organizerRequests.filter(req => req.status === 'approved').length;
    const rejectedRequests = organizerRequests.filter(req => req.status === 'rejected').length;

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEvents = events.filter(event => {
      const createdAt = event.createdAt?.toDate?.() || new Date(event.createdAt?.seconds * 1000);
      return createdAt > thirtyDaysAgo;
    }).length;

    const recentForums = forums.filter(forum => {
      const createdAt = forum.timestamp?.toDate?.() || new Date(forum.timestamp?.seconds * 1000);
      return createdAt > thirtyDaysAgo;
    }).length;

    const recentRequests = organizerRequests.filter(req => {
      const createdAt = req.createdAt?.toDate?.() || new Date(req.createdAt?.seconds * 1000);
      return createdAt > thirtyDaysAgo;
    }).length;

    // Weekly stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyEvents = events.filter(event => {
      const createdAt = event.createdAt?.toDate?.() || new Date(event.createdAt?.seconds * 1000);
      return createdAt > sevenDaysAgo;
    }).length;

    const weeklyForums = forums.filter(forum => {
      const createdAt = forum.timestamp?.toDate?.() || new Date(forum.timestamp?.seconds * 1000);
      return createdAt > sevenDaysAgo;
    }).length;

    return NextResponse.json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          admins: adminUsers,
          moderators: moderatorUsers,
          students: studentUsers,
          suspended: suspendedUsers,
          banned: bannedUsers,
          active: totalUsers - suspendedUsers - bannedUsers
        },
        events: {
          total: totalEvents,
          upcoming: upcomingEvents,
          past: pastEvents,
          recent: recentEvents,
          weekly: weeklyEvents
        },
        forums: {
          total: totalForums,
          pinned: pinnedForums,
          locked: lockedForums,
          recent: recentForums,
          weekly: weeklyForums
        },
        resources: {
          total: totalResources
        },
        organizerRequests: {
          total: totalOrganizerRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
          recent: recentRequests
        },
        activity: {
          last30Days: {
            events: recentEvents,
            forums: recentForums,
            requests: recentRequests
          },
          last7Days: {
            events: weeklyEvents,
            forums: weeklyForums
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
