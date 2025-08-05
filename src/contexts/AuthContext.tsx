// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface UserProfile {
  name: string;
  email: string;
  role: 'Student' | 'Admin' | 'Moderator';
  bio: string;
  avatar: string;
  pinnedResources: string[];
  rsvpedEvents: string[];
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, photoURL: string) => Promise<void>;
  isAdmin: () => boolean;
  isModerator: () => boolean;
  canModerate: () => boolean;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  isAdmin: () => false,
  isModerator: () => false,
  canModerate: () => false,
  getAuthToken: async () => null,
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          }
          
          // Store auth token in cookie for API requests
          const token = await user.getIdToken();
          document.cookie = `auth-token=${token}; path=/; max-age=3600; secure; samesite=strict`;
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
        // Clear auth token cookie
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  }

  const register = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const photoURL = 'https://placehold.co/100x100.png';
    await updateProfile(userCredential.user, { displayName: name, photoURL });
    
    // Create user profile in firestore
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDocRef, {
      name: name,
      email: email,
      role: 'Student',
      bio: '',
      avatar: photoURL,
      pinnedResources: [],
      rsvpedEvents: [],
    });
    
    return userCredential;
  }
  
  const updateUserProfile = async (name: string, photoURL: string) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name, photoURL: photoURL });
        // Manually trigger a user state update if needed, though onAuthStateChanged should catch it.
        setUser(auth.currentUser);
    }
  }

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = () => {
    return userProfile?.role === 'Admin';
  };

  const isModerator = () => {
    return userProfile?.role === 'Moderator';
  };

  const canModerate = () => {
    return userProfile?.role === 'Admin' || userProfile?.role === 'Moderator';
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (user) {
      try {
        return await user.getIdToken();
      } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      login, 
      register, 
      logout, 
      updateUserProfile,
      isAdmin,
      isModerator,
      canModerate,
      getAuthToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
