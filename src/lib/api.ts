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
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
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

  // Event operations
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

  async getResources() {
    return this.makeRequest('/resources');
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Hook for using API client with authentication
export const useApiClient = () => {
  const { getAuthToken } = useAuth();

  const makeAuthenticatedRequest = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      return apiClient.makeRequest(endpoint, {
        ...options,
        headers,
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

    // Resource operations
    uploadResource: (data: Parameters<typeof apiClient.uploadResource>[0]) =>
      makeAuthenticatedRequest('/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Event operations
    rsvpEvent: (eventId: string) =>
      makeAuthenticatedRequest('/events/rsvp', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      }),

    // Generic authenticated request
    request: makeAuthenticatedRequest,
  };
};
