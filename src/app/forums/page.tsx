
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowUp, MessageCircle, Search, Tag, PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { PageWrapper } from '@/components/PageWrapper';
import { forumThreads as sampleForumThreads } from '@/lib/data';
import { Switch } from '@/components/ui/switch';
import { useApiClient } from '@/lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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

export default function ForumsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);
  const [editingThread, setEditingThread] = useState<ForumThread | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const apiClient = useApiClient();

  const [newPost, setNewPost] = useState({
    title: '',
    course: '',
    tags: '',
    body: '',
  });

  const [editPost, setEditPost] = useState({
    title: '',
    course: '',
    tags: '',
    body: '',
  });

  useEffect(() => {
    const q = query(collection(db, "forumThreads"), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const threadsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ForumThread));
      
      setThreads(threadsData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to forum threads:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setNewPost((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditPost((prev) => ({ ...prev, [field]: value }));
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
      course: newPost.course,
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      body: newPost.body,
    };

    try {
        const response = await apiClient.createForumThread(threadData);
        if (response.success) {
          setOpen(false);
          setNewPost({ title: '', course: '', tags: '', body: '' });
          toast({
              title: "Post Created",
              description: "Your new forum post has been successfully created.",
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: response.error});
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message});
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread || !editPost.title || !editPost.course || !editPost.body) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please fill out all required fields.",
        });
        return;
    }

    const threadData = {
      title: editPost.title,
      course: editPost.course,
      tags: editPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      body: editPost.body,
    };

    try {
        const response = await apiClient.updateForumThread(editingThread.id, threadData);
        if (response.success) {
          setEditOpen(false);
          setEditingThread(null);
          setEditPost({ title: '', course: '', tags: '', body: '' });
          toast({
              title: "Post Updated",
              description: "Your forum post has been successfully updated.",
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: response.error});
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message});
    }
  };

  const handleDeletePost = async () => {
    if (!deletingThreadId) return;

    try {
        const response = await apiClient.deleteForumThread(deletingThreadId);
        if (response.success) {
          setDeleteOpen(false);
          setDeletingThreadId(null);
          toast({
              title: "Post Deleted",
              description: "Your forum post has been successfully deleted.",
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: response.error});
        }
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

    try {
      const response = await apiClient.upvoteThread(threadId);
      if (!response.success) {
        toast({ variant: "destructive", title: "Error", description: response.error });
      }
    } catch (error) {
      console.error("Upvote failed: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not process upvote." });
    }
  };

  const openEditDialog = (thread: ForumThread) => {
    setEditingThread(thread);
    setEditPost({
      title: thread.title,
      course: thread.course,
      tags: thread.tags.join(', '),
      body: thread.body,
    });
    setEditOpen(true);
  };

  const openDeleteDialog = (threadId: string) => {
    setDeletingThreadId(threadId);
    setDeleteOpen(true);
  };

  const canEditOrDelete = (thread: ForumThread) => {
    return user && (thread.authorId === user.uid);
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAuthor = !showMyPostsOnly || (user && thread.authorId === user.uid);

    return matchesSearch && matchesAuthor;
  });
  
  const courses = [...new Set(threads.map(r => r.course).concat(sampleForumThreads.map(r => r.course)))];

  if (loading) {
    return (
        <PageWrapper title="Forums">
            <main className="flex-1 flex items-center justify-center text-muted-foreground">
                Loading...
            </main>
        </PageWrapper>
    )
  }
  return (
    <PageWrapper title="Forums">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex w-full flex-col md:flex-row gap-4 md:items-center">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                    placeholder="Search forums..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {user && (
                    <div className="flex items-center space-x-2">
                        <Switch id="my-posts-filter" checked={showMyPostsOnly} onCheckedChange={setShowMyPostsOnly} />
                        <Label htmlFor="my-posts-filter">My Posts</Label>
                    </div>
                )}
            </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0">
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
                            {[...new Set(courses)].map(course => <SelectItem key={course} value={course}>{course}</SelectItem>)}
                            <SelectItem value="Other">Other</SelectItem>
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

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleEditPost}>
              <DialogHeader>
                <DialogTitle className="font-headline">Edit Post</DialogTitle>
                <DialogDescription>
                  Update your forum post.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input id="edit-title" value={editPost.title} onChange={(e) => handleEditInputChange('title', e.target.value)} placeholder="e.g., Struggling with Quantum Mechanics..." />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="edit-course">Course</Label>
                   <Select value={editPost.course} onValueChange={(value) => handleEditInputChange('course', value)}>
                      <SelectTrigger id="edit-course">
                          <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                          {[...new Set(courses)].map(course => <SelectItem key={course} value={course}>{course}</SelectItem>)}
                          <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input id="edit-tags" value={editPost.tags} onChange={(e) => handleEditInputChange('tags', e.target.value)} placeholder="e.g., homework-help, quantum (comma-separated)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-body">Body</Label>
                  <Textarea id="edit-body" value={editPost.body} onChange={(e) => handleEditInputChange('body', e.target.value)} placeholder="Elaborate on your post..." className="min-h-[120px]" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Update Post</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone and will also delete all replies to this post.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="space-y-4">
          {filteredThreads.map((thread) => (
            <Card key={thread.id} className="hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/forums/${thread.id}`} className="block">
                      <CardTitle className="font-headline text-lg hover:text-primary">
                        {thread.pinned && <span className="text-primary mr-2">📌</span>}
                        {thread.title}
                        {thread.edited && <span className="text-muted-foreground text-sm ml-2">(edited)</span>}
                        {thread.locked && <span className="text-muted-foreground ml-2">🔒</span>}
                      </CardTitle>
                      <CardDescription>
                        Posted by {thread.author} in <Badge variant="secondary">{thread.course}</Badge> - {new Date(thread.timestamp).toLocaleString()}
                      </CardDescription>
                    </Link>
                  </div>
                  {canEditOrDelete(thread) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.preventDefault()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(thread)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(thread.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <Link href={`/forums/${thread.id}`}>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {thread.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center gap-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => handleUpvote(e, thread.id)}
                    className={user && thread.upvotedBy?.includes(user.uid) ? 'text-primary' : ''}
                  >
                    <ArrowUp className="h-5 w-5 mr-2" />
                    <span>{thread.upvotes} Upvotes</span>
                  </Button>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="h-5 w-5" />
                    <span>{thread.replies} Replies</span>
                  </div>
                </CardFooter>
              </Link>
            </Card>
          ))}
        </div>
      </main>
    </PageWrapper>
  );
}
