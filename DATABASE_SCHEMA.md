# بنية قاعدة بيانات Cloud Firestore — DROVA Express CRM
## Cloud Firestore Architecture & Collections Schema

تم تصميم قاعدة بيانات Firestore كقاعدة بيانات وثائقية موزعة تدعم التزامن اللحظي عبر بروتوكول WebSockets وتتحمل آلاف التجار والشاحنين دون بطء.

---

## 1. جدول المستخدمين (`/users/{userId}`)
يحفظ الهويات المهنية وصلاحيات الوصول للموظفين.

| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `string` | معرف UID الخاص بـ Firebase Authentication |
| `username` | `string` | اسم المستخدم المسجل به (مثل `cherouik`, `mouradkarmoula`) |
| `fullName` | `string` | الاسم الكامل للموظف |
| `email` | `string` | البريد الداخلي المشفر (`username@drova-crm.internal`) |
| `role` | `string` | `SUPER_ADMIN` \| `ADMIN_MARKETING` \| `COMMERCIAL_MANAGER` \| `COMMERCIAL` \| `VIEWER` |
| `status` | `string` | `active` \| `disabled` |
| `phone` | `string` | رقم الهاتف المهني الجزائري (+213) |
| `createdAt` | `string` | تاريخ إنشاء الحساب (ISO 8601) |
| `lastLogin` | `string` | توقيت آخر تسجيل دخول ناجح |

---

## 2. جدول قاعدة التجار المركزية (`/prospects/{prospectId}`)
يحفظ السجل الوطني للتجار المؤهلين المكتشفين في الولايات الـ 58.

| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `string` | المعرف الموحد للتاجر (مثل `PR-ALG-0001`) |
| `name` | `string` | الاسم التجاري للمحل أو المتجر الإلكتروني |
| `phone` | `string` | رقم الهاتف الجزائري بعد التطبيع الصارم (+213...) |
| `wilaya` | `string` | اسم الولاية الجزائرية |
| `wilaya_code` | `string` | الترقيم الرسمي للولاية (01 إلى 58) |
| `commune` | `string` | اسم البلدية |
| `address` | `string` | العنوان والمقر الفعلي |
| `product` | `string` | فئة السلع (ألبسة، إلكترونيات، كوسميتيك، قطع غيار...) |
| `score` | `string` | درجة التأهيل الذاتي: `A+` (VIP)، `A` (قوي)، `B` (متوسط)، `C` (عادي) |
| `status` | `string` | الحالة: `جديد`, `جاهز للاتصال`, `مهتم`, `أكد التعامل مع DROVA`, `لم يرد`, `رفض` |
| `assigned_commercial` | `string` | اسم المندوب التجاري المسند إليه التاجر لمنع التضارب |
| `assigned_commercial_id`| `string` | معرف UID للمندوب التجاري المسند |
| `current_courier` | `string` | شركة التوصيل الحالية للتاجر (ياليدين، كازي تور، زد آر...) |
| `parcel_estimate` | `string` | حجم الطرود المتوقع يومياً (`50+`, `20-50`, `10-20`, `1-10`) |
| `call_priority` | `string` | أولوية الاتصال: `URGENT` \| `NORMAL` \| `LOW` |
| `verification_status` | `string` | حالة التوثيق: `VERIFIED` \| `PROBABLE` \| `UNVERIFIED` |
| `evidence_count` | `number` | عدد الأدلة والمصادر المتطابقة |
| `created_at` | `string` | تاريخ الاستكشاف |
| `updatedAt` | `string` | تاريخ آخر تحديث للحالة |

---

## 3. جدول سجل المكالمات التجارية (`/calls/{callId}`)
يحفظ كافة الاتصالات الهاتفية المنجزة مع التجار.

| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `string` | معرف المكالمة (مثل `call_173000...`) |
| `prospect_id` | `string` | معرف التاجر المستهدف |
| `commercial_id` | `string` | معرف المندوب المتصل |
| `commercial_name` | `string` | اسم المندوب المتصل |
| `call_result` | `string` | النتيجة: `مهتم`, `أكد التعامل مع DROVA`, `طلب معلومات`, `طلب الاتصال لاحقًا`, `لم يرد`, `رفض` |
| `is_confirmed_contact` | `boolean` | هل تم الحديث والتواصل الفعلي مع التاجر (نعم/لا) |
| `non_conversion_reason`| `string` | سبب عدم التحويل (أسعار غير تنافسية، راضي عن شركته الحالية، بيع محلي...) |
| `competitor_name` | `string` | شركة التوصيل المنافسة المصرح بها |
| `notes` | `string` | الملاحظات الميدانية للمكالمة |
| `date` | `string` | تاريخ المكالمة |
| `time` | `string` | توقيت المكالمة |
| `created_at` | `string` | التوقيت السحابي للتوثيق |

---

## 4. جدول مواعيد المتابعات (`/followUps/{followUpId}`)
إدارة مواعيد إعادة الاتصال المجدولة.

| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `string` | معرف المتابعة |
| `prospect_id` | `string` | معرف التاجر |
| `prospect_name` | `string` | اسم التاجر |
| `commercial_name` | `string` | المندوب المكلف |
| `commercial_id` | `string` | معرف المندوب المكلف |
| `scheduled_date` | `string` | التاريخ المجدول (YYYY-MM-DD) |
| `scheduled_time` | `string` | التوقيت المفضل للاتصال |
| `reason` | `string` | سبب وهدف المتابعة |
| `status` | `string` | `pending` (معلقة) \| `completed` (منجزة) \| `cancelled` (ملغاة) |

---

## 5. جدول الشاحنين المعتمدين (`/expediteurs/{expediteurId}`)
إدارة حسابات الشاحنين الفعليين لشركة DROVA.

| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `string` | المعرف الموحد للشاحن (مثل `EXP-ALG-001`) |
| `prospect_id` | `string` | معرف التاجر الأصلي المرتبط به |
| `business_name` | `string` | الاسم التجاري الرسمي للشاحن |
| `phone` | `string` | الهاتف المعتمد للشحن |
| `wilaya` | `string` | ولاية الانطلاق والمقر |
| `commercial_status` | `string` | `مرشح قوي`, `في طور التفعيل`, `مؤكد`, `نشط`, `يحتاج إعادة تفعيل` |
| `lifecycle_status` | `string` | `نشط`, `غير نشط`, `متوقف`, `إعادة التفعيل` |
| `assigned_commercial` | `string` | المشرف التجاري المسؤول |
| `shipments_count` | `number` | إجمالي الطرود المسلمة لـ DROVA |
| `estimated_parcels` | `string` | طاقة الشحن اليومية |

---

## 6. جدول سجل التدقيق والرقابة المنيع (`/auditLogs/{logId}`)
سجل رقابي مشفر لا يقبل الحذف أو التعديل إطلاقاً من أي مستخدم.

| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | `string` | معرف السجل الفريد |
| `user` | `string` | اسم المستخدم الفاعل |
| `user_id` | `string` | معرف UID للفاعل |
| `action` | `string` | نوع العملية (`USER_CREATED`, `CALL_LOGGED`, `PROSPECT_UPDATED`...) |
| `details` | `string` | التفاصيل الدقيقة للعملية |
| `timestamp` | `string` | التوقيت الزمني الدقيق للحدث |
