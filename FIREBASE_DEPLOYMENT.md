# دليل النشر الشامل على Firebase — DROVA Express CRM
## DROVA EXPRESS — Merchant Intelligence & Commercial CRM

هذا الدليل مخصص لنشر المنصة بالكامل من الصفر وحتى الإنتاج في بيئة Firebase سحابية حقيقية متعددة المستخدمين (10+ أجهزة في وقت واحد مع قاعدة بيانات مركزية).

---

## الخطوة 1: حساب Google والدخول إلى Firebase Console
1. افتح المتصفح وتوجه إلى: [https://console.firebase.google.com](https://console.firebase.google.com).
2. قم بتسجيل الدخول باستخدام البريد الرسمي لشركة DROVA أو حساب المشرف التقني.

---

## الخطوة 2: إنشاء مشروع Firebase جديد
1. انقر على **"Add project"** (إضافة مشروع).
2. اسم المشروع المقترح:
   ```text
   drova-express-crm
   ```
   *(إذا كان الاسم محجوزاً عالمياً، استخدم: `drova-crm-dz` أو `drova-express-platform`)*.
3. قم بتعطيل أو تفعيل Google Analytics حسب الرغبة، ثم انقر **Create Project**.

---

## الخطوة 3: ترقية الخطة إلى Blaze (Pay as you go)
- **هل تحتاج الخطة المدفوعة؟** نعم، لأن المنصة تحتوي على:
  - Cloud Functions (تتطلب Node.js 20 وCloud Run backend).
  - إمكانية الاتصال بخدمات خارجية مثل Gemini API.
- **التكلفة الفعلية:** توفر Google حصة مجانية ضخمة شهرياً (Free Tier):
  - أول 2,000,000 استدعاء Cloud Function شهرياً مجاناً.
  - أول 50,000 قراءة و 20,000 كتابة في Firestore يومياً مجاناً.
  - 10 جيجابايت استضافة Hosting مجاناً.
  *لفريق من 10 إلى 50 مستخدماً، تكون التكلفة عادةً 0$ أو بضعة سنتات شهرياً فقط.*

---

## الخطوة 4: تفعيل المصادقة (Firebase Authentication)
1. من القائمة الجانبية في Firebase Console، اختر **Build** ← **Authentication**.
2. انقر على **Get Started**.
3. في تبويب **Sign-in method**، اختر **Email/Password**.
4. فعّل الخيار الأول: **Enable** (Email/Password).
5. انقر **Save**.
*(المنصة تقوم آلياً بتحويل اسم المستخدم `username` إلى بريد داخلي مشفر `username@drova-crm.internal`، مما يتيح للموظف تسجيل الدخول باسم المستخدم مباشرة دون الحاجة لبريد إلكتروني خارجي).*

---

## الخطوة 5: إنشاء قاعدة بيانات Cloud Firestore
1. من القائمة الجانبية، اختر **Build** ← **Firestore Database**.
2. انقر على **Create database**.
3. **Database ID:** اختر `(default)` أو قاعدة البيانات المخصصة.
4. **Location (الموقع الجغرافي):**
   - اختر أقرب مركز بيانات للجزائر لضمان سرعة فائقة وزمن استجابة منخفض:
     - `europe-west1` (بلجيكا) أو `europe-west3` (فرانكفورت) أو `europe-west9` (باريس).
5. **Security rules:** اختر **Start in production mode** (سيتم استبدال القواعد تلقائياً بالقواعد الصارمة الموجودة في `firestore.rules`).
6. انقر **Enable**.

---

## الخطوة 6: تسجيل تطبيق الويب (Register Web App)
1. في الصفحة الرئيسية للمشروع (Project Overview)، انقر على أيقونة الويب `</>`.
2. اسم التطبيق: `DROVA CRM Web`.
3. ضع علامة صح على **Also set up Firebase Hosting for this app**.
4. انسخ كائن الإعدادات `firebaseConfig` وضعه في ملف `.env` أو `firebase-applet-config.json`.

---

## الخطوة 7: تثبيت Firebase CLI وتسجيل الدخول
على جهازك المحلي أو خادم التطوير:
```bash
# تثبيت أدوات Firebase عالمياً
npm install -g firebase-tools

# تسجيل الدخول إلى حساب Google
firebase login

# التأكد من ظهور مشروع DROVA
firebase projects:list

# تحديد المشروع الحالي للعمل
firebase use drova-express-crm
```

---

## الخطوة 8: فحص وبناء المشروع (Build)
```bash
# تثبيت التبعيات
npm install

# فحص كود TypeScript وخلوه التام من الأخطاء
npm run lint

# بناء ملفات الإنتاج لـ React / Vite
npm run build
```

---

## الخطوة 9: نشر قواعد الحماية والفهارس (Firestore Rules & Indexes)
```bash
# نشر قواعد الأمان ABAC الصارمة
firebase deploy --only firestore:rules

# نشر فهارس البحث المركبة
firebase deploy --only firestore:indexes
```

---

## الخطوة 10: نشر دوال الخادم (Cloud Functions)
```bash
# التوجه لمجلد الدوال وتثبيت الحزم
cd functions
npm install
npm run build
cd ..

# تعيين مفتاح Gemini الآمن في الخادم (بدون كشفه للمتصفح)
firebase functions:secrets:set GEMINI_API_KEY

# نشر الدوال
firebase deploy --only functions
```

---

## الخطوة 11: نشر واجهة المستخدم (Firebase Hosting)
```bash
# نشر موقع React/Vite إلى CDN العالمي فائق السرعة
firebase deploy --only hosting
```
أو لنشر كل شيء دفعة واحدة:
```bash
firebase deploy
```

---

## الخطوة 12: إنشاء حساب المسؤول الرئيسي الأول (First SUPER_ADMIN)
عند فتح الرابط لأول مرة، يمكنك تسجيل الدخول بالبيانات الأولية للمسؤول المعتمد:
- **اسم المستخدم:** `cherouik`
- **كلمة المرور:** `admin123@`

النظام يقوم تلقائياً بتهيئة الحساب في Firebase Auth وFirestore كـ `SUPER_ADMIN`.
**إجراء أمان إلزامي:** فور الدخول، توجه إلى **الإعدادات ← إدارة المستخدمين** وقم بتغيير كلمة المرور إلى كلمة مرور سرية ومعقدة خاصة بك.

---

## الخطوة 13: إنشاء حسابات المندوبين التجاريين (Commercial Accounts)
يقوم الـ SUPER_ADMIN من لوحة **الإعدادات ← المستخدمون**:
1. النقر على **"إنشاء حساب موظف جديد"**.
2. إدخال:
   - **الاسم الكامل:** مثلاً `مراد كرمولة`
   - **اسم المستخدم:** `mouradkarmoula`
   - **كلمة المرور:** كلمة مرور أولية
   - **الدور:** `Commercial (ممثل مبيعات واتصال ميداني)`
   - **الهاتف:** `+213550998877`
3. النقر على **تأكيد**. الحساب يصبح فعالاً فوراً ويستطيع المندوب الدخول من حاسوبه.

---

## الخطوة 14: ربط النطاق المخصص الخاص بالشركة (crm.drova.dz)
1. في Firebase Console ← **Hosting**.
2. انقر على **Add custom domain**.
3. أدخل: `crm.drova.dz`.
4. اتبع تعليمات إثبات ملكية النطاق (TXT Record) لدى مزود الـ DNS الخاص بشركة DROVA.
5. أضف سجلات `A Records` التي يزودك بها Firebase في لوحة تحكم DNS.
6. ستقوم Google بإصدار شهادة SSL مشفرة (HTTPS) مجاناً وتفعيلها خلال بضع ساعات تلقائياً.
