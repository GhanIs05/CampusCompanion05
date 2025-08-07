// src/lib/events-client.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  capacity?: number;
  organizer: string;
  organizerId: string;
  attendees: number;
  rsvpList: string[];
  createdAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  location: string;
  category?: string;
  capacity?: number;
}

// Client-side event operations (no API routes needed!)
export const eventOperations = {
  // Create event - client-side
  async createEvent(eventData: CreateEventData, user: User): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      // Validate required fields
      if (!eventData.title || !eventData.description || !eventData.date || !eventData.location) {
        return { success: false, error: 'Missing required fields' };
      }

      // Validate date is in the future
      const eventDate = new Date(eventData.date);
      if (eventDate <= new Date()) {
        return { success: false, error: 'Event date must be in the future' };
      }

      // Create the event document
      const docRef = await addDoc(collection(db, 'events'), {
        title: eventData.title,
        description: eventData.description,
        date: eventDate.toISOString(),
        location: eventData.location,
        category: eventData.category || 'General',
        capacity: eventData.capacity || null,
        organizer: user.displayName || user.email?.split('@')[0] || 'Unknown User',
        organizerId: user.uid,
        attendees: 0,
        rsvpList: [],
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      });

      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message || 'Failed to create event' };
    }
  },

  // Get all events - client-side
  async getEvents(): Promise<{ success: boolean; events?: Event[]; error?: string }> {
    try {
      const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
      const snapshot = await getDocs(eventsQuery);
      
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      return { success: true, events };
    } catch (error: any) {
      console.error('Error fetching events:', error);
      return { success: false, error: error.message || 'Failed to fetch events' };
    }
  },

  // Real-time event listener
  subscribeToEvents(callback: (events: Event[]) => void): () => void {
    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
    
    return onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      callback(events);
    });
  },

  // Update event - client-side
  async updateEvent(eventId: string, eventData: Partial<CreateEventData>, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Note: Firestore rules should ensure only the organizer can update their events
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message || 'Failed to update event' };
    }
  },

  // Delete event - client-side
  async deleteEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Note: Firestore rules should ensure only the organizer can delete their events
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting event:', error);
      return { success: false, error: error.message || 'Failed to delete event' };
    }
  },

  // RSVP to event - client-side
  async toggleRSVP(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const eventRef = doc(db, 'events', eventId);
      // Note: You'd need to implement this with array operations
      // This is a simplified version
      
      return { success: true };
    } catch (error: any) {
      console.error('Error toggling RSVP:', error);
      return { success: false, error: error.message || 'Failed to update RSVP' };
    }
  }
};

// Simple client-side permissions (no complex admin system needed)
export const permissions = {
  canCreateEvent(user: User | null): boolean {
    // In a client-only system, you can implement simple rules:
    return !!user; // Any authenticated user can create events
    
    // Or more complex rules based on user email/data:
    // return user?.email?.endsWith('@university.edu') || false;
  },

  canEditEvent(event: Event, user: User | null): boolean {
    return user?.uid === event.organizerId;
  },

  canDeleteEvent(event: Event, user: User | null): boolean {
    return user?.uid === event.organizerId;
  }
};
