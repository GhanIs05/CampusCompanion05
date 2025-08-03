
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowUp, MessageCircle, Search, Tag, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { collection, addDoc, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { PageWrapper } from '@/components/PageWrapper';

interface ForumThread {
    id: string;
    title: string;
    author: string;
    course: string;
    upvotes: number;
    replies: number;
    timestamp: string;
    tags: string[];
    body: string;
}


export default function ForumsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [newPost, setNewPost] = useState({
    title: '',
    course: '',
    tags: '',
    body: '',
  });

  const fetchThreads = async () => {
      const querySnapshot = await getDocs(collection(db, "forumThreads"));
      const threadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumThread));
      setThreads(threadsData);
  }

  useEffect(() => {
    fetchThreads();
  }, [])


  const handleInputChange = (field: string, value: string) => {
    setNewPost((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.course || !newPost.body) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please fill out all required fields.",
        });
        return;
    }
    if (!user) {
        toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to create a post."});
        return;
    }

    const newThread = {
      title: newPost.title,
      author: user.displayName || 'Campus User',
      course: newPost.course,
      upvotes: 0,
      replies: 0,
      timestamp: new Date().toISOString(),
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      body: newPost.body,
    };

    try {
        await addDoc(collection(db, "forumThreads"), newThread);
        setOpen(false);
        setNewPost({ title: '', course: '', tags: '', body: '' }); // Reset form
         toast({
            title: "Post Created",
            description: "Your new forum post has been successfully created.",
        });
        fetchThreads(); // Refresh threads
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message});
    }

  };
  
  const handleUpvote = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
        toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to upvote."});
        return;
    }
    const threadRef = doc(db, "forumThreads", threadId);
    await updateDoc(threadRef, {
        upvotes: increment(1)
    });
    setThreads(threads.map(thread => 
      thread.id === threadId 
        ? { ...thread, upvotes: thread.upvotes + 1 }
        : thread
    ));
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const courses = [...new Set(threads.map(r => r.course))];

  return (
    <PageWrapper title="Forums">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search forums..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreatePost}>
                <DialogHeader>
                  <DialogTitle className="font-headline">Create New Post</DialogTitle>
                  <DialogDescription>
                    Share your thoughts, ask questions, or start a discussion.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={newPost.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="e.g., Struggling with Quantum Mechanics..." />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                     <Select value={newPost.course} onValueChange={(value) => handleInputChange('course', value)}>
                        <SelectTrigger id="course">
                            <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map(course => <SelectItem key={course} value={course}>{course}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" value={newPost.tags} onChange={(e) => handleInputChange('tags', e.target.value)} placeholder="e.g., homework-help, quantum (comma-separated)" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">Body</Label>
                    <Textarea id="body" value={newPost.body} onChange={(e) => handleInputChange('body', e.target.value)} placeholder="Elaborate on your post..." className="min-h-[120px]" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Create Post</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {filteredThreads.map((thread) => (
            <Link href={`/forums/${thread.id}`} key={thread.id} className="block hover:bg-muted/50 rounded-lg">
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{thread.title}</CardTitle>
                    <CardDescription>
                    Posted by {thread.author} in <Badge variant="secondary">{thread.course}</Badge> - {new Date(thread.timestamp).toLocaleString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {thread.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                    </div>
                </CardContent>
                <CardFooter className="flex items-center gap-6">
                    <Button variant="ghost" size="sm" onClick={(e) => handleUpvote(e, thread.id)}>
                    <ArrowUp className="h-5 w-5 mr-2" />
                    <span>{thread.upvotes} Upvotes</span>
                    </Button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="h-5 w-5" />
                    <span>{thread.replies} Replies</span>
                    </div>
                </CardFooter>
                </Card>
            </Link>
          ))}
        </div>
      </main>
    </PageWrapper>
  );
}
