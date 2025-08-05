// scripts/setup-admin.js
// Run this script to set up your first admin user
// Usage: node scripts/setup-admin.js <user-email>

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (you'll need service account credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'campusconnect-ee87d',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.FIREBASE_PROJECT_ID || 'campusconnect-ee87d',
  });
}

const db = getFirestore();

async function makeUserAdmin(userEmail) {
  try {
    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', userEmail).get();
    
    if (snapshot.empty) {
      console.error(`No user found with email: ${userEmail}`);
      return;
    }

    // Update the first matching user
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      role: 'Admin'
    });

    console.log(`Successfully made ${userEmail} an Admin!`);
    console.log(`User ID: ${userDoc.id}`);
    
  } catch (error) {
    console.error('Error making user admin:', error);
  }
}

// Get email from command line arguments
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Please provide a user email:');
  console.error('node scripts/setup-admin.js user@example.com');
  process.exit(1);
}

makeUserAdmin(userEmail)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
