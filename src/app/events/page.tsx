
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { events } from '@/lib/data';
import { CheckCircle, Clock, PartyPopper } from 'lucide-react';
import { format, isFuture, isSameDay } from 'date-fns';
import Link from 'next/link';
import { PageWrapper } from '@/components/PageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface UserProfile {
    rsvpedEvents?: string[];
}

export default function EventsPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [rsvpedEventIds, setRsvpedEventIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchUserRsvps = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          setRsvpedEventIds(userData.rsvpedEvents || []);
        }
      };
      fetchUserRsvps();
    }
  }, [user]);

  const handleRsvp = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to RSVP.' });
      return;
    }

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
  };

  const filteredEvents = date
    ? events.filter(event => isSameDay(event.date, date!))
    : events.filter(event => isFuture(event.date) || isSameDay(event.date, new Date()));

  return (
    <PageWrapper title="Events">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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
                  <Link href={`/events/${event.id}`} key={event.id} className="block hover:bg-muted/50 rounded-lg">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-headline">{event.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground pt-1">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{format(event.date, "PPP, p")}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
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
                    </Card>
                  </Link>
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
