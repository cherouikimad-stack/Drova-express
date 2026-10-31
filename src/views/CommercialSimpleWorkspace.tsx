/**
 * DROVA Express — Simplified Commercial Field Workspace (Role: Commercial)
 * Implements Architecture Upgrade Sections 1, 5, 6, 7, 8, 9, 10, 11, 36
 * Features:
 * - Smart 20-Call Daily Priority Queue (Top 20 calls today / COMMENCER LES APPELS)
 * - Accueil (Dashboard KPIs & Urgent Call Launcher)
 * - Mes Prospects (Assigned merchants to call)
 * - Mes Expéditeurs (Assigned shippers)
 * - Reactivation Candidates (Inactive Shippers with >30 days inactivity)
 * - Appels (Call history with Confirmed/Unconfirmed indicator)
 * - Suivis (Follow-up queue)
 * - Signaler une information (Feedback to Marketing)
 */
import React, { useState } from 'react';
import {
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  MessageCircle,
  Building,
  MapPin,
  Flag,
  User,
  Flame,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Save,
  AlertCircle,
  Play,
  SkipForward,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { storage } from '../services/storage';
import { i18n } from '../services/i18n';
import { Prospect, ExpediteurProfile, CallResult, ProspectStatus, ReactivationCandidate } from '../types';
import { CallModal } from '../components/crm/CallModal';

interface CommercialSimpleWorkspaceProps {
  onRefresh: () => void;
}

export const CommercialSimpleWorkspace: React.FC<CommercialSimpleWorkspaceProps> = ({
  onRefresh,
}) => {
  const session = storage.getUserSession();
  const prospects = storage.getProspects();
  const expediteurs = storage.getExpediteurs();
  const allCalls = storage.getAllCalls();
  const allFollowUps = storage.getAllFollowUps();
  const reactivationCandidates = storage.getReactivationCandidates();

  const [activeTab, setActiveTab] = useState<'home' | 'prospects' | 'expediteurs' | 'reactivation' | 'calls' | 'followups' | 'profile'>('home');

  // Calling modal
  const [callingProspect, setCallingProspect] = useState<Prospect | null>(null);

  // Smart 20 Call Queue Runner
  const [showQueueRunner, setShowQueueRunner] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  // Feedback to marketing modal
  const [feedbackProspect, setFeedbackProspect] = useState<Prospect | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<'wrong_phone' | 'business_closed' | 'high_volume_vip' | 'general'>('wrong_phone');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Filter only assigned to logged in commercial (unless management)
  const isElevated = session.role === 'super_admin' || session.role === 'commercial_manager';

  const myProspects = prospects.filter(p =>
    isElevated || p.assigned_commercial === session.name || p.responsible === session.name
  );

  const myExpediteurs = expediteurs.filter(e =>
    isElevated || e.assigned_commercial === session.name || e.commercial_id === session.user_id
  );

  const myCalls = allCalls.filter(c =>
    isElevated || c.commercial_name === session.name || c.commercial_id === session.user_id
  );

  const myFollowUps = allFollowUps.filter(f =>
    isElevated || f.commercial_name === session.name
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const callsDueToday = myProspects.filter(p =>
    p.status === 'جاهز للاتصال' || p.status === 'جديد' || p.status === 'لم يرد' || p.call_priority === 'URGENT'
  );

  const followupsToday = myFollowUps.filter(f =>
    f.status !== 'completed' && f.scheduled_date <= todayStr
  );

  const interestedCount = myProspects.filter(p => p.status === 'مهتم' || p.status === 'مهتم - متابعة').length;
  const activeExpCount = myExpediteurs.filter(e => e.commercial_status === 'نشط' || e.lifecycle_status === 'نشط').length;
  const expediteursToReactivate = reactivationCandidates.length;

  // Build the Top 20 Prioritized Smart Call Queue
  const buildTop20Queue = (): Prospect[] => {
    const list: Prospect[] = [];

    // 1. Overdue or due today follow-up prospects
    const followUpProspectIds = new Set(followupsToday.map(f => f.prospect_id));
    myProspects.filter(p => followUpProspectIds.has(p.id)).forEach(p => list.push(p));

    // 2. Urgent priority prospects
    myProspects.filter(p => p.call_priority === 'URGENT' && !list.some(x => x.id === p.id)).forEach(p => list.push(p));

    // 3. A+ scored leads
    myProspects.filter(p => p.score === 'A+' && !list.some(x => x.id === p.id)).forEach(p => list.push(p));

    // 4. A scored leads
    myProspects.filter(p => p.score === 'A' && !list.some(x => x.id === p.id)).forEach(p => list.push(p));

    // 5. Fill remaining up to 20
    myProspects.filter(p => !list.some(x => x.id === p.id) && (p.status === 'جاهز للاتصال' || p.status === 'جديد' || p.status === 'لم يرد'))
      .forEach(p => {
        if (list.length < 20) list.push(p);
      });

    return list.slice(0, 20);
  };

  const top20Queue = buildTop20Queue();

  const handleStartQueue = () => {
    setQueueIndex(0);
    setShowQueueRunner(true);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackProspect || !feedbackValue.trim()) return;

    storage.submitCommercialFeedback({
      commercial_name: session.name,
      prospect_id: feedbackProspect.id,
      prospect_name: feedbackProspect.name,
      category: feedbackCategory,
      reported_value: feedbackValue.trim(),
    });

    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackProspect(null);
      setFeedbackValue('');
      onRefresh();
    }, 1500);
  };

  const currentQueueProspect = top20Queue[queueIndex];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-xs">
      {/* Top Commercial Header */}
      <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#FF0000] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-red-950/40">
            {session.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{session.name}</h2>
              <span className="px-2 py-0.5 bg-neutral-800 text-[10px] uppercase font-mono text-neutral-300 border border-neutral-700">
                {session.role}
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {i18n.t('commercial.profile') || 'الملف المهني'}: {session.email} · {session.phone || '+213550112233'}
            </p>
          </div>
        </div>

        {/* Large Primary Action: COMMENCER LES APPELS (Section 6) */}
        <button
          onClick={handleStartQueue}
          className="flex items-center gap-2.5 px-6 py-3 bg-[#FF0000] hover:bg-[#E00000] text-white text-sm font-black shadow-lg shadow-red-950/50 transition-all uppercase tracking-wider cursor-pointer"
        >
          <Play size={18} fill="currentColor" />
          <span>{i18n.t('commercial.start_calls') || 'بدء الاتصالات الذكية (Top 20)'}</span>
        </button>
      </div>

      {/* Commercial Workspace Navigation Tabs */}
      <div className="flex border-b border-[#262626] bg-[#141414] text-xs font-medium overflow-x-auto">
        {[
          { id: 'home', label: i18n.t('commercial.home') || 'الرئيسية' },
          { id: 'prospects', label: `${i18n.t('commercial.my_prospects') || 'تجار الحقيبة'} (${myProspects.length})` },
          { id: 'expediteurs', label: `${i18n.t('commercial.my_expediteurs') || 'شاحنو DROVA'} (${myExpediteurs.length})` },
          { id: 'reactivation', label: `إعادة التفعيل (${reactivationCandidates.length})` },
          { id: 'followups', label: `${i18n.t('commercial.followups') || 'المتابعات'} (${myFollowUps.length})` },
          { id: 'calls', label: `${i18n.t('commercial.calls') || 'المكالمات'} (${myCalls.length})` },
          { id: 'profile', label: i18n.t('commercial.profile') || 'الملف' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? 'border-[#FF0000] text-white font-bold bg-[#1C1C1C]'
                : 'border-transparent text-[#8E8E93] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HOME */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-4 bg-[#141414] border border-red-900/50 space-y-1">
              <span className="text-xs text-[#8E8E93] block">{i18n.t('commercial.today_calls_due') || 'اتصالات مستحقة اليوم'}</span>
              <span className="text-2xl font-bold font-mono text-[#FF0000] block">{callsDueToday.length}</span>
              <span className="text-[10px] text-red-400">مرشحون بانتظار الاتصال الأول</span>
            </div>

            <div className="p-4 bg-[#141414] border border-amber-900/50 space-y-1">
              <span className="text-xs text-[#8E8E93] block">{i18n.t('commercial.today_followups') || 'متابعات مستحقة'}</span>
              <span className="text-2xl font-bold font-mono text-amber-400 block">{followupsToday.length}</span>
              <span className="text-[10px] text-amber-500">مواعيد مستحقة اليوم أو متأخرة</span>
            </div>

            <div className="p-4 bg-[#141414] border border-[#262626] space-y-1">
              <span className="text-xs text-[#8E8E93] block">{i18n.t('commercial.awaiting_reply') || 'بانتظار الرد'}</span>
              <span className="text-2xl font-bold font-mono text-blue-400 block">
                {myProspects.filter(p => p.status === 'لم يرد' || p.status === 'طلب معلومات').length}
              </span>
              <span className="text-[10px] text-blue-500">تم إرسال العرض بانتظار الرد</span>
            </div>

            <div className="p-4 bg-[#141414] border border-[#262626] space-y-1">
              <span className="text-xs text-[#8E8E93] block">{i18n.t('commercial.interested') || 'تجار مهتمون'}</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 block">{interestedCount}</span>
              <span className="text-[10px] text-emerald-500">مرشحون للإغلاق والتفعيل</span>
            </div>

            <div className="p-4 bg-[#141414] border border-[#262626] space-y-1">
              <span className="text-xs text-[#8E8E93] block">{i18n.t('commercial.active_expediteurs') || 'شاحنون نشطون'}</span>
              <span className="text-2xl font-bold font-mono text-purple-400 block">{activeExpCount}</span>
              <span className="text-[10px] text-purple-500">يشحنون طروداً بانتظام</span>
            </div>

            <div className="p-4 bg-[#141414] border border-[#262626] space-y-1">
              <span className="text-xs text-[#8E8E93] block">مرشحو إعادة التفعيل</span>
              <span className="text-2xl font-bold font-mono text-amber-400 block">{expediteursToReactivate}</span>
              <span className="text-[10px] text-amber-500">شاحنون انقطعوا عن الشحن 30+ يوم</span>
            </div>
          </div>

          {/* Top 20 Call Queue Card */}
          <div className="bg-[#141414] border border-[#262626] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flame size={15} className="text-[#FF0000]" />
                <span>طابور أفضل 20 مكالمة لليوم (Smart Daily Queue - {top20Queue.length} تجار)</span>
              </h3>
              <button
                onClick={handleStartQueue}
                className="px-3 py-1 bg-red-950/80 hover:bg-[#FF0000] text-red-200 hover:text-white border border-red-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Play size={12} fill="currentColor" />
                <span>بدء الطابور المتسلسل</span>
              </button>
            </div>

            <div className="divide-y divide-[#222222]">
              {top20Queue.slice(0, 8).map((prospect, idx) => (
                <div key={prospect.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 bg-[#222222] text-[#8E8E93] font-mono font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{prospect.name}</span>
                        <span className="text-[10px] font-mono px-1 bg-red-950 text-red-400 border border-red-900/50">
                          {prospect.score}
                        </span>
                        <span className="text-[10px] text-neutral-400">{prospect.wilaya}</span>
                      </div>
                      <div className="text-[11px] text-[#8E8E93] mt-0.5">
                        {prospect.product} · {prospect.parcel_estimate} طرد/يوم · {prospect.current_courier}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-emerald-400 font-bold">{prospect.phone}</span>
                    <button
                      onClick={() => setCallingProspect(prospect)}
                      className="px-3 py-1 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <PhoneCall size={12} />
                      <span>اتصال</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MES PROSPECTS */}
      {activeTab === 'prospects' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#262626] p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              قائمة التجار الموجهة لي للاتصال ({myProspects.length})
            </h3>

            <div className="divide-y divide-[#222222]">
              {myProspects.map(prospect => (
                <div key={prospect.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#181818] p-2 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{prospect.name}</span>
                      <span className="px-1.5 py-0.2 bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                        {prospect.score}
                      </span>
                      <span className="px-1.5 py-0.2 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px]">
                        {prospect.status}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {prospect.wilaya}
                      </span>
                    </div>

                    <div className="text-[#8E8E93] text-[11px] flex items-center gap-2 flex-wrap">
                      <span>السلع: {prospect.product}</span>
                      <span>·</span>
                      <span>الشركة الحالية: {prospect.current_courier}</span>
                      <span>·</span>
                      <span>التقدير: {prospect.parcel_estimate} طرد</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-emerald-400 font-bold ml-2">{prospect.phone}</span>

                    <button
                      onClick={() => setCallingProspect(prospect)}
                      className="px-3 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <PhoneCall size={12} />
                      <span>اتصال</span>
                    </button>

                    <button
                      onClick={() => setFeedbackProspect(prospect)}
                      className="p-1.5 bg-[#1F1F1F] hover:bg-[#282828] border border-[#333333] text-neutral-400 hover:text-amber-400 cursor-pointer"
                      title="الإبلاغ عن معلومة جديدة للتسويق"
                    >
                      <Flag size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REACTIVATION CANDIDATES */}
      {activeTab === 'reactivation' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#262626] p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <RotateCcw size={15} className="text-amber-400" />
              <span>محرك إعادة التفعيل للشاحنين المتوقفين (Reactivation Engine)</span>
            </h3>
            <p className="text-[11px] text-[#8E8E93] mb-4">
              شاحنون معتمدون توقفوا عن الشحن لمدة تزيد عن 30 يوماً أو بحاجة لتعديل تسعيرة لاستعادة نشاطهم
            </p>

            <div className="divide-y divide-[#222222]">
              {reactivationCandidates.map(c => (
                <div key={c.expediteur_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181818] p-2 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{c.business_name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold ${
                        c.priority === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400'
                      }`}>
                        أولوية {c.priority}
                      </span>
                      <span className="text-[10px] text-[#8E8E93]">{c.wilaya}</span>
                    </div>
                    <div className="text-[11px] text-[#8E8E93]">
                      مدة التوقف: <span className="text-amber-400 font-bold font-mono">{c.days_inactive} يوم</span> · الحجم السابق: {c.previous_volume_range} طرد · السبب: {c.reason}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-emerald-400 font-bold">{c.phone}</span>
                    <a
                      href={`tel:${c.phone}`}
                      className="px-3 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <PhoneCall size={12} />
                      <span>اتصال استعادة</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MES EXPEDITEURS */}
      {activeTab === 'expediteurs' && (
        <div className="bg-[#141414] border border-[#262626] p-4 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            الشاحنون المسندون لمتابعتي ({myExpediteurs.length})
          </h3>

          <div className="divide-y divide-[#222222]">
            {myExpediteurs.map(exp => (
              <div key={exp.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#181818] p-2 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{exp.business_name}</span>
                    <span className="font-mono text-[10px] text-[#8E8E93]">{exp.id}</span>
                    <span className="px-1.5 py-0.2 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px]">
                      {exp.commercial_status}
                    </span>
                  </div>
                  <div className="text-[#8E8E93] text-[11px] mt-0.5">
                    {exp.wilaya} · الشحنات: {exp.shipments_count || 0} طرد · آخر تواصل: {exp.last_contact_date || 'لم يتم'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold">{exp.phone}</span>
                  <a
                    href={`tel:${exp.phone}`}
                    className="px-3 py-1 bg-[#FF0000] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PhoneCall size={12} />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUIVIS */}
      {activeTab === 'followups' && (
        <div className="bg-[#141414] border border-[#262626] p-4 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            مواعيد المتابعة وإعادة الاتصال الخاصة بي ({myFollowUps.length})
          </h3>

          <div className="divide-y divide-[#222222]">
            {myFollowUps.map(f => (
              <div key={f.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{f.prospect_name}</span>
                    <span className="font-mono text-amber-400 font-bold">{f.scheduled_date} {f.scheduled_time || ''}</span>
                  </div>
                  <p className="text-[11px] text-[#8E8E93]">{f.reason}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] ${f.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {f.status === 'completed' ? 'مكتملة' : 'معلقة'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: APPELS */}
      {activeTab === 'calls' && (
        <div className="bg-[#141414] border border-[#262626] p-4 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            سجل اتصالاتي المسجلة ({myCalls.length})
          </h3>

          <div className="divide-y divide-[#222222]">
            {myCalls.map(c => (
              <div key={c.id} className="py-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{c.call_result}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      c.is_confirmed_contact ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {c.is_confirmed_contact ? 'تواصل مؤكد' : 'دون رد'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#8E8E93]">{c.date.slice(0, 10)} {c.time}</span>
                </div>
                <p className="text-neutral-300 text-[11px]">{c.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#141414] border border-[#262626] p-6 space-y-4 max-w-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            بيانات الحساب التجاري
          </h3>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[#8E8E93] block">الاسم التجاري:</span>
              <span className="text-white font-bold">{session.name}</span>
            </div>
            <div>
              <span className="text-[#8E8E93] block">الدور الوظيفي:</span>
              <span className="text-white font-mono">{session.role}</span>
            </div>
            <div>
              <span className="text-[#8E8E93] block">البريد الإلكتروني:</span>
              <span className="text-white font-mono">{session.email}</span>
            </div>
            <div>
              <span className="text-[#8E8E93] block">رقم الهاتف:</span>
              <span className="text-emerald-400 font-mono">{session.phone || '+213550112233'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Smart Top 20 Call Queue Runner Modal */}
      {showQueueRunner && currentQueueProspect && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2E2E2E] w-full max-w-xl p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#FF0000] text-white flex items-center justify-center font-bold">
                  {queueIndex + 1}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    طابور المكالمات الذكي (مكالمة {queueIndex + 1} من {top20Queue.length})
                  </h4>
                  <p className="text-[10px] text-[#8E8E93]">تسلسل الأولويات اليومية الموصى به</p>
                </div>
              </div>
              <button onClick={() => setShowQueueRunner(false)} className="text-[#8E8E93] hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Current Prospect Card */}
            <div className="bg-[#1C1C1C] border border-[#333333] p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{currentQueueProspect.name}</span>
                    <span className="px-2 py-0.5 bg-red-950 text-[#FF0000] font-mono text-xs border border-red-900">
                      {currentQueueProspect.score}
                    </span>
                  </h3>
                  <p className="text-[#A1A1AA] text-xs mt-0.5">{currentQueueProspect.product}</p>
                </div>
                <span className="text-xs text-white bg-[#262626] px-2 py-1 font-mono">
                  {currentQueueProspect.wilaya} · {currentQueueProspect.commune}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#2A2A2A]">
                <div>
                  <span className="text-[#8E8E93] block">الهاتف:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">{currentQueueProspect.phone}</span>
                </div>
                <div>
                  <span className="text-[#8E8E93] block">الشركة الحالية:</span>
                  <span className="text-amber-400">{currentQueueProspect.current_courier}</span>
                </div>
              </div>
            </div>

            {/* Queue Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={queueIndex === 0}
                  onClick={() => setQueueIndex(queueIndex - 1)}
                  className="px-3 py-1.5 bg-[#222222] text-[#8E8E93] hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <ChevronRight size={14} />
                  <span>السابق</span>
                </button>
                <button
                  type="button"
                  disabled={queueIndex >= top20Queue.length - 1}
                  onClick={() => setQueueIndex(queueIndex + 1)}
                  className="px-3 py-1.5 bg-[#222222] text-[#8E8E93] hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCallingProspect(currentQueueProspect)}
                className="px-5 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold flex items-center gap-2 shadow-md shadow-red-950/40 cursor-pointer"
              >
                <PhoneCall size={14} />
                <span>بدء الاتصال وتسجيل النتيجة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {callingProspect && (
        <CallModal
          prospect={callingProspect}
          onClose={() => setCallingProspect(null)}
          onCallLogged={() => {
            setCallingProspect(null);
            onRefresh();
            // If in queue runner, advance to next
            if (showQueueRunner && queueIndex < top20Queue.length - 1) {
              setQueueIndex(queueIndex + 1);
            }
          }}
        />
      )}

      {/* Field Feedback Modal */}
      {feedbackProspect && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2E2E2E] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Flag size={16} className="text-amber-400" />
                <span>الإبلاغ عن معلومة جديدة للتسويق (Signaler)</span>
              </h3>
              <button onClick={() => setFeedbackProspect(null)} className="text-[#8E8E93] hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSendFeedback} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">نوع المعلومة المكتشفة:</label>
                <select
                  value={feedbackCategory}
                  onChange={e => setFeedbackCategory(e.target.value as any)}
                  className="w-full bg-[#181818] border border-[#333333] p-2 text-white text-xs"
                >
                  <option value="wrong_phone">تصحيح رقم هاتف خاطئ</option>
                  <option value="business_closed">النشاط التجاري مغلق أو غير موجود</option>
                  <option value="high_volume_vip">تاجر ضخم VIP (أكثر من 50 طرد يومياً)</option>
                  <option value="general">ملاحظة عامة عن المقر أو النشاط</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-300 block mb-1">تفاصيل المعلومة:</label>
                <textarea
                  rows={3}
                  required
                  value={feedbackValue}
                  onChange={e => setFeedbackValue(e.target.value)}
                  placeholder="سجل التفاصيل بدقة للتحقق منها من قبل فريق الإدارة..."
                  className="w-full bg-[#181818] border border-[#333333] p-2 text-white text-xs resize-none"
                />
              </div>

              {feedbackSent && (
                <div className="p-2 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs text-center font-bold">
                  تم إرسال الإشعار لفريق التسويق والإدارة بنجاح!
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setFeedbackProspect(null)}
                  className="px-3 py-1.5 text-xs text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold cursor-pointer"
                >
                  إرسال الإشعار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
