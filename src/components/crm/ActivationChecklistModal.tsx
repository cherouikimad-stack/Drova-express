/**
 * DROVA Express — Expéditeur Activation Checklist Modal
 * Implements Section 23 & 24
 */
import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  CheckCircle2,
  X,
  ShieldCheck,
  UserCheck,
  Building,
  Package,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Prospect, ActivationChecklist, ExpediteurProfile } from '../../types';
import { storage } from '../../services/storage';

interface ActivationChecklistModalProps {
  prospect: Prospect;
  onClose: () => void;
  onActivated: (expediteur: ExpediteurProfile) => void;
}

export const ActivationChecklistModal: React.FC<ActivationChecklistModalProps> = ({
  prospect,
  onClose,
  onActivated,
}) => {
  const session = storage.getUserSession();
  const existingExpediteur = storage.getExpediteurByProspectId(prospect.id);

  const [checklist, setChecklist] = useState<ActivationChecklist>(() => {
    if (existingExpediteur && existingExpediteur.checklist) {
      return { ...existingExpediteur.checklist };
    }
    return {
      merchant_confirmed_interest: true,
      phone_verified: prospect.phone_verification_status === 'VERIFIED',
      business_info_confirmed: true,
      wilaya_confirmed: prospect.business_location_verification === 'VERIFIED',
      commune_confirmed: !!prospect.commune,
      activity_confirmed: !!prospect.category,
      shipping_needs_understood: false,
      tariff_information_provided: false,
      required_commercial_info_received: false,
      drova_onboarding_completed: false,
      expediteur_activated: false,
    };
  });

  const toggleItem = (key: keyof ActivationChecklist) => {
    if (key === 'approved_by' || key === 'approved_at') return;
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const completedCount = [
    checklist.merchant_confirmed_interest,
    checklist.phone_verified,
    checklist.business_info_confirmed,
    checklist.wilaya_confirmed,
    checklist.commune_confirmed,
    checklist.activity_confirmed,
    checklist.shipping_needs_understood,
    checklist.tariff_information_provided,
    checklist.required_commercial_info_received,
    checklist.drova_onboarding_completed,
    checklist.expediteur_activated,
  ].filter(Boolean).length;

  const isAllChecklistDone = completedCount >= 10;
  const isManagerOrAdmin = session.role === 'admin' || session.role === 'manager';

  const handleFinalActivation = async () => {
    if (!isAllChecklistDone) {
      alert('يرجى استكمال بنود القائمة الأساسية أولاً قبل اعتماد التفعيل.');
      return;
    }

    const updatedChecklist = {
      ...checklist,
      expediteur_activated: true,
      approved_by: `${session.name} (${session.role.toUpperCase()})`,
      approved_at: new Date().toISOString(),
    };

    try {
      const exp = await storage.updateExpediteurChecklist(prospect.id, updatedChecklist, session.name);
      if (exp) {
        onActivated(exp);
        onClose();
      }
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء اعتماد تفعيل الشاحن في Firestore');
    }
  };

  const handleSaveProgress = async () => {
    try {
      await storage.updateExpediteurChecklist(prospect.id, checklist);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء حفظ مرحلة التفعيل في Firestore');
    }
  };

  const checklistItems: { key: keyof ActivationChecklist; label: string; desc: string }[] = [
    { key: 'merchant_confirmed_interest', label: '1. تأكيد رغبة التاجر في التعامل (Merchant Confirmed Interest)', desc: 'أبدى التاجر موافقته الصريحة على العمل مع DROVA' },
    { key: 'phone_verified', label: '2. رقم الهاتف موثق ومتاح (Phone Verified)', desc: 'الهاتف متاح، مطابق للشبكة الجزائرية، وتم الاتصال عليه بنجاح' },
    { key: 'business_info_confirmed', label: '3. تأكيد بيانات المتجر والنشاط (Business Info Confirmed)', desc: 'التأكد من الاسم التجاري، نوعية السلع، وحسابات المتجر' },
    { key: 'wilaya_confirmed', label: '4. تأكيد ولاية المقر الفعلي للاستلام (Wilaya Confirmed)', desc: `تأكيد أن موقع مستودع أو محل التاجر يقع فعلياً في ولاية ${prospect.wilaya}` },
    { key: 'commune_confirmed', label: '5. تأكيد البلدية ومقر المستودع (Commune Confirmed)', desc: `تحديد بلدية ${prospect.commune || 'المقر'} بدقة لجدولة شاحنات التجميع (Pick-up)` },
    { key: 'activity_confirmed', label: '6. تأكيد فئة المنتجات المشحونة (Activity Confirmed)', desc: `فئة ${prospect.product} ملائمة ومطابقة لمعايير شحن الطرود` },
    { key: 'shipping_needs_understood', label: '7. فهم احتياجات الشحن اليومية (Shipping Needs Understood)', desc: `معدل الطرود التقديري: ${prospect.parcel_estimate} طرد/يوم مع وجهات التوصيل المطلوبة` },
    { key: 'tariff_information_provided', label: '8. تقديم جدول الأسعار ومدة التسوية (Tariff Provided)', desc: 'تم إرسال تسعيرة DROVA الرسمية وشروط الدفع عند التسليم (COD)' },
    { key: 'required_commercial_info_received', label: '9. استلام الوثائق والمعلومات التجارية (Commercial Info Received)', desc: 'استلام السجل التجاري / رقم التعريف الضريبي / الاسم الكامل للمسؤول' },
    { key: 'drova_onboarding_completed', label: '10. إتمام إعداد حساب الشاحن بالمنصة (DROVA Onboarding Completed)', desc: 'إنشاء حساب الشاحن، تدريبه على إنشاء بوليصات الشحن وطباعتها' },
    { key: 'expediteur_activated', label: '11. اعتماد التفعيل النهائي واستلام أول شحنة (Expéditeur Activé)', desc: 'اعتماد رسمي من إدارة المبيعات وبدء استقبال الطرود رسمياً' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#262626] max-w-2xl w-full max-h-[92vh] flex flex-col text-xs shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#101010]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckSquare size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">قائمة تفعيل الشاحن (EXPÉDITEUR ACTIVATION CHECKLIST)</h3>
                <span className="font-mono text-[10px] bg-[#222222] px-1.5 py-0.2 text-emerald-400 font-bold">
                  {completedCount} / 11
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93]">التاجر: <strong className="text-white">{prospect.name}</strong> · ولاية {prospect.wilaya}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8E8E93] hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-[#222222]">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(completedCount / 11) * 100}%` }}
          />
        </div>

        {/* Informational Guidance (Section 24) */}
        <div className="p-3 bg-[#181818] border-b border-[#262626] text-[11px] text-[#8E8E93] flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#FF0000] shrink-0" />
          <span>
            <strong>معيار DROVA الصارم:</strong> مبدأ "مهتم" أو "أكد التعامل" لا يعني أنه أصبح شاحناً مفعلاً رسمياً حتى يتم استكمال كافة بنود القائمة واعتمادها.
          </span>
        </div>

        {/* Checklist Items */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {checklistItems.map(item => {
            const isChecked = !!checklist[item.key];
            const isFinal = item.key === 'expediteur_activated';

            return (
              <div
                key={item.key}
                onClick={() => toggleItem(item.key)}
                className={`p-3 border cursor-pointer transition-colors flex items-start gap-3 ${
                  isChecked
                    ? isFinal
                      ? 'bg-emerald-950/40 border-emerald-700 text-white'
                      : 'bg-[#191919] border-[#333333] text-white'
                    : 'bg-[#141414] border-[#222222] text-[#8E8E93] hover:border-[#333333]'
                }`}
              >
                <button
                  type="button"
                  className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#444444]'
                  }`}
                >
                  {isChecked && <CheckCircle2 size={12} />}
                </button>
                <div className="flex-1">
                  <div className={`font-bold text-xs ${isChecked ? 'text-white' : 'text-[#A0A0A0]'}`}>
                    {item.label}
                  </div>
                  <p className="text-[11px] text-[#707070] mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[#262626] bg-[#101010] flex items-center justify-between">
          <button
            type="button"
            onClick={handleSaveProgress}
            className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs transition-colors"
          >
            حفظ مسودة القائمة
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1A1A1A] text-[#8E8E93] hover:text-white text-xs"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleFinalActivation}
              disabled={!isAllChecklistDone}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold text-xs transition-colors shadow-md shadow-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={14} />
              <span>اعتماد وتفعيل الشاحن رسميًا (EXPÉDITEUR ACTIVÉ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
