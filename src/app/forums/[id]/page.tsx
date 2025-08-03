
'use client';

import { AppHeader } from '@/components/AppHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { forumThreads } from '@/lib/data';
import { ArrowUp, CornerUpLeft, MessageCircle, Tag } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const initialThreadReplies = [
    { id: 'r1', author: 'Bob Williams', avatar: 'https://placehold.co/100x100.png', timestamp: '1 hour ago', content: 'I found that watching some videos on Khan Academy really helped clarify the concepts. Maybe give that a try?' },
    { id: 'r2', author: 'Charlie Brown', avatar: 'https://placehold.co/100x100.png', timestamp: '45 minutes ago', content: 'Seconding Bob\'s suggestion. Also, the textbook has some great worked examples in chapter 5 that are directly related to the problem set.' },
];

export default function ForumThreadPage() {
    const params = useParams();
    const threadId = params.id as string;
    
    const [replies, setReplies] = useState(initialThreadReplies);
    const [replyContent, setReplyContent] = useState('');

    const thread = forumThreads.find(t => t.id === threadId);

    if (!thread) {
        return (
            <div className="flex flex-col h-full">
                <AppHeader title="Forum Post" />
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    Thread not found.
                </main>
            </div>
        );
    }
    
    const handlePostReply = () => {
        if (replyContent.trim()) {
            const newReply = {
                id: `r${replies.length + 1}-${Date.now()}`,
                author: 'Campus User',
                avatar: 'https://placehold.co/100x100.png',
                timestamp: 'Just now',
                content: replyContent,
            };
            setReplies([...replies, newReply]);
            setReplyContent('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <AppHeader title="Forum Post" />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
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
                                <span>{thread.timestamp}</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base">
                                I've been stuck on question 3 of the latest quantum mechanics problem set for hours. I understand the basic principles of wave-particle duality but I can't seem to apply it to this specific scenario. Has anyone else made progress or have any tips?
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mt-6">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                {thread.tags.map((tag) => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex items-center gap-6">
                            <Button variant="ghost">
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
                                            <p className="text-xs text-muted-foreground">{reply.timestamp}</p>
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
        </div>
    );
}
