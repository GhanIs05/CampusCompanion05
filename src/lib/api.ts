// src/lib/api.ts
import { useAuth } from '@/contexts/AuthContext';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl = '/api';

  async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Get auth token from cookie
      const getAuthTokenFromCookie = (): string | null => {
        if (typeof document === 'undefined') return null;
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
        return authCookie ? authCookie.split('=')[1] : null;
      };

      const authToken = getAuthTokenFromCookie();
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          ...options.headers,
        },
        credentials: 'include', // Include cookies
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
        message: data.message,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Forum operations
  async createForumThread(threadData: {
    title: string;
    course: string;
    tags: string[];
    body: string;
  }) {
    return this.makeRequest('/forums', {
      method: 'POST',
      body: JSON.stringify(threadData),
    });
  }

  async updateForumThread(threadId: string, threadData: {
    title: string;
    course: string;
    tags: string[];
    body: string;
  }) {
    return this.makeRequest(`/forums/${threadId}`, {
      method: 'PUT',
      body: JSON.stringify(threadData),
    });
  }

  async deleteForumThread(threadId: string) {
    return this.makeRequest(`/forums/${threadId}`, {
      method: 'DELETE',
    });
  }

  async upvoteThread(threadId: string) {
    return this.makeRequest(`/forums/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'upvote' }),
    });
  }

  async moderateThread(threadId: string, action: 'pin' | 'unpin' | 'lock' | 'unlock') {
    return this.makeRequest(`/forums/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  }

  // Forum replies
  async createForumReply(threadId: string, body: string) {
    return this.makeRequest(`/forums/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  async updateForumReply(replyId: string, body: string) {
    return this.makeRequest(`/forums/replies/${replyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'edit', body }),
    });
  }

  async deleteForumReply(replyId: string) {
    return this.makeRequest(`/forums/replies/${replyId}`, {
      method: 'DELETE',
    });
  }

  async upvoteReply(replyId: string) {
    return this.makeRequest(`/forums/replies/${replyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'upvote' }),
    });
  }

  // Resource operations
  async uploadResource(resourceData: {
    name: string;
    category: string;
    fileType: string;
    url: string;
  }) {
    return this.makeRequest('/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
  }

  async updateResource(resourceId: string, resourceData: {
    name: string;
    category: string;
  }) {
    return this.makeRequest(`/resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify(resourceData),
    });
  }

  async deleteResource(resourceId: string) {
    return this.makeRequest(`/resources/${resourceId}`, {
      method: 'DELETE',
    });
  }

  // Event operations
  async createEvent(eventData: {
    title: string;
    description: string;
    date: string;
    location: string;
    category?: string;
    capacity?: number;
    imageUrl?: string;
    extendedDescription?: string;
  }) {
    return this.makeRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId: string, eventData: {
    title: string;
    description: string;
    date: string;
    location: string;
    category?: string;
    capacity?: number;
  }) {
    return this.makeRequest(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId: string) {
    return this.makeRequest(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async rsvpEvent(eventId: string) {
    return this.makeRequest('/events/rsvp', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    });
  }

  // Get operations (no auth required but cached for performance)
  async getForumThreads() {
    return this.makeRequest('/forums');
  }

  async getForumThread(threadId: string) {
    return this.makeRequest(`/forums/${threadId}`);
  }

  async getForumReplies(threadId: string) {
    return this.makeRequest(`/forums/${threadId}/replies`);
  }

  async getResources() {
    return this.makeRequest('/resources');
  }

  async getResource(resourceId: string) {
    return this.makeRequest(`/resources/${resourceId}`);
  }

  async getEvents() {
    return this.makeRequest('/events');
  }

  async getEvent(eventId: string) {
    return this.makeRequest(`/events/${eventId}`);
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Hook for using API client with authentication
export const useApiClient = () => {
  const { getAuthToken, user } = useAuth();

  const makeAuthenticatedRequest = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const token = await getAuthToken();
      
      if (!token || !user) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.uid, // Include user ID for development compatibility
        ...options.headers,
      };

      return apiClient.makeRequest(endpoint, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  };

  return {
    // Forum operations
    createForumThread: (data: Parameters<typeof apiClient.createForumThread>[0]) =>
      makeAuthenticatedRequest('/forums', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    updateForumThread: (threadId: string, data: Parameters<typeof apiClient.updateForumThread>[1]) =>
      makeAuthenticatedRequest(`/forums/${threadId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    deleteForumThread: (threadId: string) =>
      makeAuthenticatedRequest(`/forums/${threadId}`, {
        method: 'DELETE',
      }),
    
    upvoteThread: (threadId: string) =>
      makeAuthenticatedRequest(`/forums/${threadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'upvote' }),
      }),
    
    moderateThread: (threadId: string, action: 'pin' | 'unpin' | 'lock' | 'unlock') =>
      makeAuthenticatedRequest(`/forums/${threadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }),

    // Forum replies
    createForumReply: (threadId: string, body: string) =>
      makeAuthenticatedRequest(`/forums/${threadId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),

    updateForumReply: (replyId: string, body: string) =>
      makeAuthenticatedRequest(`/forums/replies/${replyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'edit', body }),
      }),

    deleteForumReply: (replyId: string) =>
      makeAuthenticatedRequest(`/forums/replies/${replyId}`, {
        method: 'DELETE',
      }),

    upvoteReply: (replyId: string) =>
      makeAuthenticatedRequest(`/forums/replies/${replyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'upvote' }),
      }),

    // Resource operations
    uploadResource: (data: Parameters<typeof apiClient.uploadResource>[0]) =>
      makeAuthenticatedRequest('/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateResource: (resourceId: string, data: Parameters<typeof apiClient.updateResource>[1]) =>
      makeAuthenticatedRequest(`/resources/${resourceId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteResource: (resourceId: string) =>
      makeAuthenticatedRequest(`/resources/${resourceId}`, {
        method: 'DELETE',
      }),

    // Event operations
    createEvent: (data: Parameters<typeof apiClient.createEvent>[0]) =>
      makeAuthenticatedRequest('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateEvent: (eventId: string, data: Parameters<typeof apiClient.updateEvent>[1]) =>
      makeAuthenticatedRequest(`/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteEvent: (eventId: string) =>
      makeAuthenticatedRequest(`/events/${eventId}`, {
        method: 'DELETE',
      }),

    rsvpEvent: (eventId: string) =>
      makeAuthenticatedRequest('/events/rsvp', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      }),

    // Generic authenticated request
    request: makeAuthenticatedRequest,
  };
};
