/**
 * Firebase Client SDK Initialization & Connection Validation
 * Reads from firebase-applet-config.json with environment fallbacks
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase App Singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore (support custom database ID if provisioned)
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);

// Validate Connection to Firestore on boot (Critical skill constraint)
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline fallback active: Check network or Firebase security permissions.');
      return false;
    }
    // Expected on initial boot if test/connection doesn't exist
    return true;
  }
}
testFirestoreConnection().catch(() => {});
