'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, MessageSquare, BookOpen, Calendar, User, FolderKanban } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/forums', label: 'Forums', icon: MessageSquare },
  { href: '/resources', label: 'Resources', icon: FolderKanban },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
];

export function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || (href === '/' && pathname.startsWith('/dashboard'));
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => (
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
  );
}
