/**
 * DROVA Express — Today's Follow-ups & Commercial Reminders
 * Implements Section 16 & 17
 */
import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  PhoneCall,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Flame,
  ChevronRight,
  User,
  MapPin
} from 'lucide-react';
import { CRMFollowUp, Prospect } from '../types';
import { storage } from '../services/storage';
import { filterFollowUpsByTimeframe, COMMERCIAL_TEAM } from '../services/crm';
import { CallModal } from '../components/crm/CallModal';

interface FollowUpsViewProps {
  onSelectProspect: (prospect: Prospect) => void;
  onRefresh: () => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  onSelectProspect,
  onRefresh,
}) => {
  const session = storage.getUserSession();
  const [timeframe, setTimeframe] = useState<'today' | 'overdue' | 'tomorrow' | 'this_week' | 'upcoming'>('today');
  const [selectedCommercial, setSelectedCommercial] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Call modal
  const [callingProspect, setCallingProspect] = useState<Prospect | null>(null);

  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');

  const allFollowUps = storage.getAllFollowUps();
  const prospects = storage.getProspects();

  // Filtered by timeframe
  const timeframeFollowUps = filterFollowUpsByTimeframe(allFollowUps, timeframe);

  const filtered = timeframeFollowUps.filter(f => {
    if (search) {
      const q = search.toLowerCase();
      if (!f.prospect_name.toLowerCase().includes(q) && !f.phone.includes(q)) return false;
    }
    if (selectedCommercial !== 'all') {
      if (f.commercial_name !== selectedCommercial) return false;
    }
    return true;
  });

  // Timeframe counts
  const countOverdue = filterFollowUpsByTimeframe(allFollowUps, 'overdue').length;
  const countToday = filterFollowUpsByTimeframe(allFollowUps, 'today').length;
  const countTomorrow = filterFollowUpsByTimeframe(allFollowUps, 'tomorrow').length;
  const countThisWeek = filterFollowUpsByTimeframe(allFollowUps, 'this_week').length;
  const countUpcoming = filterFollowUpsByTimeframe(allFollowUps, 'upcoming').length;

  const handleComplete = (id: string) => {
    storage.completeFollowUp(id);
    onRefresh();
  };

  const handleReschedule = (id: string) => {
    if (!newDate) {
      alert('يرجى تحديد التاريخ الجديد للمتابعة');
      return;
    }
    storage.rescheduleFollowUp(id, newDate);
    setReschedulingId(null);
    setNewDate('');
    onRefresh();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={20} className="text-[#FF0000]" />
              <span>متابعات المبيعات والاتصالات المجدولة (Follow-up Dashboard)</span>
            </h2>
            {countOverdue > 0 && (
              <span className="text-[11px] px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 font-bold flex items-center gap-1">
                <AlertTriangle size={12} /> {countOverdue} متأخرة
              </span>
            )}
          </div>
          <p className="text-xs text-[#8E8E93] mt-1">
            إدارة المواعيد المحددة لإعادة الاتصال، استلام القرارات، وإرسال عروض الأسعار للشاحنين
          </p>
        </div>
      </div>

      {/* Timeframe Tabs (Section 17) */}
      <div className="flex flex-wrap gap-2 border-b border-[#262626] pb-3 text-xs">
        <button
          onClick={() => setTimeframe('overdue')}
          className={`flex items-center gap-1.5 px-3 py-2 border transition-colors ${
            timeframe === 'overdue'
              ? 'bg-red-950/60 border-red-700 text-white font-bold'
              : 'border-[#262626] bg-[#141414] text-[#8E8E93] hover:text-white'
          }`}
        >
          <span>المتأخرة (Overdue)</span>
          <span className={`px-1.5 py-0.2 font-mono text-[10px] ${countOverdue > 0 ? 'bg-red-800 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
            {countOverdue}
          </span>
        </button>

        <button
          onClick={() => setTimeframe('today')}
          className={`flex items-center gap-1.5 px-3 py-2 border transition-colors ${
            timeframe === 'today'
              ? 'bg-[#FF0000] border-[#FF0000] text-white font-bold'
              : 'border-[#262626] bg-[#141414] text-[#8E8E93] hover:text-white'
          }`}
        >
          <Clock size={13} />
          <span>متابعات اليوم (Today)</span>
          <span className="px-1.5 py-0.2 font-mono text-[10px] bg-black/40 text-white">
            {countToday}
          </span>
        </button>

        <button
          onClick={() => setTimeframe('tomorrow')}
          className={`flex items-center gap-1.5 px-3 py-2 border transition-colors ${
            timeframe === 'tomorrow'
              ? 'bg-[#1C1C1C] border-[#FF0000] text-white font-bold'
              : 'border-[#262626] bg-[#141414] text-[#8E8E93] hover:text-white'
          }`}
        >
          <span>غداً (Tomorrow)</span>
          <span className="px-1.5 py-0.2 font-mono text-[10px] bg-neutral-800 text-neutral-300">
            {countTomorrow}
          </span>
        </button>

        <button
          onClick={() => setTimeframe('this_week')}
          className={`flex items-center gap-1.5 px-3 py-2 border transition-colors ${
            timeframe === 'this_week'
              ? 'bg-[#1C1C1C] border-[#FF0000] text-white font-bold'
              : 'border-[#262626] bg-[#141414] text-[#8E8E93] hover:text-white'
          }`}
        >
          <span>هذا الأسبوع (This Week)</span>
          <span className="px-1.5 py-0.2 font-mono text-[10px] bg-neutral-800 text-neutral-300">
            {countThisWeek}
          </span>
        </button>

        <button
          onClick={() => setTimeframe('upcoming')}
          className={`flex items-center gap-1.5 px-3 py-2 border transition-colors ${
            timeframe === 'upcoming'
              ? 'bg-[#1C1C1C] border-[#FF0000] text-white font-bold'
              : 'border-[#262626] bg-[#141414] text-[#8E8E93] hover:text-white'
          }`}
        >
          <span>المواعيد القادمة (Upcoming)</span>
          <span className="px-1.5 py-0.2 font-mono text-[10px] bg-neutral-800 text-neutral-300">
            {countUpcoming}
          </span>
        </button>
      </div>

      {/* Filters Strip */}
      <div className="bg-[#141414] border border-[#262626] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute right-3 top-2.5 text-[#545458]" />
            <input
              type="text"
              placeholder="بحث باسم التاجر أو الهاتف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333333] pr-9 pl-3 py-1.5 text-white text-xs outline-none focus:border-[#FF0000]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8E8E93] text-[11px]">المندوب التجاري:</span>
            <select
              value={selectedCommercial}
              onChange={e => setSelectedCommercial(e.target.value)}
              className="bg-[#1A1A1A] border border-[#333333] px-2.5 py-1 text-white text-xs"
            >
              <option value="all">كافة المندوبين</option>
              {COMMERCIAL_TEAM.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-[11px] text-[#8E8E93] font-mono-data">
          العدد في هذا النطاق: <strong className="text-white">{filtered.length}</strong>
        </span>
      </div>

      {/* Follow-Ups List (Section 17) */}
      <div className="space-y-3">
        {filtered.map(item => {
          const matchingProspect = prospects.find(p => p.id === item.prospect_id);
          const cleanPhone = item.phone.replace(/[^0-9]/g, '');

          return (
            <div
              key={item.id}
              className={`p-4 border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                timeframe === 'overdue'
                  ? 'bg-[#181313] border-red-900/50'
                  : 'bg-[#141414] border-[#262626] hover:border-[#333333]'
              }`}
            >
              {/* Left / Main Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    onClick={() => matchingProspect && onSelectProspect(matchingProspect)}
                    className="font-bold text-white text-sm hover:text-[#FF0000] cursor-pointer"
                  >
                    {item.prospect_name}
                  </h4>
                  <span className="font-mono text-emerald-400 font-bold">{item.phone}</span>
                  <span className="text-[10px] px-2 py-0.2 bg-[#222222] text-[#8E8E93] font-mono">
                    {item.expediteur_status}
                  </span>
                </div>

                <div className="text-[11px] text-[#8E8E93] flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-data">
                  <span className="flex items-center gap-1 text-white">
                    <MapPin size={12} className="text-[#FF0000]" />
                    <span>ولاية {item.wilaya}</span>
                  </span>
                  <span>المندوب: <strong className="text-neutral-200">{item.commercial_name}</strong></span>
                  <span>الموعد المحدد: <strong className="text-amber-400">{item.scheduled_date} {item.scheduled_time && `(${item.scheduled_time})`}</strong></span>
                  {item.last_call_result && (
                    <span>آخر نتيجة: <strong className="text-white">{item.last_call_result}</strong></span>
                  )}
                </div>

                <p className="text-neutral-300 text-xs bg-[#1A1A1A] p-2 border border-[#2A2A2A] leading-relaxed">
                  {item.reason}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {matchingProspect && (
                  <button
                    onClick={() => setCallingProspect(matchingProspect)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    <PhoneCall size={13} />
                    <span>اتصال وتسجيل النتيجة</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-[#25D366] text-black hover:opacity-90"
                  title="محادثة واتساب"
                >
                  <MessageCircle size={15} />
                </a>

                <button
                  onClick={() => handleComplete(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#222222] hover:bg-[#2E2E2E] border border-[#3A3A3A] text-white text-xs"
                  title="وضع علامة مكتمل"
                >
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>اكتملت</span>
                </button>

                {reschedulingId === item.id ? (
                  <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 border border-[#333333]">
                    <input
                      type="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="bg-black text-white text-[10px] p-1 border border-[#444444]"
                    />
                    <button
                      onClick={() => handleReschedule(item.id)}
                      className="px-2 py-1 bg-[#FF0000] text-white text-[10px] font-bold"
                    >
                      تأكيد
                    </button>
                    <button
                      onClick={() => setReschedulingId(null)}
                      className="px-1 text-[#8E8E93] text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setReschedulingId(item.id);
                      setNewDate(item.scheduled_date);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#333333] text-[#8E8E93] hover:text-white text-xs"
                  >
                    <RotateCcw size={12} />
                    <span>إعادة جدولة</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-[#141414] border border-[#262626] text-[#8E8E93]">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="font-bold text-white text-sm">لا توجد مواعيد متابعة مستحقة في هذا النطاق الزمني!</p>
            <p className="text-xs text-[#545458] mt-1">كافة المتابعات تم إنجازها بنجاح أو لم يتم تحديد مواعيد متأخرة.</p>
          </div>
        )}
      </div>

      {/* Call Dialog */}
      {callingProspect && (
        <CallModal
          prospect={callingProspect}
          onClose={() => setCallingProspect(null)}
          onCallLogged={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
