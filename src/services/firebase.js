/* Firebase configuration & initialization */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCR4Avd-G812k7xWFBxRAVqSyRpebTimY8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wish-studio.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wish-studio",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wish-studio.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID || "140858187839",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:140858187839:web:a5a4b813f660b76639988a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
