'use client';
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

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl md:text-2xl font-headline font-semibold text-foreground">{title}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="profile avatar" />
              <AvatarFallback>CC</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Campus User</p>
              <p className="text-xs leading-none text-muted-foreground">student@university.edu</p>
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
          <DropdownMenuItem asChild>
            <Link href="/login">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
