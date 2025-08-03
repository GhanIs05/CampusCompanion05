
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/SidebarNav';
import { Flame } from 'lucide-react';
import { AppHeader } from './AppHeader';


interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
  isPublic?: boolean;
}

export function PageWrapper({ children, title, isPublic = false }: PageWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push('/login');
    }
  }, [user, loading, isPublic, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Loading...</div>;
  }
  
  if (!user && !isPublic) {
    return null;
  }

  if (isPublic) {
    return <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">{children}</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Flame className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-headline font-semibold">CampusConnect</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full">
            <AppHeader title={title} />
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

