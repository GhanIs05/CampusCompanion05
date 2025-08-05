'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, increment, onSnapshot, query, orderBy, runTransaction, arrayUnion, arrayRemove, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Calendar, MapPin, Users, Tag, CheckCircle, Share2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';
import Link from 'next/link';

interface Event {
    id: string;
    title: string;
    description: string;
    date: Date;
    time: string;
    location: string;
    organizer: string;
    organizerId?: string;
    type: 'academic' | 'social' | 'career';
    capacity?: number;
    attendeeCount?: number;
}

interface RSVP {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    rsvpDate: Date;
    status: 'attending' | 'maybe' | 'not_attending';
}

interface UserProfile {
    rsvpedEvents?: string[];
    role?: string;
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const { user } = useAuth();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    const [event, setEvent] = useState<Event | null>(null);
    const [rsvps, setRSVPs] = useState<RSVP[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isRSVPed, setIsRSVPed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAttendees, setShowAttendees] = useState(false);

    // Fetch event data
    useEffect(() => {
        if (eventId) {
            const eventDocRef = doc(db, 'events', eventId);
            const unsubscribe = onSnapshot(eventDocRef, (eventDoc) => {
                if (eventDoc.exists()) {
                    const eventData = eventDoc.data();
                    setEvent({
                        id: eventDoc.id,
                        ...eventData,
                        date: eventData.date.toDate ? eventData.date.toDate() : new Date(eventData.date)
                    } as Event);
                } else {
                    setEvent(null);
                }
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [eventId]);

    // Fetch RSVPs
    useEffect(() => {
        if (eventId) {
            const rsvpsRef = collection(db, 'events', eventId, 'rsvps');
            const unsubscribe = onSnapshot(rsvpsRef, (rsvpSnapshot) => {
                const rsvpData = rsvpSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    rsvpDate: doc.data().rsvpDate.toDate ? doc.data().rsvpDate.toDate() : new Date(doc.data().rsvpDate)
                } as RSVP));
                setRSVPs(rsvpData);
            });

            return () => unsubscribe();
        }
    }, [eventId]);

    // Fetch user profile and RSVP status
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserProfile;
                    setUserProfile(userData);
                    setIsRSVPed((userData.rsvpedEvents || []).includes(eventId));
                }
            });

            return () => unsubscribe();
        }
    }, [user, eventId]);

    const handleRsvp = async () => {
        if (!user || !event) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to RSVP.' });
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const eventDocRef = doc(db, 'events', eventId);
            const rsvpDocRef = doc(db, 'events', eventId, 'rsvps', user.uid);
            
            if (isRSVPed) {
                // Remove RSVP
                await updateDoc(userDocRef, { rsvpedEvents: arrayRemove(eventId) });
                await deleteDoc(rsvpDocRef);
                
                // Update attendee count
                await updateDoc(eventDocRef, { 
                    attendeeCount: Math.max(0, (event.attendeeCount || 0) - 1)
                });
                
                toast({ title: 'RSVP Removed', description: 'You have been removed from this event.' });
            } else {
                // Check capacity
                if (event.capacity && (event.attendeeCount || 0) >= event.capacity) {
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
                await updateDoc(eventDocRef, { 
                    attendeeCount: (event.attendeeCount || 0) + 1
                });
                
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

    const handleDeleteEvent = async () => {
        if (!user || !event) return;

        try {
            await deleteDoc(doc(db, 'events', eventId));
            toast({
                title: "Event Deleted",
                description: "The event has been successfully deleted.",
            });
            router.push('/events');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const canEditOrDelete = () => {
        return user && event && (event.organizerId === user.uid || event.organizer === user.displayName || userProfile?.role === 'Faculty' || userProfile?.role === 'Admin');
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'academic': return 'bg-blue-100 text-blue-800';
            case 'social': return 'bg-green-100 text-green-800';
            case 'career': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const shareEvent = async () => {
        if (navigator.share && isMobile) {
            try {
                await navigator.share({
                    title: event?.title,
                    text: `Check out this campus event: ${event?.title}`,
                    url: window.location.href,
                });
                toast({ title: 'Shared', description: 'Event shared successfully.' });
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    // AbortError is thrown when user cancels share
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: 'Link Copied', description: 'Event link copied to clipboard.' });
                }
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied', description: 'Event link copied to clipboard.' });
        }
    };

    if (loading) {
        return (
            <PageWrapper title="Event Details">
                <main className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 text-muted-foreground">
                    <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p>Loading event details...</p>
                    </div>
                </main>
            </PageWrapper>
        );
    }

    if (!event) {
        return (
            <PageWrapper title="Event Details">
                <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 text-muted-foreground">
                    <p>Event not found.</p>
                    <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => router.push('/events')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Events
                    </Button>
                </main>
            </PageWrapper>
        );
    }

    const attendingCount = rsvps.filter(rsvp => rsvp.status === 'attending').length;
    const isCapacityFull = Boolean(event.capacity && attendingCount >= event.capacity);

    return (
        <PageWrapper title="Event Details">
            <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {isMobile && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push('/events')}
                            className="mb-3 -ml-2 flex items-center"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            <span>Back to Events</span>
                        </Button>
                    )}
                    
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
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                                <div className="flex-1">
                                    <CardTitle className="font-headline text-xl sm:text-2xl md:text-3xl mb-2">{event.title}</CardTitle>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={getEventTypeColor(event.type)}>
                                            {event.type}
                                        </Badge>
                                        {isCapacityFull && (
                                            <Badge variant="secondary">
                                                Full
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <Button variant="outline" size="sm" onClick={shareEvent}>
                                        <Share2 className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Share</span>
                                    </Button>
                                    {canEditOrDelete() && (
                                        <>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-destructive">
                                                        <Trash2 className="h-4 w-4 sm:mr-2" />
                                                        <span className="hidden sm:inline">Delete</span>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="mx-2 w-[calc(100vw-1rem)] sm:mx-0 sm:w-auto">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "{event.title}"? This action cannot be undone and will remove all RSVPs.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                                                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction 
                                                            onClick={handleDeleteEvent}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                                <div className="md:col-span-2 space-y-6">
                                    <div>
                                        <h3 className="font-headline text-lg sm:text-xl mb-3">Description</h3>
                                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{event.description}</p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-headline text-lg sm:text-xl">Attendees ({attendingCount}{event.capacity && `/${event.capacity}`})</h3>
                                            {rsvps.length > 0 && (
                                                <Dialog open={showAttendees} onOpenChange={setShowAttendees}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            View All
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto w-[calc(100vw-1rem)] sm:w-auto sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>Event Attendees</DialogTitle>
                                                            <DialogDescription>
                                                                People who have RSVPed to this event
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-3 max-h-[50vh] sm:max-h-96 overflow-y-auto">
                                                            {rsvps.filter(rsvp => rsvp.status === 'attending').map((rsvp) => (
                                                                <div key={rsvp.id} className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarFallback>
                                                                            {rsvp.userName.charAt(0)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-medium text-sm">{rsvp.userName}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            RSVPed {format(rsvp.rsvpDate, 'MMM d')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                        
                                        {rsvps.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                {rsvps.filter(rsvp => rsvp.status === 'attending').slice(0, 5).map((rsvp) => (
                                                    <Avatar key={rsvp.id} className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {rsvp.userName.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                {attendingCount > 5 && (
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                        +{attendingCount - 5}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">No one has RSVPed yet. Be the first!</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 order-first md:order-last mb-4 md:mb-0">
                                    {isMobile && (
                                        <Button 
                                            onClick={handleRsvp}
                                            className={`w-full ${isRSVPed 
                                                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                                                : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                                            }`}
                                            disabled={!isRSVPed && isCapacityFull}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {isRSVPed 
                                                ? 'Cancel RSVP' 
                                                : isCapacityFull 
                                                    ? 'Event Full' 
                                                    : 'RSVP to Event'
                                            }
                                        </Button>
                                    )}
                                    
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="font-headline text-base sm:text-lg">Event Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">{format(event.date, isMobile ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')}</p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground">{event.time}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">{event.location}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">Organizer</p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground">{event.organizer}</p>
                                                </div>
                                            </div>

                                            {event.capacity && (
                                                <div className="flex items-center gap-3">
                                                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium text-sm sm:text-base">Capacity</p>
                                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                                            {attendingCount} / {event.capacity} attendees
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {!isMobile && (
                                        <Button 
                                            onClick={handleRsvp}
                                            className={`w-full ${isRSVPed 
                                                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' 
                                                : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                                            }`}
                                            disabled={!isRSVPed && isCapacityFull}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {isRSVPed 
                                                ? 'Cancel RSVP' 
                                                : isCapacityFull 
                                                    ? 'Event Full' 
                                                    : 'RSVP to Event'
                                            }
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </PageWrapper>
    );
}

