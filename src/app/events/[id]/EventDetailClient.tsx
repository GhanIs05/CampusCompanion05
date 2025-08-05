'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Clock, MapPin, Tag, Users, Share2, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import { PageWrapper } from '@/components/PageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
    capacity: number;
    registrations: number;
    categories: string[];
    attendees: string[];
    interestedUsers: number;
    priceType: 'free' | 'paid';
    price?: number;
    requirements?: string[];
    contactInfo?: {
        email?: string;
        phone?: string;
        website?: string;
    };
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
    images?: string[];
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

interface Attendee {
    id: string;
    name: string;
    avatar?: string;
    status: 'going' | 'interested' | 'not_going';
    registeredAt: Date;
}

export default function EventDetailClient({ params }: { params: { id: string } }) {
    const { id } = params;
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const isMobile = useIsMobile();
    
    const [event, setEvent] = useState<Event | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState<'going' | 'interested' | 'not_going' | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const isOrganizer = user && event && event.organizerId === user.uid;
    const isRegistered = user && event && event.attendees.includes(user.uid);
    const isFull = event && event.registrations >= event.capacity;

    useEffect(() => {
        if (!id) return;

        const eventRef = doc(db, 'events', id);
        const unsubscribe = onSnapshot(eventRef, (doc) => {
            if (doc.exists()) {
                const eventData = doc.data();
                setEvent({
                    id: doc.id,
                    ...eventData,
                    date: eventData.date?.toDate() || new Date(),
                    createdAt: eventData.createdAt?.toDate() || new Date(),
                    updatedAt: eventData.updatedAt?.toDate() || new Date(),
                } as Event);
            } else {
                toast({
                    title: "Event not found",
                    description: "The event you're looking for doesn't exist.",
                    variant: "destructive",
                });
                router.push('/events');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, toast, router]);

    useEffect(() => {
        if (!event || !user) return;

        // Check user's registration status
        const attendeesRef = collection(db, `events/${id}/attendees`);
        const unsubscribe = onSnapshot(query(attendeesRef), (snapshot) => {
            const attendeesList: Attendee[] = [];
            let currentUserStatus: 'going' | 'interested' | 'not_going' | null = null;

            snapshot.forEach((doc) => {
                const attendeeData = doc.data();
                attendeesList.push({
                    id: doc.id,
                    ...attendeeData,
                    registeredAt: attendeeData.registeredAt?.toDate() || new Date(),
                } as Attendee);

                if (doc.id === user.uid) {
                    currentUserStatus = attendeeData.status;
                }
            });

            setAttendees(attendeesList);
            setUserStatus(currentUserStatus);
        });

        return () => unsubscribe();
    }, [event, user, id]);

    const handleRegister = async () => {
        if (!user || !event) return;

        try {
            const eventRef = doc(db, 'events', event.id);
            const attendeeRef = doc(db, `events/${event.id}/attendees`, user.uid);

            if (isRegistered) {
                // Unregister
                await updateDoc(eventRef, {
                    attendees: arrayRemove(user.uid),
                    registrations: Math.max(0, event.registrations - 1),
                });
                await deleteDoc(attendeeRef);
                
                toast({
                    title: "Unregistered successfully",
                    description: "You have been removed from this event.",
                });
            } else {
                if (isFull) {
                    toast({
                        title: "Event is full",
                        description: "This event has reached its maximum capacity.",
                        variant: "destructive",
                    });
                    return;
                }

                // Register
                await updateDoc(eventRef, {
                    attendees: arrayUnion(user.uid),
                    registrations: event.registrations + 1,
                });
                
                await setDoc(attendeeRef, {
                    name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
                    avatar: user.photoURL,
                    status: 'going',
                    registeredAt: new Date(),
                });

                toast({
                    title: "Registered successfully",
                    description: "You have been registered for this event.",
                });
            }
        } catch (error) {
            console.error('Error updating registration:', error);
            toast({
                title: "Error",
                description: "Failed to update registration. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleInterested = async () => {
        if (!user || !event) return;

        try {
            const attendeeRef = doc(db, `events/${event.id}/attendees`, user.uid);
            
            if (userStatus === 'interested') {
                // Remove interest
                await deleteDoc(attendeeRef);
                toast({
                    title: "Interest removed",
                    description: "You are no longer marked as interested.",
                });
            } else {
                // Mark as interested
                await setDoc(attendeeRef, {
                    name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
                    avatar: user.photoURL,
                    status: 'interested',
                    registeredAt: new Date(),
                });

                toast({
                    title: "Marked as interested",
                    description: "You have been marked as interested in this event.",
                });
            }
        } catch (error) {
            console.error('Error updating interest:', error);
            toast({
                title: "Error",
                description: "Failed to update interest. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event?.title,
                    text: event?.description,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Link copied",
                description: "Event link has been copied to your clipboard.",
            });
        }
    };

    const handleDelete = async () => {
        if (!event || !isOrganizer) return;

        try {
            await deleteDoc(doc(db, 'events', event.id));
            toast({
                title: "Event deleted",
                description: "The event has been successfully deleted.",
            });
            router.push('/events');
        } catch (error) {
            console.error('Error deleting event:', error);
            toast({
                title: "Error",
                description: "Failed to delete event. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <PageWrapper>
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    if (!event) {
        return (
            <PageWrapper>
                <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
                    <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
                    <Button asChild>
                        <Link href="/events">Back to Events</Link>
                    </Button>
                </div>
            </PageWrapper>
        );
    }

    const goingCount = attendees.filter(a => a.status === 'going').length;
    const interestedCount = attendees.filter(a => a.status === 'interested').length;

    return (
        <PageWrapper>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    
                    <div className="flex-1" />

                    {isOrganizer && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/events/${event.id}/edit`)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            
                            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this event? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}>
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Header */}
                        <Card>
                            <CardHeader>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {event.categories.map((category) => (
                                        <Badge key={category} variant="secondary">
                                            {category}
                                        </Badge>
                                    ))}
                                    <Badge 
                                        variant={event.status === 'upcoming' ? 'default' : 
                                                event.status === 'ongoing' ? 'secondary' :
                                                event.status === 'completed' ? 'outline' : 'destructive'}
                                    >
                                        {event.status}
                                    </Badge>
                                </div>
                                
                                <CardTitle className="text-2xl lg:text-3xl">{event.title}</CardTitle>
                                
                                <div className="flex items-center gap-4 text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{format(event.date, 'EEEE, MMMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>{event.time}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{event.location}</span>
                                </div>
                            </CardHeader>
                            
                            {event.images && event.images.length > 0 && (
                                <div className="px-6">
                                    <div className="relative aspect-video rounded-lg overflow-hidden">
                                        <Image
                                            src={event.images[0]}
                                            alt={event.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            <CardContent>
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-base leading-relaxed">{event.description}</p>
                                </div>
                                
                                {event.requirements && event.requirements.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold mb-2">Requirements:</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {event.requirements.map((req, index) => (
                                                <li key={index}>{req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <Separator className="my-6" />
                                
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Organized by <span className="font-medium">{event.organizer}</span>
                                    </div>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleShare}
                                    >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        {event.contactInfo && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {event.contactInfo.email && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Email:</span>
                                            <a href={`mailto:${event.contactInfo.email}`} className="text-blue-600 hover:underline">
                                                {event.contactInfo.email}
                                            </a>
                                        </div>
                                    )}
                                    {event.contactInfo.phone && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Phone:</span>
                                            <a href={`tel:${event.contactInfo.phone}`} className="text-blue-600 hover:underline">
                                                {event.contactInfo.phone}
                                            </a>
                                        </div>
                                    )}
                                    {event.contactInfo.website && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Website:</span>
                                            <a href={event.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {event.contactInfo.website}
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Registration Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Event Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Price:</span>
                                    <Badge variant={event.priceType === 'free' ? 'secondary' : 'default'}>
                                        {event.priceType === 'free' ? 'Free' : `$${event.price}`}
                                    </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Capacity:</span>
                                    <span className="text-sm">
                                        {event.registrations} / {event.capacity} registered
                                    </span>
                                </div>
                                
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${Math.min((event.registrations / event.capacity) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                
                                {user && (
                                    <div className="space-y-2 pt-4">
                                        <Button
                                            onClick={handleRegister}
                                            disabled={isFull && !isRegistered}
                                            className="w-full"
                                            variant={isRegistered ? "outline" : "default"}
                                        >
                                            {isRegistered ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Registered
                                                </>
                                            ) : isFull ? (
                                                'Event Full'
                                            ) : (
                                                'Register'
                                            )}
                                        </Button>
                                        
                                        <Button
                                            onClick={handleInterested}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            {userStatus === 'interested' ? 'Remove Interest' : 'Mark as Interested'}
                                        </Button>
                                    </div>
                                )}
                                
                                {!user && (
                                    <div className="pt-4">
                                        <Button asChild className="w-full">
                                            <Link href="/login">Login to Register</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Attendees */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Attendees</CardTitle>
                                <CardDescription>
                                    {goingCount} going • {interestedCount} interested
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {attendees.slice(0, 5).map((attendee) => (
                                        <div key={attendee.id} className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={attendee.avatar} />
                                                <AvatarFallback>
                                                    {attendee.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{attendee.name}</p>
                                            </div>
                                            <Badge 
                                                variant={attendee.status === 'going' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {attendee.status === 'going' ? 'Going' : 'Interested'}
                                            </Badge>
                                        </div>
                                    ))}
                                    
                                    {attendees.length > 5 && (
                                        <div className="text-center">
                                            <Button variant="ghost" size="sm">
                                                View all {attendees.length} attendees
                                            </Button>
                                        </div>
                                    )}
                                    
                                    {attendees.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No attendees yet
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
