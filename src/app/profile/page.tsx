import { AppHeader } from "@/components/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { userProfile } from "@/lib/data";

export default function ProfilePage() {
    return (
        <div className="flex flex-col h-full">
            <AppHeader title="My Profile" />
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
                                <AvatarFallback>CU</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <Button>Upload new photo</Button>
                                <Button variant="ghost">Delete</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" defaultValue={userProfile.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue={userProfile.email} />
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select defaultValue={userProfile.role}>
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
                            <Textarea id="bio" placeholder="Tell us a little about yourself" className="min-h-[100px]" defaultValue={userProfile.bio} />
                        </div>
                        <div className="flex justify-end">
                            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
