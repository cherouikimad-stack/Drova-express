/**
 * Central Cloud Firestore Service for DROVA Express CRM
 * Real-time synchronization across all commercial and management devices
 * Primary Canonical Store: Cloud Firestore on Project 'drova-express' (default)
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './config';
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

function formatFirestoreErrorMessage(error: any, actionName: string): string {
  const msg = error?.message || String(error);
  if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
    return `خطأ في الصلاحيات أثناء ${actionName}: يرجى التأكد من تسجيل الدخول بحساب موظف مصرح له في DROVA Express.`;
  }
  if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('network')) {
    return `تعذر الاتصال بخوادم Firestore أثناء ${actionName}. يرجى التحقق من اتصال الإنترنت.`;
  }
  if (msg.includes('Quota exceeded')) {
    return `تم تجاوز حد الحصص المجاني المتاح في Firebase Spark لهذا اليوم. سيتجدد غداً.`;
  }
  return `فشل ${actionName} في Firestore: ${msg}`;
}

export const firestoreService = {
  // ================= MERCHANTS & PROSPECTS (CANONICAL SOURCE: 'prospects') =================
  subscribeProspects(onUpdate: (prospects: Prospect[]) => void, onError?: (err: any) => void): Unsubscribe {
    const colRef = collection(db, 'prospects');
    return onSnapshot(
      colRef,
      snapshot => {
        const list: Prospect[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        onUpdate(list);
      },
      error => {
        console.warn('[Firestore] Prospects snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async getProspectsOnce(): Promise<Prospect[]> {
    try {
      const snap = await getDocs(collection(db, 'prospects'));
      const list: Prospect[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
      return list;
    } catch (error: any) {
      console.error('[Firestore getProspectsOnce Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'تحميل التجار من Firestore'));
    }
  },

  async saveProspect(prospect: Prospect, checkDuplicate: boolean = true): Promise<void> {
    const cleanPhone = (prospect.phone || '').trim();
    const phoneNorm = normalizeAlgerianPhone(cleanPhone);
    const phoneKey = phoneNorm.isValid
      ? `phone_${phoneNorm.normalized.replace(/[^0-9]/g, '')}`
      : null;

    // Duplicate Phone Check against Firestore
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

    try {
      // 1. Write to canonical 'prospects' collection
      await setDoc(doc(db, 'prospects', prospect.id), sanitized, { merge: true });

      // 2. Synchronize to 'merchants' collection for full backwards compatibility
      await setDoc(doc(db, 'merchants', prospect.id), sanitized, { merge: true });

      // 3. Register unique phone lock
      if (phoneKey) {
        const phoneLockRef = doc(db, 'merchant_phones', phoneKey);
        await setDoc(phoneLockRef, {
          merchantId: prospect.id,
          name: prospect.name,
          phone: phoneNorm.normalized,
          updatedAt: now,
        }, { merge: true });
      }
    } catch (error: any) {
      console.error('[Firestore saveProspect Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, `حفظ التاجر "${prospect.name}"`));
    }
  },

  async updateProspect(id: string, updates: Partial<Prospect>): Promise<void> {
    const now = new Date().toISOString();
    const sanitized = sanitizeForFirestore({ ...updates, updatedAt: now, updated_at: now });
    try {
      await Promise.all([
        setDoc(doc(db, 'prospects', id), sanitized, { merge: true }),
        setDoc(doc(db, 'merchants', id), sanitized, { merge: true })
      ]);
    } catch (error: any) {
      console.error('[Firestore updateProspect Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, `تحديث التاجر (${id})`));
    }
  },

  async deleteProspect(id: string): Promise<void> {
    try {
      await Promise.all([
        deleteDoc(doc(db, 'prospects', id)),
        deleteDoc(doc(db, 'merchants', id))
      ]);
    } catch (error: any) {
      console.error('[Firestore deleteProspect Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, `حذف التاجر (${id})`));
    }
  },

  async saveProspectsBatch(prospects: Prospect[]): Promise<void> {
    if (!prospects || prospects.length === 0) return;
    const chunkSize = 200;
    try {
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
          batch.set(doc(db, 'prospects', p.id), sanitized, { merge: true });
          batch.set(doc(db, 'merchants', p.id), sanitized, { merge: true });
        }
        await batch.commit();
      }
    } catch (error: any) {
      console.error('[Firestore saveProspectsBatch Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'حفظ دفعة التجار'));
    }
  },

  async updateProspectsBatch(updates: { id: string; data: Partial<Prospect> }[]): Promise<void> {
    if (!updates || updates.length === 0) return;
    const chunkSize = 200;
    try {
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        const now = new Date().toISOString();
        for (const item of chunk) {
          const sanitized = sanitizeForFirestore({ ...item.data, updatedAt: now });
          batch.set(doc(db, 'prospects', item.id), sanitized, { merge: true });
          batch.set(doc(db, 'merchants', item.id), sanitized, { merge: true });
        }
        await batch.commit();
      }
    } catch (error: any) {
      console.error('[Firestore updateProspectsBatch Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'تحديث دفعة التجار'));
    }
  },

  async deleteProspectsBatch(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    const chunkSize = 200;
    try {
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const id of chunk) {
          batch.delete(doc(db, 'prospects', id));
          batch.delete(doc(db, 'merchants', id));
        }
        await batch.commit();
      }
    } catch (error: any) {
      console.error('[Firestore deleteProspectsBatch Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'حذف دفعة التجار'));
    }
  },

  // ================= CALLS & ACTIVITIES =================
  subscribeCalls(onUpdate: (calls: CRMCall[]) => void, onError?: (err: any) => void): Unsubscribe {
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
        console.warn('[Firestore] Calls snapshot warning:', error);
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

    try {
      await setDoc(docRef, sanitized, { merge: true });

      // Update merchant's last call status in prospects & merchants
      if (call.prospect_id) {
        const callUpdate = {
          last_call_at: call.date,
          last_call_result: call.call_result,
          updated_at: new Date().toISOString(),
        };
        await Promise.all([
          setDoc(doc(db, 'prospects', call.prospect_id), callUpdate, { merge: true }),
          setDoc(doc(db, 'merchants', call.prospect_id), callUpdate, { merge: true })
        ]);
      }

      // Record activity in merchantActivities collection
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
    } catch (error: any) {
      console.error('[Firestore recordCall Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'تسجيل المكالمة التجارية'));
    }
  },

  // ================= FOLLOW-UPS =================
  subscribeFollowUps(onUpdate: (followUps: CRMFollowUp[]) => void, onError?: (err: any) => void): Unsubscribe {
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
        console.warn('[Firestore] FollowUps snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveFollowUp(followUp: CRMFollowUp): Promise<void> {
    const sanitized = sanitizeForFirestore(followUp);
    try {
      await Promise.all([
        setDoc(doc(db, 'followups', followUp.id), sanitized, { merge: true }),
        setDoc(doc(db, 'followUps', followUp.id), sanitized, { merge: true })
      ]);
    } catch (error: any) {
      console.error('[Firestore saveFollowUp Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'حفظ المتابعة في Firestore'));
    }
  },

  async updateFollowUp(id: string, updates: Partial<CRMFollowUp>): Promise<void> {
    const sanitized = sanitizeForFirestore(updates);
    try {
      await Promise.all([
        setDoc(doc(db, 'followups', id), sanitized, { merge: true }),
        setDoc(doc(db, 'followUps', id), sanitized, { merge: true })
      ]);
    } catch (error: any) {
      console.error('[Firestore updateFollowUp Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'تحديث المتابعة في Firestore'));
    }
  },

  // ================= EXPEDITEURS =================
  subscribeExpediteurs(onUpdate: (expediteurs: ExpediteurProfile[]) => void, onError?: (err: any) => void): Unsubscribe {
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
        console.warn('[Firestore] Expediteurs snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveExpediteur(expediteur: ExpediteurProfile): Promise<void> {
    const docRef = doc(db, 'expediteurs', expediteur.id);
    const sanitized = sanitizeForFirestore(expediteur);
    try {
      await setDoc(docRef, sanitized, { merge: true });
    } catch (error: any) {
      console.error('[Firestore saveExpediteur Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'حفظ الشاحن (Expéditeur) في Firestore'));
    }
  },

  async updateExpediteur(id: string, updates: Partial<ExpediteurProfile>): Promise<void> {
    const docRef = doc(db, 'expediteurs', id);
    const sanitized = sanitizeForFirestore(updates);
    try {
      await setDoc(docRef, sanitized, { merge: true });
    } catch (error: any) {
      console.error('[Firestore updateExpediteur Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'تحديث الشاحن (Expéditeur) في Firestore'));
    }
  },

  // ================= COMMERCIAL FEEDBACKS =================
  subscribeFeedbacks(onUpdate: (feedbacks: CommercialFeedback[]) => void, onError?: (err: any) => void): Unsubscribe {
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
        console.warn('[Firestore] Feedbacks snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveFeedback(feedback: CommercialFeedback): Promise<void> {
    const docRef = doc(db, 'commercialFeedbacks', feedback.id);
    const sanitized = sanitizeForFirestore(feedback);
    try {
      await setDoc(docRef, sanitized, { merge: true });
    } catch (error: any) {
      console.error('[Firestore saveFeedback Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'إرسال ملاحظة المبيعات'));
    }
  },

  // ================= NOTIFICATIONS =================
  subscribeNotifications(onUpdate: (notifications: NotificationItem[]) => void, onError?: (err: any) => void): Unsubscribe {
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
        console.warn('[Firestore] Notifications snapshot warning:', error);
        if (onError) onError(error);
      }
    );
  },

  async saveNotification(notification: NotificationItem): Promise<void> {
    const docRef = doc(db, 'notifications', notification.id);
    const sanitized = sanitizeForFirestore(notification);
    try {
      await setDoc(docRef, sanitized, { merge: true });
    } catch (error: any) {
      console.error('[Firestore saveNotification Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'حفظ الإشعار'));
    }
  },

  async updateNotification(id: string, updates: Partial<NotificationItem>): Promise<void> {
    const docRef = doc(db, 'notifications', id);
    const sanitized = sanitizeForFirestore(updates);
    try {
      await setDoc(docRef, sanitized, { merge: true });
    } catch (error: any) {
      console.error('[Firestore updateNotification Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, 'تحديث الإشعار'));
    }
  },

  // ================= AUDIT LOGS =================
  async recordAuditLog(entry: Omit<AuditLog, 'id'>): Promise<void> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, 'auditLogs', id);
    try {
      await setDoc(docRef, { ...entry, id });
    } catch (error) {
      console.warn('[Firestore recordAuditLog notice]', error);
    }
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
  subscribeUsers(onUpdate: (users: UserAccount[]) => void, onError?: (err: any) => void): Unsubscribe {
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
        console.warn('[Firestore] Users snapshot warning:', error);
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
      email: user.email || `${cleanUser}@drova-express.dz`,
      password_hash: user.password_hash || '',
      salt: user.salt || '',
      createdAt: user.created_at || new Date().toISOString(),
      lastLogin: user.last_login || null
    });

    try {
      const docRef = doc(db, 'users', user.id);
      await setDoc(docRef, docData, { merge: true });

      if (cleanUser && user.id !== `usr_${cleanUser}`) {
        await setDoc(doc(db, 'users', `usr_${cleanUser}`), docData, { merge: true });
      }
    } catch (error: any) {
      console.error('[Firestore saveUser Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, `حفظ حساب المستخدم "${user.username}"`));
    }
  },

  async updateUser(id: string, updates: any): Promise<void> {
    const docRef = doc(db, 'users', id);
    try {
      await setDoc(docRef, sanitizeForFirestore(updates), { merge: true });
    } catch (error: any) {
      console.error('[Firestore updateUser Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, `تحديث المستخدم (${id})`));
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error: any) {
      console.error('[Firestore deleteUser Failed]', error);
      throw new Error(formatFirestoreErrorMessage(error, `حذف المستخدم (${id})`));
    }
  }
};
