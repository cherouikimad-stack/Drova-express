# DROVA EXPRESS — Merchant Intelligence & Commercial CRM
### منصة استخبارات التجار الوطنية وإدارة الشاحنين لشركة DROVA Express الجزائر

منصة مؤسساتية متكاملة وسحابية مصممة خصيصاً لشركة **DROVA Express الجزائر**، تتيح استكشاف آلاف التجار وأصحاب المتاجر الإلكترونية عبر 69 ولاية جزائرية، توثيق وتطبيع أرقام الهواتف، توزيع المهام على المندوبين التجاريين، وإدارة دورة حياة الشاحنين (Expéditeurs CRM) في بيئة مركزية مشتركة بين جميع حواسيب الشركة في وقت واحد مع منع التكرار.

---

## 🏗 البنية التقنية السحابية (Full-Stack Cloud Architecture)
- **الواجهة الأمامية (Frontend):** React 19 + TypeScript + Tailwind CSS + Lucide Icons.
- **إدارة الحزم والبناء:** Vite فائق السرعة.
- **قاعدة البيانات المركزية:** Google Cloud Firestore (تزامن لحظي Real-time عبر WebSockets لجميع الأجهزة) مع مجموعة مركزية `merchants`.
- **المصادقة وإدارة الهوية:** Firebase Authentication + تشفير PBKDF2 وSalted Hashing.
- **الأمان والتحكم:** Attribute-Based Access Control (ABAC) مدعوم بـ `firestore.rules`.
- **منع التكرار (Anti-Duplicate):** قفل رقم الهاتف والاسم التجاري عبر فهارس `merchant_phones`.
- **الاستضافة السحابية:** Firebase Hosting مع دعم شهادات SSL وتوجيه النطاق المخصص `crm.drova.dz`.

---

## 🚀 التشغيل والتطوير المحلي (Local Development)

### 1. تثبيت الحزم
```bash
npm install
```

### 2. تشغيل خادم التطوير
```bash
npm run dev
```
التطبيق سيعمل على المنفذ `http://localhost:3000`.

---

## 📦 بناء الإنتاج (Production Build)
```bash
# فحص الكود والتأكد من خلوه من الأخطاء
npm run lint

# بناء الحزمة النهائية
npm run build
```
تُحفظ ملفات الإنتاج الجاهزة في مجلد `dist/`.

---

## 🌐 النشر على Firebase (Firebase Deployment)

### نشر كامل المنصة
```bash
firebase deploy
```

### نشر أجزاء محددة
```bash
# نشر قواعد بيانات وأمان Firestore
firebase deploy --only firestore:rules

# نشر فهارس البحث المركبة
firebase deploy --only firestore:indexes

# نشر الواجهة الأمامية Hosting
firebase deploy --only hosting
```

---

## 🔑 تسجيل الدخول الأول وتعيين الحسابات (Admin Setup)

### حساب المشرف الرئيسي المعتمد (Super Admin)
- **اسم المستخدم:** `cherouik`
- **كلمة المرور:** `admin123@`

> **تنبيه أمان:** بمجرد الدخول إلى النظام، يرجى التوجه إلى **الإعدادات ← المستخدمون** لتغيير كلمة المرور وإنشاء حسابات الفريق التجاري.

---

## 🌍 ربط النطاق المخصص (Connecting crm.drova.dz)
1. في **Firebase Console** ← انتقل إلى **Hosting**.
2. انقر على **"Add custom domain"**.
3. اكتب النطاق: `crm.drova.dz`.
4. انسخ سجلات الـ DNS (سجلات A و TXT) وضعها في لوحة تحكم مزود النطاق الخاص بشركة DROVA.
5. ستقوم Google بإصدار شهادة SSL مشفرة وتفعيل رابط HTTPS خلال بضع ساعات تلقائياً.

---

## 💾 النسخ الاحتياطي واستعادة الكوارث (Backup & Recovery)
- **التحميل اليدوي:** من واجهة **الإعدادات ← النسخ الاحتياطي**، انقر على **"تنزيل لقطة قاعدة البيانات (Snapshot JSON)"** لحفظ نسخة محلية مشفرة بجميع التجار والمكالمات والشاحنين.
- **الاستعادة الفورية:** في حال حدوث أي طارئ، يمكنك رفع ملف النسخة الاحتياطية واستعادة قاعدة البيانات بالكامل بضغطة زر واحدة.

---

## 🛠 استكشاف الأخطاء الشائعة (Troubleshooting)

| المشكلة | السبب المحتمل | الحل |
| :--- | :--- | :--- |
| **User not authorized** | الحساب معطل أو الدور غير مطابق | تأكد من تفعيل الحساب من قِبل الـ Super Admin في لوحة المستخدمين. |
| **Firestore offline warning** | انقطاع اتصال الإنترنت أو عدم توثيق القواعد | النظام يعمل تلقائياً بذاكرة الكاش المحلية ويعيد المزامنة فور عودة الاتصال. |
| **Missing index error** | استعلام مركب جديد يحتاج فهرس | افتح الرابط المباشر الموجود في Console لإنشاء الفهرس بضغطة زر أو نفذ `firebase deploy --only firestore:indexes`. |

---

**Developed by Cherouik Imad** · DROVA Express Algérie © 2026 · All Rights Reserved
