/**
 * Firebase Authentication & Centralized Multi-PC Identity Service
 * DROVA Express Algeria — Enterprise Merchant CRM
 *
 * Dedicated strictly to official Firebase Project: drova-express
 * Supports:
 * 1. Email / Password authentication via official Firebase Auth
 * 2. Seamless username-to-email resolution (e.g. cherouikimad -> cherouikimad@gmail.com)
 * 3. Loading RBAC roles directly from Firestore users/{uid} document
 * 4. Safe user creation without disrupting the active Administrator session
 */
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db, firebaseConfig } from './config';
import { UserAccount, UserRole, UserSession } from '../../types';

const INTERNAL_DOMAIN = '@drova-express.dz';

// Helper: convert username to internal email for team members who do not have an external email
export function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (clean === 'cherouikimad' || clean === 'cherouik') {
    return 'cherouikimad@gmail.com';
  }
  return `${clean}${INTERNAL_DOMAIN}`;
}

export function emailToUsername(email: string): string {
  if (email.toLowerCase() === 'cherouikimad@gmail.com') return 'cherouikimad';
  return email.replace(INTERNAL_DOMAIN, '').split('@')[0];
}

export interface AuthResult {
  success: boolean;
  message?: string;
  session?: UserSession;
  account?: UserAccount;
}

// Secondary App instance for admin user provisioning without disconnecting the active session
function getAdminOpsAuth() {
  const secondaryApp =
    getApps().find(a => a.name === 'DrovaAdminOps') ||
    initializeApp(firebaseConfig, 'DrovaAdminOps');
  return getAuth(secondaryApp);
}

export const authService = {
  /**
   * Log in using Username or Email + Password via official Firebase Authentication
   */
  async login(identifier: string, pass: string): Promise<AuthResult> {
    const rawIdentifier = (identifier || '').trim();
    if (!rawIdentifier || !pass) {
      return {
        success: false,
        message: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور.'
      };
    }

    let targetEmail = '';
    const cleanIdentifier = rawIdentifier.toLowerCase();

    // 1. Resolve identifier to Email
    if (cleanIdentifier.includes('@')) {
      targetEmail = cleanIdentifier;
    } else if (cleanIdentifier === 'cherouikimad' || cleanIdentifier === 'cherouik') {
      // Official Super Admin username alias mapping
      targetEmail = 'cherouikimad@gmail.com';
    } else {
      // Look up username in Firestore mapping or query users
      try {
        const uNameSnap = await getDoc(doc(db, 'usernames', cleanIdentifier));
        if (uNameSnap.exists() && uNameSnap.data()?.email) {
          targetEmail = uNameSnap.data().email;
        } else {
          const q = query(collection(db, 'users'), where('username', '==', cleanIdentifier));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            targetEmail = qSnap.docs[0].data()?.email || `${cleanIdentifier}${INTERNAL_DOMAIN}`;
          } else {
            targetEmail = `${cleanIdentifier}${INTERNAL_DOMAIN}`;
          }
        }
      } catch {
        targetEmail = `${cleanIdentifier}${INTERNAL_DOMAIN}`;
      }
    }

    // 2. Authenticate directly through Firebase Authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, pass);
      const fbUser = userCredential.user;

      // 3. Load user document from Firestore (users/{uid})
      let uData: any = null;
      try {
        const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDocSnap.exists()) {
          uData = userDocSnap.data();
        }
      } catch (docErr) {
        console.warn('[Firestore User Profile Notice]', docErr);
      }

      // Check if this is the official Super Admin
      const isOfficialSuperAdmin =
        fbUser.uid === 'aj9amW4NKRR6gS3G4MgyG3fU2sS2' ||
        targetEmail === 'cherouikimad@gmail.com';

      if (!uData) {
        // Initialize default user document if missing in Firestore
        uData = {
          id: fbUser.uid,
          email: fbUser.email || targetEmail,
          fullName: isOfficialSuperAdmin ? 'DROVA Administrator' : (fbUser.displayName || cleanIdentifier),
          username: isOfficialSuperAdmin ? 'cherouikimad' : cleanIdentifier,
          role: isOfficialSuperAdmin ? 'SUPER_ADMIN' : 'COMMERCIAL',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        // Persist non-blocking
        setDoc(doc(db, 'users', fbUser.uid), uData, { merge: true }).catch(() => {});
      }

      // Check account status
      if (uData.status === 'disabled') {
        await signOut(auth).catch(() => {});
        return {
          success: false,
          message: 'هذا الحساب معطل حالياً من قِبل إدارة DROVA Express.'
        };
      }

      // 4. Update lastLogin asynchronously (failure must NEVER block login)
      updateDoc(doc(db, 'users', fbUser.uid), {
        lastLogin: new Date().toISOString(),
        last_login: new Date().toISOString()
      }).catch(() => {});

      // 5. Construct normalized UserSession
      const rawRole = (uData.role || (isOfficialSuperAdmin ? 'SUPER_ADMIN' : 'COMMERCIAL')).toString().toLowerCase();
      const role: UserRole = rawRole as UserRole;

      const session: UserSession = {
        user_id: fbUser.uid,
        name: uData.fullName || uData.full_name || fbUser.displayName || 'DROVA User',
        username: uData.username || cleanIdentifier,
        role,
        email: fbUser.email || targetEmail,
        phone: uData.phone || fbUser.phoneNumber || ''
      };

      const account: UserAccount = {
        id: fbUser.uid,
        full_name: session.name,
        username: session.username || cleanIdentifier,
        password_hash: '',
        salt: '',
        role,
        phone: session.phone,
        email: session.email,
        status: (uData.status as any) || 'active',
        created_at: uData.createdAt || uData.created_at || new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      return {
        success: true,
        session,
        account
      };
    } catch (err: any) {
      console.warn('[Firebase Auth Login Error]', err?.code, err?.message);

      let arabicMessage = 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم/البريد وكلمة المرور.';

      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-email') {
        arabicMessage = 'اسم المستخدم أو البريد الإلكتروني غير مسجل في النظام.';
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        arabicMessage = 'كلمة المرور غير صحيحة، يرجى التحقق والمحاولة مجدداً.';
      } else if (err?.code === 'auth/user-disabled') {
        arabicMessage = 'هذا الحساب معطل حالياً من قِبل إدارة DROVA Express.';
      } else if (err?.code === 'auth/too-many-requests') {
        arabicMessage = 'تم حظر المحاولات مؤقتاً بسبب تكرار إدخال كلمة المرور بشكل خاطئ. يرجى المحاولة بعد قليل.';
      } else if (err?.code === 'auth/network-request-failed') {
        arabicMessage = 'تعذر الاتصال بخدمة المصادقة السحابية. يرجى التحقق من اتصال الإنترنت.';
      }

      return {
        success: false,
        message: arabicMessage
      };
    }
  },

  /**
   * Log in using Google Workspace OAuth Single Sign-On
   */
  async loginWithGoogle(): Promise<AuthResult> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      const email = fbUser.email?.toLowerCase() || '';

      // Check if user document exists in Firestore
      const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
      let uData: any = userDocSnap.exists() ? userDocSnap.data() : null;

      const isOfficialSuperAdmin =
        fbUser.uid === 'aj9amW4NKRR6gS3G4MgyG3fU2sS2' ||
        email === 'cherouikimad@gmail.com' ||
        email.includes('cherouik');

      let role: UserRole = isOfficialSuperAdmin ? 'super_admin' : 'commercial';

      if (!uData) {
        uData = {
          id: fbUser.uid,
          username: email.split('@')[0],
          fullName: fbUser.displayName || email.split('@')[0],
          full_name: fbUser.displayName || email.split('@')[0],
          email,
          role: role.toUpperCase(),
          status: 'active',
          phone: fbUser.phoneNumber || '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', fbUser.uid), uData, { merge: true }).catch(() => {});
      } else {
        role = (uData.role || (isOfficialSuperAdmin ? 'SUPER_ADMIN' : 'COMMERCIAL')).toLowerCase() as UserRole;
        if (uData.status === 'disabled') {
          await signOut(auth);
          return {
            success: false,
            message: 'هذا الحساب معطل حالياً من قِبل إدارة DROVA Express.'
          };
        }
      }

      const session: UserSession = {
        user_id: fbUser.uid,
        name: uData.fullName || uData.full_name || fbUser.displayName || 'DROVA Member',
        username: uData.username || email.split('@')[0],
        role,
        email,
        phone: uData.phone || fbUser.phoneNumber || ''
      };

      return {
        success: true,
        session,
        account: {
          id: fbUser.uid,
          full_name: session.name,
          username: session.username || email.split('@')[0],
          password_hash: 'GOOGLE_OAUTH',
          salt: 'GOOGLE_OAUTH',
          role,
          phone: session.phone,
          email,
          status: 'active',
          created_at: uData.createdAt || new Date().toISOString(),
          last_login: new Date().toISOString()
        }
      };
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err?.message || err);
      if (err.code === 'auth/popup-closed-by-user') {
        return { success: false, message: 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.' };
      }
      return {
        success: false,
        message: err.message || 'فشل تسجيل الدخول بواسطة Google.'
      };
    }
  },

  /**
   * Load authorized user profile from Firestore by UID
   */
  async loadAuthorizedUser(uid: string): Promise<UserSession | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      const data = snap.data();
      const roleStr = (data.role || (uid === 'aj9amW4NKRR6gS3G4MgyG3fU2sS2' ? 'SUPER_ADMIN' : 'COMMERCIAL')).toLowerCase() as UserRole;
      return {
        user_id: uid,
        name: data.fullName || data.full_name || 'DROVA Member',
        username: data.username || 'member',
        role: roleStr,
        email: data.email || '',
        phone: data.phone || ''
      };
    } catch {
      return null;
    }
  },

  /**
   * Create a new authorized team account in Firebase Auth & Firestore
   * Uses secondary Firebase Auth instance to avoid logging out the current administrator
   */
  async createUser(data: {
    fullName: string;
    username: string;
    password: string;
    role: UserRole;
    phone?: string;
    email?: string;
  }): Promise<AuthResult> {
    const cleanUsername = data.username.trim().toLowerCase();
    const internalEmail = data.email || usernameToEmail(cleanUsername);

    // 1. Check existing username in Firestore mapping (non-blocking if permission restricted)
    try {
      const uNameSnap = await getDoc(doc(db, 'usernames', cleanUsername));
      if (uNameSnap.exists()) {
        return { success: false, message: 'اسم المستخدم مسجل مسبقاً في قاعدة البيانات' };
      }
    } catch (checkErr) {
      console.warn('[Username Check Notice]', checkErr);
    }

    try {
      // 2. Create user with isolated secondary auth client
      const adminAuth = getAdminOpsAuth();
      const userCredential = await createUserWithEmailAndPassword(adminAuth, internalEmail, data.password);
      const newUid = userCredential.user.uid;

      await updateProfile(userCredential.user, { displayName: data.fullName }).catch(() => {});
      // Immediately sign out from secondary client so it stays clean
      await signOut(adminAuth).catch(() => {});

      const newAccountDoc = {
        id: newUid,
        username: cleanUsername,
        fullName: data.fullName,
        full_name: data.fullName,
        email: internalEmail,
        role: data.role.toUpperCase(),
        status: 'active',
        phone: data.phone || '',
        createdAt: new Date().toISOString()
      };

      // 3. Save to users collection (safe & non-blocking if permission-denied in browser)
      try {
        await setDoc(doc(db, 'users', newUid), newAccountDoc, { merge: true });
        await setDoc(doc(db, 'usernames', cleanUsername), {
          uid: newUid,
          username: cleanUsername,
          email: internalEmail,
          createdAt: newAccountDoc.createdAt
        }, { merge: true });
      } catch (docErr) {
        console.warn('[Firestore User Doc Notice - Non Blocking]', docErr);
      }

      return {
        success: true,
        account: {
          id: newUid,
          full_name: data.fullName,
          username: cleanUsername,
          password_hash: 'FIREBASE_AUTH',
          salt: 'FIREBASE_AUTH',
          role: data.role,
          phone: data.phone,
          email: internalEmail,
          status: 'active',
          created_at: newAccountDoc.createdAt
        }
      };
    } catch (err: any) {
      console.warn('Create User error:', err?.code, err?.message);
      let msg = 'حدث خطأ أثناء إنشاء حساب الموظف في خادم المصادقة.';
      if (err?.code === 'auth/email-already-in-use') {
        msg = 'البريد الإلكتروني أو اسم المستخدم مرتبط بحساب موجود مسبقاً في Firebase.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'كلمة المرور ضعيفة جداً. يجب أن تحتوي على 6 أحرف أو أرقام على الأقل.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'صيغة اسم المستخدم غير صالحة للبريد الإلكتروني.';
      } else if (err?.code === 'auth/network-request-failed') {
        msg = 'تعذر الاتصال بخدمة Firebase. يرجى التحقق من اتصال الإنترنت.';
      } else if (err?.message) {
        msg = `خطأ في مصادقة Firebase: ${err.message}`;
      }
      return {
        success: false,
        message: msg
      };
    }
  },

  /**
   * Log out of current session
   */
  async logout(): Promise<void> {
    await signOut(auth).catch(() => {});
  },

  /**
   * Listen to Firebase auth state changes
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
