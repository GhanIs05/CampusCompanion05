
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, MessageCircle, Tag, Edit, Trash2, MoreHorizontal, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/PageWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useApiClient } from '@/lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface ForumThread {
    id: string;
    title: string;
    author: string;
    authorId: string;
    course: string;
    upvotes: number;
    replies: number;
    timestamp: string;
    tags: string[];
    body: string;
    upvotedBy: string[];
    edited?: boolean;
    pinned?: boolean;
    locked?: boolean;
}

interface ForumReply {
    id: string;
    body: string;
    author: string;
    authorId: string;
    threadId: string;
    upvotes: number;
    upvotedBy: string[];
    timestamp: any;
    createdAt: string;
    edited?: boolean;
}

export default function ForumThreadPage() {
    const { id } = useParams();
    const router = useRouter();
    const [thread, setThread] = useState<ForumThread | null>(null);
    const [replies, setReplies] = useState<ForumReply[]>([]);
    const [loading, setLoading] = useState(true);
    const [newReply, setNewReply] = useState('');
    const [editingReply, setEditingReply] = useState<ForumReply | null>(null);
    const [editReplyText, setEditReplyText] = useState('');
    const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const apiClient = useApiClient();

    useEffect(() => {
        if (!id) return;

        const threadRef = doc(db, 'forumThreads', id as string);
        const unsubscribeThread = onSnapshot(threadRef, (doc) => {
            if (doc.exists()) {
                setThread({ id: doc.id, ...doc.data() } as ForumThread);
            } else {
                toast({ variant: 'destructive', title: 'Thread not found', description: 'This thread may have been deleted.' });
                router.push('/forums');
            }
            setLoading(false);
        });

        const repliesQuery = query(
            collection(db, 'forumReplies'),
            where('threadId', '==', id as string),
            orderBy('timestamp', 'asc')
        );
        
        const unsubscribeReplies = onSnapshot(repliesQuery, (querySnapshot) => {
            const repliesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ForumReply));
            setReplies(repliesData);
        });

        return () => {
            unsubscribeThread();
            unsubscribeReplies();
        };
    }, [id, router, toast]);

    const handleUpvoteThread = async () => {
        if (!user || !thread) {
            toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to upvote." });
            return;
        }

        try {
            const response = await apiClient.upvoteThread(thread.id);
            if (!response.success) {
                toast({ variant: "destructive", title: "Error", description: response.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not process upvote." });
        }
    };

    const handleUpvoteReply = async (replyId: string) => {
        if (!user) {
            toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to upvote." });
            return;
        }

        try {
            const response = await apiClient.upvoteReply(replyId);
            if (!response.success) {
                toast({ variant: "destructive", title: "Error", description: response.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not process upvote." });
        }
    };

    const handleCreateReply = async () => {
        if (!newReply.trim()) {
            toast({ variant: "destructive", title: "Empty reply", description: "Please write a reply before submitting." });
            return;
        }
        if (!user || !thread) {
            toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to reply." });
            return;
        }

        try {
            const response = await apiClient.createForumReply(thread.id, newReply);
            if (response.success) {
                setNewReply('');
                toast({ title: "Reply posted", description: "Your reply has been added to the discussion." });
            } else {
                toast({ variant: "destructive", title: "Error", description: response.error });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleEditReply = async () => {
        if (!editingReply || !editReplyText.trim()) {
            toast({ variant: "destructive", title: "Empty reply", description: "Please write a reply before submitting." });
            return;
        }

        try {
            const response = await apiClient.updateForumReply(editingReply.id, editReplyText);
            if (response.success) {
                setEditOpen(false);
                setEditingReply(null);
                setEditReplyText('');
                toast({ title: "Reply updated", description: "Your reply has been successfully updated." });
            } else {
                toast({ variant: "destructive", title: "Error", description: response.error });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleDeleteReply = async () => {
        if (!deletingReplyId) return;

        try {
            const response = await apiClient.deleteForumReply(deletingReplyId);
            if (response.success) {
                setDeleteOpen(false);
                setDeletingReplyId(null);
                toast({ title: "Reply deleted", description: "Your reply has been successfully deleted." });
            } else {
                toast({ variant: "destructive", title: "Error", description: response.error });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const openEditDialog = (reply: ForumReply) => {
        setEditingReply(reply);
        setEditReplyText(reply.body);
        setEditOpen(true);
    };

    const openDeleteDialog = (replyId: string) => {
        setDeletingReplyId(replyId);
        setDeleteOpen(true);
    };

    const canEditOrDeleteReply = (reply: ForumReply) => {
        return user && reply.authorId === user.uid;
    };

    if (loading) {
        return (
            <PageWrapper title="Forum Thread">
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    Loading...
                </main>
            </PageWrapper>
        );
    }

    if (!thread) {
        return (
            <PageWrapper title="Thread Not Found">
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-2">Thread Not Found</h2>
                        <p>This thread may have been deleted or doesn't exist.</p>
                        <Link href="/forums" className="text-primary hover:underline">
                            Back to Forums
                        </Link>
                    </div>
                </main>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title={thread.title}>
            <main className="flex-1 space-y-4">
                <Link href="/forums" className="text-sm text-muted-foreground hover:underline">
                    ← Back to Forums
                </Link>

                {/* Original Thread */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-xl">{thread.title}</CardTitle>
                                <CardDescription className="mt-1">
                                    by <span className="font-medium">{thread.author}</span> in {thread.course}
                                    {thread.edited && <span className="text-xs ml-2">(edited)</span>}
                                </CardDescription>
                            </div>
                            {thread.pinned && <Badge variant="secondary">Pinned</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {thread.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {thread.body}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleUpvoteThread}
                                className={thread.upvotedBy?.includes(user?.uid || '') ? 'text-blue-600' : ''}
                            >
                                <ArrowUp className="w-4 h-4 mr-1" />
                                {thread.upvotes}
                            </Button>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                            </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {(() => {
                                try {
                                    const date = thread.timestamp?.toDate ? thread.timestamp.toDate() : new Date(thread.timestamp);
                                    return format(date, 'MMM d, yyyy HH:mm');
                                } catch {
                                    return 'Unknown date';
                                }
                            })()}
                        </span>
                    </CardFooter>
                </Card>

                {/* Replies */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Replies ({replies.length})</h3>
                    
                    {replies.map((reply) => (
                        <Card key={reply.id}>
                            <CardContent className="pt-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-medium text-sm">{reply.author}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(() => {
                                                try {
                                                    const date = reply.timestamp?.toDate ? reply.timestamp.toDate() : 
                                                               reply.createdAt ? new Date(reply.createdAt) : new Date();
                                                    return format(date, 'MMM d, yyyy HH:mm');
                                                } catch {
                                                    return 'Unknown date';
                                                }
                                            })()}
                                            {reply.edited && <span className="ml-2">(edited)</span>}
                                        </p>
                                    </div>
                                    {canEditOrDeleteReply(reply) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(reply)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Reply
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => openDeleteDialog(reply.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Reply
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap mb-3">{reply.body}</p>
                                <div className="flex items-center">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleUpvoteReply(reply.id)}
                                        className={reply.upvotedBy?.includes(user?.uid || '') ? 'text-blue-600' : ''}
                                    >
                                        <ArrowUp className="w-4 h-4 mr-1" />
                                        {reply.upvotes}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* New Reply Form */}
                    {user && !thread.locked && (
                        <Card>
                            <CardContent className="pt-4">
                                <Label htmlFor="new-reply" className="text-sm font-medium">
                                    Write a reply
                                </Label>
                                <Textarea
                                    id="new-reply"
                                    placeholder="Share your thoughts..."
                                    value={newReply}
                                    onChange={(e) => setNewReply(e.target.value)}
                                    className="mt-2"
                                    rows={3}
                                />
                                <div className="flex justify-end mt-3">
                                    <Button 
                                        onClick={handleCreateReply}
                                        disabled={!newReply.trim()}
                                    >
                                        <Send className="w-4 h-4 mr-1" />
                                        Post Reply
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!user && (
                        <Card>
                            <CardContent className="pt-4 text-center text-muted-foreground">
                                <p>Please <Link href="/login" className="text-primary hover:underline">log in</Link> to post a reply.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>

            {/* Edit Reply Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>Edit Reply</DialogTitle>
                        <DialogDescription>
                            Make changes to your reply below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-reply">Reply</Label>
                            <Textarea
                                id="edit-reply"
                                value={editReplyText}
                                onChange={(e) => setEditReplyText(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditReply} disabled={!editReplyText.trim()}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Reply Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this reply? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteReply} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Reply
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageWrapper>
    );
}