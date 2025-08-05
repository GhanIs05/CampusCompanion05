'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { User, MapPin, Calendar } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  bio: string;
  avatar: string;
  joinedDate?: string;
}

interface UserProfileCardProps {
  userId: string;
  showFullBio?: boolean;
  className?: string;
}

export function UserProfileCard({ userId, showFullBio = false, className = "" }: UserProfileCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const docRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-3 text-muted-foreground">
            <User className="h-8 w-8" />
            <span>User not found</span>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar} alt={`${profile.name}'s avatar`} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg">{profile.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{profile.role}</Badge>
              {profile.joinedDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Since {new Date(profile.joinedDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      {profile.bio && (
        <CardContent>
          <p className={`text-sm text-muted-foreground ${!showFullBio ? 'line-clamp-2' : ''}`}>
            {profile.bio}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

// Simplified inline version for use in lists
interface UserAvatarProps {
  userId: string;
  fallbackName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ userId, fallbackName, size = 'md', className = "" }: UserAvatarProps) {
  const [avatar, setAvatar] = useState<string>('');
  const [name, setName] = useState<string>('');

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };

  useEffect(() => {
    if (!userId) return;

    const docRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAvatar(data.avatar || '');
        setName(data.name || fallbackName || '');
      }
    });

    return () => unsubscribe();
  }, [userId, fallbackName]);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={avatar} alt={`${name}'s avatar`} />
      <AvatarFallback>
        {name ? name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
