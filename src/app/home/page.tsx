
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { events as staticEvents } from '@/lib/data';
import Link from 'next/link';
import { format, isFuture, isToday } from 'date-fns';
import { ArrowRight, MessageSquare, Calendar } from 'lucide-react';

interface ForumThread {
    id: string;
    title: string;
    author: string;
    timestamp: string;
}

interface Event {
    id: string;
    title: string;
    date: Date;
}

export default function HomePage() {
    const { user } = useAuth();
    const [recentThreads, setRecentThreads] = useState<ForumThread[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentData = async () => {
            setLoading(true);
            // Fetch recent forum threads
            const threadsRef = collection(db, "forumThreads");
            const threadsQuery = query(threadsRef, orderBy("timestamp", "desc"), limit(3));
            const threadsSnapshot = await getDocs(threadsQuery);
            const threadsData = threadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumThread));
            setRecentThreads(threadsData);

            // Filter upcoming events
            const futureEvents = staticEvents
                .filter(event => isFuture(event.date) || isToday(event.date))
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 2);
            setUpcomingEvents(futureEvents);
            
            setLoading(false);
        };

        fetchRecentData();
    }, []);

    return (
        <PageWrapper title="Home">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="space-y-6">
                    <h1 className="text-3xl font-headline font-semibold text-foreground">
                        Welcome back, {user?.displayName?.split(' ')[0] || 'Campus User'}!
                    </h1>
                    
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Recent Forum Threads */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="font-headline">Recent Discussions</CardTitle>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/forums">
                                        View All
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <p>Loading discussions...</p>
                                ) : recentThreads.length > 0 ? (
                                    <ul className="space-y-4">
                                        {recentThreads.map(thread => (
                                             <li key={thread.id} className="flex items-start gap-4">
                                                <MessageSquare className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                                                <div className="flex-grow">
                                                    <Link href={`/forums/${thread.id}`} className="font-medium hover:underline">
                                                        {thread.title}
                                                    </Link>
                                                    <p className="text-sm text-muted-foreground">
                                                        by {thread.author} &middot; {format(new Date(thread.timestamp), 'MMM d')}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground">No recent discussions.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Events */}
                        <Card>
                            <CardHeader  className="flex flex-row items-center justify-between">
                                 <CardTitle className="font-headline">Upcoming Events</CardTitle>
                                 <Button variant="ghost" size="sm" asChild>
                                    <Link href="/events">
                                        View All
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                               {loading ? (
                                    <p>Loading events...</p>
                                ) : upcomingEvents.length > 0 ? (
                                    <ul className="space-y-4">
                                        {upcomingEvents.map(event => (
                                            <li key={event.id} className="flex items-start gap-4">
                                                <Calendar className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                                                <div className="flex-grow">
                                                     <Link href={`/events/${event.id}`} className="font-medium hover:underline">
                                                        {event.title}
                                                    </Link>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(event.date, "PPP")}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground">No upcoming events.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
}
