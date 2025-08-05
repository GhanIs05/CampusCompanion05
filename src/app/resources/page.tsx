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
import { collection, addDoc, getDocs, writeBatch, doc, query, where, documentId, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, orderBy, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, AlertTriangle, FileImage, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';


// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/msword', // .doc
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-powerpoint', // .ppt
];

interface UploadState {
    isUploading: boolean;
    progress: number;
    error: string | null;
}


interface Resource {
    id: string;
    name: string;
    category: string;
    uploader: string;
    uploaderId?: string;
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
    const [uploadState, setUploadState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    
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
                uploaderId: 'sample-user',
                url: 'https://firebasestorage.googleapis.com/v0/b/campusconnect-ee87d.appspot.com/o/resources%2Fsample.pdf?alt=media&token=1d74e2a8-1b29-41d4-8398-3499426f4977', // Placeholder URL
                date: new Date().toISOString(),
            }
            batch.set(resourceRef, dataWithUrl);
        });
        await batch.commit();
    };

    // Real-time listener for resources
    useEffect(() => {
        setLoading(true);
        const resourcesRef = collection(db, "resources");
        const q = query(resourcesRef, orderBy("date", "desc"));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                await seedDatabase();
                return; // Will trigger again after seeding
            }
            
            const resourcesData = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            } as Resource));
            
            setAllResources(resourcesData);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to resources:", error);
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: "Failed to load resources." 
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch user pinned resources
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserProfile;
                    setPinnedResourceIds(userData.pinnedResources || []);
                }
            });
            return () => unsubscribe();
        }
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Reset any previous errors
            setUploadState(prev => ({ ...prev, error: null }));
            
            // Validate file
            const validation = validateFile(file);
            if (!validation.isValid) {
                setUploadState(prev => ({ ...prev, error: validation.error || 'Invalid file' }));
                e.target.value = ''; // Clear the input
                return;
            }
            
            setFileToUpload(file);
            toast({
                title: "File selected",
                description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB) ready to upload.`,
            });
        }
    };

    // File validation function
    const validateFile = (file: File): { isValid: boolean; error?: string } => {
        // Check file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            const allowedExtensions = ALLOWED_FILE_TYPES
                .map(type => {
                    if (type.startsWith('image/')) return type.split('/')[1];
                    if (type === 'application/pdf') return 'pdf';
                    if (type.includes('wordprocessingml')) return 'docx';
                    if (type.includes('spreadsheetml')) return 'xlsx';
                    if (type.includes('presentationml')) return 'pptx';
                    if (type === 'application/msword') return 'doc';
                    if (type === 'application/vnd.ms-excel') return 'xls';
                    if (type === 'application/vnd.ms-powerpoint') return 'ppt';
                    if (type === 'text/plain') return 'txt';
                    if (type === 'text/csv') return 'csv';
                    return type;
                })
                .filter(Boolean)
                .join(', ');
            
            return {
                isValid: false,
                error: `Invalid file type. Allowed types: ${allowedExtensions}`
            };
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return {
                isValid: false,
                error: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
            };
        }

        return { isValid: true };
    };

    const handleUploadResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newResource.name || !newResource.category) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all fields." });
            return;
        }
        if (!editingResource && !fileToUpload) {
            toast({ variant: "destructive", title: "Missing File", description: "Please select a file to upload." });
            return;
        }
        if (!user) {
            toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to upload a resource." });
            return;
        }
        
        setUploadState(prev => ({ 
            ...prev, 
            isUploading: true, 
            progress: 0, 
            error: null 
        }));

        try {
            let downloadURL = editingResource?.url;
            
            // Upload new file if provided
            if (fileToUpload) {
                // Delete old file if updating and it exists
                if (editingResource?.url && !editingResource.url.includes('sample.pdf')) {
                    try {
                        const oldFileRef = ref(storage, editingResource.url);
                        await deleteObject(oldFileRef);
                    } catch (deleteError) {
                        console.warn("Could not delete old file:", deleteError);
                    }
                }
                
                const timestamp = Date.now();
                const fileName = `${timestamp}_${fileToUpload.name}`;
                const storageRef = ref(storage, `resources/${fileName}`);
                
                // Use resumable upload for progress tracking
                const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
                
                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            // Progress tracking
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadState(prev => ({ ...prev, progress }));
                        },
                        (error) => {
                            // Handle upload errors
                            console.error('Upload error:', error);
                            let errorMessage = 'Failed to upload file.';
                            
                            switch (error.code) {
                                case 'storage/unauthorized':
                                    errorMessage = 'You are not authorized to upload files.';
                                    break;
                                case 'storage/canceled':
                                    errorMessage = 'Upload was cancelled.';
                                    break;
                                case 'storage/quota-exceeded':
                                    errorMessage = 'Storage quota exceeded.';
                                    break;
                                case 'storage/invalid-format':
                                    errorMessage = 'Invalid file format.';
                                    break;
                                case 'storage/retry-limit-exceeded':
                                    errorMessage = 'Upload failed after multiple retries.';
                                    break;
                            }
                            
                            setUploadState(prev => ({ ...prev, error: errorMessage }));
                            reject(error);
                        },
                        async () => {
                            // Upload completed successfully
                            try {
                                downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve();
                            } catch (urlError) {
                                console.error('Error getting download URL:', urlError);
                                setUploadState(prev => ({ 
                                    ...prev, 
                                    error: 'Failed to get file URL after upload.' 
                                }));
                                reject(urlError);
                            }
                        }
                    );
                });
            }
            
            const resourceData = {
                name: newResource.name,
                category: newResource.category,
                uploader: user.displayName || 'Campus User',
                uploaderId: user.uid,
                date: editingResource ? editingResource.date : new Date().toISOString(),
                fileType: fileToUpload ? fileToUpload.type : editingResource?.fileType,
                url: downloadURL,
            };
            
            if (editingResource) {
                // Update existing resource
                await updateDoc(doc(db, "resources", editingResource.id), resourceData);
                toast({ title: "Resource Updated", description: "Your resource has been updated." });
            } else {
                // Create new resource
                await addDoc(collection(db, "resources"), resourceData);
                toast({ title: "Resource Uploaded", description: "Your resource has been added to the library." });
            }
            
            setOpen(false);
            setEditingResource(null);
            setNewResource({ name: '', category: '' });
            setFileToUpload(null);
            setUploadState({
                isUploading: false,
                progress: 0,
                error: null,
            });
        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadState(prev => ({ 
                ...prev, 
                isUploading: false, 
                error: error.message || "Failed to upload resource. Please try again." 
            }));
            
            toast({ 
                variant: "destructive", 
                title: "Upload Error", 
                description: error.message || "Failed to upload resource. Please try again." 
            });
        }
    };

    const handleDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            toast({ 
                title: "Download Starting", 
                description: `Starting download of ${fileName}...` 
            });
            
            // For better UX, we'll use fetch to show progress
            const response = await fetch(url);
            if (!response.ok) throw new Error('Download failed');
            
            const contentLength = response.headers.get('content-length');
            if (!contentLength) {
                // Fallback to simple download if we can't track progress
                window.open(url, '_blank');
                return;
            }
            
            const total = parseInt(contentLength, 10);
            const reader = response.body?.getReader();
            if (!reader) {
                window.open(url, '_blank');
                return;
            }
            
            let receivedLength = 0;
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                chunks.push(value);
                receivedLength += value.length;
                
                // Show progress every 10%
                const progress = Math.round((receivedLength / total) * 100);
                if (progress % 10 === 0) {
                    toast({
                        title: "Downloading...",
                        description: `${fileName} - ${progress}% complete`,
                    });
                }
            }
            
            // Create blob and download
            const blob = new Blob(chunks);
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            
            toast({
                title: "Download Complete",
                description: `${fileName} has been downloaded successfully.`,
            });
            
        } catch (error) {
            console.error('Download error:', error);
            // Fallback to simple download
            window.open(url, '_blank');
            toast({
                title: "Download Started",
                description: "Your file download has started in a new tab.",
            });
        }
    };

    const handleEditResource = (resource: Resource) => {
        setEditingResource(resource);
        setNewResource({
            name: resource.name,
            category: resource.category,
        });
        setOpen(true);
    };

    const handleDeleteResource = async (resource: Resource) => {
        if (!user) {
            toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to delete resources." });
            return;
        }

        try {
            // Delete file from storage if it's not a sample URL
            if (!resource.url.includes('sample.pdf')) {
                const storageRef = ref(storage, resource.url);
                try {
                    await deleteObject(storageRef);
                } catch (storageError) {
                    console.warn("Could not delete file from storage:", storageError);
                }
            }
            
            // Delete document from Firestore
            await deleteDoc(doc(db, "resources", resource.id));
            
            toast({
                title: "Resource Deleted",
                description: "The resource has been successfully deleted.",
            });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const canEditOrDelete = (resource: Resource) => {
        return user && (resource.uploaderId === user.uid || resource.uploader === user.displayName);
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
                                <Dialog open={open} onOpenChange={(isOpen) => {
                                    setOpen(isOpen);
                                    if (!isOpen) {
                                        setEditingResource(null);
                                        setNewResource({ name: '', category: '' });
                                        setFileToUpload(null);
                                        setUploadState({
                                            isUploading: false,
                                            progress: 0,
                                            error: null,
                                        });
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                            <Upload className="mr-2 h-4 w-4" /> Upload
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <form onSubmit={handleUploadResource}>
                                            <DialogHeader>
                                                <DialogTitle className="font-headline">
                                                    {editingResource ? 'Edit Resource' : 'Upload Resource'}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {editingResource 
                                                        ? 'Update your resource details.' 
                                                        : 'Share a new resource with the community.'
                                                    }
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Resource Name</Label>
                                                    <Input 
                                                        id="name" 
                                                        value={newResource.name} 
                                                        onChange={(e) => handleInputChange('name', e.target.value)} 
                                                        placeholder="e.g., Quantum Mechanics Lecture Notes" 
                                                        disabled={uploadState.isUploading}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="category">Category</Label>
                                                    <Select 
                                                        value={newResource.category} 
                                                        onValueChange={(value) => handleInputChange('category', value)}
                                                        disabled={uploadState.isUploading}
                                                    >
                                                        <SelectTrigger id="category">
                                                            <SelectValue placeholder="Select a category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {[...new Set(categories)].map(cat => 
                                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                            )}
                                                            <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="file">
                                                        Document {editingResource && '(optional - leave empty to keep current file)'}
                                                    </Label>
                                                    <Input 
                                                        id="file" 
                                                        type="file" 
                                                        onChange={handleFileChange}
                                                        disabled={uploadState.isUploading}
                                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.gif"
                                                    />
                                                    {fileToUpload && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {Math.round(fileToUpload.size / (1024 * 1024) * 10) / 10}MB • {fileToUpload.type}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Upload Progress */}
                                                {uploadState.isUploading && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Upload className="h-4 w-4 animate-pulse text-blue-500" />
                                                            <span className="text-sm font-medium">
                                                                {editingResource ? 'Updating resource...' : 'Uploading file...'}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground ml-auto">
                                                                {Math.round(uploadState.progress)}%
                                                            </span>
                                                        </div>
                                                        <Progress value={uploadState.progress} className="h-2" />
                                                    </div>
                                                )}

                                                {/* Error Display */}
                                                {uploadState.error && (
                                                    <Alert variant="destructive">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <AlertDescription>
                                                            {uploadState.error}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                {/* File Selected Confirmation */}
                                                {fileToUpload && !uploadState.error && !uploadState.isUploading && (
                                                    <Alert>
                                                        <FileImage className="h-4 w-4" />
                                                        <AlertDescription>
                                                            File selected: {fileToUpload.name}. Click "{editingResource ? 'Update' : 'Add'} Resource" to upload.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button 
                                                    type="submit" 
                                                    className="bg-accent hover:bg-accent/90 text-accent-foreground" 
                                                    disabled={uploadState.isUploading}
                                                >
                                                    {uploadState.isUploading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                                            {editingResource ? 'Updating...' : 'Uploading...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlusCircle className="mr-2 h-4 w-4" /> 
                                                            {editingResource ? 'Update Resource' : 'Add Resource'}
                                                        </>
                                                    )}
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
                                                    <Button variant="ghost" size="icon" onClick={(e) => handleDownload(e, resource.url, resource.name)}>
                                                        <Download className="h-5 w-5 text-muted-foreground" />
                                                        <span className="sr-only">Download</span>
                                                    </Button>
                                                    {canEditOrDelete(resource) && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                                                    <span className="sr-only">More options</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem onClick={() => handleEditResource(resource)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <DropdownMenuItem 
                                                                            onSelect={(e) => e.preventDefault()}
                                                                            className="text-destructive"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                        </DropdownMenuItem>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete "{resource.name}"? This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction 
                                                                                onClick={() => handleDeleteResource(resource)}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
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

