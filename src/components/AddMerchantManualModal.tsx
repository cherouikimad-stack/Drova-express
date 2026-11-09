/**
 * DROVA Express — Add Merchant Manual Modal (فضاء إضافة تاجر يدوياً للكومرسيال)
 * Allows sales reps to directly insert real merchants into CRM with full validation & tracking.
 */
import React, { useState } from 'react';
import {
  X,
  Plus,
  Store,
  Phone,
  MapPin,
  Tag,
  Activity,
  CheckCircle2,
  AlertCircle,
  Truck,
  Globe,
  FileText,
  UserCheck
} from 'lucide-react';
import { storage } from '../services/storage';
import { normalizeAlgerianPhone } from '../services/phone';
import { ALGERIA_WILAYAS } from '../data/wilayas';
import { ProspectStatus, LeadScore, Prospect, ParcelEstimate } from '../types';

interface AddMerchantManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProspect: Prospect) => void;
}

const CATEGORIES = [
  'ملابس وأزياء (Vêtements & Mode)',
  'مستحضرات تجميل وعناية (Cosmétiques & Beauté)',
  'عطور (Parfums)',
  'أحذية وحقائب (Chaussures & Maroquinerie)',
  'هواتف وإلكترونيات (Téléphones & High-Tech)',
  'أجهزة كهرومنزلية (Électroménager)',
  'مستلزمات منزل وديكور (Maison & Décoration)',
  'ساعات ومجوهرات واكسسوارات (Accessoires & Bijoux)',
  'ألعاب وأطفال (Jouets & Bébés)',
  'رياضة وتخييم (Sport & Fitness)',
  'قطع غيار واكسسوارات سيارات (Auto & Moto)',
  'أغذية ومأكولات ومنتجات طبيعية (Alimentation & Bio)',
  'مواد غذائية وحلويات (Pâtisserie & Confiserie)',
  'أخرى (Autre)',
];

const COURIERS = [
  'غير معروف (Inconnu)',
  'Yalidine Express',
  'ZR Express',
  'Maystro Delivery',
  'Procolis',
  'Kazitour',
  'Nord & Sud',
  'Ecolove Delivery',
  'توصيل خاص (Livreur interne)',
  'شركة أخرى',
];

const CONTACT_STATUSES: { value: ProspectStatus; label: string }[] = [
  { value: 'جديد', label: 'جديد (Nouveau - Non contacté)' },
  { value: 'جاهز للاتصال', label: 'جاهز للاتصال (Prêt pour appel)' },
  { value: 'مهتم', label: 'تم الاتصال - مهتم بالتعامل (Intéressé)' },
  { value: 'طلب معلومات', label: 'طلب معلومات وأسعار (Demande d\'infos)' },
  { value: 'لم يرد', label: 'لم يرد / الرقم غير متاح (Injoignable)' },
  { value: 'أكد التعامل مع DROVA', label: 'أكد التعامل مع DROVA (Confirmé)' },
  { value: 'غير مهتم', label: 'غير مهتم حالياً (Pas intéressé)' },
];

export const AddMerchantManualModal: React.FC<AddMerchantManualModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const session = storage.getUserSession();

  const [name, setName] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [wilaya, setWilaya] = useState('الجزائر');
  const [commune, setCommune] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [status, setStatus] = useState<ProspectStatus>('جديد');
  const [product, setProduct] = useState('');
  const [address, setAddress] = useState('');
  const [courier, setCourier] = useState(COURIERS[0]);
  const [parcelEstimate, setParcelEstimate] = useState<ParcelEstimate>('10–20');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setRawPhone('');
    setWilaya('الجزائر');
    setCommune('');
    setCategory(CATEGORIES[0]);
    setStatus('جديد');
    setProduct('');
    setAddress('');
    setCourier(COURIERS[0]);
    setParcelEstimate('10–20');
    setFacebookUrl('');
    setInstagramUrl('');
    setWebsiteUrl('');
    setNotes('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    setSuccessMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  // Selected wilaya communes
  const selectedWilayaObj = ALGERIA_WILAYAS.find(w => w.nameAr === wilaya || w.nameFr === wilaya);
  const availableCommunes = selectedWilayaObj?.communes || [];

  // Phone validation feedback
  const phoneValidation = rawPhone.trim() ? normalizeAlgerianPhone(rawPhone) : null;

  const processSubmit = async (shouldClose: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('يرجى إدخال اسم المتجر أو النشاط التجاري.');
      return;
    }

    let finalPhone = '';
    let isPhoneVerified = false;

    if (rawPhone.trim()) {
      const norm = normalizeAlgerianPhone(rawPhone);
      if (!norm.isValid) {
        setErrorMsg('رقم الهاتف الجزائري غير صالح. يرجى إدخال رقم هاتف صحيح (مثال: 0550123456 أو +213661123456).');
        return;
      }
      finalPhone = norm.normalized;
      isPhoneVerified = true;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const currentUserName = session?.name || session?.username || 'Commercial';
      const currentUserId = session?.user_id || session?.username || 'usr_commercial';

      const newId = `pros_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Calculate initial LeadScore
      let score: LeadScore = 'B';
      if (isPhoneVerified && (status === 'مهتم' || status === 'أكد التعامل مع DROVA')) {
        score = 'A+';
      } else if (isPhoneVerified) {
        score = 'A';
      }

      const newProspect: Prospect = {
        id: newId,
        name: trimmedName,
        business_name: trimmedName,
        page_name: trimmedName,
        merchant_type: 'متجر بيع وتوزيع',
        product: product.trim() || category,
        category: category,
        wilaya: wilaya,
        commune: commune.trim() || (availableCommunes[0] || 'الوسط'),
        address: address.trim() || `${commune.trim() || ''} ${wilaya}`.trim(),
        phone: finalPhone || rawPhone.trim(),
        phone_source: 'إدخال يدوي من الكومرسيال',
        phone_verified: isPhoneVerified,
        whatsapp: 'غير معروف',
        email: '',
        page_url: facebookUrl.trim() || websiteUrl.trim() || instagramUrl.trim() || '',
        source: 'manual_commercial_entry',
        source_url: websiteUrl.trim() || facebookUrl.trim() || '',
        source_urls: [websiteUrl.trim(), facebookUrl.trim(), instagramUrl.trim()].filter(Boolean),
        current_courier: courier,
        current_delivery_company: courier,
        loyalty_level: 'Medium',
        parcel_estimate: parcelEstimate,
        status: status,
        contact_date: status !== 'جديد' ? now.split('T')[0] : '',
        next_followup: '',
        responsible: currentUserName,
        assigned_commercial: currentUserName,
        added_by: currentUserName,
        creator_id: currentUserId,
        notes: notes.trim()
          ? `[أضيف يدوياً بواسطة ${currentUserName}]: ${notes.trim()}`
          : `تمت الإضافة يدوياً بواسطة ممثل المبيعات ${currentUserName}`,
        alert: !isPhoneVerified ? 'يتطلب إثراء رقم الهاتف' : '',
        score: score,
        score_reasons: [
          'تمت إضافة التاجر يدوياً بواسطة فريق المبيعات',
          isPhoneVerified ? 'رقم هاتف جزائري موثق ومطابق' : 'ينقصه رقم الهاتف الموثق',
        ],
        verification_status: isPhoneVerified ? 'CONTACTABLE' : 'VERIFICATION_REQUIRED',
        verification_notes: `إدخال يدوي مباشر بواسطة ${currentUserName}`,
        phone_verification_status: isPhoneVerified ? 'VERIFIED' : 'UNVERIFIED',
        business_location_verification: 'VERIFIED',
        shipping_potential: score === 'A+' || score === 'A' ? 'HIGH' : 'MEDIUM',
        data_origin: 'real_manual',
        duplicate_confidence: 0,
        created_at: now,
        updated_at: now,
        facebook_url: facebookUrl.trim() || '',
        instagram_url: instagramUrl.trim() || '',
        website_url: websiteUrl.trim() || '',
      };

      // Save directly to storage & Firestore
      await storage.addManualProspect(newProspect);

      // Reset form fields completely after each registration
      resetForm();

      onSuccess(newProspect);

      if (shouldClose) {
        onClose();
      } else {
        setSuccessMsg(`تم حفظ وتوثيق التاجر "${trimmedName}" بنجاح في Firestore! تم تفريغ الحقول ويمكنك الآن تسجيل تاجر آخر.`);
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء حفظ التاجر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSubmit(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141414] border border-[#2E2E2E] max-w-2xl w-full p-5 sm:p-6 space-y-4 text-xs shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-950 border border-[#FF0000]/60 text-[#FF0000] flex items-center justify-center font-bold">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                إضافة تاجر يدوياً (Add Merchant Manually)
              </h3>
              <p className="text-[11px] text-[#8E8E93]">
                تسجيل نشاط تجاري حقيقي جديد في حقيبة المبيعات وتوثيقه باسمك مباشرة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#8E8E93] hover:text-white p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main required fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Store Name */}
            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                اسم المتجر / النشاط التجاري <span className="text-[#FF0000]">*</span>
              </label>
              <div className="relative">
                <Store size={14} className="absolute right-3 top-2.5 text-[#71717A]" />
                <input
                  type="text"
                  required
                  placeholder="مثال: Boutique Elegance Alger"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-[#333333] pr-9 pl-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                رقم الهاتف (الجزائر)
              </label>
              <div className="relative">
                <Phone size={14} className="absolute right-3 top-2.5 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="0550123456 أو 0661..."
                  value={rawPhone}
                  onChange={e => setRawPhone(e.target.value)}
                  className={`w-full bg-[#1C1C1E] border pr-9 pl-3 py-2 text-white font-mono text-xs outline-none ${
                    phoneValidation
                      ? phoneValidation.isValid
                        ? 'border-emerald-600 focus:border-emerald-500'
                        : 'border-rose-600 focus:border-rose-500'
                      : 'border-[#333333] focus:border-[#FF0000]'
                  }`}
                  dir="ltr"
                />
              </div>
              {phoneValidation && (
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  {phoneValidation.isValid ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 size={11} /> {phoneValidation.normalized} ({phoneValidation.carrier})
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertCircle size={11} /> رقم جزائري غير صالح
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Wilaya & Commune */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                الولاية <span className="text-[#FF0000]">*</span>
              </label>
              <select
                value={wilaya}
                onChange={e => {
                  setWilaya(e.target.value);
                  const w = ALGERIA_WILAYAS.find(x => x.nameAr === e.target.value);
                  if (w && w.communes.length > 0) setCommune(w.communes[0]);
                }}
                className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
              >
                {ALGERIA_WILAYAS.map(w => (
                  <option key={w.code} value={w.nameAr}>
                    {w.code} - {w.nameAr} ({w.nameFr})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                البلدية
              </label>
              <input
                type="text"
                list="communes-list"
                placeholder="البلدية (مثال: الأغواط، آفلو، بئر خادم...)"
                value={commune}
                onChange={e => setCommune(e.target.value)}
                className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
              />
              <datalist id="communes-list">
                {availableCommunes.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Category & Contact Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                الفئة / قطاع النشاط <span className="text-[#FF0000]">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                حالة الاتصال الحالية <span className="text-[#FF0000]">*</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ProspectStatus)}
                className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
              >
                {CONTACT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shipping & Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                شركة التوصيل الحالية
              </label>
              <select
                value={courier}
                onChange={e => setCourier(e.target.value)}
                className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
              >
                {COURIERS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                تقدير حجم الطرود اليومية
              </label>
              <select
                value={parcelEstimate}
                onChange={e => setParcelEstimate(e.target.value as any)}
                className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
              >
                <option value="1–10">1 – 10 طرد / يوم (بداية النشاط)</option>
                <option value="10–20">10 – 20 طرد / يوم (نشاط متوسط)</option>
                <option value="20–50">20 – 50 طرد / يوم (نشاط مرتفع)</option>
                <option value="50+">50+ طرد / يوم (VIP حجم كبير)</option>
              </select>
            </div>
          </div>

          {/* Product & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                السلعة أو التخصص
              </label>
              <input
                type="text"
                placeholder="مثال: ألبسة نسائية جاهزة للشحن"
                value={product}
                onChange={e => setProduct(e.target.value)}
                className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
              />
            </div>

            <div>
              <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
                العنوان الجغرافي / المقر
              </label>
              <input
                type="text"
                placeholder="مثال: شارع الاستقلال، وسط المدينة"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[#8E8E93] text-[10px] block mb-1">
                رابط فيسبوك
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                value={facebookUrl}
                onChange={e => setFacebookUrl(e.target.value)}
                className="w-full bg-[#18181A] border border-[#2B2B2D] px-2.5 py-1.5 text-white text-[11px] outline-none font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-[#8E8E93] text-[10px] block mb-1">
                رابط إنستغرام
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={instagramUrl}
                onChange={e => setInstagramUrl(e.target.value)}
                className="w-full bg-[#18181A] border border-[#2B2B2D] px-2.5 py-1.5 text-white text-[11px] outline-none font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-[#8E8E93] text-[10px] block mb-1">
                موقع الويب
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                className="w-full bg-[#18181A] border border-[#2B2B2D] px-2.5 py-1.5 text-white text-[11px] outline-none font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[#A1A1AA] text-[11px] block mb-1 font-medium">
              ملاحظات التواصل الميداني
            </label>
            <textarea
              rows={2}
              placeholder="اكتب ملاحظاتك الأولية حول التاجر، نقاط الاتفاق أو تفاصيل العرض..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[#1C1C1E] border border-[#333333] px-3 py-2 text-white text-xs focus:border-[#FF0000] outline-none"
            />
          </div>

          {/* Commercial Attribution Badge */}
          <div className="bg-[#101010] p-2.5 border border-[#242424] flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <div className="flex items-center gap-2">
              <UserCheck size={14} className="text-emerald-400" />
              <span>
                سيتم توثيق التاجر باسم الكومرسيال: <strong className="text-white">{session?.name}</strong>
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">
              ID: {session?.user_id || session?.username || 'usr_commercial'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#262626]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-medium cursor-pointer transition-colors"
            >
              إلغاء وإغلاق
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => processSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-md"
                title="حفظ التاجر الحالي وتفريغ النموذج فوراً لتسجيل تاجر جديد دون إغلاق النافذة"
              >
                <Plus size={14} />
                <span>حفظ وتفريغ لإضافة تاجر آخر (+)</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-5 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 size={14} />
                <span>{isSubmitting ? 'جاري الحفظ في Firestore...' : 'حفظ وإغلاق'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
