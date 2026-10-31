/**
 * DROVA Express — Commercial Call Dialog & Structured Result Logger
 * Implements Sections 13, 14, 15, 16, 26, 35, 40 (Confirmed Contact, Non-Conversion, Competitor Intelligence, Feedback)
 */
import React, { useState } from 'react';
import {
  PhoneCall,
  Phone,
  MessageCircle,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  User,
  ShieldCheck,
  Building,
  MapPin,
  Flame,
  CheckSquare,
  Building2,
  HelpCircle,
  Send,
  Sparkles
} from 'lucide-react';
import { Prospect, CallResult, ProspectStatus, ExpediteurStatus } from '../../types';
import { storage } from '../../services/storage';

interface CallModalProps {
  prospect: Prospect;
  onClose: () => void;
  onCallLogged: () => void;
  onOpenChecklist?: () => void;
}

const CALL_RESULTS: {
  result: CallResult;
  desc: string;
  color: string;
  defaultStatus: ProspectStatus;
  defaultExpStatus: ExpediteurStatus;
  isConfirmedContact: boolean;
}[] = [
  { result: 'مهتم', desc: 'التاجر أبدى اهتماماً ويرغب في معرفة المزيد', color: 'border-emerald-600 bg-emerald-950/30 text-emerald-400', defaultStatus: 'مهتم', defaultExpStatus: 'مرشح قوي', isConfirmedContact: true },
  { result: 'أكد التعامل مع DROVA', desc: 'تم الاتفاق النهائي وبدء إجراءات التفعيل', color: 'border-[#FF0000] bg-red-950/40 text-white font-bold', defaultStatus: 'أكد التعامل مع DROVA', defaultExpStatus: 'مؤكد', isConfirmedContact: true },
  { result: 'طلب معلومات', desc: 'طلب إرسال جدول الأسعار أو العقد عبر الواتساب', color: 'border-blue-600 bg-blue-950/30 text-blue-400', defaultStatus: 'طلب معلومات', defaultExpStatus: 'مهتم', isConfirmedContact: true },
  { result: 'موافق مبدئيًا', desc: 'موافق على التجربة بشرط مطابقة الأسعار والسرعة', color: 'border-teal-600 bg-teal-950/30 text-teal-400', defaultStatus: 'مهتم - متابعة', defaultExpStatus: 'قيد المتابعة', isConfirmedContact: true },
  { result: 'طلب الاتصال لاحقًا', desc: 'مشغول حالياً، وطلب معاودة الاتصال في موعد محدد', color: 'border-amber-600 bg-amber-950/30 text-amber-400', defaultStatus: 'إعادة الاتصال', defaultExpStatus: 'قيد المتابعة', isConfirmedContact: true },
  { result: 'لم يرد', desc: 'رن الهاتف دون إجابة', color: 'border-neutral-700 bg-neutral-900 text-neutral-400', defaultStatus: 'لم يرد', defaultExpStatus: 'Prospect', isConfirmedContact: false },
  { result: 'الرقم مشغول', desc: 'خط الهاتف مشغول', color: 'border-neutral-700 bg-neutral-900 text-neutral-400', defaultStatus: 'إعادة الاتصال', defaultExpStatus: 'Prospect', isConfirmedContact: false },
  { result: 'الرقم غير متاح', desc: 'الهاتف مغلق أو خارج نطاق التغطية', color: 'border-neutral-700 bg-neutral-900 text-neutral-400', defaultStatus: 'رقم غير متاح', defaultExpStatus: 'Prospect', isConfirmedContact: false },
  { result: 'رقم خاطئ', desc: 'الرقم لا يخص التاجر المعني', color: 'border-rose-800 bg-rose-950/30 text-rose-400', defaultStatus: 'رقم خاطئ', defaultExpStatus: 'مرفوض', isConfirmedContact: false },
  { result: 'غير مهتم', desc: 'التاجر مكتفٍ بشركته الحالية أو لا يرغب بالتعامل', color: 'border-zinc-700 bg-zinc-900 text-zinc-400', defaultStatus: 'غير مهتم', defaultExpStatus: 'غير مهتم', isConfirmedContact: true },
  { result: 'رفض', desc: 'رفض قاطع للعرض والاتصال', color: 'border-red-900 bg-red-950/30 text-red-400', defaultStatus: 'رفض', defaultExpStatus: 'مرفوض', isConfirmedContact: true },
];

const NON_CONVERSION_REASONS = [
  'راضي تماماً عن شركة التوصيل الحالية',
  'الأسعار المقترحة غير تنافسية مقارنة بشركته الحالية',
  'تخوف من بطء آجال تسليم الطرود والرجوع (Retour)',
  'حجم شحن ضعيف جداً أو بيع محلي في المحل فقط',
  'تجربة سابقة سلبية مع خدمات التوصيل',
  'لا يحتاج تغطية وطنية (58 ولاية)',
  'أسباب أخرى خاصة بالتاجر'
];

const COURIER_COMPETITORS = [
  'Yalidine Express',
  'Kazi Tour',
  'ZR Express',
  'Maystro Delivery',
  'Procolis',
  'Nord & Sud Express',
  'DHL Algérie',
  'E-Express',
  'توصيل ذاتي / خاص',
  'أخرى'
];

export const CallModal: React.FC<CallModalProps> = ({
  prospect,
  onClose,
  onCallLogged,
  onOpenChecklist,
}) => {
  const session = storage.getUserSession();
  const [selectedResult, setSelectedResult] = useState<CallResult>('مهتم');
  const [callNotes, setCallNotes] = useState('');
  const [callDate] = useState(() => new Date().toISOString());

  // Confirmed Contact (reached the merchant)
  const [isConfirmedContact, setIsConfirmedContact] = useState<boolean>(true);

  // Non-conversion & Competitor intelligence
  const [nonConversionReason, setNonConversionReason] = useState<string>('');
  const [competitorName, setCompetitorName] = useState<string>(prospect.current_courier || 'Yalidine Express');

  // Commercial feedback to marketing
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'wrong_phone' | 'business_closed' | 'high_volume_vip' | 'general'>('wrong_phone');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Follow-up state (required if interested / call later)
  const isFollowUpRequired = selectedResult === 'طلب الاتصال لاحقًا' || selectedResult === 'مهتم' || selectedResult === 'طلب معلومات' || selectedResult === 'موافق مبدئيًا';

  const defaultNextDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const [followUpDate, setFollowUpDate] = useState<string>(defaultNextDate);
  const [followUpTime, setFollowUpTime] = useState<string>('10:00');
  const [followUpReason, setFollowUpReason] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // When result changes, sync default isConfirmedContact
  const handleResultChange = (res: CallResult) => {
    setSelectedResult(res);
    const item = CALL_RESULTS.find(c => c.result === res);
    if (item) {
      setIsConfirmedContact(item.isConfirmedContact);
    }
  };

  // Check duplicate conflict
  const isConflict = prospect.assigned_commercial && prospect.assigned_commercial !== session.name && session.role !== 'super_admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isFollowUpRequired && !followUpDate) {
      alert('يرجى تحديد تاريخ المتابعة القادمة.');
      return;
    }

    setIsSubmitting(true);

    const config = CALL_RESULTS.find(c => c.result === selectedResult);
    const statusAfter = config?.defaultStatus || prospect.status;
    const expStatusAfter = config?.defaultExpStatus || prospect.expediteur_status || 'Prospect';

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    storage.recordCall(
      {
        prospect_id: prospect.id,
        commercial_name: session.name,
        commercial_id: session.user_id,
        date: callDate,
        time: timeStr,
        call_result: selectedResult,
        is_confirmed_contact: isConfirmedContact,
        non_conversion_reason: (selectedResult === 'غير مهتم' || selectedResult === 'رفض') ? nonConversionReason : undefined,
        competitor_name: competitorName,
        notes: callNotes.trim(),
        next_followup_date: isFollowUpRequired ? followUpDate : undefined,
        next_followup_time: isFollowUpRequired ? followUpTime : undefined,
        status_before: prospect.status,
        status_after: statusAfter,
        expediteur_status_before: prospect.expediteur_status || 'Prospect',
        expediteur_status_after: expStatusAfter,
      },
      isFollowUpRequired
        ? {
            date: followUpDate,
            time: followUpTime,
            reason: followUpReason || `متابعة بعد مكالمة: ${selectedResult}`,
          }
        : undefined
    );

    setIsSubmitting(false);
    onCallLogged();

    if (selectedResult === 'أكد التعامل مع DROVA' && onOpenChecklist) {
      onOpenChecklist();
    } else {
      onClose();
    }
  };

  const handleSendFeedback = () => {
    if (!feedbackValue.trim()) return;

    storage.submitCommercialFeedback({
      commercial_name: session.name,
      prospect_id: prospect.id,
      prospect_name: prospect.name,
      category: feedbackCategory,
      reported_value: feedbackValue.trim(),
    });

    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setShowFeedbackModal(false);
      setFeedbackValue('');
    }, 1500);
  };

  const cleanPhone = prospect.phone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#262626] max-w-2xl w-full max-h-[92vh] flex flex-col text-xs shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#101010]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#FF0000] text-white flex items-center justify-center font-bold">
              <PhoneCall size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">تسجيل مكالمة تجارية (Commercial Call Screen)</h3>
              <p className="text-[11px] text-[#8E8E93]">
                المندوب التجاري: <span className="text-white font-medium">{session.name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8E8E93] hover:text-white p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Warning if already assigned */}
        {isConflict && (
          <div className="p-3 bg-amber-950/40 border-b border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>تنبيه: هذا التاجر مسند مسبقاً للمندوب <strong>{prospect.assigned_commercial}</strong> لمنع تضارب الاتصالات.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Merchant Snapshot Card */}
          <div className="bg-[#181818] border border-[#2A2A2A] p-3.5 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>{prospect.name}</span>
                  {prospect.call_priority === 'URGENT' && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 font-bold flex items-center gap-0.5">
                      <Flame size={10} /> عاجل
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#262626] text-[#A1A1AA] font-mono">
                    {prospect.wilaya}
                  </span>
                </h4>
                <p className="text-[#8E8E93] text-[11px]">{prospect.product}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${prospect.phone}`}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  <Phone size={13} />
                  <span>اتصال مباشر</span>
                </a>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs"
                >
                  <MessageCircle size={13} />
                  <span>واتساب</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-2.5 py-1 bg-[#262626] hover:bg-[#333333] text-[#A1A1AA] hover:text-white text-[11px] font-medium border border-[#3E3E3E] cursor-pointer"
                  title="إبلاغ التسويق بتصحيح هاتف أو إغلاق"
                >
                  إبلاغ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#262626] text-[11px] font-mono-data">
              <div>
                <span className="text-[#8E8E93] block">الهاتف:</span>
                <span className="text-white font-bold">{prospect.phone}</span>
              </div>
              <div>
                <span className="text-[#8E8E93] block">المقر:</span>
                <span className="text-white">{prospect.wilaya} · {prospect.commune}</span>
              </div>
              <div>
                <span className="text-[#8E8E93] block">الشركة الحالية:</span>
                <span className="text-amber-400">{prospect.current_courier || 'غير محدد'}</span>
              </div>
              <div>
                <span className="text-[#8E8E93] block">تقدير الطرود:</span>
                <span className="text-white">{prospect.parcel_estimate} طرد/يوم</span>
              </div>
            </div>
          </div>

          {/* Section: Call Outcome & Confirmed Contact Distinction (Section 35) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-white font-bold block">
                1. نتيجة المكالمة (Call Result - إلزامي):
              </label>
              {/* Confirmed Contact Toggle */}
              <div className="flex items-center gap-2 bg-[#1A1A1A] px-2.5 py-1 border border-[#333333]">
                <span className="text-[11px] text-[#8E8E93]">تم الرد والحديث الفعلي (Confirmed Contact):</span>
                <button
                  type="button"
                  onClick={() => setIsConfirmedContact(!isConfirmedContact)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                    isConfirmedContact
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-700 text-[#A1A1AA]'
                  }`}
                >
                  {isConfirmedContact ? 'نعم (تواصل مؤكد)' : 'لا (دون رد)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CALL_RESULTS.map(item => {
                const isSelected = selectedResult === item.result;
                return (
                  <button
                    key={item.result}
                    type="button"
                    onClick={() => handleResultChange(item.result)}
                    className={`p-2.5 text-right border transition-all cursor-pointer ${
                      isSelected
                        ? `${item.color} ring-1 ring-white/20`
                        : 'border-[#2E2E2E] bg-[#1A1A1A] text-[#8E8E93] hover:text-white hover:border-[#3E3E3E]'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{item.result}</span>
                      {isSelected && <CheckCircle2 size={13} />}
                    </div>
                    <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Structured Non-Conversion Reason (when rejected / not interested) */}
          {(selectedResult === 'غير مهتم' || selectedResult === 'رفض') && (
            <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 space-y-2">
              <label className="text-rose-300 font-bold block text-xs flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>السبب الهيكلي لعدم التحويل (Non-Conversion Reason):</span>
              </label>
              <select
                value={nonConversionReason}
                onChange={e => setNonConversionReason(e.target.value)}
                className="w-full bg-[#181818] border border-rose-800/60 p-2 text-white text-xs outline-none focus:border-[#FF0000]"
              >
                <option value="">-- حدد السبب الرئيسي بدقة لتحليل السوق --</option>
                {NON_CONVERSION_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Competitor Courier Intelligence */}
          <div className="p-3 bg-[#181818] border border-[#2E2E2E] space-y-2">
            <label className="text-white font-bold block text-xs flex items-center gap-1.5">
              <Building2 size={13} className="text-amber-400" />
              <span>شركة التوصيل الحالية المنافسة (Competitor Courier):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {COURIER_COMPETITORS.slice(0, 8).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCompetitorName(c)}
                  className={`px-2 py-1.5 text-center text-[11px] border transition-colors cursor-pointer ${
                    competitorName === c
                      ? 'bg-amber-950/40 border-amber-500 text-amber-300 font-bold'
                      : 'bg-[#141414] border-[#2A2A2A] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Call Notes */}
          <div className="space-y-1.5">
            <label className="text-white font-bold flex items-center gap-1.5">
              <FileText size={13} className="text-[#FF0000]" />
              <span>2. تفاصيل وملاحظات المكالمة (Call Notes):</span>
            </label>
            <textarea
              required
              rows={3}
              value={callNotes}
              onChange={e => setCallNotes(e.target.value)}
              placeholder="مثال: يبيع ملابس نسائية، يتعامل حالياً مع ياليدين، مهتم إذا كانت الأسعار مناسبة، طلب إرسال grille tarifaire عبر الواتساب..."
              className="w-full bg-[#181818] border border-[#333333] p-2.5 text-white text-xs outline-none focus:border-[#FF0000] leading-relaxed"
            />
          </div>

          {/* Mandatory Next Follow-Up */}
          {isFollowUpRequired && (
            <div className="p-3.5 bg-[#1B1616] border border-[#441C1C] space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Clock size={14} className="text-[#FF0000]" />
                <span>3. تحديد موعد المتابعة القادمة (مطلوب آلياً لحالات الاهتمام):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8E8E93] text-[11px] block mb-1">تاريخ المتابعة:</label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="w-full bg-[#121212] border border-[#3E2222] px-2.5 py-1.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[#8E8E93] text-[11px] block mb-1">الوقت المفضل:</label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={e => setFollowUpTime(e.target.value)}
                    className="w-full bg-[#121212] border border-[#3E2222] px-2.5 py-1.5 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8E8E93] text-[11px] block mb-1">سبب المتابعة / الهدف:</label>
                <input
                  type="text"
                  placeholder="مثال: التأكد من استلام عرض الأسعار واستلام الدفعة الأولى من الطرود التجريبية"
                  value={followUpReason}
                  onChange={e => setFollowUpReason(e.target.value)}
                  className="w-full bg-[#121212] border border-[#3E2222] px-2.5 py-1.5 text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* If Confirmed, mention Activation Checklist */}
          {selectedResult === 'أكد التعامل مع DROVA' && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} />
                <span>سيتم فتح قائمة تفعيل الشاحن (Activation Checklist) تلقائياً بمجرد الحفظ لتسجيل العقد والموقع.</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#222222] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold transition-colors shadow-md shadow-red-950/40 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'تثبيت نتيجة المكالمة'}
            </button>
          </div>
        </form>
      </div>

      {/* Field Feedback Modal to Marketing (Section 40) */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#333333] max-w-md w-full p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span>إبلاغ فريق التسويق والبيانات (Signaler une information)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="text-[#8E8E93] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-center space-y-1">
                <CheckCircle2 size={24} className="mx-auto" />
                <p className="font-bold">تم إرسال الإبلاغ بنجاح إلى فريق التسويق!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[#8E8E93] block mb-1">نوع الإبلاغ الميداني:</label>
                  <select
                    value={feedbackCategory}
                    onChange={e => setFeedbackCategory(e.target.value as any)}
                    className="w-full bg-[#1C1C1C] border border-[#333333] p-2 text-white"
                  >
                    <option value="wrong_phone">تصحيح رقم هاتف خاطئ</option>
                    <option value="business_closed">النشاط التجاري مغلق أو غير موجود</option>
                    <option value="high_volume_vip">تاجر ضخم VIP (أكثر من 50 طرد يومياً)</option>
                    <option value="general">ملاحظة عامة عن المقر أو النشاط</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8E8E93] block mb-1">
                    {feedbackCategory === 'wrong_phone'
                      ? 'الرقم الصحيح الجديد المكتشف ميدانياً:'
                      : 'التفاصيل والمعلومات الميدانية:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      feedbackCategory === 'wrong_phone'
                        ? '+213550123456'
                        : 'اكتب التفاصيل بدقة ليتم مراجعتها من فريق التسويق...'
                    }
                    value={feedbackValue}
                    onChange={e => setFeedbackValue(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#333333] p-2 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-3 py-1.5 bg-[#222222] text-[#8E8E93] hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSendFeedback}
                    className="px-4 py-1.5 bg-[#FF0000] text-white font-bold hover:bg-[#E00000] cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>إرسال الإبلاغ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
