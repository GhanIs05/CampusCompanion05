'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/PageWrapper';

export default function DevToolsPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSetRole = async () => {
    if (!user || !selectedRole) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/dev/set-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          role: selectedRole
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Role updated to ${selectedRole}. Please refresh the page.`
        });
      } else {
        throw new Error('Failed to update role');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update role'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <PageWrapper title="Dev Tools">
        <div className="flex items-center justify-center min-h-screen">
          <p>Please log in to access dev tools</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Development Tools">
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Development Tools</CardTitle>
            <CardDescription>
              Tools for development and testing (remove in production)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Current User Info</h3>
              <p className="text-sm text-gray-600">
                <strong>UID:</strong> {user.uid}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Current Role:</strong> {userProfile?.role || 'Not set'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Set User Role</h3>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Moderator">Moderator</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSetRole} 
                  disabled={!selectedRole || isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Role'}
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This is a development tool. In production, user roles should be managed through proper admin interfaces with authentication.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
