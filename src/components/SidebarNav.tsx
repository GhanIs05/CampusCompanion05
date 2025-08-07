
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';
import { MessageSquare, FolderKanban, Calendar, User, Home, Shield, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedAction } from '@/components/ProtectedActions';

const mainNavItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/forums', label: 'Forums', icon: MessageSquare },
  { href: '/resources', label: 'Resources', icon: FolderKanban },
  { href: '/events', label: 'Events', icon: Calendar },
];

const userNavItems = [
    { href: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { href: '/admin', label: 'Admin Panel', icon: Shield },
];

const devNavItems = [
  { href: '/dev', label: 'Dev Tools', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { canModerate } = useAuth();

  const isActive = (href: string) => {
    // Make home active for the root path as well
    if (href === '/home' && pathname === '/') return true;
    return pathname === href;
  };

  return (
    <>
        <SidebarGroup>
            <SidebarMenu>
            {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <div>
                        <item.icon />
                        <span>{item.label}</span>
                    </div>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
      </SidebarGroup>
      <SidebarSeparator />
        <SidebarGroup>
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarMenu>
            {userNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <div>
                        <item.icon />
                        <span>{item.label}</span>
                    </div>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
      </SidebarGroup>
      
      <ProtectedAction requiredRoles={['Admin', 'Moderator']}>
        <SidebarSeparator />
        <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarMenu>
            {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <div>
                        <item.icon />
                        <span>{item.label}</span>
                    </div>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarGroup>
      </ProtectedAction>
      
      {/* Development tools - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <SidebarSeparator />
          <SidebarGroup>
              <SidebarGroupLabel>Development</SidebarGroupLabel>
              <SidebarMenu>
              {devNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref>
                      <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                      <div>
                          <item.icon />
                          <span>{item.label}</span>
                      </div>
                      </SidebarMenuButton>
                  </Link>
                  </SidebarMenuItem>
              ))}
              </SidebarMenu>
          </SidebarGroup>
        </>
      )}
    </>
  );
}
