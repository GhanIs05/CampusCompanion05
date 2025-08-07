
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { events as sampleEvents } from '@/lib/data';
import { CheckCircle, Clock, PartyPopper, PlusCircle, Edit, Trash2, MoreHorizontal, MapPin, Users } from 'lucide-react';
import { format, isFuture, isSameDay } from 'date-fns';
import Link from 'next/link';
import { PageWrapper } from '@/components/PageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useApiClient } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import EventPermissionBanner from '@/components/EventPermissionBanner';

interface Event {
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
}

interface UserProfile {
    rsvpedEvents?: string[];
}

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

export default function EventsPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvpedEventIds, setRsvpedEventIds] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const apiClient = useApiClient();

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'General',
    capacity: '',
  });

  const [editEvent, setEditEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'General',
    capacity: '',
  });

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy('date', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
      
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to events:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        // Fetch user RSVPs
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          setRsvpedEventIds(userData.rsvpedEvents || []);
        }

        // Fetch user permissions
        try {
          const response = await fetch('/api/user/permissions', {
            headers: {
              'x-user-id': user.uid
            },
            credentials: 'include'
          });
          const data = await response.json();
          if (data.success) {
            setUserPermissions(data.permissions);
          }
        } catch (error) {
          console.error('Error fetching permissions:', error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  const refreshUserPermissions = async () => {
    if (!user) return;
    
    try {
      console.log('Refreshing user permissions...');
      const response = await fetch('/api/user/permissions', {
        headers: {
          'x-user-id': user.uid
        },
        credentials: 'include'
      });
      const data = await response.json();
      console.log('User permissions response:', data);
      if (data.success) {
        setUserPermissions(data.permissions);
        console.log('Updated userPermissions state:', data.permissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewEvent((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditEvent((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.description || !newEvent.date || !newEvent.location) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please fill out all required fields.",
        });
        return;
    }
    if (!user) {
        toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to create an event."});
        return;
    }

    const eventData = {
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      location: newEvent.location,
      category: newEvent.category,
      capacity: newEvent.capacity ? parseInt(newEvent.capacity) : undefined,
    };

    try {
        const response = await apiClient.createEvent(eventData);
        if (response.success) {
          setOpen(false);
          setNewEvent({ title: '', description: '', date: '', location: '', category: 'General', capacity: '' });
          toast({
              title: "Event Created",
              description: "Your event has been successfully created.",
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: response.error});
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message});
    }
  };

  const handleEditEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editEvent.title || !editEvent.description || !editEvent.date || !editEvent.location) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please fill out all required fields.",
        });
        return;
    }

    const eventData = {
      title: editEvent.title,
      description: editEvent.description,
      date: editEvent.date,
      location: editEvent.location,
      category: editEvent.category,
      capacity: editEvent.capacity ? parseInt(editEvent.capacity) : undefined,
    };

    try {
        const response = await apiClient.updateEvent(editingEvent.id, eventData);
        if (response.success) {
          setEditOpen(false);
          setEditingEvent(null);
          setEditEvent({ title: '', description: '', date: '', location: '', category: 'General', capacity: '' });
          toast({
              title: "Event Updated",
              description: "Your event has been successfully updated.",
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: response.error});
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message});
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;

    try {
        const response = await apiClient.deleteEvent(deletingEventId);
        if (response.success) {
          setDeleteOpen(false);
          setDeletingEventId(null);
          toast({
              title: "Event Deleted",
              description: "Your event has been successfully deleted.",
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: response.error});
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message});
    }
  };

  const handleRsvp = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to RSVP.' });
      return;
    }

    try {
      const response = await apiClient.rsvpEvent(eventId);
      if (response.success) {
        const userDocRef = doc(db, 'users', user.uid);
        let newRsvpedEventIds;
        
        if (rsvpedEventIds.includes(eventId)) {
          await updateDoc(userDocRef, { rsvpedEvents: arrayRemove(eventId) });
          newRsvpedEventIds = rsvpedEventIds.filter(id => id !== eventId);
          toast({ title: 'RSVP Removed' });
        } else {
          await updateDoc(userDocRef, { rsvpedEvents: arrayUnion(eventId) });
          newRsvpedEventIds = [...rsvpedEventIds, eventId];
          toast({ title: 'RSVP Confirmed!' });
        }

        setRsvpedEventIds(newRsvpedEventIds);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: response.error });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setEditEvent({
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      category: event.category,
      capacity: event.capacity ? event.capacity.toString() : '',
    });
    setEditOpen(true);
  };

  const openDeleteDialog = (eventId: string) => {
    setDeletingEventId(eventId);
    setDeleteOpen(true);
  };

  const canEditOrDelete = (event: Event) => {
    return user && event.organizerId === user.uid;
  };

  const filteredEvents = date
    ? events.filter(event => isSameDay(new Date(event.date), date!))
    : events.filter(event => isFuture(new Date(event.date)) || isSameDay(new Date(event.date), new Date()));

  if (loading) {
    return (
        <PageWrapper title="Events">
            <main className="flex-1 flex items-center justify-center text-muted-foreground">
                Loading...
            </main>
        </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Events">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
          <div className="w-full">
            <h1 className="text-3xl font-bold font-headline">Campus Events</h1>
            <p className="text-muted-foreground mt-2">Discover and participate in campus activities.</p>
          </div>
          {/* Only show create button if user has permissions */}
          {user && userPermissions?.canCreateEvents && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleCreateEvent}>
                  <DialogHeader>
                    <DialogTitle className="font-headline">Create New Event</DialogTitle>
                    <DialogDescription>
                      Organize an event for the campus community.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input 
                        id="title" 
                        value={newEvent.title} 
                        onChange={(e) => handleInputChange('title', e.target.value)} 
                        placeholder="e.g., Study Group Session" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        value={newEvent.description} 
                        onChange={(e) => handleInputChange('description', e.target.value)} 
                        placeholder="Describe your event..." 
                        className="min-h-[100px]" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date & Time</Label>
                        <Input 
                          id="date" 
                          type="datetime-local" 
                          value={newEvent.date} 
                          onChange={(e) => handleInputChange('date', e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity (Optional)</Label>
                        <Input 
                          id="capacity" 
                          type="number" 
                          value={newEvent.capacity} 
                          onChange={(e) => handleInputChange('capacity', e.target.value)} 
                          placeholder="Max attendees" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        value={newEvent.location} 
                        onChange={(e) => handleInputChange('location', e.target.value)} 
                        placeholder="e.g., Library Study Room A" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newEvent.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Social">Social</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Cultural">Cultural</SelectItem>
                          <SelectItem value="Career">Career</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      Create Event
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleEditEventSubmit}>
              <DialogHeader>
                <DialogTitle className="font-headline">Edit Event</DialogTitle>
                <DialogDescription>
                  Update your event details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Event Title</Label>
                  <Input 
                    id="edit-title" 
                    value={editEvent.title} 
                    onChange={(e) => handleEditInputChange('title', e.target.value)} 
                    placeholder="e.g., Study Group Session" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea 
                    id="edit-description" 
                    value={editEvent.description} 
                    onChange={(e) => handleEditInputChange('description', e.target.value)} 
                    placeholder="Describe your event..." 
                    className="min-h-[100px]" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Date & Time</Label>
                    <Input 
                      id="edit-date" 
                      type="datetime-local" 
                      value={editEvent.date} 
                      onChange={(e) => handleEditInputChange('date', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-capacity">Capacity (Optional)</Label>
                    <Input 
                      id="edit-capacity" 
                      type="number" 
                      value={editEvent.capacity} 
                      onChange={(e) => handleEditInputChange('capacity', e.target.value)} 
                      placeholder="Max attendees" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input 
                    id="edit-location" 
                    value={editEvent.location} 
                    onChange={(e) => handleEditInputChange('location', e.target.value)} 
                    placeholder="e.g., Library Study Room A" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editEvent.category} onValueChange={(value) => handleEditInputChange('category', value)}>
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Cultural">Cultural</SelectItem>
                      <SelectItem value="Career">Career</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Update Event
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this event? This action cannot be undone and all RSVPs will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <EventPermissionBanner 
          userPermissions={userPermissions} 
          user={user} 
          onRequestSubmitted={refreshUserPermissions}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Event Calendar</CardTitle>
                    <CardDescription>Select a date to see events.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                    />
                </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-headline font-semibold mb-4">
              {date ? `Events for ${format(date, 'PPP')}` : 'Upcoming Events'}
            </h2>
            <div className="space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:bg-muted/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link href={`/events/${event.id}`}>
                            <CardTitle className="font-headline hover:text-primary">{event.title}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground pt-1 space-x-4">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{format(new Date(event.date), "PPP, p")}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                        {canEditOrDelete(event) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.preventDefault()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(event)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(event.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <Link href={`/events/${event.id}`}>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{event.category}</Badge>
                          {event.capacity && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{event.attendees}/{event.capacity}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">Organized by {event.organizer}</p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={(e) => handleRsvp(e, event.id)}
                          variant={rsvpedEventIds.includes(event.id) ? 'secondary' : 'default'}
                          className={!rsvpedEventIds.includes(event.id) ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {rsvpedEventIds.includes(event.id) ? 'RSVPed' : 'RSVP'}
                        </Button>
                      </CardFooter>
                    </Link>
                  </Card>
                ))
              ) : (
                <Card className="flex flex-col items-center justify-center p-8 border-dashed">
                    <PartyPopper className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle className="font-headline text-lg">No Events Scheduled</CardTitle>
                    <CardDescription className="mt-2">
                      {date ? 'There are no events for this day. Try another date!' : 'There are no upcoming events.'}
                    </CardDescription>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
