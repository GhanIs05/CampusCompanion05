
'use client';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Clock, MapPin, Tag } from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import { PageWrapper } from '@/components/PageWrapper';
import { useEffect, useState } from 'react';

interface Event {
  id: string;
  title: string;
  description: string;
  extendedDescription?: string;
  imageUrl?: string;
  date: string;
  location: string;
  category: string;
  organizerId: string;
  capacity?: number;
  registeredUsers?: string[];
}

export default function EventDetailPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(`/api/events/${eventId}`);
                if (!response.ok) {
                    throw new Error('Event not found');
                }
                const eventData = await response.json();
                setEvent(eventData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch event');
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    if (loading) {
        return (
            <PageWrapper title="Event Details">
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    Loading event details...
                </main>
            </PageWrapper>
        );
    }

    if (error || !event) {
        return (
            <PageWrapper title="Event Details">
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    {error || 'Event not found.'}
                </main>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Event Details">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader className="p-0">
                           <Image 
                             src={event.imageUrl || "https://placehold.co/1200x400.png"}
                             alt={event.title}
                             width={1200}
                             height={400}
                             className="rounded-t-lg object-cover"
                             data-ai-hint="event photo"
                           />
                        </CardHeader>
                        <div className="p-6">
                            <CardTitle className="font-headline text-3xl mb-2">{event.title}</CardTitle>
                             <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(event.date), "PPP")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{format(new Date(event.date), "p")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{event.location}</span>
                                </div>
                            </div>

                            <CardContent className="p-0">
                                <p className="text-base mb-4">{event.description}</p>
                                
                                {event.extendedDescription && (
                                  <div className="mb-6">
                                    <h3 className="font-semibold text-lg mb-2">More Details</h3>
                                    <p className="text-base text-muted-foreground">{event.extendedDescription}</p>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <Badge variant="secondary">{event.category}</Badge>
                                    <Badge variant="outline">Networking</Badge>
                                    <Badge variant="outline">Students</Badge>
                                </div>
                            </CardContent>

                            <div className="mt-8 flex gap-4">
                                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    RSVP
                                </Button>
                                <Button variant="outline">Add to Calendar</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </PageWrapper>
    );
}

