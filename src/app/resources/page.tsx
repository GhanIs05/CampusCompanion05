
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { resourceLibrary as sampleResourceLibrary } from '@/lib/data';
import { Download, FileText, Search, Upload, PlusCircle, Loader2, Pin, PinOff, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collection, onSnapshot, doc, query, orderBy, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiClient } from '@/lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Resource {
    id: string;
    name: string;
    category: string;
    uploader: string;
    uploaderId: string;
    date: string;
    fileType: string;
    url: string;
}

interface UserProfile {
    pinnedResources?: string[];
}

export default function ResourcesPage() {
    const [allResources, setAllResources] = useState<Resource[]>([]);
    const [pinnedResources, setPinnedResources] = useState<Resource[]>([]);
    const [searchResults, setSearchResults] = useState<Resource[]>([]);
    const [pinnedResourceIds, setPinnedResourceIds] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
    
    const { user } = useAuth();
    const { toast } = useToast();
    const apiClient = useApiClient();

    const [newResource, setNewResource] = useState({ name: '', category: '' });
    const [editResource, setEditResource] = useState({ name: '', category: '' });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    useEffect(() => {
        const q = query(collection(db, "resources"), orderBy('date', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const resourcesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Resource));
          
          setAllResources(resourcesData);
          setLoading(false);
        }, (error) => {
          console.error('Error listening to resources:', error);
          setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data() as UserProfile;
                    const userPinnedIds = userData.pinnedResources || [];
                    setPinnedResourceIds(userPinnedIds);
                }
            }
        };
        fetchUserProfile();
    }, [user]);

    useEffect(() => {
        if (pinnedResourceIds.length > 0 && allResources.length > 0) {
            const userPinnedResources = allResources.filter(resource => pinnedResourceIds.includes(resource.id));
            setPinnedResources(userPinnedResources);
        } else {
            setPinnedResources([]);
        }
    }, [pinnedResourceIds, allResources]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = allResources.filter(resource =>
                resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resource.uploader.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 10);
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, allResources]);

    const handlePinToggle = async (resourceId: string) => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.uid);
        let newPinnedIds;
        if (pinnedResourceIds.includes(resourceId)) {
            await updateDoc(userDocRef, { pinnedResources: arrayRemove(resourceId) });
            newPinnedIds = pinnedResourceIds.filter(id => id !== resourceId);
            toast({ title: "Resource unpinned!" });
        } else {
            await updateDoc(userDocRef, { pinnedResources: arrayUnion(resourceId) });
            newPinnedIds = [...pinnedResourceIds, resourceId];
            toast({ title: "Resource pinned!" });
        }
        setPinnedResourceIds(newPinnedIds);
    };

    const handleInputChange = (field: string, value: string) => {
        setNewResource((prev) => ({ ...prev, [field]: value }));
    };

    const handleEditInputChange = (field: string, value: string) => {
        setEditResource((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileToUpload(e.target.files[0]);
        }
    };

    const handleUploadResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newResource.name || !newResource.category || !fileToUpload) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all fields and select a file." });
            return;
        }
        if (!user) {
            toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to upload a resource." });
            return;
        }
        setUploading(true);
        try {
            // Wait for auth token to ensure user is properly authenticated
            const authToken = await user.getIdToken(true); // Force refresh token
            console.log('Auth token exists:', !!authToken);
            console.log('User uid:', user.uid);
            console.log('User email:', user.email);
            
            // Add a small delay to ensure auth state is synced
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const storageRef = ref(storage, `resources/${Date.now()}_${fileToUpload.name}`);
            console.log('Storage ref path:', storageRef.fullPath);
            console.log('Storage bucket:', storageRef.bucket);
            
            await uploadBytes(storageRef, fileToUpload);
            const downloadURL = await getDownloadURL(storageRef);
            
            const resourceData = {
                name: newResource.name,
                category: newResource.category,
                fileType: fileToUpload.type,
                url: downloadURL,
            };

            const response = await apiClient.uploadResource(resourceData);
            if (response.success) {
                setOpen(false);
                setNewResource({ name: '', category: '' });
                setFileToUpload(null);
                toast({ title: "Resource Uploaded", description: "Your resource has been added to the library." });
            } else {
                toast({ variant: "destructive", title: "Upload Error", description: response.error });
            }
        } catch (error: any) {
            console.error('Full upload error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            toast({ variant: "destructive", title: "Upload Error", description: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleEditResourceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingResource || !editResource.name || !editResource.category) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
            return;
        }

        try {
            const response = await apiClient.updateResource(editingResource.id, {
                name: editResource.name,
                category: editResource.category,
            });
            
            if (response.success) {
                setEditOpen(false);
                setEditingResource(null);
                setEditResource({ name: '', category: '' });
                toast({ title: "Resource Updated", description: "Your resource has been successfully updated." });
            } else {
                toast({ variant: "destructive", title: "Error", description: response.error });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleDeleteResource = async () => {
        if (!deletingResourceId) return;

        try {
            const response = await apiClient.deleteResource(deletingResourceId);
            if (response.success) {
                setDeleteOpen(false);
                setDeletingResourceId(null);
                toast({ title: "Resource Deleted", description: "Your resource has been successfully deleted." });
            } else {
                toast({ variant: "destructive", title: "Error", description: response.error });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleDownload = (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        e.stopPropagation();
        toast({ title: "Downloading...", description: "Your file download has started." });
        window.open(url, '_blank');
    };

    const openEditDialog = (resource: Resource) => {
        setEditingResource(resource);
        setEditResource({
            name: resource.name,
            category: resource.category,
        });
        setEditOpen(true);
    };

    const openDeleteDialog = (resourceId: string) => {
        setDeletingResourceId(resourceId);
        setDeleteOpen(true);
    };

    const canEditOrDelete = (resource: Resource) => {
        return user && resource.uploaderId === user.uid;
    };

    const getFileIcon = (fileType: string) => <FileText className="h-5 w-5 text-primary" />;

    const categories = [...new Set(allResources.map(r => r.category).concat(sampleResourceLibrary.map(r => r.category)))];

    const resourcesToDisplay = searchTerm ? searchResults : pinnedResources;
    return (
        <PageWrapper title="Resource Library">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <CardTitle className="font-headline">{searchTerm ? "Search Results" : "My Pinned Resources"}</CardTitle>
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <div className="relative flex-1 md:flex-initial">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="Search all resources..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <Dialog open={open} onOpenChange={setOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                            <Upload className="mr-2 h-4 w-4" /> Upload
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <form onSubmit={handleUploadResource}>
                                            <DialogHeader>
                                                <DialogTitle className="font-headline">Upload Resource</DialogTitle>
                                                <DialogDescription>Share a new resource with the community.</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="space-y-2"><Label htmlFor="name">Resource Name</Label><Input id="name" value={newResource.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Quantum Mechanics Lecture Notes" /></div>
                                                <div className="space-y-2"><Label htmlFor="category">Category</Label><Select value={newResource.category} onValueChange={(value) => handleInputChange('category', value)}><SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{[...new Set(categories)].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}<SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                                                <div className="space-y-2"><Label htmlFor="file">Document</Label><Input id="file" type="file" onChange={handleFileChange} /></div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={uploading}>
                                                    {uploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>) : (<><PlusCircle className="mr-2 h-4 w-4" /> Add Resource</>)}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Category</TableHead>
                                        <TableHead className="hidden lg:table-cell">Uploader</TableHead>
                                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center">Loading resources...</TableCell></TableRow>
                                    ) : resourcesToDisplay.length > 0 ? (
                                        resourcesToDisplay.map((resource) => (
                                            <TableRow key={resource.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        {getFileIcon(resource.fileType)}
                                                        <span className="truncate">{resource.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell"><Badge variant="secondary">{resource.category}</Badge></TableCell>
                                                <TableCell className="hidden lg:table-cell">{resource.uploader}</TableCell>
                                                <TableCell className="hidden lg:table-cell">{format(new Date(resource.date), "PPP")}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handlePinToggle(resource.id)}>
                                                            {pinnedResourceIds.includes(resource.id) ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4 text-muted-foreground" />}
                                                            <span className="sr-only">{pinnedResourceIds.includes(resource.id) ? 'Unpin' : 'Pin'}</span>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={(e) => handleDownload(e, resource.url)}>
                                                            <Download className="h-4 w-4 text-muted-foreground" />
                                                            <span className="sr-only">Download</span>
                                                        </Button>
                                                        {canEditOrDelete(resource) && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => openEditDialog(resource)}>
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => openDeleteDialog(resource.id)} className="text-destructive">
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                {searchTerm ? "No results found." : "You have no pinned resources. Use the search bar to find and pin resources."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {searchTerm && searchResults.length >= 10 && (
                             <div className="flex justify-center mt-4">
                                <Button variant="outline" disabled>Load More (Not Implemented)</Button>
                             </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleEditResourceSubmit}>
                            <DialogHeader>
                                <DialogTitle className="font-headline">Edit Resource</DialogTitle>
                                <DialogDescription>Update the resource information.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Resource Name</Label>
                                    <Input id="edit-name" value={editResource.name} onChange={(e) => handleEditInputChange('name', e.target.value)} placeholder="e.g., Quantum Mechanics Lecture Notes" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-category">Category</Label>
                                    <Select value={editResource.category} onValueChange={(value) => handleEditInputChange('category', value)}>
                                        <SelectTrigger id="edit-category">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...new Set(categories)].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Update Resource</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this resource? This action cannot be undone and the file will be permanently removed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteResource} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </PageWrapper>
    );
}