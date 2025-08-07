'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, PartyPopper } from 'lucide-react';
import RequestOrganizerButton from './RequestOrganizerButton';

interface UserPermissions {
  canCreateEvents: boolean;
  needsApproval: boolean;
  requestStatus?: 'pending' | 'approved' | 'rejected' | null;
  organizerInfo?: {
    role: string;
    organizationType: string;
    organizationName: string;
    approvedAt?: string;
  };
}

interface EventPermissionBannerProps {
  userPermissions: UserPermissions | null;
  user: any;
  onRequestSubmitted?: () => void | Promise<void>;
}

export default function EventPermissionBanner({ userPermissions, user, onRequestSubmitted }: EventPermissionBannerProps) {
  if (!user) return null;
  
  // User has organizer permissions
  if (userPermissions?.canCreateEvents) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-green-800 dark:text-green-200">
              Event Organizer Active
            </div>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">
              You can create and manage events on Campus Companion
              {userPermissions.organizerInfo && (
                <span className="block">
                  Role: {userPermissions.organizerInfo.role} • {userPermissions.organizerInfo.organizationName}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User has pending request
  if (userPermissions?.requestStatus === 'pending') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-yellow-800 dark:text-yellow-200">
              Request Under Review
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
              Your organizer request is being reviewed by campus administrators. 
              You'll be notified once it's processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User has rejected request
  if (userPermissions?.requestStatus === 'rejected') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 dark:text-red-300 text-xs font-bold">✕</span>
          </div>
          <div className="flex-1">
            <div className="font-medium text-red-800 dark:text-red-200">
              Request Not Approved
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              Your organizer request was not approved. You can submit a new request with additional information.
            </p>
            <div className="mt-3">
              <RequestOrganizerButton 
                requestStatus={userPermissions.requestStatus} 
                onRequestSubmitted={onRequestSubmitted}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User can request permissions
  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <PartyPopper className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Want to Organize Campus Events? 🎉
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
              Request permission to create and manage events for the campus community. 
              Perfect for club officers, student government members, and event organizers.
            </p>
            <RequestOrganizerButton 
              requestStatus={userPermissions?.requestStatus}
              onRequestSubmitted={onRequestSubmitted}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
