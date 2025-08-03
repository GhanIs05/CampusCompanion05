'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageWrapper } from '@/components/PageWrapper';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const [userProfile, setUserProfile] = useState({
        name: '',
        email: '',
        role: '',
        bio: '',
        avatar: '',
    });
    const { toast } = useToast();
    
    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as any);
                } else {
                    setUserProfile(prev => ({
                        ...prev,
                        name: user.displayName || '',
                        email: user.email || '',
                        avatar: user.photoURL || 'https://placehold.co/100x100.png',
                    }))
                }
            };
            fetchProfile();
        }
    }, [user]);


    const handleInputChange = (field: string, value: string) => {
        setUserProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveChanges = async () => {
        if (user) {
            try {
                await setDoc(doc(db, "users", user.uid), userProfile, { merge: true });
                toast({
                    title: "Profile Updated",
                    description: "Your profile information has been saved.",
                });
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: error.message,
                });
            }
        }
    };
    
    return (
        <PageWrapper title="My Profile">
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex justify-center items-start">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline">Profile Information</CardTitle>
                        <CardDescription>Update your photo and personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={userProfile.avatar} data-ai-hint="profile avatar" />
                                <AvatarFallback>{userProfile.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <Button>Upload new photo</Button>
                                <Button variant="ghost">Delete</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={userProfile.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={userProfile.email} onChange={(e) => handleInputChange('email', e.target.value)} disabled />
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
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea id="bio" placeholder="Tell us a little about yourself" className="min-h-[100px]" value={userProfile.bio} onChange={(e) => handleInputChange('bio', e.target.value)} />
                        </div>
                        <div className="flex justify-end">
                            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSaveChanges}>Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </PageWrapper>
    );
}
