'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PartyPopper, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RequestOrganizerButtonProps {
  requestStatus?: 'pending' | 'approved' | 'rejected' | null;
  onRequestSubmitted?: () => void | Promise<void>;
}

export default function RequestOrganizerButton({ 
  requestStatus: propRequestStatus,
  onRequestSubmitted 
}: RequestOrganizerButtonProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localRequestStatus, setLocalRequestStatus] = useState<{
    status: 'pending' | 'approved' | 'rejected' | null;
    organizationType?: string;
    organizationName?: string;
    role?: string;
    createdAt?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(!propRequestStatus);
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    organizationType: '',
    organizationName: '',
    role: '',
    justification: ''
  });

  // Use prop status if provided, otherwise use local status
  const requestStatus = propRequestStatus ? { status: propRequestStatus } : localRequestStatus;

  const organizationTypes = [
    { value: 'student_club', label: 'Student Club/Organization' },
    { value: 'academic_dept', label: 'Academic Department' },
    { value: 'academic_role', label: 'Academic Role (TA, Research Assistant)' },
    { value: 'general_organizer', label: 'General Event Organizer' }
  ];

  // Check for existing request status on component mount (only if not provided via props)
  useEffect(() => {
    if (propRequestStatus || !user) {
      setIsLoading(false);
      return;
    }

    const checkRequestStatus = async () => {
      try {
        const response = await fetch('/api/organizer-request', {
          method: 'GET',
          headers: {
            'x-user-id': user.uid
          },
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          setLocalRequestStatus(result.requestStatus);
        }
      } catch (error) {
        console.error('Error checking request status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkRequestStatus();
  }, [propRequestStatus, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ 
        variant: "destructive",
        title: "Error",
        description: 'You must be logged in to submit a request'
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/organizer-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        toast({ 
          title: "Request submitted!", 
          description: "You'll be notified when it's reviewed." 
        });
        setIsOpen(false);
        setFormData({ organizationType: '', organizationName: '', role: '', justification: '' });
        
        // Notify parent component first to refresh permissions
        if (onRequestSubmitted) {
          await onRequestSubmitted();
        }
        
        // Then refresh local status if we're managing it locally
        if (!propRequestStatus) {
          // Add a small delay to ensure the database write has propagated
          setTimeout(async () => {
            try {
              const statusResponse = await fetch('/api/organizer-request', {
                method: 'GET',
                headers: {
                  'x-user-id': user.uid
                },
                credentials: 'include'
              });
              if (statusResponse.ok) {
                const statusResult = await statusResponse.json();
                console.log('Refreshed local status after submission:', statusResult);
                setLocalRequestStatus(statusResult.requestStatus);
              }
            } catch (error) {
              console.error('Error refreshing local status:', error);
            }
          }, 1000); // 1 second delay
        }
      } else {
        toast({ 
          variant: "destructive",
          title: "Error",
          description: result.error || 'Failed to submit request'
        });
      }
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "Error",
        description: 'Failed to submit request'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Button disabled className="bg-blue-600">
        <Clock className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Show pending status if user has a pending request
  if (requestStatus?.status === 'pending') {
    return (
      <Button disabled className="bg-yellow-600 text-white">
        <Clock className="w-4 h-4 mr-2" />
        Request Pending Review
      </Button>
    );
  }

  // Show approved status (though this should be handled by parent component)
  if (requestStatus?.status === 'approved') {
    return (
      <Button disabled className="bg-green-600 text-white">
        <PartyPopper className="w-4 h-4 mr-2" />
        Organizer Permissions Active
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <PartyPopper className="w-4 h-4 mr-2" />
          Request Organizer Permissions
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Event Organizer Permissions</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Organization Type *</Label>
            <Select 
              value={formData.organizationType}
              onValueChange={(value) => setFormData({...formData, organizationType: value})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your organization type" />
              </SelectTrigger>
              <SelectContent>
                {organizationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Organization/Department Name *</Label>
            <Input
              value={formData.organizationName}
              onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
              placeholder="e.g., Computer Science Club, Student Government"
              required
            />
          </div>

          <div>
            <Label>Your Role/Position *</Label>
            <Input
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              placeholder="e.g., President, Event Coordinator, TA"
              required
            />
          </div>

          <div>
            <Label>Why do you need organizer permissions? *</Label>
            <Textarea
              value={formData.justification}
              onChange={(e) => setFormData({...formData, justification: e.target.value})}
              placeholder="Explain what events you plan to organize and why..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Your request will be reviewed by campus administrators. 
              This typically takes 1-3 business days.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
