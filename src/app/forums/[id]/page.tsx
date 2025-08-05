'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowUp, CornerUpLeft, MessageCircle, Tag } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, increment, onSnapshot, query, orderBy, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/PageWrapper';
import Link from 'next/link';

interface ForumThread {
    id: string;
    title: string;
    author: string;
    authorId?: string;
    course: string;
    upvotes: number;
    replies: number;
    timestamp: string;
    tags: string[];
    body: string;
    upvotedBy: string[];
}

interface Reply {
    id: string;
    author: string;
    avatar: string;
    timestamp: string;
    content: string;
}

export default function ForumThreadPage() {
    const params = useParams();
    const threadId = params.id as string;
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [thread, setThread] = useState<ForumThread | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!threadId) return;

        setLoading(true);
        const threadRef = doc(db, "forumThreads", threadId);
        
        const unsubscribeThread = onSnapshot(threadRef, (threadSnap) => {
            if (threadSnap.exists()) {
                setThread({ id: threadSnap.id, ...threadSnap.data() } as ForumThread);
            }
            setLoading(false);
        });

        const repliesRef = collection(db, "forumThreads", threadId, "replies");
        const q = query(repliesRef, orderBy("timestamp", "asc"));

        const unsubscribeReplies = onSnapshot(q, (repliesSnap) => {
            const repliesData = repliesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reply));
            setReplies(repliesData);
            
            // Update reply count on thread document for consistency on the main forums page
            if (threadRef) {
                updateDoc(threadRef, { replies: repliesData.length });
            }
        });

        return () => {
            unsubscribeThread();
            unsubscribeReplies();
        };

    }, [threadId]);


    const handlePostReply = async () => {
        if (replyContent.trim() && user) {
            // Get current user profile for most up-to-date info
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                let authorName = user.displayName || 'Campus User';
                let authorAvatar = user.photoURL || 'https://placehold.co/100x100.png';
                
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    authorName = userData.name || authorName;
                    authorAvatar = userData.avatar || authorAvatar;
                }
                
                const newReply = {
                    author: authorName,
                    authorId: user.uid,
                    avatar: authorAvatar,
                    timestamp: new Date().toISOString(),
                    content: replyContent,
                };
                
                const repliesRef = collection(db, "forumThreads", threadId, "replies");
                await addDoc(repliesRef, newReply);

                setReplyContent('');
                toast({ title: "Reply posted successfully!" });
            } catch (error: any) {
                toast({ 
                    variant: "destructive", 
                    title: "Error", 
                    description: "Failed to post reply. Please try again." 
                });
            }
        } else if (!user) {
            toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to reply."});
        }
    };
    
      const handleUpvote = async () => {
        if (!user || !thread) {
            toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to upvote."});
            return;
        }
        const threadRef = doc(db, "forumThreads", thread.id);

        try {
          await runTransaction(db, async (transaction) => {
            const threadDoc = await transaction.get(threadRef);
            if (!threadDoc.exists()) {
              throw "Document does not exist!";
            }

            const threadData = threadDoc.data();
            const upvotedBy = threadData.upvotedBy || [];
            const hasUpvoted = upvotedBy.includes(user.uid);
            
            let newUpvotedBy;
            let newUpvotes;

            if (hasUpvoted) {
              newUpvotedBy = arrayRemove(user.uid);
              newUpvotes = increment(-1);
            } else {
              newUpvotedBy = arrayUnion(user.uid);
              newUpvotes = increment(1);
            }
            
            transaction.update(threadRef, { upvotes: newUpvotes, upvotedBy: newUpvotedBy });

            // No need to update local state here as onSnapshot will take care of it
          });
        } catch (error) {
          console.error("Transaction failed: ", error);
          toast({ variant: "destructive", title: "Error", description: "Could not process upvote." });
        }
      };


    if (loading) {
        return (
            <PageWrapper title="Forum Post">
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    Loading...
                </main>
            </PageWrapper>
        )
    }

    if (!thread) {
        return (
            <PageWrapper title="Forum Post">
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    Thread not found.
                </main>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Forum Post">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-4">
                        <Button asChild variant="outline">
                            <Link href="/forums">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Forums
                            </Link>
                        </Button>
                    </div>
                    {/* Original Post */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{thread.title}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="forum user avatar" />
                                        <AvatarFallback>{thread.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{thread.author}</span>
                                </div>
                                <span>in <Badge variant="secondary">{thread.course}</Badge></span>
                                <span>{new Date(thread.timestamp).toLocaleString()}</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base">{thread.body}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-6">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                {thread.tags.map((tag) => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex items-center gap-6">
                            <Button 
                                variant="ghost"
                                onClick={handleUpvote}
                                className={user && thread.upvotedBy?.includes(user.uid) ? 'text-primary' : ''}
                            >
                                <ArrowUp className="h-5 w-5 mr-2" />
                                <span>{thread.upvotes} Upvotes</span>
                            </Button>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MessageCircle className="h-5 w-5" />
                                <span>{replies.length} Replies</span>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Replies */}
                    <h2 className="text-xl font-headline font-semibold mb-4">{replies.length} Replies</h2>
                    <div className="space-y-4">
                        {replies.map(reply => (
                            <Card key={reply.id} className="bg-muted/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={reply.avatar} data-ai-hint="forum user avatar" />
                                            <AvatarFallback>{reply.author.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{reply.author}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(reply.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p>{reply.content}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Reply Form */}
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="font-headline">Leave a Reply</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                placeholder="Write your reply here..." 
                                className="min-h-[120px]"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handlePostReply}>
                                <CornerUpLeft className="mr-2 h-4 w-4" />
                                Post Reply
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </PageWrapper>
    );
}

