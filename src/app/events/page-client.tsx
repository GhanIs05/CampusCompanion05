'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, PartyPopper, PlusCircle, Edit, Trash2, MapPin, Users } from 'lucide-react';
import { format, isFuture, isSameDay } from 'date-fns';
import { PageWrapper } from '@/components/PageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { eventOperations, permissions, Event, CreateEventData } from '@/lib/events-client';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New event form state
  const [newEvent, setNewEvent] = useState<CreateEventData>({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'General',
    capacity: undefined
  });

  // Edit event form state
  const [editEvent, setEditEvent] = useState<CreateEventData>({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'General',
    capacity: undefined
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Load events with real-time updates
  useEffect(() => {
    const unsubscribe = eventOperations.subscribeToEvents((fetchedEvents) => {
      setEvents(fetchedEvents);
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription
  }, []);

  // Handle create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to create an event." });
      return;
    }

    if (!permissions.canCreateEvent(user)) {
      toast({ variant: "destructive", title: "Permission denied", description: "You don't have permission to create events." });
      return;
    }

    const result = await eventOperations.createEvent(newEvent, user);
    
    if (result.success) {
      setOpen(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        location: '',
        category: 'General',
        capacity: undefined
      });
      toast({
        title: "Event Created",
        description: "Your event has been successfully created.",
      });
    } else {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: result.error || "Failed to create event"
      });
    }
  };

  // Handle edit event
  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEvent || !user) return;

    if (!permissions.canEditEvent(editingEvent, user)) {
      toast({ variant: "destructive", title: "Permission denied", description: "You can only edit your own events." });
      return;
    }

    const result = await eventOperations.updateEvent(editingEvent.id, editEvent, user.uid);
    
    if (result.success) {
      setEditOpen(false);
      setEditingEvent(null);
      toast({ title: "Event Updated", description: "Your event has been successfully updated." });
    } else {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: result.error || "Failed to update event"
      });
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;

    const event = events.find(e => e.id === eventId);
    if (!event || !permissions.canDeleteEvent(event, user)) {
      toast({ variant: "destructive", title: "Permission denied", description: "You can only delete your own events." });
      return;
    }

    const result = await eventOperations.deleteEvent(eventId, user.uid);
    
    if (result.success) {
      toast({ title: "Event Deleted", description: "Event has been successfully deleted." });
    } else {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: result.error || "Failed to delete event"
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setEditEvent({
      title: event.title,
      description: event.description,
      date: event.date.split('T')[0], // Convert to date input format
      location: event.location,
      category: event.category,
      capacity: event.capacity
    });
    setEditOpen(true);
  };

  // Filter events by selected date
  const eventsForSelectedDate = events.filter(event => 
    isSameDay(new Date(event.date), selectedDate)
  );

  const upcomingEvents = events.filter(event => isFuture(new Date(event.date)));

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold font-headline">Campus Events</h1>
          <p className="text-xl text-muted-foreground">
            Discover and participate in exciting campus activities
          </p>
        </div>

        {/* Create Event Button - Only show if user can create events */}
        {user && permissions.canCreateEvent(user) && (
          <div className="flex justify-center">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Fill out the details for your new campus event.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEvent}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter event title"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your event"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Event location"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newEvent.category} onValueChange={(value) => setNewEvent(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Arts">Arts</SelectItem>
                          <SelectItem value="Social">Social</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">Capacity (Optional)</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newEvent.capacity || ''}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, capacity: e.target.value ? parseInt(e.target.value) : undefined }))}
                        placeholder="Maximum attendees"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Event</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Event Calendar</CardTitle>
                <CardDescription>Select a date to see events.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>

          {/* Events for Selected Date */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">
                  Events on {format(selectedDate, 'MMMM d, yyyy')}
                </CardTitle>
                <CardDescription>
                  {eventsForSelectedDate.length} events scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading events...</p>
                ) : eventsForSelectedDate.length > 0 ? (
                  <div className="space-y-4">
                    {eventsForSelectedDate.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.attendees} attendees
                              </div>
                            </div>
                            <Badge variant="outline" className="mt-2">
                              {event.category}
                            </Badge>
                          </div>
                          
                          {/* Action buttons for event owner */}
                          {user && permissions.canEditEvent(event, user) && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(event)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No events scheduled for this date.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Upcoming Events</CardTitle>
            <CardDescription>Don't miss these exciting events!</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading events...</p>
            ) : upcomingEvents.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.slice(0, 6).map((event) => (
                  <Card key={event.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline">{event.category}</Badge>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(event.date), 'MMM d')}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        {event.description.length > 100
                          ? `${event.description.substring(0, 100)}...`
                          : event.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.attendees}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-sm text-muted-foreground">
                          by {event.organizer}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <p>No upcoming events found.</p>
            )}
          </CardContent>
        </Card>

        {/* Edit Event Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the details for your event.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditEvent}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editEvent.title}
                    onChange={(e) => setEditEvent(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editEvent.description}
                    onChange={(e) => setEditEvent(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editEvent.date}
                    onChange={(e) => setEditEvent(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editEvent.location}
                    onChange={(e) => setEditEvent(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editEvent.category} onValueChange={(value) => setEditEvent(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-capacity">Capacity (Optional)</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={editEvent.capacity || ''}
                    onChange={(e) => setEditEvent(prev => ({ ...prev, capacity: e.target.value ? parseInt(e.target.value) : undefined }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}
