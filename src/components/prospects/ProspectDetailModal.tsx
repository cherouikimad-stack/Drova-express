/**
 * DROVA Merchant Intelligence Dossier Modal (Section 42)
 * Complete verification evidence, courier intelligence, and sales CRM controls
 */
import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  ExternalLink,
  ShieldCheck,
  Building,
  Truck,
  Calendar,
  AlertTriangle,
  FileCheck,
  Save,
  Trash2,
  Copy,
  Check,
  PhoneCall,
  CalendarCheck,
  Award,
  Ban,
  CheckCircle2,
  Clock,
  User,
  ListChecks,
  Flame,
  UserCheck
} from 'lucide-react';
import { Prospect, ProspectStatus, SourceEvidence, CRMCall, CRMFollowUp } from '../../types';
import { storage } from '../../services/storage';
import { ScoreBadge, VerificationBadge, StatusBadge, WhatsAppBadge } from '../ui/Badge';
import { ALGERIA_WILAYAS } from '../../data/wilayas';
import { CallModal } from '../crm/CallModal';
import { ActivationChecklistModal } from '../crm/ActivationChecklistModal';
import { COMMERCIAL_TEAM, calculateCallPriority, calculateContactabilityScore } from '../../services/crm';

interface ProspectDetailModalProps {
  prospect: Prospect;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProspectDetailModal: React.FC<ProspectDetailModalProps> = ({
  prospect,
  onClose,
  onUpdate,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dossier' | 'calls' | 'evidence'>('dossier');

  // Modals
  const [showCallModal, setShowCallModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showDncModal, setShowDncModal] = useState(false);
  const [dncReason, setDncReason] = useState('طلب التاجر صراحة عدم الاتصال به مجدداً');

  // Form states for sales fields
  const [status, setStatus] = useState<ProspectStatus>(prospect.status);
  const [responsible, setResponsible] = useState(prospect.responsible || prospect.assigned_commercial || '');
  const [contactDate, setContactDate] = useState(prospect.contact_date || '');
  const [nextFollowup, setNextFollowup] = useState(prospect.next_followup || '');
  const [notes, setNotes] = useState(prospect.notes || '');
  const [alert, setAlert] = useState(prospect.alert || '');
  const [wilaya, setWilaya] = useState(prospect.wilaya);
  const [commune, setCommune] = useState(prospect.commune);

  const [saving, setSaving] = useState(false);

  const evidenceList: SourceEvidence[] = storage.getEvidenceForProspect(prospect.id);
  const calls: CRMCall[] = storage.getCallsForProspect(prospect.id);
  const followUps: CRMFollowUp[] = storage.getAllFollowUps().filter(f => f.prospect_id === prospect.id);
  const expediteurProfile = storage.getExpediteurByProspectId(prospect.id);

  const contactability = calculateContactabilityScore(prospect);
  const priority = prospect.call_priority || calculateCallPriority(prospect);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    setSaving(true);
    storage.updateProspect(
      prospect.id,
      {
        status,
        responsible,
        assigned_commercial: responsible,
        contact_date: contactDate,
        next_followup: nextFollowup,
        notes,
        alert,
        wilaya,
        commune,
      },
      'Updated merchant dossier and sales CRM fields'
    );
    setSaving(false);
    onUpdate();
  };

  const handleAssignCommercial = (newCommercial: string) => {
    setResponsible(newCommercial);
    storage.assignCommercial(prospect.id, newCommercial);
    onUpdate();
  };

  const handleApplyDNC = () => {
    if (!dncReason.trim()) return;
    storage.setDoNotContact(prospect.id, dncReason.trim());
    setStatus('Do Not Contact');
    setShowDncModal(false);
    onUpdate();
  };

  const handleDelete = () => {
    if (confirm(`هل أنت متأكد من حذف التاجر "${prospect.name}" نهائياً من قاعدة البيانات؟`)) {
      storage.deleteProspect(prospect.id);
      onUpdate();
      onClose();
    }
  };

  const formattedWhatsAppUrl = prospect.phone
    ? `https://wa.me/213${prospect.phone.replace(/^(\+213|0)/, '')}?text=${encodeURIComponent(`السلام عليكم متجر ${prospect.name}، معكم شركة DROVA Express للتوصيل السريع.`)}`
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 backdrop-blur-sm overflow-y-auto">
        <div className="bg-[#121212] border border-[#262626] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
          {/* Modal Header */}
          <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#161616]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#1F1F1F] border border-[#333333] flex items-center justify-center font-bold text-white text-lg shrink-0">
                {prospect.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white truncate max-w-xs">{prospect.name}</h2>
                  <ScoreBadge score={prospect.score} />
                  <VerificationBadge level={prospect.verification_status} />
                  <StatusBadge status={prospect.status} />

                  {(prospect.data_origin === 'real_imported' || prospect.data_origin === 'real_manual' || prospect.source === 'excel_import') ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                      ● تاجر حقيقي موثق
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-950/80 border border-amber-800 text-amber-300">
                      ○ محاكاة اختبارية
                    </span>
                  )}

                  {priority === 'URGENT' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-950/80 border border-red-700 text-red-300 flex items-center gap-1">
                      <Flame size={11} className="text-[#FF0000]" />
                      <span>أولوية قصوى</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8E8E93] mt-0.5 truncate">
                  {prospect.merchant_type} · {prospect.category} · {prospect.wilaya} - {prospect.commune}
                </p>
              </div>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCallModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold shadow-md transition-colors"
                title="تسجيل مكالمة تجارية الآن"
              >
                <PhoneCall size={14} />
                <span>اتصال تجاري</span>
              </button>

              {formattedWhatsAppUrl && (
                <a
                  href={formattedWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-950/60 border border-emerald-800 transition-colors"
                  title="فتح محادثة واتساب الرسمية"
                >
                  <MessageCircle size={16} />
                </a>
              )}

              {(prospect.status === 'أكد التعامل مع DROVA' ||
                prospect.status === 'في طور التفعيل' ||
                prospect.status === 'Expéditeur مفعل' ||
                prospect.status === 'Expéditeur نشط' ||
                expediteurProfile) && (
                <button
                  onClick={() => setShowChecklistModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-medium transition-colors"
                  title="قائمة التحقق من التفعيل 11 خطوة"
                >
                  <ListChecks size={14} className="text-emerald-400" />
                  <span>قائمة التفعيل</span>
                </button>
              )}

              <button
                onClick={() => setShowDncModal(true)}
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-[#1F1F1F] border border-transparent hover:border-neutral-700 transition-colors"
                title="حظر التواصل (Do Not Contact)"
              >
                <Ban size={15} />
              </button>

              <button
                onClick={handleDelete}
                title="حذف التاجر نهائياً"
                className="p-1.5 text-[#8E8E93] hover:text-red-400 hover:bg-[#1F1F1F] transition-colors"
              >
                <Trash2 size={16} />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#1F1F1F] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-[#262626] bg-[#141414] px-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dossier')}
              className={`py-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'dossier'
                  ? 'border-[#FF0000] text-white font-bold'
                  : 'border-transparent text-[#8E8E93] hover:text-white'
              }`}
            >
              ملف التاجر ومعلومات المبيعات
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'calls'
                  ? 'border-[#FF0000] text-white font-bold'
                  : 'border-transparent text-[#8E8E93] hover:text-white'
              }`}
            >
              <span>سجل المكالمات والمتابعات</span>
              <span className="px-1.5 py-0.2 bg-[#222222] text-[10px] font-mono-data rounded-sm">
                {calls.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'evidence'
                  ? 'border-[#FF0000] text-white font-bold'
                  : 'border-transparent text-[#8E8E93] hover:text-white'
              }`}
            >
              <span>أدلة التدقيق والمصادر</span>
              <span className="px-1.5 py-0.2 bg-[#222222] text-[10px] font-mono-data rounded-sm">
                {evidenceList.length}
              </span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            {activeTab === 'dossier' && (
              <>
                {/* Top Key Signals Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#181818] border border-[#262626]">
                    <span className="text-[11px] text-[#8E8E93] block">شركة التوصيل الحالية</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {prospect.current_courier}
                    </span>
                    <span className="text-[10px] text-[#545458] block mt-0.5">
                      مستوى الولاء: {prospect.loyalty_level}
                    </span>
                  </div>

                  <div className="p-3 bg-[#181818] border border-[#262626]">
                    <span className="text-[11px] text-[#8E8E93] block">تقدير حجم الطرود</span>
                    <span className="text-sm font-mono-data font-bold text-[#FF0000] mt-1 block">
                      {prospect.parcel_estimate} طرد/يوم
                    </span>
                    <span className="text-[10px] text-[#545458] block mt-0.5">
                      إمكانية الشحن: {prospect.shipping_potential}
                    </span>
                  </div>

                  <div className="p-3 bg-[#181818] border border-[#262626]">
                    <span className="text-[11px] text-[#8E8E93] block">الهاتف الموثق</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-mono-data font-bold text-emerald-400">
                        {prospect.phone}
                      </span>
                      <button
                        onClick={() => handleCopy(prospect.phone, 'phone')}
                        className="text-[#8E8E93] hover:text-white"
                        title="نسخ الرقم"
                      >
                        {copiedField === 'phone' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <span className="text-[10px] text-emerald-500 block mt-0.5">
                      {prospect.phone_verification_status === 'VERIFIED' ? 'رقم جزائري موثق' : 'قيد المراجعة'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#181818] border border-[#262626]">
                    <span className="text-[11px] text-[#8E8E93] block">قابلية الوصول وأولوية الاتصال</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-mono-data text-white font-bold">
                        {contactability}/100
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">
                        {priority}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#545458] block mt-0.5">
                      المكالمات المسجلة: {calls.length}
                    </span>
                  </div>
                </div>

                {/* Section: Business Identity & Product */}
                <div className="border border-[#262626] bg-[#161616] p-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Building size={14} className="text-[#FF0000]" />
                    <span>هوية النشاط التجاري والمنتجات</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#8E8E93] block">اسم المتجر / الصفحة:</span>
                      <span className="text-white font-medium mt-0.5 block">{prospect.name}</span>
                    </div>
                    <div>
                      <span className="text-[#8E8E93] block">طبيعة المنتجات المعروضة:</span>
                      <span className="text-white font-medium mt-0.5 block">{prospect.product}</span>
                    </div>
                    <div>
                      <span className="text-[#8E8E93] block">الولاية:</span>
                      <select
                        value={wilaya}
                        onChange={e => {
                          setWilaya(e.target.value);
                          const w = ALGERIA_WILAYAS.find(x => x.nameAr === e.target.value);
                          if (w && w.communes[0]) setCommune(w.communes[0]);
                        }}
                        className="w-full mt-1 bg-[#121212] border border-[#333333] px-2 py-1 text-white text-xs"
                      >
                        {ALGERIA_WILAYAS.map(w => (
                          <option key={w.code} value={w.nameAr}>
                            {w.code} - {w.nameAr} ({w.nameFr})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[#8E8E93] block">البلدية:</span>
                      <input
                        type="text"
                        value={commune}
                        onChange={e => setCommune(e.target.value)}
                        className="w-full mt-1 bg-[#121212] border border-[#333333] px-2 py-1 text-white text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[#8E8E93] block">روابط التواجد الرقمي:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {prospect.source_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#1F1F1F] hover:bg-[#282828] border border-[#333333] text-xs text-blue-400 truncate max-w-md"
                          >
                            <ExternalLink size={12} />
                            <span className="truncate">{url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Scoring & Intelligence Breakdown */}
                <div className="border border-[#262626] bg-[#161616] p-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>تحليل التقييم وعوامل التأهيل (DROVA Scoring Logic)</span>
                  </h3>

                  <div className="space-y-2">
                    {prospect.score_reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                        <span className="w-1.5 h-1.5 bg-[#FF0000] shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {prospect.courier_evidence && (
                    <div className="mt-3 pt-3 border-t border-[#262626] text-xs">
                      <span className="text-[#8E8E93] block">دليل شركة الشحن الحالية:</span>
                      <span className="text-neutral-300 mt-0.5 block">{prospect.courier_evidence}</span>
                    </div>
                  )}
                </div>

                {/* Section: Sales CRM Workflow (Sections 11, 23 & 42) */}
                <div className="border border-[#262626] bg-[#161616] p-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-amber-400" />
                    <span>إدارة المبيعات والتفعيل (DROVA Expéditeur CRM)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-[#8E8E93] block mb-1">حالة العميل المحتمل (20 حالة معتمدة):</label>
                      <select
                        value={status}
                        onChange={e => setStatus(e.target.value as ProspectStatus)}
                        className="w-full bg-[#121212] border border-[#333333] px-2.5 py-1.5 text-white text-xs font-medium"
                      >
                        <option value="جديد">جديد</option>
                        <option value="جاهز للاتصال">جاهز للاتصال</option>
                        <option value="جاهز للتواصل">جاهز للتواصل</option>
                        <option value="تم التحقق">تم التحقق</option>
                        <option value="تم الاتصال">تم الاتصال</option>
                        <option value="لم يرد">لم يرد</option>
                        <option value="إعادة الاتصال">إعادة الاتصال</option>
                        <option value="مهتم">مهتم</option>
                        <option value="مهتم - متابعة">مهتم - متابعة</option>
                        <option value="طلب معلومات">طلب معلومات</option>
                        <option value="أرسل المعلومات">أرسل المعلومات</option>
                        <option value="في طور التفعيل">في طور التفعيل</option>
                        <option value="أكد التعامل مع DROVA">أكد التعامل مع DROVA</option>
                        <option value="Expéditeur مفعل">Expéditeur مفعل</option>
                        <option value="Expéditeur نشط">Expéditeur نشط (VIP)</option>
                        <option value="عميل">عميل (تم إبرام الاتفاق)</option>
                        <option value="متابعة">متابعة</option>
                        <option value="غير مهتم">غير مهتم</option>
                        <option value="رفض">رفض</option>
                        <option value="مرفوض">مرفوض</option>
                        <option value="رقم خاطئ">رقم خاطئ</option>
                        <option value="رقم غير متاح">رقم غير متاح</option>
                        <option value="لا علاقة له بالنشاط">لا علاقة له بالنشاط</option>
                        <option value="مكرر">مكرر</option>
                        <option value="Do Not Contact">Do Not Contact (حظر التواصل)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[#8E8E93] block mb-1">الممثل التجاري المعين (منع تداخل المبيعات):</label>
                      <select
                        value={responsible}
                        onChange={e => handleAssignCommercial(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333333] px-2.5 py-1.5 text-white text-xs"
                      >
                        <option value="">غير معين (طابور عام)</option>
                        {COMMERCIAL_TEAM.map(member => (
                          <option key={member.name} value={member.name}>
                            {member.name} ({member.role === 'admin' ? 'مدير' : 'تجاري'})
                          </option>
                        ))}
                      </select>
                      {responsible && (
                        <span className="text-[10px] text-emerald-400 block mt-1 flex items-center gap-1">
                          <UserCheck size={10} />
                          <span>سجل محمي تحت إدارة: {responsible}</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-[#8E8E93] block mb-1">تنبيه خاص (Alert):</label>
                      <input
                        type="text"
                        placeholder="مثال: تاجر أزياء طرود ضخمة 30+/يوم"
                        value={alert}
                        onChange={e => setAlert(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333333] px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[#8E8E93] block mb-1">تاريخ آخر تواصل:</label>
                      <input
                        type="date"
                        value={contactDate}
                        onChange={e => setContactDate(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333333] px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[#8E8E93] block mb-1">تاريخ المتابعة القادمة:</label>
                      <input
                        type="date"
                        value={nextFollowup}
                        onChange={e => setNextFollowup(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333333] px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-[#8E8E93] block mb-1">ملاحظات المفاوضات التجارية:</label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="سجل نتائج المكالمات، الأسعار المقترحة، أو متطلبات التاجر الخاصة..."
                        className="w-full bg-[#121212] border border-[#333333] p-2 text-white text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB: CALLS & FOLLOW-UPS */}
            {activeTab === 'calls' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#161616] p-3 border border-[#262626]">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <PhoneCall size={14} className="text-[#FF0000]" />
                      <span>سجل الاتصالات الهاتفية الموثقة ({calls.length})</span>
                    </h3>
                    <p className="text-[11px] text-[#8E8E93] mt-0.5">
                      تاريخ المكالمات ونتائجها وملاحظات الممثلين التجاريين
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCallModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] text-white text-xs font-bold hover:bg-[#E00000] transition-colors"
                  >
                    <PhoneCall size={13} />
                    <span>تسجيل مكالمة جديدة</span>
                  </button>
                </div>

                {/* Followups */}
                {followUps.length > 0 && (
                  <div className="border border-amber-900/40 bg-amber-950/20 p-3">
                    <h4 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                      <CalendarCheck size={14} />
                      <span>المتابعات المجدولة ({followUps.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {followUps.map(f => (
                        <div key={f.id} className="flex items-center justify-between text-xs bg-[#121212] p-2 border border-[#333333]">
                          <div>
                            <span className="font-bold text-white ml-2">{f.scheduled_date} {f.scheduled_time || ''}</span>
                            <span className="text-[#8E8E93]">{f.reason}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] ${f.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {f.status === 'completed' ? 'مكتملة' : 'معلقة'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calls timeline */}
                {calls.length === 0 ? (
                  <div className="text-center py-8 text-[#8E8E93] bg-[#161616] border border-[#262626] text-xs">
                    لم يتم تسجيل أي مكالمات تجارية لهذا التاجر حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {calls.map(call => (
                      <div key={call.id} className="bg-[#161616] border border-[#262626] p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{call.call_result}</span>
                          </div>
                          <span className="text-[11px] font-mono text-[#8E8E93]">
                            {call.date.slice(0, 10)} {call.time}
                          </span>
                        </div>
                        <p className="text-neutral-300 text-xs">{call.notes}</p>
                        <div className="flex items-center justify-between pt-1 border-t border-[#222222] text-[10px] text-[#545458]">
                          <span>المسؤول: {call.commercial_name}</span>
                          {call.next_followup_date && (
                            <span className="text-amber-400">متابعة مجدولة: {call.next_followup_date} {call.next_followup_time || ''}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: EVIDENCE */}
            {activeTab === 'evidence' && (
              <div className="border border-[#262626] bg-[#161616] p-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileCheck size={14} className="text-cyan-400" />
                  <span>جدول أدلة المصادر الداخلية (Audit Evidence)</span>
                </h3>

                {evidenceList.length === 0 ? (
                  <p className="text-xs text-[#545458]">لا توجد أدلة إضافية ملحقة بهذا السجل.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-[#262626] text-[#8E8E93]">
                          <th className="pb-2 font-medium">الحقل</th>
                          <th className="pb-2 font-medium">القيمة المستخرجة</th>
                          <th className="pb-2 font-medium">المصدر</th>
                          <th className="pb-2 font-medium">مستوى التوثيق</th>
                          <th className="pb-2 font-medium">ملاحظات التحقق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222]">
                        {evidenceList.map(evi => (
                          <tr key={evi.id} className="text-neutral-300">
                            <td className="py-2 font-mono text-[11px] text-[#8E8E93]">{evi.field_name}</td>
                            <td className="py-2 font-medium text-white">{evi.value}</td>
                            <td className="py-2 text-[11px]">{evi.source}</td>
                            <td className="py-2">
                              <VerificationBadge level={evi.verification_level} />
                            </td>
                            <td className="py-2 text-[#8E8E93] text-[11px]">{evi.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-[#262626] bg-[#161616] flex items-center justify-between">
            <div className="text-[11px] text-[#545458]">
              معرف السجل: <span className="font-mono">{prospect.id}</span> · أضيف في: {new Date(prospect.created_at).toLocaleDateString('ar-DZ')}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs text-[#8E8E93] hover:text-white transition-colors"
              >
                إغلاق
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Save size={14} />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <CallModal
          prospect={prospect}
          onClose={() => setShowCallModal(false)}
          onCallLogged={() => {
            setShowCallModal(false);
            onUpdate();
          }}
          onOpenChecklist={() => {
            setShowCallModal(false);
            setShowChecklistModal(true);
          }}
        />
      )}

      {/* Activation Checklist Modal */}
      {showChecklistModal && (
        <ActivationChecklistModal
          prospect={prospect}
          onClose={() => setShowChecklistModal(false)}
          onActivated={() => {
            setShowChecklistModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Do Not Contact Modal */}
      {showDncModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#141414] border border-rose-900/60 p-5 w-full max-w-md space-y-4">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
              <Ban size={18} />
              <span>حظر التواصل مع التاجر (Do Not Contact)</span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              بموجب المادة 18، سيتم حظر الاتصال بالتاجر {prospect.name} فورياً واستبعاده من كافة الحملات وقوائم الاتصال التجارية لمنع الإزعاج.
            </p>
            <div>
              <label className="text-xs text-neutral-300 block mb-1">سبب الحظر الإلزامي:</label>
              <textarea
                rows={3}
                value={dncReason}
                onChange={e => setDncReason(e.target.value)}
                className="w-full bg-[#181818] border border-[#333333] p-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDncModal(false)}
                className="px-3 py-1.5 text-xs text-[#8E8E93] hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleApplyDNC}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                تطبيق الحظر الدائم
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
