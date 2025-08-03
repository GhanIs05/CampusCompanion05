
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { resourceLibrary as sampleResourceLibrary } from '@/lib/data';
import { Download, FileText, Search, Upload, PlusCircle, Loader2, Pin, PinOff } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, writeBatch, doc, query, where, documentId, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface Resource {
    id: string;
    name: string;
    category: string;
    uploader: string;
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
    
    const { user } = useAuth();
    const { toast } = useToast();

    const [newResource, setNewResource] = useState({ name: '', category: '' });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    const seedDatabase = async () => {
        const batch = writeBatch(db);
        sampleResourceLibrary.forEach((resource) => {
            const { id, ...resourceData } = resource;
            const resourceRef = doc(collection(db, "resources"));
            const dataWithUrl = {
                ...resourceData,
                url: 'https://firebasestorage.googleapis.com/v0/b/campusconnect-ee87d.appspot.com/o/resources%2Fsample.pdf?alt=media&token=1d74e2a8-1b29-41d4-8398-3499426f4977', // Placeholder URL
                date: new Date().toISOString(),
            }
            batch.set(resourceRef, dataWithUrl);
        });
        await batch.commit();
    };

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        const resourcesQuerySnapshot = await getDocs(collection(db, "resources"));
        if (resourcesQuerySnapshot.empty) {
            await seedDatabase();
            const newQuerySnapshot = await getDocs(collection(db, "resources"));
            const resourcesData = newQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
            setAllResources(resourcesData);
        } else {
            const resourcesData = resourcesQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
            setAllResources(resourcesData);
        }

        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as UserProfile;
                const userPinnedIds = userData.pinnedResources || [];
                setPinnedResourceIds(userPinnedIds);
            }
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

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
            const storageRef = ref(storage, `resources/${Date.now()}_${fileToUpload.name}`);
            await uploadBytes(storageRef, fileToUpload);
            const downloadURL = await getDownloadURL(storageRef);
            const resourceData = {
                name: newResource.name,
                category: newResource.category,
                uploader: user.displayName || 'Campus User',
                date: new Date().toISOString(),
                fileType: fileToUpload.type,
                url: downloadURL,
            };
            await addDoc(collection(db, "resources"), resourceData);
            setOpen(false);
            setNewResource({ name: '', category: '' });
            setFileToUpload(null);
            toast({ title: "Resource Uploaded", description: "Your resource has been added to the library." });
            fetchInitialData(); // Refresh all data
        } catch (error: any) {
            toast({ variant: "destructive", title: "Upload Error", description: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        e.stopPropagation();
        toast({ title: "Downloading...", description: "Your file download has started." });
        window.open(url, '_blank');
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
                                                    <Button variant="ghost" size="icon" onClick={() => handlePinToggle(resource.id)}>
                                                        {pinnedResourceIds.includes(resource.id) ? <PinOff className="h-5 w-5 text-primary" /> : <Pin className="h-5 w-5 text-muted-foreground" />}
                                                        <span className="sr-only">{pinnedResourceIds.includes(resource.id) ? 'Unpin' : 'Pin'}</span>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={(e) => handleDownload(e, resource.url)}>
                                                        <Download className="h-5 w-5 text-muted-foreground" />
                                                        <span className="sr-only">Download</span>
                                                    </Button>
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
            </main>
        </PageWrapper>
    );
}

    