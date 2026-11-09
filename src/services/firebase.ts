/**
 * DROVA Express CRM — Central Firebase Service Export
 * Unified export for Firebase Auth and Firestore database instances.
 */
export { app, auth, db, firebaseConfig, testFirestoreConnection } from './firebase/config';
export { authService } from './firebase/authService';
export { firestoreService } from './firebase/firestoreService';
