// src/components/AdminPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  UserPlus
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
  role: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewerNotes?: string;
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

  // Fetch organizer requests on component mount
  useEffect(() => {
    fetchOrganizerRequests();
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
                            <strong>Organization Type:</strong> {request.organizationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">User management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">1,234</CardTitle>
                <CardDescription>Total Posts</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">567</CardTitle>
                <CardDescription>Active Users</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">89</CardTitle>
                <CardDescription>Resources Uploaded</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <ProtectedAction requiredRoles={['Admin']}>
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </ProtectedAction>
      </Tabs>
    </div>
  );
};
