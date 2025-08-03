'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { toast } = useToast();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password || !confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out all fields.',
            });
            return;
        }
        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords Do Not Match',
                description: 'Please ensure your passwords match.',
            });
            return;
        }
        toast({
            title: 'Registration Successful',
            description: 'You can now log in with your new account.',
        });
        // In a real app, you would handle user creation and redirect
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="absolute top-8 flex items-center gap-2">
                <Flame className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-headline font-semibold">CampusConnect</h1>
            </div>
            <Card className="w-full max-w-sm">
                <form onSubmit={handleRegister}>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Register</CardTitle>
                        <CardDescription>Create an account to get started.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" type="text" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                           Create Account
                        </Button>
                         <div className="text-center text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="underline">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
