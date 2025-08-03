'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please enter both email and password.',
            });
            return;
        }
        try {
            await login(email, password);
            toast({
                title: 'Login Successful',
                description: 'Redirecting to your dashboard...',
            });
            router.push('/');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: error.message,
            });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
             <div className="absolute top-8 flex items-center gap-2">
                <Flame className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-headline font-semibold">CampusConnect</h1>
            </div>
            <Card className="w-full max-w-sm">
                <form onSubmit={handleLogin}>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Login</CardTitle>
                        <CardDescription>Enter your email below to login to your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                            Sign In
                        </Button>
                        <div className="text-center text-sm">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="underline">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
