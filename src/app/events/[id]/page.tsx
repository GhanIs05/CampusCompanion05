
'use client';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { events } from '@/lib/data';
import { Calendar, CheckCircle, Clock, MapPin, Tag } from 'lucide-react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';

export default function EventDetailPage() {
    const params = useParams();
    const eventId = params.id as string;
    
    const event = events.find(e => e.id === eventId);

    if (!event) {
        return (
            <div className="flex flex-col h-full">
                <AppHeader title="Event Details" />
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    Event not found.
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <AppHeader title="Event Details" />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader className="p-0">
                           <Image 
                             src="https://placehold.co/1200x400.png"
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
                                    <span>{format(event.date, "PPP")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{format(event.date, "p")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>University Auditorium</span>
                                </div>
                            </div>

                            <CardContent className="p-0">
                                <p className="text-base mb-6">{event.description} This is an extended description to provide more details about the event. We will cover various topics and have guest speakers from the industry. It's a great opportunity for networking and learning.</p>
                                
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
        </div>
    );
}

