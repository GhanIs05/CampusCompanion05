
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDohuQq_1gWajvmjH6qqeU3s6MIo0zglX4",
  authDomain: "campusconnect-a41e3.firebaseapp.com",
  projectId: "campusconnect-a41e3",
  storageBucket: "campusconnect-a41e3.appspot.com",
  messagingSenderId: "197519420772",
  appId: "1:197519420772:web:3f8bc8e33483d374355e71",
  measurementId: "G-CVFPG47TVN"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
