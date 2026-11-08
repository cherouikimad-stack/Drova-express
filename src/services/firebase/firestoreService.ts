/**
 * Central Cloud Firestore Service for DROVA Express
 * Real-time synchronization across all commercial and management PCs
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import {
  Prospect,
  CRMCall,
  CRMFollowUp,
  ExpediteurProfile,
  CommercialFeedback,
  NotificationItem,
  AuditLog,
  UserAccount
} from '../../types';
import type { AdminSettings } from '../storage';
import { normalizeAlgerianPhone } from '../phone';
import { normalizeBusinessName } from '../deduplication';

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export const firestoreService = {
  // ================= MERCHANTS & PROSPECTS (CENTRAL SINGLE SOURCE OF TRUTH) =================
  subscribeProspects(onUpdate: (prospects: Prospect[]) => void, onError?: (err: any) => void) {
    // Primary subscription to 'merchants' collection with fallback to 'prospects'
    const merchantsRef = collection(db, 'merchants');
    return onSnapshot(
      merchantsRef,
      snapshot => {
        const list: Prospect[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...(d.data() as any) });
        });

        if (list.length > 0) {
          onUpdate(list);
        } else {
          // If merchants is empty, check prospects for initial migration
          getDocs(collection(db, 'prospects')).then(pSnap => {
            const pList: Prospect[] = [];
            pSnap.forEach(d => pList.push({ id: d.id, ...(d.data() as any) }));
            onUpdate(pList);
          }).catch(() => onUpdate([]));
        }
      },
      error => {
        console.warn('Merchants Firestore snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveProspect(prospect: Prospect, checkDuplicate: boolean = true): Promise<void> {
    const cleanPhone = (prospect.phone || '').trim();
    const phoneNorm = normalizeAlgerianPhone(cleanPhone);
    const phoneKey = phoneNorm.isValid
      ? `phone_${phoneNorm.normalized.replace(/[^0-9]/g, '')}`
      : null;

    // Atomic Duplicate Prevention against Firestore
    if (checkDuplicate && phoneKey) {
      try {
        const phoneLockRef = doc(db, 'merchant_phones', phoneKey);
        const lockSnap = await getDoc(phoneLockRef);
        if (lockSnap.exists()) {
          const lockData = lockSnap.data();
          if (lockData.merchantId && lockData.merchantId !== prospect.id) {
            const existingName = lockData.name || 'تاجر مسجل';
            const normCandidateName = normalizeBusinessName(prospect.name);
            const normExistingName = normalizeBusinessName(existingName);

            if (normCandidateName === normExistingName) {
              throw new Error(
                `هذا التاجر مسجل مسبقاً في النظام. (الاسم: "${existingName}"، رقم الهاتف: ${phoneNorm.normalized}، المعرّف: ${lockData.merchantId})`
              );
            } else {
              throw new Error(
                `رقم الهاتف (${prospect.phone}) مسجل مسبقاً في النظام للتاجر "${existingName}" (معرف: ${lockData.merchantId}). لا يمكن إنشاء سجل مكرر.`
              );
            }
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('مسجل مسبقاً')) {
          throw err;
        }
      }
    }

    const now = new Date().toISOString();
    const sanitized = sanitizeForFirestore({
      ...prospect,
      business_name: prospect.business_name || prospect.name,
      updatedAt: now,
      updated_at: now
    });

    // 1. Write to central 'merchants' collection (Master primary store)
    await setDoc(doc(db, 'merchants', prospect.id), sanitized, { merge: true });

    // 2. Synchronize to 'prospects' collection (For backwards compatibility across all views)
    await setDoc(doc(db, 'prospects', prospect.id), sanitized, { merge: true });

    // 3. Atomically register phone lock
    if (phoneKey) {
      const phoneLockRef = doc(db, 'merchant_phones', phoneKey);
      await setDoc(phoneLockRef, {
        merchantId: prospect.id,
        name: prospect.name,
        phone: phoneNorm.normalized,
        updatedAt: now,
      }, { merge: true }).catch(() => {});
    }
  },

  async updateProspect(id: string, updates: Partial<Prospect>): Promise<void> {
    const now = new Date().toISOString();
    const sanitized = sanitizeForFirestore({ ...updates, updatedAt: now, updated_at: now });
    await updateDoc(doc(db, 'merchants', id), sanitized).catch(() => {});
    await updateDoc(doc(db, 'prospects', id), sanitized).catch(() => {});
  },

  async deleteProspect(id: string): Promise<void> {
    await deleteDoc(doc(db, 'merchants', id)).catch(() => {});
    await deleteDoc(doc(db, 'prospects', id)).catch(() => {});
  },

  async saveProspectsBatch(prospects: Prospect[]): Promise<void> {
    if (!prospects || prospects.length === 0) return;
    const chunkSize = 200; // Well below 500 writes limit
    for (let i = 0; i < prospects.length; i += chunkSize) {
      const chunk = prospects.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      for (const p of chunk) {
        const sanitized = sanitizeForFirestore({
          ...p,
          business_name: p.business_name || p.name,
          updatedAt: now,
          updated_at: now
        });
        batch.set(doc(db, 'merchants', p.id), sanitized, { merge: true });
        batch.set(doc(db, 'prospects', p.id), sanitized, { merge: true });
      }
      await batch.commit();
    }
  },

  async updateProspectsBatch(updates: { id: string; data: Partial<Prospect> }[]): Promise<void> {
    if (!updates || updates.length === 0) return;
    const chunkSize = 200;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      for (const item of chunk) {
        const sanitized = sanitizeForFirestore({ ...item.data, updatedAt: now });
        batch.update(doc(db, 'merchants', item.id), sanitized);
        batch.update(doc(db, 'prospects', item.id), sanitized);
      }
      await batch.commit();
    }
  },

  async deleteProspectsBatch(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const chunkSize = 200;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, 'merchants', id));
        batch.delete(doc(db, 'prospects', id));
      }
      await batch.commit();
    }
  },

  // ================= CALLS & MERCHANT ACTIVITIES =================
  subscribeCalls(onUpdate: (calls: CRMCall[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'calls');
    return onSnapshot(
      colRef,
      snapshot => {
        const list: CRMCall[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        onUpdate(list);
      },
      error => {
        console.warn('Calls Firestore snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async recordCall(call: CRMCall): Promise<void> {
    const docRef = doc(db, 'calls', call.id);
    const sanitized = sanitizeForFirestore({
      ...call,
      created_at: call.date || new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });

    // Update merchant's last call status in merchants & prospects
    if (call.prospect_id) {
      const callUpdate = {
        last_call_at: call.date,
        last_call_result: call.call_result,
        updated_at: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'merchants', call.prospect_id), callUpdate).catch(() => {});
      await updateDoc(doc(db, 'prospects', call.prospect_id), callUpdate).catch(() => {});
    }

    // Record activity in merchantActivities collection
    try {
      const actId = `act_${call.id}`;
      await setDoc(doc(db, 'merchantActivities', actId), {
        id: actId,
        merchantId: call.prospect_id,
        commercialId: call.commercial_id || call.commercial_name,
        action: 'CALL_RECORDED',
        callResult: call.call_result,
        notes: call.notes,
        timestamp: call.date || new Date().toISOString()
      }, { merge: true });
    } catch {}
  },

  // ================= FOLLOW-UPS =================
  subscribeFollowUps(onUpdate: (followUps: CRMFollowUp[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'followups');
    return onSnapshot(
      colRef,
      snapshot => {
        const list: CRMFollowUp[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        onUpdate(list);
      },
      error => {
        console.warn('FollowUps Firestore snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveFollowUp(followUp: CRMFollowUp): Promise<void> {
    const sanitized = sanitizeForFirestore(followUp);
    await setDoc(doc(db, 'followups', followUp.id), sanitized, { merge: true });
    await setDoc(doc(db, 'followUps', followUp.id), sanitized, { merge: true }).catch(() => {});
  },

  async updateFollowUp(id: string, updates: Partial<CRMFollowUp>): Promise<void> {
    const sanitized = sanitizeForFirestore(updates);
    await updateDoc(doc(db, 'followups', id), sanitized).catch(() => {});
    await updateDoc(doc(db, 'followUps', id), sanitized).catch(() => {});
  },

  // ================= EXPEDITEURS =================
  subscribeExpediteurs(onUpdate: (expediteurs: ExpediteurProfile[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'expediteurs');
    return onSnapshot(
      colRef,
      snapshot => {
        const list: ExpediteurProfile[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        onUpdate(list);
      },
      error => {
        console.warn('Expediteurs Firestore snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveExpediteur(expediteur: ExpediteurProfile): Promise<void> {
    const docRef = doc(db, 'expediteurs', expediteur.id);
    await setDoc(docRef, expediteur, { merge: true });
  },

  async updateExpediteur(id: string, updates: Partial<ExpediteurProfile>): Promise<void> {
    const docRef = doc(db, 'expediteurs', id);
    await updateDoc(docRef, updates);
  },

  // ================= COMMERCIAL FEEDBACKS =================
  subscribeFeedbacks(onUpdate: (feedbacks: CommercialFeedback[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'commercialFeedbacks');
    return onSnapshot(
      colRef,
      snapshot => {
        const list: CommercialFeedback[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        onUpdate(list);
      },
      error => {
        console.warn('Feedbacks Firestore snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveFeedback(feedback: CommercialFeedback): Promise<void> {
    const docRef = doc(db, 'commercialFeedbacks', feedback.id);
    await setDoc(docRef, feedback, { merge: true });
  },

  // ================= NOTIFICATIONS =================
  subscribeNotifications(onUpdate: (notifications: NotificationItem[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'notifications');
    return onSnapshot(
      colRef,
      snapshot => {
        const list: NotificationItem[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        onUpdate(list);
      },
      error => {
        console.warn('Notifications Firestore snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveNotification(notification: NotificationItem): Promise<void> {
    const docRef = doc(db, 'notifications', notification.id);
    await setDoc(docRef, notification, { merge: true });
  },

  async updateNotification(id: string, updates: Partial<NotificationItem>): Promise<void> {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, updates);
  },

  // ================= AUDIT LOGS =================
  async recordAuditLog(entry: Omit<AuditLog, 'id'>): Promise<void> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, 'auditLogs', id);
    await setDoc(docRef, { ...entry, id });
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(150));
      const snap = await getDocs(q);
      const list: AuditLog[] = [];
      snap.forEach(d => list.push(d.data() as AuditLog));
      return list;
    } catch {
      return [];
    }
  },

  // ================= USERS =================
  subscribeUsers(onUpdate: (users: UserAccount[]) => void, onError?: (err: any) => void) {
    const colRef = collection(db, 'users');
    return onSnapshot(
      colRef,
      snapshot => {
        const list: UserAccount[] = [];
        snapshot.forEach(d => {
          const data = d.data();
          list.push({
            id: d.id,
            full_name: data.fullName || data.full_name || data.username || '',
            username: data.username || '',
            password_hash: data.password_hash || '',
            salt: data.salt || '',
            role: (data.role || 'COMMERCIAL').toLowerCase(),
            status: data.status || 'active',
            phone: data.phone || '',
            email: data.email || '',
            created_at: data.createdAt || data.created_at || new Date().toISOString(),
            last_login: data.lastLogin || data.last_login
          });
        });
        onUpdate(list);
      },
      error => {
        console.warn('Users Firestore snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveUser(user: UserAccount): Promise<void> {
    const cleanUser = (user.username || '').toLowerCase().trim();
    const docData = sanitizeForFirestore({
      id: user.id,
      username: cleanUser,
      fullName: user.full_name || cleanUser,
      full_name: user.full_name || cleanUser,
      role: (user.role || 'COMMERCIAL').toUpperCase(),
      status: user.status || 'active',
      phone: user.phone || '',
      email: user.email || `${cleanUser}@drova-crm.internal`,
      password_hash: user.password_hash || '',
      salt: user.salt || '',
      createdAt: user.created_at || new Date().toISOString(),
      lastLogin: user.last_login || null
    });

    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, docData, { merge: true });

    // Also mirror to doc by username for O(1) direct lookup without index dependencies
    if (cleanUser && user.id !== `usr_${cleanUser}`) {
      await setDoc(doc(db, 'users', `usr_${cleanUser}`), docData, { merge: true }).catch(() => {});
    }
  },

  async updateUser(id: string, updates: any): Promise<void> {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, sanitizeForFirestore(updates));
  },

  async deleteUser(id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', id)).catch(() => {});
  }
};
