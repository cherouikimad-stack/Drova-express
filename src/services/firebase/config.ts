/**
 * Firebase Client SDK Initialization & Connection Validation
 * Dedicated exclusively to official project: drova-express
 * Uses standard (default) Firestore instance and Firebase Auth
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDfzBl7A2wGuCV7qdyYunRFKF4Sxud7bTo',
  authDomain: 'drova-express.firebaseapp.com',
  projectId: 'drova-express',
  storageBucket: 'drova-express.firebasestorage.app',
  messagingSenderId: '1021606726596',
  appId: '1:1021606726596:web:c0218baf493a86e269f291',
  measurementId: 'G-1PS8C3KLH6',
};

// Initialize Firebase App Singleton (prevent duplicate initialization)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore (default database instance)
export const db = getFirestore(app);

// Validate Connection to Firestore on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline fallback active: Check network or Firebase security permissions.');
      return false;
    }
    return true;
  }
}
testFirestoreConnection().catch(() => {});
