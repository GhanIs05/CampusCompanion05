// src/components/ForumActions.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProtectedButton } from '@/components/ProtectedActions';
import { useApiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, Trash2, Pin, Lock, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ForumActionsProps {
  threadId: string;
  upvotes: number;
  isUpvoted: boolean;
  isPinned?: boolean;
  isLocked?: boolean;
  onUpdate?: () => void;
}

export const ForumActions: React.FC<ForumActionsProps> = ({
  threadId,
  upvotes,
  isUpvoted,
  isPinned = false,
  isLocked = false,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const apiClient = useApiClient();
  const { toast } = useToast();

  const handleUpvote = async () => {
    setLoading(true);
    try {
      const response = await apiClient.upvoteThread(threadId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: isUpvoted ? 'Upvote removed' : 'Thread upvoted',
        });
        onUpdate?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error || 'Failed to upvote thread',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModerateAction = async (action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete') => {
    setLoading(true);
    try {
      let response;
      
      if (action === 'delete') {
        response = await apiClient.deleteForumThread(threadId);
      } else {
        response = await apiClient.moderateThread(threadId, action);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: `Thread ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`,
        });
        onUpdate?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error || `Failed to ${action} thread`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Upvote button - available to all authenticated users */}
      <Button
        variant={isUpvoted ? 'default' : 'outline'}
        size="sm"
        onClick={handleUpvote}
        disabled={loading}
        className="flex items-center gap-1"
      >
        <ArrowUp className="w-4 h-4" />
        {upvotes}
      </Button>

      {/* Moderation actions - only for admins/moderators */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Pin/Unpin action */}
          <ProtectedButton
            onClick={() => handleModerateAction(isPinned ? 'unpin' : 'pin')}
            variant="ghost"
            size="sm"
            requiredRoles={['Admin', 'Moderator']}
            className="w-full justify-start"
          >
            <Pin className="w-4 h-4 mr-2" />
            {isPinned ? 'Unpin' : 'Pin'} Thread
          </ProtectedButton>

          {/* Lock/Unlock action */}
          <ProtectedButton
            onClick={() => handleModerateAction(isLocked ? 'unlock' : 'lock')}
            variant="ghost"
            size="sm"
            requiredRoles={['Admin', 'Moderator']}
            className="w-full justify-start"
          >
            <Lock className="w-4 h-4 mr-2" />
            {isLocked ? 'Unlock' : 'Lock'} Thread
          </ProtectedButton>

          <DropdownMenuSeparator />

          {/* Delete action */}
          <ProtectedButton
            onClick={() => handleModerateAction('delete')}
            variant="ghost"
            size="sm"
            requiredRoles={['Admin', 'Moderator']}
            className="w-full justify-start text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Thread
          </ProtectedButton>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
