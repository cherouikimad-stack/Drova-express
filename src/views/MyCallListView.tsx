/**
 * DROVA Express — Daily Commercial Call List ("MY CALL LIST")
 * Implements Section 31
 */
import React, { useState } from 'react';
import {
  PhoneCall,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  MessageCircle,
  ShieldCheck,
  Building,
  Target
} from 'lucide-react';
import { Prospect } from '../types';
import { storage } from '../services/storage';
import { CallModal } from '../components/crm/CallModal';
import { ActivationChecklistModal } from '../components/crm/ActivationChecklistModal';

interface MyCallListViewProps {
  onSelectProspect: (prospect: Prospect) => void;
  onRefresh: () => void;
}

export const MyCallListView: React.FC<MyCallListViewProps> = ({
  onSelectProspect,
  onRefresh,
}) => {
  const session = storage.getUserSession();
  const prospects = storage.getProspects();
  const allFollowUps = storage.getAllFollowUps();

  const [activeTab, setActiveTab] = useState<'overdue' | 'urgent' | 'interested' | 'activation'>('urgent');
  const [callingProspect, setCallingProspect] = useState<Prospect | null>(null);
  const [checklistProspect, setChecklistProspect] = useState<Prospect | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Overdue followups for this user (or all if admin)
  const overdueFollowUps = allFollowUps.filter(f => {
    if (f.status === 'completed' || f.status === 'cancelled') return false;
    const isMine = session.role === 'admin' || f.commercial_name === session.name;
    return isMine && f.scheduled_date <= todayStr;
  });

  // 2. High Priority / Urgent New Prospects assigned to user or unassigned
  const urgentNewProspects = prospects.filter(p => {
    const isMine = session.role === 'admin' || !p.assigned_commercial || p.assigned_commercial === session.name || p.responsible === session.name;
    const isPriority = p.call_priority === 'URGENT' || p.call_priority === 'HIGH';
    const isNotDone = p.status === 'جاهز للاتصال' || p.status === 'جاهز للتواصل' || p.status === 'جديد' || p.status === 'تم التحقق' || p.status === 'لم يرد';
    return isMine && isPriority && isNotDone;
  });

  // 3. Interested Prospects requiring active commercial closing
  const interestedProspects = prospects.filter(p => {
    const isMine = session.role === 'admin' || p.assigned_commercial === session.name || p.responsible === session.name;
    return isMine && (p.status === 'مهتم' || p.status === 'مهتم - متابعة' || p.status === 'طلب معلومات' || p.expediteur_status === 'مرشح قوي');
  });

  // 4. Activation Candidates (Confirmed, waiting onboarding & activation)
  const activationCandidates = prospects.filter(p => {
    const isMine = session.role === 'admin' || p.assigned_commercial === session.name || p.responsible === session.name;
    return isMine && (p.status === 'أكد التعامل مع DROVA' || p.status === 'في طور التفعيل' || p.expediteur_status === 'مؤكد');
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target size={20} className="text-[#FF0000]" />
              <span>قائمة اتصالاتي اليومية (Daily Commercial Queue)</span>
            </h2>
            <span className="text-xs px-2 py-0.5 bg-[#1F1F1F] text-white border border-[#333333]">
              المسؤول: {session.name}
            </span>
          </div>
          <p className="text-xs text-[#8E8E93] mt-1">
            قائمة مهام الاتصال المرتبة حسب الأولوية الذكية لحسم الصفقات وتحويل التجار لشاحنين
          </p>
        </div>
      </div>

      {/* 4 Summary Action Cards (Section 31) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-4 border text-right transition-all ${
            activeTab === 'overdue'
              ? 'bg-red-950/50 border-red-700 text-white shadow-lg'
              : 'bg-[#141414] border-[#262626] text-[#8E8E93] hover:border-[#383838]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-red-400">متابعات مستحقة اليوم</span>
            <AlertTriangle size={15} className="text-red-400" />
          </div>
          <span className="text-2xl font-bold font-mono-data text-white">{overdueFollowUps.length}</span>
          <p className="text-[10px] text-[#8E8E93] mt-1">مواعيد اتصال متفق عليها سابقاً</p>
        </button>

        <button
          onClick={() => setActiveTab('urgent')}
          className={`p-4 border text-right transition-all ${
            activeTab === 'urgent'
              ? 'bg-amber-950/40 border-amber-600 text-white shadow-lg'
              : 'bg-[#141414] border-[#262626] text-[#8E8E93] hover:border-[#383838]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-400">تجار جدد بأولوية قصوى</span>
            <Flame size={15} className="text-[#FF0000]" />
          </div>
          <span className="text-2xl font-bold font-mono-data text-white">{urgentNewProspects.length}</span>
          <p className="text-[10px] text-[#8E8E93] mt-1">تصنيف A+ بحجم طرود عالي</p>
        </button>

        <button
          onClick={() => setActiveTab('interested')}
          className={`p-4 border text-right transition-all ${
            activeTab === 'interested'
              ? 'bg-blue-950/40 border-blue-600 text-white shadow-lg'
              : 'bg-[#141414] border-[#262626] text-[#8E8E93] hover:border-[#383838]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-400">تجار أبدوا اهتماماً</span>
            <PhoneCall size={15} className="text-blue-400" />
          </div>
          <span className="text-2xl font-bold font-mono-data text-white">{interestedProspects.length}</span>
          <p className="text-[10px] text-[#8E8E93] mt-1">قيد دراسة الأسعار والعرض</p>
        </button>

        <button
          onClick={() => setActiveTab('activation')}
          className={`p-4 border text-right transition-all ${
            activeTab === 'activation'
              ? 'bg-emerald-950/50 border-emerald-600 text-white shadow-lg'
              : 'bg-[#141414] border-[#262626] text-[#8E8E93] hover:border-[#383838]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-400">مرشحو التفعيل النهائي</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-mono-data text-white">{activationCandidates.length}</span>
          <p className="text-[10px] text-[#8E8E93] mt-1">أكدوا الاتفاق وينتظرون القائمة</p>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-3">
        {/* TAB 1: OVERDUE / TODAY FOLLOW-UPS */}
        {activeTab === 'overdue' && (
          <div className="space-y-2.5">
            {overdueFollowUps.map(f => {
              const matchingProspect = prospects.find(p => p.id === f.prospect_id);
              const cleanPhone = f.phone.replace(/[^0-9]/g, '');
              return (
                <div key={f.id} className="p-4 bg-[#161212] border border-red-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 onClick={() => matchingProspect && onSelectProspect(matchingProspect)} className="font-bold text-white text-sm hover:text-[#FF0000] cursor-pointer">
                        {f.prospect_name}
                      </h4>
                      <span className="font-mono text-emerald-400 font-bold">{f.phone}</span>
                      <span className="text-[10px] text-amber-400 bg-amber-950/50 px-2 py-0.5 border border-amber-900">
                        موعد: {f.scheduled_date} {f.scheduled_time && `(${f.scheduled_time})`}
                      </span>
                    </div>
                    <p className="text-neutral-300 text-xs">{f.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {matchingProspect && (
                      <button
                        onClick={() => setCallingProspect(matchingProspect)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        <PhoneCall size={13} />
                        <span>اتصال الآن</span>
                      </button>
                    )}
                    <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noreferrer" className="p-1.5 bg-[#25D366] text-black">
                      <MessageCircle size={15} />
                    </a>
                  </div>
                </div>
              );
            })}
            {overdueFollowUps.length === 0 && (
              <div className="text-center py-10 bg-[#141414] border border-[#262626] text-[#8E8E93]">
                <CheckCircle2 size={30} className="mx-auto text-emerald-500 mb-1" />
                <p className="text-white font-bold">لا توجد متابعات متأخرة لليوم!</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: URGENT / HIGH PRIORITY NEW */}
        {activeTab === 'urgent' && (
          <div className="space-y-2.5">
            {urgentNewProspects.map(pros => {
              const cleanPhone = pros.phone.replace(/[^0-9]/g, '');
              return (
                <div key={pros.id} className="p-4 bg-[#141414] border border-[#2E2E2E] hover:border-[#444444] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 onClick={() => onSelectProspect(pros)} className="font-bold text-white text-sm hover:text-[#FF0000] cursor-pointer">
                        {pros.name}
                      </h4>
                      <span className="font-mono text-emerald-400 font-bold">{pros.phone}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 font-bold flex items-center gap-0.5">
                        <Flame size={10} /> أولوية قصوى
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8E8E93] flex flex-wrap items-center gap-3 font-mono-data">
                      <span>{pros.wilaya} · {pros.commune}</span>
                      <span>السلع: <strong className="text-white">{pros.product}</strong></span>
                      <span>الموزع الحالي: <strong className="text-amber-400">{pros.current_courier}</strong> ({pros.parcel_estimate} طرد)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setCallingProspect(pros)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      <PhoneCall size={13} />
                      <span>بدء الاتصال الأول</span>
                    </button>
                    <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noreferrer" className="p-1.5 bg-[#25D366] text-black">
                      <MessageCircle size={15} />
                    </a>
                  </div>
                </div>
              );
            })}
            {urgentNewProspects.length === 0 && (
              <div className="text-center py-10 bg-[#141414] border border-[#262626] text-[#8E8E93]">
                <p className="text-white font-bold">لا يوجد تجار جدد بأولوية قصوى بانتظار الاتصال الأول حالياً.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INTERESTED PROSPECTS */}
        {activeTab === 'interested' && (
          <div className="space-y-2.5">
            {interestedProspects.map(pros => {
              const cleanPhone = pros.phone.replace(/[^0-9]/g, '');
              return (
                <div key={pros.id} className="p-4 bg-[#141414] border border-[#2E2E2E] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 onClick={() => onSelectProspect(pros)} className="font-bold text-white text-sm hover:text-[#FF0000] cursor-pointer">
                        {pros.name}
                      </h4>
                      <span className="font-mono text-emerald-400 font-bold">{pros.phone}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                        {pros.status}
                      </span>
                    </div>
                    <p className="text-[#8E8E93] text-xs font-mono-data">
                      آخر مكالمة: {pros.last_call_at ? new Date(pros.last_call_at).toLocaleDateString('ar-DZ') : 'حديثاً'} · الملاحظات: {pros.notes || 'التاجر مهتم بالعرض'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setCallingProspect(pros)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      <PhoneCall size={13} />
                      <span>معاودة الاتصال</span>
                    </button>
                    <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noreferrer" className="p-1.5 bg-[#25D366] text-black">
                      <MessageCircle size={15} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: ACTIVATION CANDIDATES */}
        {activeTab === 'activation' && (
          <div className="space-y-2.5">
            {activationCandidates.map(pros => (
              <div key={pros.id} className="p-4 bg-[#131916] border border-emerald-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 onClick={() => onSelectProspect(pros)} className="font-bold text-white text-sm hover:text-[#FF0000] cursor-pointer">
                      {pros.name}
                    </h4>
                    <span className="font-mono text-emerald-400 font-bold">{pros.phone}</span>
                    <span className="text-[10px] px-2 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      أكد التعامل مع DROVA
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8E8E93] font-mono-data">
                    المقر: {pros.wilaya} · {pros.commune} · التقدير: {pros.parcel_estimate} طرد/يوم
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setChecklistProspect(pros)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    <CheckCircle2 size={14} />
                    <span>فتح قائمة التفعيل واعتماد الشاحن</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Dialog */}
      {callingProspect && (
        <CallModal
          prospect={callingProspect}
          onClose={() => setCallingProspect(null)}
          onCallLogged={() => onRefresh()}
          onOpenChecklist={() => {
            setChecklistProspect(callingProspect);
            setCallingProspect(null);
          }}
        />
      )}

      {/* Checklist Dialog */}
      {checklistProspect && (
        <ActivationChecklistModal
          prospect={checklistProspect}
          onClose={() => setChecklistProspect(null)}
          onActivated={(exp) => {
            onRefresh();
            alert(`تم تفعيل الشاحن رسميًا: ${exp.business_name} (${exp.id})`);
          }}
        />
      )}
    </div>
  );
};
