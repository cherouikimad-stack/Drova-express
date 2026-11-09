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
import React, { useState, useEffect } from 'react';
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
  X,
  TrendingUp,
  Target,
  Activity,
  AlertTriangle,
  BarChart3,
  UserPlus
} from 'lucide-react';
import { storage } from '../services/storage';
import { i18n } from '../services/i18n';
import { Prospect, ExpediteurProfile, CallResult, ProspectStatus, ReactivationCandidate } from '../types';
import { CallModal } from '../components/crm/CallModal';
import { AddMerchantManualModal } from '../components/AddMerchantManualModal';

interface CommercialSimpleWorkspaceProps {
  onRefresh: () => void;
}

export const CommercialSimpleWorkspace: React.FC<CommercialSimpleWorkspaceProps> = ({
  onRefresh,
}) => {
  const [session, setSession] = useState(() => storage.getUserSession());
  const [prospects, setProspects] = useState<Prospect[]>(() => storage.getProspects());
  const [expediteurs, setExpediteurs] = useState(() => storage.getExpediteurs());
  const [allCalls, setAllCalls] = useState(() => storage.getAllCalls());
  const [allFollowUps, setAllFollowUps] = useState(() => storage.getAllFollowUps());
  const [reactivationCandidates, setReactivationCandidates] = useState(() => storage.getReactivationCandidates());
  const [myPerformance, setMyPerformance] = useState(() => storage.getCommercialUserPerformance(session.username || session.name, 'all'));

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      const s = storage.getUserSession();
      setSession(s);
      setProspects(storage.getProspects());
      setExpediteurs(storage.getExpediteurs());
      setAllCalls(storage.getAllCalls());
      setAllFollowUps(storage.getAllFollowUps());
      setReactivationCandidates(storage.getReactivationCandidates());
      setMyPerformance(storage.getCommercialUserPerformance(s.username || s.name, 'all'));
    });
    return () => unsub();
  }, [session.username, session.name]);

  const [activeTab, setActiveTab] = useState<'home' | 'prospects' | 'expediteurs' | 'reactivation' | 'calls' | 'followups' | 'performance' | 'profile'>('home');

  // Calling modal
  const [callingProspect, setCallingProspect] = useState<Prospect | null>(null);

  // Smart 20 Call Queue Runner
  const [showQueueRunner, setShowQueueRunner] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  // Manual Merchant Entry Modal
  const [showAddMerchantModal, setShowAddMerchantModal] = useState(false);

  // Feedback to marketing modal
  const [feedbackProspect, setFeedbackProspect] = useState<Prospect | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState<'wrong_phone' | 'business_closed' | 'high_volume_vip' | 'other'>('wrong_phone');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Filter only assigned to logged in commercial (unless management)
  const isElevated = session.role === 'super_admin' || session.role === 'commercial_manager';

  const myProspects = prospects.filter(p => {
    if (isElevated) return true;
    const sName = (session.name || '').toLowerCase();
    const sUser = (session.username || '').toLowerCase();
    const sId = (session.user_id || '').toLowerCase();

    const pAssigned = (p.assigned_commercial || '').toLowerCase();
    const pResp = (p.responsible || '').toLowerCase();
    const pAdded = (p.added_by || '').toLowerCase();
    const pCreator = (p.creator_id || '').toLowerCase();

    return (
      (sName && (pAssigned === sName || pResp === sName || pAdded === sName)) ||
      (sUser && (pAssigned === sUser || pResp === sUser || pAdded === sUser)) ||
      (sId && (pCreator === sId || (p as any).assigned_commercial_id === sId))
    );
  });

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

  // Daily Goal Targets & Current Progress
  const DAILY_CALL_TARGET = 20;
  const DAILY_CONVERSION_TARGET = 3;
  const callsTodayCount = myCalls.filter(c => {
    const time = c.date || (c as any).created_at || '';
    return time.startsWith(todayStr);
  }).length;

  const conversionsTodayCount = myCalls.filter(c => {
    const time = c.date || (c as any).created_at || '';
    if (!time.startsWith(todayStr)) return false;
    const res = (c.call_result || '').toLowerCase();
    return res.includes('مهتم') || res.includes('موافقة') || res.includes('اتفاق') || res.includes('interess') || res.includes('valid');
  }).length;

  const callProgressPct = Math.min(100, Math.round((callsTodayCount / DAILY_CALL_TARGET) * 100));
  const convProgressPct = Math.min(100, Math.round((conversionsTodayCount / DAILY_CONVERSION_TARGET) * 100));

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
      commercial_id: session.user_id || 'usr_commercial',
      commercial_name: session.name,
      prospect_id: feedbackProspect.id,
      prospect_name: feedbackProspect.name,
      category: feedbackCategory,
      field_name: feedbackCategory === 'wrong_phone' ? 'phone' : 'general',
      reported_value: feedbackValue.trim(),
      notes: feedbackValue.trim(),
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

        {/* Primary Actions: Manual Entry & Call Queue */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddMerchantModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all uppercase tracking-wider cursor-pointer"
          >
            <UserPlus size={16} />
            <span>+ إضافة تاجر يدوياً</span>
          </button>

          <button
            onClick={handleStartQueue}
            className="flex items-center gap-2.5 px-5 py-3 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-black shadow-lg shadow-red-950/50 transition-all uppercase tracking-wider cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>{i18n.t('commercial.start_calls') || 'بدء الاتصالات الذكية (Top 20)'}</span>
          </button>
        </div>
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
          { id: 'performance', label: `تقييم أدائي (${myPerformance.score} نقطة)` },
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
          {/* Real Commercial Performance Banner */}
          <div className="p-4 bg-gradient-to-r from-[#181818] via-[#1C1616] to-[#181818] border border-red-950/70 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-950/70 border border-[#FF0000]/40 flex flex-col items-center justify-center shrink-0">
                <span className="text-xl font-black font-mono text-[#FF0000] leading-none">{myPerformance.score}</span>
                <span className="text-[10px] text-neutral-300 font-bold mt-0.5">{myPerformance.rank}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Award size={16} className="text-[#FF0000]" />
                    <span>معدل الأداء الفعلي (Call Activity Scoring)</span>
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-[#262626] text-neutral-300">
                    التقييم: {myPerformance.rank} ({myPerformance.rankTitle})
                  </span>
                </div>
                <p className="text-xs text-[#8E8E93] mt-1">
                  نسبة الاتصال الفعلي: <span className="text-emerald-400 font-bold font-mono">{myPerformance.contactRate}%</span> ({myPerformance.contacted} تم الاتصال من أصل {myPerformance.assigned} معين) · <span className="text-red-400 font-mono font-bold">{myPerformance.notContacted}</span> تاجر لم يتم الاتصال بهم إطلاقاً.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('performance')}
              className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-white border border-[#333333] hover:border-red-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>تقرير أدائي الكامل</span>
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Commercial Daily Goal Widget — Circular Progress Indicators */}
          <div className="p-5 bg-[#141414] border border-[#262626] shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Info & Guidance */}
              <div className="space-y-2 text-center lg:text-right flex-1">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <div className="p-1.5 bg-red-950/60 border border-red-800 text-[#FF0000]">
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">الهدف التجاري اليومي (Commercial Daily Goal)</h3>
                    <p className="text-[11px] text-[#A1A1AA]">تتبع فوري لمعدل إنجاز المكالمات وكوتا تحويل التجار لهذا اليوم</p>
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-3 pt-1">
                  <span className={`px-2.5 py-1 text-[11px] font-bold border ${
                    callsTodayCount >= DAILY_CALL_TARGET
                      ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                      : callsTodayCount >= 10
                      ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                      : 'bg-red-950/60 border-red-900 text-red-300'
                  }`}>
                    {callsTodayCount >= DAILY_CALL_TARGET
                      ? '✓ تم إنجاز هدف المكالمات اليومي بالكامل!'
                      : `متبقي ${DAILY_CALL_TARGET - callsTodayCount} مكالمة لإتمام هدف اليوم`}
                  </span>

                  <span className="text-[11px] text-[#71717A] hidden sm:inline">
                    تاريخ اليوم: {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Circular Indicators */}
              <div className="flex items-center gap-6 sm:gap-8">
                {/* 1. Calls Progress Circle */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#262626"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#FF0000"
                        strokeWidth="7"
                        strokeDasharray={238.76}
                        strokeDashoffset={238.76 - (callProgressPct / 100) * 238.76}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-lg font-black font-mono text-white leading-none">{callsTodayCount}</span>
                      <span className="text-[9px] text-[#8E8E93] font-mono mt-0.5">من {DAILY_CALL_TARGET}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-white block">مكالمات اليوم</span>
                    <span className="text-[10px] font-mono text-[#FF0000] font-bold">{callProgressPct}%</span>
                  </div>
                </div>

                {/* 2. Conversions Progress Circle */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#262626"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#10B981"
                        strokeWidth="7"
                        strokeDasharray={238.76}
                        strokeDashoffset={238.76 - (convProgressPct / 100) * 238.76}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-lg font-black font-mono text-white leading-none">{conversionsTodayCount}</span>
                      <span className="text-[9px] text-[#8E8E93] font-mono mt-0.5">من {DAILY_CONVERSION_TARGET}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-white block">كوتا التحويل</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{convProgressPct}%</span>
                  </div>
                </div>

                {/* Quick Launch CTA */}
                {callsTodayCount < DAILY_CALL_TARGET && (
                  <button
                    onClick={handleStartQueue}
                    className="hidden xl:flex flex-col items-center justify-center px-4 py-3 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold text-xs shadow-lg shadow-red-950/40 transition-all cursor-pointer gap-1"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>متابعة الاتصالات</span>
                  </button>
                )}
              </div>
            </div>
          </div>

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
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  قائمة التجار الموجهة لي للاتصال ({myProspects.length})
                </h3>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  تجار أضفتهم يدوياً: <span className="text-emerald-400 font-bold font-mono">{myPerformance.manuallyAddedCount || 0}</span> تاجر · إجمالي القائمة: <span className="text-white font-mono">{myProspects.length}</span>
                </p>
              </div>

              <button
                onClick={() => setShowAddMerchantModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <UserPlus size={14} />
                <span>+ إضافة تاجر يدوياً</span>
              </button>
            </div>

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

      {/* TAB: COMMERCIAL PERFORMANCE & CALL ACTIVITY SCORING */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#141414] border border-[#262626] p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222222] pb-5">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 flex flex-col items-center justify-center font-black font-mono border ${
                  myPerformance.score >= 80 ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400' :
                  myPerformance.score >= 65 ? 'bg-blue-950/60 border-blue-500 text-blue-400' :
                  myPerformance.score >= 50 ? 'bg-amber-950/60 border-amber-500 text-amber-400' :
                  'bg-red-950/60 border-red-500 text-red-400'
                }`}>
                  <span className="text-2xl leading-none">{myPerformance.score}</span>
                  <span className="text-[10px] mt-0.5">{myPerformance.rank}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Award size={18} className="text-[#FF0000]" />
                      <span>بطاقة تقييم الأداء التجاري — {myPerformance.name}</span>
                    </h3>
                    <span className="px-2 py-0.5 bg-[#222222] text-[#8E8E93] text-xs font-mono font-bold">
                      التقييم: {myPerformance.rank} ({myPerformance.rankTitle})
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    تقييم آلي رسمي يستند حصراً إلى سجلات المكالمات الفعلية وتوثيق CRM لمنع احتساب التعيين كاتصال دون إجراء مكالمة حقيقية.
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono bg-[#181818] border border-[#2E2E2E] p-3 text-neutral-300 space-y-1">
                <div>الحقيبة المعينة: <strong className="text-white">{myPerformance.assigned} تاجر</strong></div>
                <div>تم الاتصال الفعلي: <strong className="text-emerald-400">{myPerformance.contacted} تاجر ({myPerformance.contactRate}%)</strong></div>
                <div>لم يتم الاتصال: <strong className="text-red-400">{myPerformance.notContacted} تاجر</strong></div>
              </div>
            </div>

            {/* 6-Factor Score Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={14} className="text-[#FF0000]" />
                <span>المعايير المعتمدة في احتساب النقاط (100 نقطة)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-[#181818] border border-[#282828] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">1. نشاط الاتصال الفعلي (25%)</span>
                    <span className="font-mono font-bold text-white">{myPerformance.contactRate}%</span>
                  </div>
                  <div className="h-1.5 bg-[#262626] overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, myPerformance.contactRate)}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8E8E93]">
                    <span>تم الاتصال: <b className="text-white font-mono">{myPerformance.contacted}</b></span>
                    <span>لم يتصل: <b className="text-red-400 font-mono">{myPerformance.notContacted}</b></span>
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#282828] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">2. نجاح التواصل مع التاجر (20%)</span>
                    <span className="font-mono font-bold text-white">{myPerformance.successfulContactRate}%</span>
                  </div>
                  <div className="h-1.5 bg-[#262626] overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, myPerformance.successfulContactRate)}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8E8E93]">
                    <span>مكالمات ناجحة: <b className="text-white font-mono">{myPerformance.successfulCalls}</b></span>
                    <span>إجمالي المحاولات: <b className="text-neutral-300 font-mono">{myPerformance.totalCalls}</b></span>
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#282828] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">3. تأكيد التجار للخدمة (20%)</span>
                    <span className="font-mono font-bold text-white">{myPerformance.confirmedRate}%</span>
                  </div>
                  <div className="h-1.5 bg-[#262626] overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, myPerformance.confirmedRate * 2.5)}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8E8E93]">
                    <span>تجار مؤكدون: <b className="text-emerald-400 font-mono">{myPerformance.confirmedCount}</b></span>
                    <span>مهتمون بالخدمة: <b className="text-neutral-300 font-mono">{myPerformance.interestedCount}</b></span>
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#282828] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">4. التحويل إلى شاحن DROVA (15%)</span>
                    <span className="font-mono font-bold text-white">{myPerformance.expediteurConversionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-[#262626] overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, myPerformance.expediteurConversionRate * 3)}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8E8E93]">
                    <span>شاحنون فعليون: <b className="text-white font-mono">{myPerformance.expediteursCount}</b></span>
                    <span>شاحنون نشطون VIP: <b className="text-amber-400 font-mono">{myPerformance.activeMerchantsCount}</b></span>
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#282828] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">5. الالتزام بالمتابعات (10%)</span>
                    <span className="font-mono font-bold text-white">{myPerformance.followUpCompletionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-[#262626] overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, myPerformance.followUpCompletionRate)}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8E8E93]">
                    <span>مكتملة: <b className="text-white font-mono">{myPerformance.followUpsCompleted}</b></span>
                    <span>متأخرة: <b className={`font-mono ${myPerformance.followUpsOverdue > 0 ? 'text-red-400 font-bold' : 'text-neutral-400'}`}>{myPerformance.followUpsOverdue}</b></span>
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#282828] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">6. جودة التوثيق والـCRM (10%)</span>
                    <span className="font-mono font-bold text-white">{myPerformance.scoreBreakdown.dataQualityScore}%</span>
                  </div>
                  <div className="h-1.5 bg-[#262626] overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, myPerformance.scoreBreakdown.dataQualityScore * 10)}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8E8E93]">
                    <span>نقاط الجودة: <b className="text-white font-mono">{myPerformance.scoreBreakdown.dataQualityScore} / 10</b></span>
                    <span>إجمالي المكالمات: <b className="text-neutral-300 font-mono">{myPerformance.totalCalls}</b></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 9-Stage Commercial Pipeline Funnel */}
          <div className="bg-[#141414] border border-[#262626] p-6 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={15} className="text-[#FF0000]" />
              <span>مسار التحويل التجاري المتسلسل (9-Stage Conversion Funnel)</span>
            </h4>
            <p className="text-xs text-[#8E8E93]">
              المعينون في الحقيبة لا يتحولون لمرحلة تواصل إلا بعد تسجيل مكالمة CRM فعلية.
            </p>

            <div className="grid grid-cols-3 md:grid-cols-9 gap-2 text-center text-xs">
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <div className="text-[10px] text-[#8E8E93] mb-1">1. المعينون</div>
                <div className="text-lg font-black font-mono text-white">{myPerformance.assigned}</div>
                <div className="text-[9px] text-neutral-500">الحقيبة</div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-red-900/40">
                <div className="text-[10px] text-red-400 mb-1">2. لم يتصل</div>
                <div className="text-lg font-black font-mono text-red-400">{myPerformance.notContacted}</div>
                <div className="text-[9px] text-red-500">يحتاج مكالمة</div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <div className="text-[10px] text-[#8E8E93] mb-1">3. محاولات</div>
                <div className="text-lg font-black font-mono text-blue-400">{myPerformance.totalCalls}</div>
                <div className="text-[9px] text-neutral-500">إجمالي الرنات</div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-emerald-900/40">
                <div className="text-[10px] text-emerald-400 mb-1">4. اتصال فعلي</div>
                <div className="text-lg font-black font-mono text-emerald-400">{myPerformance.contacted}</div>
                <div className="text-[9px] text-emerald-500 font-mono">{myPerformance.contactRate}%</div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <div className="text-[10px] text-[#8E8E93] mb-1">5. مهتمون</div>
                <div className="text-lg font-black font-mono text-cyan-400">{myPerformance.interestedCount}</div>
                <div className="text-[9px] text-neutral-500">مرحلة التفاوض</div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-purple-900/40">
                <div className="text-[10px] text-purple-400 mb-1">6. مؤكدون</div>
                <div className="text-lg font-black font-mono text-purple-400">{myPerformance.confirmedCount}</div>
                <div className="text-[9px] text-purple-500">وافقوا على الشحن</div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <div className="text-[10px] text-[#8E8E93] mb-1">7. قيد التهيئة</div>
                <div className="text-lg font-black font-mono text-indigo-400">{myPerformance.onboardingCount}</div>
                <div className="text-[9px] text-neutral-500">فتح الحساب</div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-amber-900/40">
                <div className="text-[10px] text-amber-400 mb-1">8. شاحن DROVA</div>
                <div className="text-lg font-black font-mono text-amber-400">{myPerformance.expediteursCount}</div>
                <div className="text-[9px] text-amber-500">أول شحنة</div>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-red-900/50">
                <div className="text-[10px] text-[#FF0000] mb-1">9. نشط VIP</div>
                <div className="text-lg font-black font-mono text-[#FF0000]">{myPerformance.activeMerchantsCount}</div>
                <div className="text-[9px] text-neutral-500">شحن منتظم</div>
              </div>
            </div>
          </div>

          {/* Actionable Coaching Tips */}
          <div className="bg-[#141414] border border-[#262626] p-6 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <span>توجيهات ذكية لتحسين أدائك ورفع نقاطك (Actionable Coaching)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {myPerformance.notContacted > 0 && (
                <div className="p-3 bg-red-950/30 border border-red-900/60 text-red-200 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-[#FF0000] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">لديك {myPerformance.notContacted} تاجر لم تتصل بهم أبداً</span>
                    <span className="text-[11px] text-neutral-400">
                      البدء بالاتصال بهؤلاء التجار سيرفع مباشرة نسبة Contact Rate وسيزيد نقاطك الإجمالية حتى 25 نقطة.
                    </span>
                  </div>
                </div>
              )}

              {myPerformance.followUpsOverdue > 0 && (
                <div className="p-3 bg-amber-950/30 border border-amber-900/60 text-amber-200 flex items-start gap-2.5">
                  <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">لديك {myPerformance.followUpsOverdue} مواعيد متابعة متأخرة</span>
                    <span className="text-[11px] text-neutral-400">
                      التجار الذين تم الاتفاق على متابعتهم ينتظرون ردك، إتمام هذه المواعيد يرفع معدل الالتزام.
                    </span>
                  </div>
                </div>
              )}

              {myPerformance.scoreBreakdown.dataQualityScore < 8 && (
                <div className="p-3 bg-blue-950/30 border border-blue-900/60 text-blue-200 flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">تعزيز جودة الملاحظات بعد كل مكالمة</span>
                    <span className="text-[11px] text-neutral-400">
                      تسجيل ملاحظة واضحة ومفصلة في كل مكالمة يضمن حصولك على الدرجة الكاملة في معيار جودة الـCRM.
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-950/30 border border-emerald-900/60 text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-white">التركيز على تحويل المهتمين إلى مؤكدين</span>
                  <span className="text-[11px] text-neutral-400">
                    لديك {myPerformance.interestedCount} تجار في خانة المهتمين، تفعيل عروض DROVA التنافسية معهم يحولهم مباشرة لشاحنين دائمين.
                  </span>
                </div>
              </div>
            </div>
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
                  <option value="other">ملاحظة عامة عن المقر أو النشاط</option>
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

      {/* Manual Merchant Entry Modal */}
      <AddMerchantManualModal
        isOpen={showAddMerchantModal}
        onClose={() => setShowAddMerchantModal(false)}
        onSuccess={() => {
          setProspects(storage.getProspects());
          setMyPerformance(storage.getCommercialUserPerformance(session.username || session.name, 'all'));
          onRefresh();
        }}
      />
    </div>
  );
};
