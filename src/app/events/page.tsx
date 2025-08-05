
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { events as sampleEvents } from '@/lib/data';
import { CheckCircle, Clock, PartyPopper, PlusCircle, Edit, Trash2, MoreHorizontal, Users, CalendarDays, Filter, Grid, List } from 'lucide-react';
import { format, isFuture, isSameDay } from 'date-fns';
import Link from 'next/link';
import { PageWrapper } from '@/components/PageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, getDocs, writeBatch, onSnapshot, query, orderBy, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface Event {
    id: string;
    title: string;
    description: string;
    date: Date;
    time: string;
    location: string;
    organizer: string;
    organizerId?: string;
    type: 'academic' | 'social' | 'career' | 'other';
    capacity?: number;
    attendeeCount?: number;
}

interface UserProfile {
    rsvpedEvents?: string[];
    role?: string;
}

interface RSVP {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    rsvpDate: Date;
    status: 'attending' | 'maybe' | 'not_attending';
}

export default function EventsPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvpedEventIds, setRsvpedEventIds] = useState<string[]>([]);
  const [eventRSVPs, setEventRSVPs] = useState<Record<string, RSVP[]>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [filterType, setFilterType] = useState<'all' | 'academic' | 'social' | 'career' | 'other'>('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'academic' as 'academic' | 'social' | 'career' | 'other',
    capacity: '',
  });

  const seedDatabase = async () => {
    const batch = writeBatch(db);
    sampleEvents.forEach((event) => {
      const { id, ...eventData } = event;
      const eventRef = doc(collection(db, "events"));
      const dataWithOrganizerId = {
        ...eventData,
        organizerId: 'sample-user',
      }
      batch.set(eventRef, dataWithOrganizerId);
    });
    await batch.commit();
  };

  // Initialize view mode based on screen size
  useEffect(() => {
    if (isMobile !== undefined) {
      // For mobile, default to list view
      setViewMode(isMobile ? 'list' : 'calendar');
    }
  }, [isMobile]);

  // Make calendar always accessible but default to list on mobile
  useEffect(() => {
    // Ensure mobile users can still access calendar if they explicitly choose it
    if (viewMode === 'calendar' && isMobile) {
      // Show a toast explaining best practices for mobile calendar use
      toast({
        title: "Mobile Calendar View",
        description: "Calendar view works best in landscape orientation. Tap a date to see events.",
        duration: 3000
      });
    }
  }, [viewMode, isMobile, toast]);

  // Real-time listener for events
  useEffect(() => {
    setLoading(true);
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("date", "asc"));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        await seedDatabase();
        return; // Will trigger again after seeding
      }
      
      const eventsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          date: data.date.toDate ? data.date.toDate() : new Date(data.date)
        } as Event;
      });
      
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to events:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to load events." 
      });
      setLoading(false);
    });

    // Add pull-to-refresh functionality for mobile
    if (isMobile) {
      let touchStartY = 0;
      let touchEndY = 0;
      
      const handleTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0].clientY;
      };
      
      const handleTouchEnd = (e: TouchEvent) => {
        touchEndY = e.changedTouches[0].clientY;
        const pullDistance = touchEndY - touchStartY;
        
        // If the user pulled down by more than 100px at the top of the page
        if (pullDistance > 100 && window.scrollY === 0) {
          toast({ title: "Refreshing...", description: "Updating events list" });
          // This will re-trigger the snapshot listener
          setLoading(true);
        }
      };
      
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
        unsubscribe();
      };
    }

    return () => unsubscribe();
  }, [isMobile]);

  // Fetch user RSVPs and profile
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setUserProfile(userData);
          setRsvpedEventIds(userData.rsvpedEvents || []);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Fetch RSVP counts for all events
  useEffect(() => {
    if (events.length > 0) {
      const fetchRSVPs = async () => {
        const rsvpData: Record<string, RSVP[]> = {};
        
        for (const event of events) {
          try {
            const rsvpsRef = collection(db, 'events', event.id, 'rsvps');
            const rsvpQuery = query(rsvpsRef);
            const rsvpSnapshot = await getDocs(rsvpQuery);
            
            rsvpData[event.id] = rsvpSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as RSVP));
          } catch (error) {
            console.error(`Error fetching RSVPs for event ${event.id}:`, error);
            rsvpData[event.id] = [];
          }
        }
        
        setEventRSVPs(rsvpData);
      };
      
      fetchRSVPs();
    }
  }, [events]);

  const handleInputChange = (field: string, value: string) => {
    setNewEvent((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.description || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out all required fields.",
      });
      return;
    }
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to create an event." });
      return;
    }

    const eventData = {
      title: newEvent.title,
      description: newEvent.description,
      date: new Date(newEvent.date),
      time: newEvent.time,
      location: newEvent.location,
      organizer: user.displayName || 'Campus User',
      organizerId: user.uid,
      type: newEvent.type,
      capacity: newEvent.capacity ? parseInt(newEvent.capacity) : undefined,
      attendeeCount: 0,
    };

    try {
      if (editingEvent) {
        // Update existing event
        await updateDoc(doc(db, "events", editingEvent.id), eventData);
        toast({
          title: "Event Updated",
          description: "Your event has been successfully updated.",
        });
      } else {
        // Create new event
        await addDoc(collection(db, "events"), eventData);
        toast({
          title: "Event Created",
          description: "Your new event has been successfully created.",
        });
      }
      
      setOpen(false);
      setEditingEvent(null);
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', type: 'academic' as 'academic' | 'social' | 'career' | 'other', capacity: '' });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      date: format(event.date, 'yyyy-MM-dd'),
      time: event.time,
      location: event.location,
      type: event.type,
      capacity: event.capacity?.toString() || '',
    });
    setOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to delete events." });
      return;
    }

    try {
      await deleteDoc(doc(db, "events", eventId));
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const canEditOrDelete = (event: Event) => {
    return user && (event.organizerId === user.uid || event.organizer === user.displayName || userProfile?.role === 'Faculty' || userProfile?.role === 'Admin');
  };

  const handleRsvp = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to RSVP.' });
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const eventDocRef = doc(db, 'events', eventId);
      const rsvpDocRef = doc(db, 'events', eventId, 'rsvps', user.uid);
      
      const isCurrentlyRSVPed = rsvpedEventIds.includes(eventId);
      
      if (isCurrentlyRSVPed) {
        // Remove RSVP
        await updateDoc(userDocRef, { rsvpedEvents: arrayRemove(eventId) });
        await deleteDoc(rsvpDocRef);
        
        // Update attendee count
        const currentEvent = events.find(e => e.id === eventId);
        if (currentEvent) {
          await updateDoc(eventDocRef, { 
            attendeeCount: Math.max(0, (currentEvent.attendeeCount || 0) - 1)
          });
        }
        
        setRsvpedEventIds(prev => prev.filter(id => id !== eventId));
        toast({ title: 'RSVP Removed', description: 'You have been removed from this event.' });
      } else {
        // Check capacity
        const currentEvent = events.find(e => e.id === eventId);
        if (currentEvent?.capacity && (currentEvent.attendeeCount || 0) >= currentEvent.capacity) {
          toast({ 
            variant: 'destructive', 
            title: 'Event Full', 
            description: 'This event has reached its maximum capacity.' 
          });
          return;
        }
        
        // Add RSVP
        const rsvpData: RSVP = {
          id: user.uid,
          userId: user.uid,
          userName: user.displayName || 'Campus User',
          userEmail: user.email || '',
          rsvpDate: new Date(),
          status: 'attending'
        };
        
        await updateDoc(userDocRef, { rsvpedEvents: arrayUnion(eventId) });
        await setDoc(rsvpDocRef, rsvpData);
        
        // Update attendee count
        if (currentEvent) {
          await updateDoc(eventDocRef, { 
            attendeeCount: (currentEvent.attendeeCount || 0) + 1
          });
        }
        
        setRsvpedEventIds(prev => [...prev, eventId]);
        toast({ title: 'RSVP Confirmed!', description: 'You have been added to this event.' });
      }
    } catch (error: any) {
      console.error('RSVP error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'RSVP Failed', 
        description: 'Failed to update RSVP. Please try again.' 
      });
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'social': return 'bg-green-100 text-green-800';
      case 'career': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendeeInfo = (eventId: string) => {
    const rsvps = eventRSVPs[eventId] || [];
    const attendingCount = rsvps.filter(rsvp => rsvp.status === 'attending').length;
    return { attendingCount, totalRsvps: rsvps.length };
  };

  const filteredEvents = date
    ? events.filter(event => 
        isSameDay(event.date, date!) && 
        (filterType === 'all' || event.type === filterType)
      )
    : events.filter(event => 
        (isFuture(event.date) || isSameDay(event.date, new Date())) &&
        (filterType === 'all' || event.type === filterType)
      );

  if (loading) {
    return (
      <PageWrapper title="Events">
        <main className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <p>Loading events...</p>
          </div>
        </main>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Events">
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold">Events</h1>
            <Dialog open={open} onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setEditingEvent(null);
                setNewEvent({ title: '', description: '', date: '', time: '', location: '', type: 'academic' as 'academic' | 'social' | 'career' | 'other', capacity: '' });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {isMobile ? 'Create' : 'Create Event'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto w-[calc(100vw-1rem)] sm:w-auto">
                <form onSubmit={handleCreateEvent}>
                  <DialogHeader>
                    <DialogTitle className="font-headline text-lg sm:text-xl">
                      {editingEvent ? 'Edit Event' : 'Create New Event'}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {editingEvent 
                        ? 'Update your event details.' 
                        : 'Create a new campus event for students to discover and attend.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm">Title</Label>
                    <Input 
                      id="title" 
                      value={newEvent.title} 
                      onChange={(e) => handleInputChange('title', e.target.value)} 
                      placeholder="e.g., Study Group: Advanced Calculus" 
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm">Description</Label>
                    <Textarea 
                      id="description" 
                      value={newEvent.description} 
                      onChange={(e) => handleInputChange('description', e.target.value)} 
                      placeholder="Describe your event..." 
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm">Date</Label>
                      <Input 
                        id="date" 
                        type="date" 
                        value={newEvent.date} 
                        onChange={(e) => handleInputChange('date', e.target.value)} 
                        className="h-9 text-sm"
                        pattern="\d{4}-\d{2}-\d{2}"
                        onClick={isMobile ? (e) => e.currentTarget.showPicker() : undefined}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-sm">Time</Label>
                      <Input 
                        id="time" 
                        type="time" 
                        value={newEvent.time} 
                        onChange={(e) => handleInputChange('time', e.target.value)} 
                        className="h-9 text-sm"
                        onClick={isMobile ? (e) => e.currentTarget.showPicker() : undefined}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm">Location</Label>
                    <Input 
                      id="location" 
                      value={newEvent.location} 
                      onChange={(e) => handleInputChange('location', e.target.value)} 
                      placeholder="e.g., Library Study Room 202" 
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm">Type</Label>
                      <Select value={newEvent.type} onValueChange={(value: any) => handleInputChange('type', value)}>
                        <SelectTrigger id="type" className="h-9 text-sm">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="career">Career</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-sm">Capacity (Optional)</Label>
                      <Input 
                        id="capacity" 
                        type="number" 
                        min="1" 
                        value={newEvent.capacity} 
                        onChange={(e) => handleInputChange('capacity', e.target.value)} 
                        placeholder="e.g., 50" 
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
                    disabled={!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location}
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6 sticky top-14 sm:top-16 z-10 bg-background py-3 sm:py-0 border-b sm:border-0">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-sm text-muted-foreground hidden sm:inline">View:</span>
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  if (isMobile) {
                    toast({
                      title: "Mobile Calendar View",
                      description: "Calendar view works best in landscape orientation",
                      duration: 3000,
                    });
                  }
                  setViewMode('calendar');
                }}
                className="flex items-center gap-2 rounded-r-none"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 rounded-l-none"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsContent value="calendar" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1 order-2 lg:order-1">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Event Calendar</CardTitle>
                        <CardDescription>
                          {isMobile 
                            ? "Tap a date to see events. Scroll down to view events after selecting."
                            : "Select a date to see events."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(selectedDate) => {
                              // Handle the date selection and ensure it works properly on mobile
                              setDate(selectedDate);
                              
                              // On mobile, we might want to automatically show events for the selected date
                              if (isMobile && selectedDate) {
                                // Scroll to the events list after selecting a date on mobile
                                setTimeout(() => {
                                  document.getElementById('events-list')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                              }
                            }}
                            className={`rounded-md border ${isMobile ? 'touch-manipulation mobile-calendar' : ''}`}
                            // Use minimal custom classNames as our component now has better defaults
                            classNames={{
                              day_today: "bg-accent text-accent-foreground font-bold",
                              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                            }}
                            disabled={false}
                            initialFocus={false}
                            fromDate={new Date()} // Don't allow selecting dates in the past
                        />
                    </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2 order-1 lg:order-2">
                <h2 className="text-xl sm:text-2xl font-headline font-semibold mb-4">
                  {date ? `Events for ${format(date, 'PPP')}` : 'Upcoming Events'}
                </h2>
                <div id="events-list" className="space-y-4">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-headline font-semibold">
                {date ? `Events for ${format(date, 'PPP')}` : 'All Upcoming Events'}
              </h2>
              {filteredEvents.length > 0 ? (
                <div id="events-list" className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
              
              {isMobile && date && (
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm" 
                    onClick={() => setDate(undefined)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Show all upcoming events
                  </Button>
                </div>
              )}
              
              {isMobile && filteredEvents.length > 5 && (
                <div className="fixed bottom-4 right-4 z-20">
                  <Button 
                    size="sm" 
                    className="rounded-full h-10 w-10 shadow-lg p-0" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </PageWrapper>
  );

  // Event Card Component
  function EventCard({ event }: { event: Event }) {
    const { attendingCount } = getAttendeeInfo(event.id);
    const isRSVPed = rsvpedEventIds.includes(event.id);
    const isCapacityFull = Boolean(event.capacity && attendingCount >= event.capacity);

    return (
      <Link href={`/events/${event.id}`} className="block hover:bg-muted/50 rounded-lg transition-colors">
        <Card className="h-full touch-manipulation"
              onClick={(e) => {
                // Prevent link navigation on buttons
                if ((e.target as HTMLElement).closest('button')) {
                  e.preventDefault();
                }
              }}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="font-headline text-base sm:text-lg line-clamp-2 flex-1">{event.title}</CardTitle>
              <Badge className={`${getEventTypeColor(event.type)} text-xs flex-shrink-0`}>
                {event.type}
              </Badge>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground pt-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">{format(event.date, isMobile ? "MMM d, p" : "PPP, p")}</span>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>{attendingCount}</span>
                {event.capacity && <span>/ {event.capacity}</span>}
              </div>
              {isCapacityFull && (
                <Badge variant="secondary" className="text-xs">
                  Full
                </Badge>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2 pt-0">
            <Button
              onClick={(e) => handleRsvp(e, event.id)}
              variant={isRSVPed ? 'secondary' : 'default'}
              className={`${!isRSVPed ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''} text-xs sm:text-sm h-8 sm:h-9 flex-1`}
              disabled={!isRSVPed && isCapacityFull}
            >
              <CheckCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {isRSVPed ? 'RSVPed' : isCapacityFull ? 'Full' : 'RSVP'}
            </Button>
            
            {canEditOrDelete(event) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditEvent(event);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="mx-2 w-[calc(100vw-1rem)] sm:mx-0 sm:w-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{event.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardFooter>
        </Card>
      </Link>
    );
  }

  // Empty State Component
  function EmptyState() {
    return (
      <Card className="flex flex-col items-center justify-center p-4 sm:p-8 border-dashed">
          <PartyPopper className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
          <CardTitle className="font-headline text-base sm:text-lg text-center">No Events Scheduled</CardTitle>
          <CardDescription className="mt-2 text-center text-xs sm:text-sm">
            {date ? 'There are no events for this day. Try another date!' : 'There are no upcoming events.'}
          </CardDescription>
      </Card>
    );
  }
}
