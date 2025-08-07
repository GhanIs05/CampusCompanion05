// src/lib/auth-admin.ts
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  try {
    // For development: Use Application Default Credentials or emulator
    const projectId = process.env.FIREBASE_PROJECT_ID || 'campusconnect-ee87d';
    
    // Check if we have service account credentials
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Initializing Firebase Admin with service account credentials');
      app = initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        projectId: projectId,
      });
    } else {
      console.log('Initializing Firebase Admin with default credentials for development');
      // Initialize without explicit credentials - will use default credentials or emulator
      app = initializeApp({
        projectId: projectId,
      });
    }
  } catch (error) {
    console.warn('Firebase Admin initialization failed, using fallback:', error);
    // Create a basic app for development
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'campusconnect-ee87d',
    });
  }
} else {
  app = getApps()[0] as App;
}

auth = getAuth(app);
db = getFirestore(app);

export { auth as adminAuth, db as adminDb };

export interface UserProfile {
  name: string;
  email: string;
  role: 'Student' | 'Admin' | 'Moderator';
  bio: string;
  avatar: string;
  pinnedResources: string[];
  rsvpedEvents: string[];
}

export async function verifyAuthToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function checkUserRole(uid: string, requiredRoles: string[]): Promise<boolean> {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) return false;
    return requiredRoles.includes(userProfile.role);
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}
