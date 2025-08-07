// src/components/AdminPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProtectedAction, ProtectedButton } from '@/components/ProtectedActions';
import { useApiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  FileText, 
  Trash2, 
  Pin, 
  PinOff, 
  Lock, 
  Unlock,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';

interface ModerationItem {
  id: string;
  type: 'forum' | 'resource' | 'user';
  title: string;
  author: string;
  date: string;
  status: 'active' | 'pinned' | 'locked' | 'deleted';
  reports?: number;
}

interface OrganizerRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  organizationType: string;
  organizationName: string;
  description: string;
  experience: string;
  portfolio?: string;
  justification: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewComments?: string;
  reviewerNotes?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Moderator' | 'Admin';
  status?: 'active' | 'suspended' | 'banned';
  bio?: string;
  avatar?: string;
  createdAt?: any;
  lastLogin?: any;
  suspendedAt?: any;
  suspendedBy?: string;
  suspensionReason?: string;
  bannedAt?: any;
  bannedBy?: string;
  banReason?: string;
}

interface AnalyticsData {
  users: {
    total: number;
    admins: number;
    moderators: number;
    students: number;
    suspended: number;
    banned: number;
    active: number;
  };
  events: {
    total: number;
    upcoming: number;
    past: number;
    recent: number;
    weekly: number;
  };
  forums: {
    total: number;
    pinned: number;
    locked: number;
    recent: number;
    weekly: number;
  };
  resources: {
    total: number;
  };
  organizerRequests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    recent: number;
  };
  activity: {
    last30Days: {
      events: number;
      forums: number;
      requests: number;
    };
    last7Days: {
      events: number;
      forums: number;
    };
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Moderator' | 'Admin';
  status?: 'active' | 'suspended' | 'banned';
  bio?: string;
  avatar?: string;
  createdAt?: any;
  lastLogin?: any;
  suspendedAt?: any;
  suspendedBy?: string;
  suspensionReason?: string;
  bannedAt?: any;
  bannedBy?: string;
  banReason?: string;
}

export const AdminPanel: React.FC = () => {
  const { userProfile, canModerate, isAdmin, user } = useAuth();
  const { toast } = useToast();
  const apiClient = useApiClient();
  
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>([
    {
      id: '1',
      type: 'forum',
      title: 'Help with CS101 Assignment',
      author: 'John Doe',
      date: '2025-01-15',
      status: 'active',
      reports: 2
    },
    {
      id: '2',
      type: 'resource',
      title: 'Lecture Notes - Week 5',
      author: 'Jane Smith',
      date: '2025-01-14',
      status: 'active',
      reports: 0
    }
  ]);

  const [organizerRequests, setOrganizerRequests] = useState<OrganizerRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    console.log('AdminPanel useEffect triggered, user:', !!user, 'canModerate:', canModerate(), 'isAdmin:', isAdmin());
    fetchOrganizerRequests();
    fetchUsers();
    fetchAnalytics();
  }, [user]);

  const fetchOrganizerRequests = async () => {
    if (!user || !canModerate()) return;
    
    try {
      setLoadingRequests(true);
      const response = await fetch('/api/admin/organizer-requests', {
        headers: {
          'x-user-id': user.uid
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizerRequests(data.requests || []);
      } else {
        console.error('Failed to fetch organizer requests');
      }
    } catch (error) {
      console.error('Error fetching organizer requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchUsers = async () => {
    if (!user || !canModerate()) return;
    
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-user-id': user.uid
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!user || !isAdmin()) {
      console.log('Analytics fetch skipped: user not admin', { user: !!user, isAdmin: isAdmin() });
      return;
    }
    
    try {
      setLoadingAnalytics(true);
      console.log('Fetching analytics data...');
      
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'x-user-id': user.uid
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data);
        // The API returns { success: true, analytics: {...} }
        if (data.success && data.analytics) {
          console.log('Setting analytics state with:', data.analytics);
          setAnalytics(data.analytics);
        } else {
          console.error('Invalid analytics response format:', data);
          setAnalytics(null);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch analytics:', response.status, errorText);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleUserAction = async (targetUserId: string, action: string, newRole?: string, reason?: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          targetUserId,
          action,
          newRole,
          reason
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message,
        });
        
        // Refresh the users list
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to update user',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          targetUserId
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        
        // Refresh the users list
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to delete user',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    }
  };

  const handleOrganizerRequestAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch('/api/admin/organizer-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          requestId,
          action,
          reviewerNotes: notes || ''
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Request ${action}d successfully`,
        });
        
        // Refresh the requests list
        fetchOrganizerRequests();
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || `Failed to ${action} request`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    }
  };

  const handleModerateAction = async (itemId: string, action: string) => {
    try {
      let response;
      
      if (action === 'delete') {
        response = await apiClient.deleteForumThread(itemId);
      } else {
        response = await apiClient.moderateThread(itemId, action as any);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: `Item ${action}ed successfully`,
        });
        
        // Update local state
        setModerationItems(items =>
          items.map(item =>
            item.id === itemId
              ? { ...item, status: action === 'delete' ? 'deleted' : action as any }
              : item
          )
        );
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error || 'Failed to moderate item',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    }
  };

  if (!canModerate()) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You need Admin or Moderator permissions to access this panel.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          {isAdmin() ? 'Admin Panel' : 'Moderator Panel'}
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome, {userProfile?.name} ({userProfile?.role})
        </p>
      </div>

      <Tabs defaultValue="organizer-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="organizer-requests">Organizer Requests</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings" disabled={!isAdmin()}>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="organizer-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Organizer Requests
              </CardTitle>
              <CardDescription>
                Review and approve requests for event organizer permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="w-6 h-6 animate-spin mr-2" />
                  Loading requests...
                </div>
              ) : organizerRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No organizer requests found
                </div>
              ) : (
                <div className="space-y-4">
                  {organizerRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{request.userName}</h4>
                            <Badge 
                              variant={
                                request.status === 'pending' ? 'default' : 
                                request.status === 'approved' ? 'default' : 
                                'destructive'
                              }
                              className={
                                request.status === 'pending' ? 'bg-yellow-500' :
                                request.status === 'approved' ? 'bg-green-500' :
                                'bg-red-500'
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {request.userEmail} • {request.role} at {request.organizationName}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Organization Type:</strong> {request.organizationType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-700">
                            <strong>Justification:</strong> {request.justification}
                          </p>
                          {request.reviewerNotes && (
                            <p className="text-sm text-blue-700 mt-2">
                              <strong>Reviewer Notes:</strong> {request.reviewerNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <ProtectedButton
                            onClick={() => handleOrganizerRequestAction(request.id, 'approve')}
                            variant="default"
                            size="sm"
                            requiredRoles={['Admin', 'Moderator']}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </ProtectedButton>
                          
                          <ProtectedButton
                            onClick={() => handleOrganizerRequestAction(request.id, 'reject', 'Request does not meet requirements')}
                            variant="destructive"
                            size="sm"
                            requiredRoles={['Admin', 'Moderator']}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </ProtectedButton>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Submitted: {new Date(request.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                        {request.reviewedAt && (
                          <span className="ml-4">
                            Reviewed: {new Date(request.reviewedAt?.seconds * 1000).toLocaleDateString()}
                            {request.reviewedBy && ` by ${request.reviewedBy}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Content Moderation
              </CardTitle>
              <CardDescription>
                Review and moderate forum posts, resources, and reported content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moderationItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.type === 'forum' ? (
                          <MessageSquare className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                        {item.reports && item.reports > 0 && (
                          <Badge variant="destructive">{item.reports} reports</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        By {item.author} on {item.date}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* View details */}}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <ProtectedButton
                        onClick={() => handleModerateAction(item.id, 'pin')}
                        variant="outline"
                        size="sm"
                        requiredRoles={['Admin', 'Moderator']}
                      >
                        <Pin className="w-4 h-4" />
                      </ProtectedButton>
                      
                      <ProtectedButton
                        onClick={() => handleModerateAction(item.id, 'lock')}
                        variant="outline"
                        size="sm"
                        requiredRoles={['Admin', 'Moderator']}
                      >
                        <Lock className="w-4 h-4" />
                      </ProtectedButton>
                      
                      <ProtectedButton
                        onClick={() => handleModerateAction(item.id, 'delete')}
                        variant="destructive"
                        size="sm"
                        requiredRoles={['Admin', 'Moderator']}
                      >
                        <Trash2 className="w-4 h-4" />
                      </ProtectedButton>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user roles, permissions, and account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="w-6 h-6 animate-spin mr-2" />
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{user.name || 'Unknown User'}</h4>
                            <Badge 
                              variant={
                                user.role === 'Admin' ? 'destructive' : 
                                user.role === 'Moderator' ? 'default' : 
                                'secondary'
                              }
                            >
                              {user.role}
                            </Badge>
                            {user.status && user.status !== 'active' && (
                              <Badge 
                                variant="outline"
                                className={
                                  user.status === 'suspended' ? 'border-yellow-500 text-yellow-700' :
                                  user.status === 'banned' ? 'border-red-500 text-red-700' :
                                  ''
                                }
                              >
                                {user.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {user.email} • User ID: {user.id.slice(-8)}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Bio:</strong> {user.bio}
                            </p>
                          )}
                          {user.suspensionReason && (
                            <p className="text-sm text-yellow-700">
                              <strong>Suspension Reason:</strong> {user.suspensionReason}
                            </p>
                          )}
                          {user.banReason && (
                            <p className="text-sm text-red-700">
                              <strong>Ban Reason:</strong> {user.banReason}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {/* Role Change Buttons */}
                        {user.role !== 'Student' && (
                          <ProtectedButton
                            onClick={() => handleUserAction(user.id, 'changeRole', 'Student')}
                            variant="outline"
                            size="sm"
                            requiredRoles={['Admin']}
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Make Student
                          </ProtectedButton>
                        )}
                        
                        {user.role !== 'Moderator' && (
                          <ProtectedButton
                            onClick={() => handleUserAction(user.id, 'changeRole', 'Moderator')}
                            variant="outline"
                            size="sm"
                            requiredRoles={['Admin']}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Make Moderator
                          </ProtectedButton>
                        )}
                        
                        {user.role !== 'Admin' && (
                          <ProtectedButton
                            onClick={() => handleUserAction(user.id, 'changeRole', 'Admin')}
                            variant="outline"
                            size="sm"
                            requiredRoles={['Admin']}
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Make Admin
                          </ProtectedButton>
                        )}
                        
                        {/* Moderation Actions */}
                        {(!user.status || user.status === 'active') && (
                          <>
                            <ProtectedButton
                              onClick={() => handleUserAction(user.id, 'suspend', undefined, 'Temporary suspension')}
                              variant="outline"
                              size="sm"
                              requiredRoles={['Admin', 'Moderator']}
                              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Suspend
                            </ProtectedButton>
                            
                            <ProtectedButton
                              onClick={() => handleUserAction(user.id, 'ban', undefined, 'Account banned')}
                              variant="outline"
                              size="sm"
                              requiredRoles={['Admin', 'Moderator']}
                              className="border-red-500 text-red-700 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Ban
                            </ProtectedButton>
                          </>
                        )}
                        
                        {user.status === 'suspended' && (
                          <ProtectedButton
                            onClick={() => handleUserAction(user.id, 'unsuspend')}
                            variant="outline"
                            size="sm"
                            requiredRoles={['Admin', 'Moderator']}
                            className="border-green-500 text-green-700 hover:bg-green-50"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Unsuspend
                          </ProtectedButton>
                        )}
                        
                        {user.status === 'banned' && (
                          <ProtectedButton
                            onClick={() => handleUserAction(user.id, 'unban')}
                            variant="outline"
                            size="sm"
                            requiredRoles={['Admin', 'Moderator']}
                            className="border-green-500 text-green-700 hover:bg-green-50"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Unban
                          </ProtectedButton>
                        )}
                        
                        {/* Delete User (Admin only) */}
                        <ProtectedButton
                          onClick={() => handleDeleteUser(user.id)}
                          variant="destructive"
                          size="sm"
                          requiredRoles={['Admin']}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </ProtectedButton>
                      </div>
                      
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Created: {user.createdAt ? new Date(user.createdAt?.seconds * 1000).toLocaleDateString() : 'Unknown'}
                        {user.lastLogin && (
                          <span className="ml-4">
                            Last Login: {new Date(user.lastLogin?.seconds * 1000).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {loadingAnalytics ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-500">Loading analytics...</div>
            </div>
          ) : analytics && analytics.users ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.users?.total || 0}</CardTitle>
                    <CardDescription>Total Users</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.users?.admins || 0}</CardTitle>
                    <CardDescription>Administrators</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.users?.moderators || 0}</CardTitle>
                    <CardDescription>Moderators</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.users?.active || 0}</CardTitle>
                    <CardDescription>Active Users</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.events?.total || 0}</CardTitle>
                    <CardDescription>Total Events</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.events?.upcoming || 0}</CardTitle>
                    <CardDescription>Upcoming Events</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.events?.weekly || 0}</CardTitle>
                    <CardDescription>Events This Week</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.forums?.total || 0}</CardTitle>
                    <CardDescription>Forum Posts</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.forums?.recent || 0}</CardTitle>
                    <CardDescription>Recent Posts</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.resources?.total || 0}</CardTitle>
                    <CardDescription>Resources</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.organizerRequests?.pending || 0}</CardTitle>
                    <CardDescription>Pending Organizer Requests</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{analytics.organizerRequests?.approved || 0}</CardTitle>
                    <CardDescription>Approved Organizers</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{(analytics.users?.suspended || 0) + (analytics.users?.banned || 0)}</CardTitle>
                    <CardDescription>Suspended/Banned Users</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Activity Overview</CardTitle>
                  <CardDescription>Platform activity in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analytics.activity?.last30Days?.events || 0}</div>
                      <div className="text-sm text-gray-500">New Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics.activity?.last30Days?.forums || 0}</div>
                      <div className="text-sm text-gray-500">Forum Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics.activity?.last30Days?.requests || 0}</div>
                      <div className="text-sm text-gray-500">Organizer Requests</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex justify-center items-center h-32">
              <div className="text-red-500">Failed to load analytics data</div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
