'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import { events } from '@/lib/data';
import { CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function EventsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({});

  const handleRsvp = (eventId: string) => {
    setRsvps((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Events" />
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
            <h2 className="text-2xl font-headline font-semibold mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle className="font-headline">{event.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground pt-1">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{format(event.date, "PPP 'at' p")}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleRsvp(event.id)}
                      variant={rsvps[event.id] ? 'secondary' : 'default'}
                      className={rsvps[event.id] ? '' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {rsvps[event.id] ? 'RSVPed' : 'RSVP'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
