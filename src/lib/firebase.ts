// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics }from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDohuQq_1gWajvmjH6qqeU3s6MIo0zglX4",
  authDomain: "campusconnect-ee87d.firebaseapp.com",
  projectId: "campusconnect-ee87d",
  storageBucket: "campusconnect-ee87d.appspot.com",
  messagingSenderId: "197519420772",
  appId: "1:197519420772:web:3f8bc8e33483d374355e71",
  measurementId: "G-CVFPG47TVN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export { app };
