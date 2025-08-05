
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from '@/components/ui/sidebar';
import { MessageSquare, FolderKanban, Calendar, User, Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const mainNavItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/forums', label: 'Forums', icon: MessageSquare },
  { href: '/resources', label: 'Resources', icon: FolderKanban },
  { href: '/events', label: 'Events', icon: Calendar },
];

const userNavItems = [
    { href: '/profile', label: 'Profile', icon: User },
]

export function SidebarNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

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
                    <div className={isMobile ? "py-1.5" : ""}>
                        <item.icon className={isMobile ? "h-5 w-5" : ""} />
                        <span className={isMobile ? "text-sm" : ""}>{item.label}</span>
                    </div>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
      </SidebarGroup>
      <SidebarSeparator />
        <SidebarGroup>
            <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>User</SidebarGroupLabel>
            <SidebarMenu>
            {userNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                    <div className={isMobile ? "py-1.5" : ""}>
                        <item.icon className={isMobile ? "h-5 w-5" : ""} />
                        <span className={isMobile ? "text-sm" : ""}>{item.label}</span>
                    </div>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
