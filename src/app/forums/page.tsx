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
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { collection, addDoc, getDocs, doc, updateDoc, increment, writeBatch, runTransaction, arrayUnion, arrayRemove, getDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { PageWrapper } from '@/components/PageWrapper';
import { forumThreads as sampleForumThreads } from '@/lib/data';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

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


export default function ForumsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<ForumThread | null>(null);
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [newPost, setNewPost] = useState({
    title: '',
    course: '',
    tags: '',
    body: '',
  });

  const seedDatabase = async () => {
    const batch = writeBatch(db);
    sampleForumThreads.forEach((thread) => {
        const { id, ...threadData } = thread;
        const threadRef = doc(collection(db, "forumThreads"));
        const dataWithUpvotedBy = {
          ...threadData,
          upvotedBy: [],
          authorId: 'sample-user',
        }
        batch.set(threadRef, dataWithUpvotedBy);
    });
    await batch.commit();
  }

  // Real-time listener for threads
  useEffect(() => {
    setLoading(true);
    const threadsRef = collection(db, "forumThreads");
    const q = query(threadsRef, orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        await seedDatabase();
        return; // Will trigger again after seeding
      }
      
      const threadsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ForumThread));
      
      setThreads(threadsData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to threads:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to load forum threads." 
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


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

    const threadData = {
      title: newPost.title,
      author: user.displayName || 'Campus User',
      authorId: user.uid,
      course: newPost.course,
      upvotes: 0,
      replies: 0,
      timestamp: new Date().toISOString(),
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      body: newPost.body,
      upvotedBy: [],
    };

    try {
        if (editingThread) {
          // Update existing thread
          await updateDoc(doc(db, "forumThreads", editingThread.id), threadData);
          toast({
            title: "Post Updated",
            description: "Your forum post has been successfully updated.",
          });
        } else {
          // Create new thread
          await addDoc(collection(db, "forumThreads"), threadData);
          toast({
            title: "Post Created",
            description: "Your new forum post has been successfully created.",
          });
        }
        
        setOpen(false);
        setEditingThread(null);
        setNewPost({ title: '', course: '', tags: '', body: '' }); // Reset form
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
          // User is removing their upvote
          newUpvotedBy = arrayRemove(user.uid);
          newUpvotes = increment(-1);
        } else {
          // User is adding an upvote
          newUpvotedBy = arrayUnion(user.uid);
          newUpvotes = increment(1);
        }
        
        transaction.update(threadRef, { upvotes: newUpvotes, upvotedBy: newUpvotedBy });
      });
      
      // No need to update local state - real-time listener will handle it
    } catch (error) {
      console.error("Transaction failed: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not process upvote." });
    }
  };

  const handleEditThread = (thread: ForumThread) => {
    setEditingThread(thread);
    setNewPost({
      title: thread.title,
      course: thread.course,
      tags: thread.tags.join(', '),
      body: thread.body,
    });
    setOpen(true);
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to delete posts." });
      return;
    }

    try {
      await deleteDoc(doc(db, "forumThreads", threadId));
      toast({
        title: "Post Deleted",
        description: "Your forum post has been successfully deleted.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const canEditOrDelete = (thread: ForumThread) => {
    return user && (thread.authorId === user.uid || thread.author === user.displayName);
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAuthor = !showMyPostsOnly || (user && (thread.authorId === user.uid || thread.author === user.displayName));

    return matchesSearch && matchesAuthor;
  });
  
  const courses = [...new Set(threads.map(r => r.course).concat(sampleForumThreads.map(r => r.course)))];

  if (loading) {
    return (
        <PageWrapper title="Forums">
            <main className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 text-muted-foreground">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p>Loading forums...</p>
                </div>
            </main>
        </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Forums">
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 sticky top-14 sm:top-16 z-10 bg-background py-3 sm:py-0 border-b sm:border-0">
            <div className="flex w-full flex-col sm:flex-row gap-4 sm:items-center">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <Input 
                    placeholder="Search forums..." 
                    className="pl-10 h-9 sm:h-10 text-sm sm:text-base" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {user && (
                    <div className="flex items-center space-x-2">
                        <Switch id="my-posts-filter" checked={showMyPostsOnly} onCheckedChange={setShowMyPostsOnly} />
                        <Label htmlFor="my-posts-filter" className="text-sm sm:text-base">My Posts</Label>
                    </div>
                )}
            </div>
          
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingThread(null);
              setNewPost({ title: '', course: '', tags: '', body: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                {isMobile ? 'New Post' : 'Create New Post'}
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto w-[calc(100vw-1rem)] sm:w-auto sm:max-w-[425px]">
              <form onSubmit={handleCreatePost}>
                <DialogHeader>
                  <DialogTitle className="font-headline text-lg sm:text-xl">
                    {editingThread ? 'Edit Post' : 'Create New Post'}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    {editingThread 
                      ? 'Update your forum post.' 
                      : 'Share your thoughts, ask questions, or start a discussion.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm">Title</Label>
                    <Input 
                      id="title" 
                      value={newPost.title} 
                      onChange={(e) => handleInputChange('title', e.target.value)} 
                      placeholder="e.g., Struggling with Quantum Mechanics..." 
                      className="h-9 text-sm"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="course" className="text-sm">Course</Label>
                     <Select value={newPost.course} onValueChange={(value) => handleInputChange('course', value)}>
                        <SelectTrigger id="course" className="h-9 text-sm">
                            <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                            {[...new Set(courses)].map(course => <SelectItem key={course} value={course}>{course}</SelectItem>)}
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm">Tags</Label>
                    <Input 
                      id="tags" 
                      value={newPost.tags} 
                      onChange={(e) => handleInputChange('tags', e.target.value)} 
                      placeholder="e.g., homework-help, quantum (comma-separated)" 
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body" className="text-sm">Body</Label>
                    <Textarea 
                      id="body" 
                      value={newPost.body} 
                      onChange={(e) => handleInputChange('body', e.target.value)} 
                      placeholder="Elaborate on your post..." 
                      className="min-h-[120px] text-sm"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
                  >
                    {editingThread ? 'Update Post' : 'Create Post'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {filteredThreads.length > 0 ? (
            <>
              {filteredThreads.map((thread) => (
                <Link href={`/forums/${thread.id}`} key={thread.id} className="block hover:bg-muted/50 rounded-lg transition-colors">
                    <Card className="touch-manipulation">
                    <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-base sm:text-lg line-clamp-2">{thread.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                        Posted by {thread.author} in <Badge variant="secondary">{thread.course}</Badge>
                        <span className="block sm:inline sm:ml-1">{new Date(thread.timestamp).toLocaleDateString()}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        {thread.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-3 sm:gap-6 pt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleUpvote(e, thread.id)}
                          className={`${user && thread.upvotedBy?.includes(user.uid) ? 'text-primary' : ''} p-1 sm:p-2 h-8 sm:h-9`}
                        >
                          <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                          <span className="text-xs sm:text-sm ml-1 sm:ml-0">{thread.upvotes}</span>
                        </Button>
                        <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>{thread.replies}</span>
                        </div>
                        {canEditOrDelete(thread) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-auto p-1 h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditThread(thread);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="mx-2 w-[calc(100vw-1rem)] sm:mx-0 sm:w-auto">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this post? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteThread(thread.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </CardFooter>
                    </Card>
                </Link>
              ))}
              
              {isMobile && filteredThreads.length > 5 && (
                <div className="fixed bottom-4 right-4 z-20">
                  <Button 
                    size="sm" 
                    className="rounded-full h-10 w-10 shadow-lg p-0" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center p-4 sm:p-8 border-dashed">
              <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <CardTitle className="font-headline text-base sm:text-lg text-center">No forum posts found</CardTitle>
              <CardDescription className="mt-2 text-center text-xs sm:text-sm">
                {searchTerm || showMyPostsOnly 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Be the first to start a discussion!'}
              </CardDescription>
            </Card>
          )}
        </div>
      </main>
    </PageWrapper>
  );
}


