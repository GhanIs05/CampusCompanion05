'use client';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { SidebarTrigger } from './ui/sidebar';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type AppHeaderProps = {
  title: string;
};

interface UserProfile {
  name: string;
  avatar: string;
  role: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Listen to user profile changes in real-time
  useEffect(() => {
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({
            name: data.name || user.displayName || 'Campus User',
            avatar: data.avatar || user.photoURL || 'https://placehold.co/100x100.png',
            role: data.role || 'Student',
          });
        } else {
          // Fallback to Auth user data
          setUserProfile({
            name: user.displayName || 'Campus User',
            avatar: user.photoURL || 'https://placehold.co/100x100.png',
            role: 'Student',
          });
        }
      });

      return () => unsubscribe();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  }

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-card px-3 sm:px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 sm:gap-4">
        <SidebarTrigger className="lg:hidden" />
        <h1 className="text-base sm:text-lg md:text-xl font-headline font-semibold text-foreground truncate">{title}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
              <AvatarImage 
                src={userProfile?.avatar || user?.photoURL || "https://placehold.co/100x100.png"} 
                alt="User Avatar" 
              />
              <AvatarFallback>
                {userProfile?.name?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {userProfile?.name || user?.displayName || "Campus User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || 'student@university.edu'}
              </p>
              {userProfile?.role && (
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile.role}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
