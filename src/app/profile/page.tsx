'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { PageWrapper } from '@/components/PageWrapper';
import { Loader2, Camera, Trash2, User, Upload, X, AlertTriangle, CheckCircle, FileImage } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';


interface UserProfile {
    name: string;
    email: string;
    role: string;
    bio: string;
    avatar: string;
    pinnedResources?: string[];
    rsvpedEvents?: string[];
    joinedDate?: string;
    lastUpdated?: string;
}

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_DIMENSION = 2048; // Max width/height in pixels

interface UploadState {
    isUploading: boolean;
    progress: number;
    error: string | null;
    preview: string | null;
}

export default function ProfilePage() {
    const { user, loading, updateUserProfile } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: '',
        email: '',
        role: '',
        bio: '',
        avatar: '',
        pinnedResources: [],
        rsvpedEvents: [],
    });
    const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
    const { toast } = useToast();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
        preview: null,
    });
    const [profileLoading, setProfileLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Real-time listener for user profile
    useEffect(() => {
        if (user) {
            setProfileLoading(true);
            const docRef = doc(db, "users", user.uid);
            
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const profileData = docSnap.data() as UserProfile;
                    setUserProfile(profileData);
                    setOriginalProfile(profileData);
                } else {
                    // Create initial profile if it doesn't exist
                    const initialProfile: UserProfile = {
                        name: user.displayName || '',
                        email: user.email || '',
                        role: 'Student',
                        bio: '',
                        avatar: user.photoURL || 'https://placehold.co/100x100.png',
                        pinnedResources: [],
                        rsvpedEvents: [],
                        joinedDate: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                    };
                    setUserProfile(initialProfile);
                    setOriginalProfile(initialProfile);
                }
                setProfileLoading(false);
            }, (error) => {
                console.error("Error listening to profile:", error);
                toast({ 
                    variant: "destructive", 
                    title: "Error", 
                    description: "Failed to load profile data." 
                });
                setProfileLoading(false);
            });

            return () => unsubscribe();
        }
    }, [user, toast]);

    // Check for changes
    useEffect(() => {
        if (originalProfile) {
            const hasProfileChanges = 
                userProfile.name !== originalProfile.name ||
                userProfile.role !== originalProfile.role ||
                userProfile.bio !== originalProfile.bio ||
                avatarFile !== null;
            setHasChanges(hasProfileChanges);
        }
    }, [userProfile, originalProfile, avatarFile]);


    const handleInputChange = (field: string, value: string) => {
        setUserProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Reset any previous errors
            setUploadState(prev => ({ ...prev, error: null }));
            
            // Validate file type and size
            const validation = validateImageFile(file);
            if (!validation.isValid) {
                setUploadState(prev => ({ ...prev, error: validation.error || 'Invalid file' }));
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            
            // Validate image dimensions
            const dimensionValidation = await validateImageDimensions(file);
            if (!dimensionValidation.isValid) {
                setUploadState(prev => ({ ...prev, error: dimensionValidation.error || 'Invalid dimensions' }));
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            
            // Set file and create preview
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadState(prev => ({ 
                    ...prev, 
                    preview: reader.result as string,
                    error: null 
                }));
            };
            reader.readAsDataURL(file);
            
            toast({
                title: "Image selected",
                description: `${file.name} (${(file.size / 1024).toFixed(1)}KB) ready to upload.`,
            });
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleDeleteAvatar = async () => {
        if (!user) return;
        
        try {
            // Reset to default avatar
            const defaultAvatar = 'https://placehold.co/100x100.png';
            setUserProfile(prev => ({ ...prev, avatar: defaultAvatar }));
            setAvatarFile(null);
            
            toast({
                title: "Avatar removed",
                description: "Your profile picture has been reset to default.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to remove avatar.",
            });
        }
    };

    const resetChanges = () => {
        if (originalProfile) {
            setUserProfile(originalProfile);
            setAvatarFile(null);
        }
    };

    const handleSaveChanges = async () => {
        if (!user) return;

        // Validate required fields
        if (!userProfile.name.trim()) {
            toast({
                variant: "destructive",
                title: "Name required",
                description: "Please enter your full name.",
            });
            return;
        }

        setUploadState(prev => ({ 
            ...prev, 
            isUploading: true, 
            progress: 0, 
            error: null 
        }));

        let avatarUrl = userProfile.avatar;

        try {
            // Upload new avatar if selected
            if (avatarFile) {
                // Delete old avatar if it exists and is not the default
                if (originalProfile?.avatar && 
                    !originalProfile.avatar.includes('placehold.co') && 
                    originalProfile.avatar.includes('firebase')) {
                    try {
                        const oldAvatarRef = ref(storage, originalProfile.avatar);
                        await deleteObject(oldAvatarRef);
                    } catch (deleteError) {
                        console.warn("Could not delete old avatar:", deleteError);
                    }
                }
                
                // Upload new avatar with progress tracking
                const timestamp = Date.now();
                const fileExtension = avatarFile.name.split('.').pop();
                const fileName = `avatar_${timestamp}.${fileExtension}`;
                const storageRef = ref(storage, `profiles/${user.uid}/${fileName}`);
                
                // Use resumable upload for progress tracking
                const uploadTask = uploadBytesResumable(storageRef, avatarFile);
                
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
                            let errorMessage = 'Failed to upload image.';
                            
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
                                avatarUrl = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve();
                            } catch (urlError) {
                                console.error('Error getting download URL:', urlError);
                                setUploadState(prev => ({ 
                                    ...prev, 
                                    error: 'Failed to get image URL after upload.' 
                                }));
                                reject(urlError);
                            }
                        }
                    );
                });
            }

            // Update user profile in Firestore
            const updatedProfileData: UserProfile = { 
                ...userProfile,
                avatar: avatarUrl,
                lastUpdated: new Date().toISOString(),
                joinedDate: originalProfile?.joinedDate || new Date().toISOString(),
                pinnedResources: userProfile.pinnedResources || [],
                rsvpedEvents: userProfile.rsvpedEvents || [],
            };
            
            await setDoc(doc(db, "users", user.uid), updatedProfileData, { merge: true });

            // Update Firebase Auth profile
            await updateUserProfile(userProfile.name, avatarUrl);

            // Reset upload state
            resetUploadState();
            
            toast({
                title: "Profile Updated",
                description: "Your profile information has been successfully saved.",
            });
        } catch (error: any) {
            console.error("Profile update error:", error);
            setUploadState(prev => ({ 
                ...prev, 
                isUploading: false, 
                error: error.message || "Failed to update profile. Please try again." 
            }));
            
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Failed to update profile. Please try again.",
            });
        }
    };
    
    // File validation functions
    const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
        // Check file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return {
                isValid: false,
                error: `Invalid file type. Please select a ${ALLOWED_IMAGE_TYPES.map(type => type.split('/')[1]).join(', ')} image.`
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

    const validateImageDimensions = (file: File): Promise<{ isValid: boolean; error?: string }> => {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
                    resolve({
                        isValid: false,
                        error: `Image dimensions too large. Maximum size is ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} pixels.`
                    });
                } else {
                    resolve({ isValid: true });
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({
                    isValid: false,
                    error: "Invalid image file. Please select a valid image."
                });
            };
            
            img.src = url;
        });
    };

    const resetUploadState = () => {
        setUploadState({
            isUploading: false,
            progress: 0,
            error: null,
            preview: null,
        });
        setAvatarFile(null);
    };

    if (loading || profileLoading) {
        return (
            <PageWrapper title="My Profile">
                <main className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading profile...
                    </div>
                </main>
            </PageWrapper>
        );
    }
    
    return (
        <PageWrapper title="My Profile">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex justify-center items-start">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline">Profile Information</CardTitle>
                        <CardDescription>
                            Update your photo and personal details here.
                            {userProfile.joinedDate && (
                                <span className="block mt-1 text-xs text-muted-foreground">
                                    Member since {new Date(userProfile.joinedDate).toLocaleDateString()}
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={userProfile.avatar} alt="Profile picture" />
                                    <AvatarFallback className="text-lg">
                                        <User className="h-8 w-8" />
                                    </AvatarFallback>
                                </Avatar>
                                {avatarFile && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                                        <Camera className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleAvatarChange} 
                                className="hidden"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                            />
                            <div className="flex flex-col gap-2">
                                <Button onClick={triggerFileSelect} variant="outline" className="flex items-center gap-2">
                                    <Camera className="h-4 w-4" />
                                    {avatarFile ? 'Change Photo' : 'Upload Photo'}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            className="text-destructive hover:text-destructive"
                                            disabled={userProfile.avatar.includes('placehold.co')}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to remove your profile picture? This will reset it to the default avatar.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteAvatar}>
                                                Remove
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                {avatarFile && (
                                    <p className="text-xs text-muted-foreground">
                                        {Math.round(avatarFile.size / 1024)}KB • {avatarFile.type}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input 
                                    id="name" 
                                    value={userProfile.name} 
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={userProfile.email} 
                                    disabled 
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed here
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={userProfile.role} onValueChange={(value) => handleInputChange('role', value)}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Student">Student</SelectItem>
                                    <SelectItem value="Mentor">Mentor</SelectItem>
                                    <SelectItem value="Tutor">Tutor</SelectItem>
                                    <SelectItem value="Teaching Assistant">Teaching Assistant</SelectItem>
                                    <SelectItem value="Faculty">Faculty</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea 
                                id="bio" 
                                placeholder="Tell us a little about yourself, your interests, or what you're studying..." 
                                className="min-h-[120px]" 
                                value={userProfile.bio} 
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {userProfile.bio.length}/500 characters
                            </p>
                        </div>
                        
                        {/* Upload Progress and Errors */}
                        {uploadState.isUploading && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Upload className="h-4 w-4 animate-pulse text-blue-500" />
                                    <span className="text-sm font-medium">Uploading avatar...</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {Math.round(uploadState.progress)}%
                                    </span>
                                </div>
                                <Progress value={uploadState.progress} className="h-2" />
                            </div>
                        )}

                        {uploadState.error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    {uploadState.error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {uploadState.preview && !uploadState.error && (
                            <Alert>
                                <FileImage className="h-4 w-4" />
                                <AlertDescription>
                                    New avatar selected. Click "Save Changes" to upload and apply the new profile picture.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!uploadState.isUploading && !uploadState.error && originalProfile && userProfile.avatar !== originalProfile.avatar && !avatarFile && (
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Profile picture updated successfully!
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <Button 
                                variant="outline" 
                                onClick={resetChanges}
                                disabled={!hasChanges || uploadState.isUploading}
                            >
                                Reset Changes
                            </Button>
                            <Button 
                                className="bg-accent hover:bg-accent/90 text-accent-foreground" 
                                onClick={handleSaveChanges} 
                                disabled={uploadState.isUploading || !hasChanges}
                            >
                                {uploadState.isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                        
                        {userProfile.lastUpdated && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                                Last updated: {new Date(userProfile.lastUpdated).toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </PageWrapper>
    );
}
