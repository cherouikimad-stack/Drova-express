/**
 * DROVA Express — Server-Side Cloud Functions
 * Privileged Admin Operations, Secret Management (Gemini API), and Server-Side Logic
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();
const db = admin.firestore();

/**
 * Privileged User Creation with Custom Role Claims
 * Enforces that only an authenticated SUPER_ADMIN can create users
 */
export const adminCreateUser = functions.https.onCall(async (data, context) => {
  // Verify authenticated caller
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول كمسؤول.');
  }

  // Verify caller has SUPER_ADMIN role
  const callerUid = context.auth.uid;
  const callerDoc = await db.collection('users').doc(callerUid).get();
  const callerRole = callerDoc.data()?.role;

  if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'الصلاحية مخصصة فقط للمسؤول التنفيذي SUPER_ADMIN.');
  }

  const { fullName, username, password, role, phone } = data;

  if (!fullName || !username || !password || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'جميع حقول المستخدم إلزامية.');
  }

  const cleanUsername = username.trim().toLowerCase();
  const internalEmail = `${cleanUsername}@drova-crm.internal`;

  // Create Firebase Auth user
  const userRecord = await admin.auth().createUser({
    email: internalEmail,
    password: password,
    displayName: fullName,
    phoneNumber: phone && phone.startsWith('+') ? phone : undefined,
  });

  // Set Custom Claims for instant security rules enforcement
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: role.toUpperCase(),
    username: cleanUsername,
  });

  // Store profile in Firestore
  const userProfile = {
    id: userRecord.uid,
    username: cleanUsername,
    fullName: fullName,
    email: internalEmail,
    role: role.toUpperCase(),
    status: 'active',
    phone: phone || '',
    createdAt: new Date().toISOString(),
    createdBy: callerDoc.data()?.fullName || 'Super Admin',
  };

  await db.collection('users').doc(userRecord.uid).set(userProfile);

  // Record Immutable Audit Log
  await db.collection('auditLogs').add({
    user: callerDoc.data()?.fullName || 'Super Admin',
    user_id: callerUid,
    action: 'USER_CREATED',
    details: `إنشاء حساب موظف جديد: ${fullName} (${cleanUsername}) - دور: ${role}`,
    timestamp: new Date().toISOString(),
  });

  return { success: true, userId: userRecord.uid };
});

/**
 * Toggle User Account Status (Enable / Disable)
 */
export const adminSetUserStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'المصادقة مطلوبة.');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (callerDoc.data()?.role !== 'SUPER_ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'مسموح فقط لـ SUPER_ADMIN.');
  }

  const { targetUserId, status } = data;
  if (!targetUserId || (status !== 'active' && status !== 'disabled')) {
    throw new functions.https.HttpsError('invalid-argument', 'بيانات غير صالحة.');
  }

  await admin.auth().updateUser(targetUserId, {
    disabled: status === 'disabled',
  });

  await db.collection('users').doc(targetUserId).update({ status });

  await db.collection('auditLogs').add({
    user: callerDoc.data()?.fullName || 'Super Admin',
    user_id: callerUid,
    action: status === 'disabled' ? 'USER_DISABLED' : 'USER_ENABLED',
    details: `تغيير حالة حساب المستخدم ${targetUserId} إلى ${status}`,
    timestamp: new Date().toISOString(),
  });

  return { success: true };
});

/**
 * Server-Side Gemini Intelligence & Merchant Analysis
 * Keeps GEMINI_API_KEY completely hidden server-side
 */
export const secureGeminiEnrich = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'المصادقة مطلوبة.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'مفتاح Gemini API غير مهيأ في الخادم.');
  }

  const { merchantName, rawText, url } = data;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `أنت خبير في تأهيل التجارة الإلكترونية لشركة DROVA Express بالجزائر.
قم بتحليل هذا النشاط التجاري واستخرج ما يلي بصيغة JSON:
- category (تصنيف السلعة)
- estimated_daily_parcels (تقدير حجم الطرود يومياً: 50+, 20-50, 10-20, 1-10)
- shipping_potential (HIGH, MEDIUM, LOW)
- wilaya (الولاية الجزائرية المحتملة)

بيانات التاجر:
اسم التاجر: ${merchantName}
الرابط: ${url || ''}
الوصف: ${rawText || ''}

أجب بـ JSON فقط:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '{}';
    return { success: true, analysis: text };
  } catch (err: any) {
    throw new functions.https.HttpsError('internal', err.message || 'فشل استدعاء محرك الذكاء الاصطناعي.');
  }
});
