/**
 * DROVA Express — Commercial Performance & Call Activity Evaluation Platform
 * Real CRM activity tracking, strict Contact Rate calculations, anti-gaming rules & configurable evaluation scores
 */
import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  Sliders,
  Download,
  Eye,
  X,
  Clock,
  Sparkles,
  Users,
  Target,
  ArrowRight,
  ShieldCheck,
  PhoneForwarded,
  PhoneMissed,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { storage } from '../services/storage';
import { i18n } from '../services/i18n';
import {
  CommercialPerformanceReport,
  PerformanceScoringWeights,
  CRMCall
} from '../types';

export const CommercialPerformanceView: React.FC = () => {
  const session = storage.getUserSession();
  const isManagement = session.role === 'super_admin' || session.role === 'commercial_manager';

  // State
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState({
    from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [sortBy, setSortBy] = useState<
    'score' | 'contactRate' | 'totalCalls' | 'confirmedCount' | 'expediteursCount' | 'activeMerchantsCount' | 'manuallyAddedCount'
  >('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Drilldown modal state
  const [selectedRep, setSelectedRep] = useState<CommercialPerformanceReport | null>(null);

  // Settings weighting modal state (Admin only)
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const currentSettings = storage.getSettings();
  const [weights, setWeights] = useState<PerformanceScoringWeights>(
    currentSettings.performanceWeights || {
      contactActivity: 25,
      successfulContacts: 20,
      confirmedMerchants: 20,
      expediteurConversion: 15,
      followUpCompletion: 10,
      dataQualityDiscipline: 10
    }
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Retrieve reports
  const allReports = storage.getCommercialPerformanceReports(
    period,
    period === 'custom' ? customRange : undefined
  );
  const myReport = storage.getCommercialUserPerformance(
    session.username || session.name,
    period,
    period === 'custom' ? customRange : undefined
  );
  const sourceROI = storage.getSourceROIMetrics();
  const allCalls = storage.getAllCalls();
  const prospects = storage.getProspects();
  const expediteurs = storage.getExpediteurs();

  // Aggregate Team Totals
  const totalAssigned = allReports.reduce((acc, r) => acc + r.assigned, 0);
  const totalContacted = allReports.reduce((acc, r) => acc + r.contacted, 0);
  const totalNotContacted = allReports.reduce((acc, r) => acc + r.notContacted, 0);
  const teamContactRate = totalAssigned > 0 ? Number(((totalContacted / totalAssigned) * 100).toFixed(1)) : 0;
  const totalCallsCount = allReports.reduce((acc, r) => acc + r.totalCalls, 0);
  const totalSuccessfulCalls = allReports.reduce((acc, r) => acc + r.successfulCalls, 0);
  const totalConfirmed = allReports.reduce((acc, r) => acc + r.confirmedCount, 0);
  const totalExpediteurs = allReports.reduce((acc, r) => acc + r.expediteursCount, 0);
  const totalActiveMerchants = allReports.reduce((acc, r) => acc + r.activeMerchantsCount, 0);
  const totalManuallyAdded = allReports.reduce((acc, r) => acc + (r.manuallyAddedCount || 0), 0);

  // Sorting
  const sortedReports = [...allReports].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'score') diff = a.score - b.score;
    else if (sortBy === 'contactRate') diff = a.contactRate - b.contactRate;
    else if (sortBy === 'totalCalls') diff = a.totalCalls - b.totalCalls;
    else if (sortBy === 'confirmedCount') diff = a.confirmedCount - b.confirmedCount;
    else if (sortBy === 'expediteursCount') diff = a.expediteursCount - b.expediteursCount;
    else if (sortBy === 'activeMerchantsCount') diff = a.activeMerchantsCount - b.activeMerchantsCount;
    else if (sortBy === 'manuallyAddedCount') diff = (a.manuallyAddedCount || 0) - (b.manuallyAddedCount || 0);
    return sortOrder === 'desc' ? -diff : diff;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = sortedReports.map((r, idx) => ({
      'الترتيب': idx + 1,
      'المندوب التجاري': r.name,
      'اسم المستخدم': r.username,
      'الدور الوظيفي': r.role,
      'التجار المسندون': r.assigned,
      'تجار مضافون يدوياً': r.manuallyAddedCount || 0,
      'تم الاتصال بهم فعلياً (مكالمة مسجلة)': r.contacted,
      'لم يتم الاتصال بهم': r.notContacted,
      'معدل الاتصال % (Contact Rate)': `${r.contactRate}%`,
      'إجمالي المكالمات': r.totalCalls,
      'اتصالات ناجحة (تحدثوا مع التاجر)': r.successfulCalls,
      'لم يرد': r.unansweredCalls,
      'مشغول / غير متاح': r.busyCalls,
      'رقم خاطئ': r.wrongNumberCalls,
      'تجار مهتمون': r.interestedCount,
      'أكدوا التعامل (Confirmed)': r.confirmedCount,
      'شاحنون محولون (Expéditeurs)': r.expediteursCount,
      'شاحنون نشطون (Active)': r.activeMerchantsCount,
      'متابعات مكتملة': r.followUpsCompleted,
      'متابعات متأخرة': r.followUpsOverdue,
      'نسبة إنجاز المتابعات %': `${r.followUpCompletionRate}%`,
      'درجة التقييم (Score / 100)': r.score,
      'الفئة التقديرية': r.rank,
      'الوصف التقديري': r.rankTitle,
      'الفترة': period
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير الأداء التجاري');
    XLSX.writeFile(workbook, `DROVA_Commercial_Performance_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Save Configurable Weights
  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    const sum =
      Number(weights.contactActivity) +
      Number(weights.successfulContacts) +
      Number(weights.confirmedMerchants) +
      Number(weights.expediteurConversion) +
      Number(weights.followUpCompletion) +
      Number(weights.dataQualityDiscipline);

    if (sum !== 100) {
      alert(`مجموع الأوزان يجب أن يساوي بالضبط 100%. المجموع الحالي: ${sum}%`);
      return;
    }

    storage.updateSettings({ performanceWeights: weights });
    setSaveSuccessMsg('تم حفظ وتحديث أوزان التقييم السحابية بنجاح.');
    setTimeout(() => {
      setSaveSuccessMsg(null);
      setShowWeightsModal(false);
    }, 1500);
  };

  // Representative calls for drilldown modal
  const repCalls = selectedRep
    ? allCalls.filter(
        c =>
          c.commercial_name === selectedRep.name ||
          c.commercial_name === selectedRep.username ||
          c.commercial_id === selectedRep.userId
      )
    : [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={22} className="text-[#FF0000]" />
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {isManagement
                ? 'لوحة تقييم وترتيب أداء الفريق التجاري (Commercial Performance & Activity Scoring)'
                : 'لوحة تقييم نشاطي وأدائي التجاري (My Commercial Performance & Activity Score)'}
            </h1>
          </div>
          <p className="text-xs text-[#8E8E93] mt-1">
            نظام تقييم حقيقي قائم حصرياً على سجلات CRM المعتمدة — الإسناد لا يعني الاتصال
          </p>
        </div>

        {/* Toolbar & Period Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#141414] border border-[#2E2E2E] p-1">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                period === 'today' ? 'bg-[#FF0000] text-white' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                period === 'week' ? 'bg-[#FF0000] text-white' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                period === 'month' ? 'bg-[#FF0000] text-white' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                period === 'all' ? 'bg-[#FF0000] text-white' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              كامل الفترة
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                period === 'custom' ? 'bg-[#FF0000] text-white' : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              مخصص
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5 bg-[#141414] border border-[#2E2E2E] p-1 text-xs">
              <input
                type="date"
                value={customRange.from}
                onChange={e => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                className="bg-[#1C1C1E] text-white px-2 py-0.5 border border-[#3A3A3C] outline-none"
              />
              <span className="text-[#71717A]">إلى</span>
              <input
                type="date"
                value={customRange.to}
                onChange={e => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                className="bg-[#1C1C1E] text-white px-2 py-0.5 border border-[#3A3A3C] outline-none"
              />
            </div>
          )}

          {isManagement && (
            <button
              onClick={() => setShowWeightsModal(true)}
              className="px-3 py-1.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white border border-[#3A3A3C] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="تعديل أوزان معادلة التقييم"
            >
              <Sliders size={14} className="text-amber-400" />
              <span>معايير التقييم</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] text-emerald-400 border border-emerald-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* SECTION A: INDIVIDUAL COMMERCIAL VIEW (Strict role privacy) */}
      {!isManagement ? (
        <div className="space-y-6">
          {/* Top Score Banner for Commercial */}
          <div className="bg-[#141414] border border-[#262626] p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8E8E93]">المندوب التجاري:</span>
                  <span className="text-sm font-bold text-white">{myReport.name}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800">
                    {myReport.role}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  درجة الأداء الإجمالي:{' '}
                  <span className="text-[#FF0000] font-mono-data">{myReport.score}</span> / 100
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold border ${
                      myReport.rank === 'A+' || myReport.rank === 'A'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : myReport.rank === 'B'
                        ? 'bg-blue-950 text-blue-400 border-blue-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}
                  >
                    الفئة التقديرية: {myReport.rank}
                  </span>
                  <span className="text-xs text-[#A1A1AA]">{myReport.rankTitle}</span>
                </div>
              </div>

              {/* Strict Contact Rate Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#1C1C1E] border border-[#2E2E2E] p-3 text-center">
                  <span className="text-[10px] text-[#8E8E93] block">المسندون لي</span>
                  <span className="text-xl font-bold font-mono-data text-white">{myReport.assigned}</span>
                </div>
                <div className="bg-[#1C1C1E] border border-[#2E2E2E] p-3 text-center">
                  <span className="text-[10px] text-[#8E8E93] block">اتصلت بهم فعلياً</span>
                  <span className="text-xl font-bold font-mono-data text-emerald-400">{myReport.contacted}</span>
                </div>
                <div className="bg-[#1C1C1E] border border-[#2E2E2E] p-3 text-center">
                  <span className="text-[10px] text-[#8E8E93] block">لم أتصل بهم بعد</span>
                  <span className="text-xl font-bold font-mono-data text-rose-400">{myReport.notContacted}</span>
                </div>
                <div className="bg-[#1C1C1E] border border-red-900/60 p-3 text-center bg-red-950/20">
                  <span className="text-[10px] text-red-300 block font-semibold">معدل الاتصال</span>
                  <span className="text-xl font-bold font-mono-data text-white">{myReport.contactRate}%</span>
                </div>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div className="mt-6 pt-5 border-t border-[#262626] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs">
              <div className="bg-[#181818] p-2.5 border border-[#2A2A2A]">
                <span className="text-[10px] text-[#8E8E93] block">نشاط الاتصال (25%)</span>
                <span className="font-bold text-white font-mono-data">
                  {myReport.scoreBreakdown.contactActivityScore} / 25
                </span>
              </div>
              <div className="bg-[#181818] p-2.5 border border-[#2A2A2A]">
                <span className="text-[10px] text-[#8E8E93] block">نجاح التواصل (20%)</span>
                <span className="font-bold text-white font-mono-data">
                  {myReport.scoreBreakdown.successfulContactsScore} / 20
                </span>
              </div>
              <div className="bg-[#181818] p-2.5 border border-[#2A2A2A]">
                <span className="text-[10px] text-[#8E8E93] block">تأكيد الاتفاق (20%)</span>
                <span className="font-bold text-white font-mono-data">
                  {myReport.scoreBreakdown.confirmedMerchantsScore} / 20
                </span>
              </div>
              <div className="bg-[#181818] p-2.5 border border-[#2A2A2A]">
                <span className="text-[10px] text-[#8E8E93] block">تحويل شاحنين (15%)</span>
                <span className="font-bold text-white font-mono-data">
                  {myReport.scoreBreakdown.expediteurConversionScore} / 15
                </span>
              </div>
              <div className="bg-[#181818] p-2.5 border border-[#2A2A2A]">
                <span className="text-[10px] text-[#8E8E93] block">انضباط المتابعة (10%)</span>
                <span className="font-bold text-white font-mono-data">
                  {myReport.scoreBreakdown.followUpCompletionScore} / 10
                </span>
              </div>
              <div className="bg-[#181818] p-2.5 border border-[#2A2A2A]">
                <span className="text-[10px] text-[#8E8E93] block">جودة التدوين (10%)</span>
                <span className="font-bold text-white font-mono-data">
                  {myReport.scoreBreakdown.dataQualityScore} / 10
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Pipeline Progression */}
          <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Target size={15} className="text-[#FF0000]" />
              <span>مراحل التحويل الحقيقية لتجاري (Commercial Real Funnel)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center text-xs">
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">إجمالي المكالمات</span>
                <span className="text-lg font-bold font-mono-data text-blue-400">{myReport.totalCalls}</span>
              </div>
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">تواصل ناجح (ردوا)</span>
                <span className="text-lg font-bold font-mono-data text-emerald-400">
                  {myReport.successfulCalls}
                </span>
              </div>
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">تجار مهتمون</span>
                <span className="text-lg font-bold font-mono-data text-amber-400">
                  {myReport.interestedCount}
                </span>
              </div>
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">أكدوا الاتفاق</span>
                <span className="text-lg font-bold font-mono-data text-teal-400">
                  {myReport.confirmedCount}
                </span>
              </div>
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">شاحنون محولون</span>
                <span className="text-lg font-bold font-mono-data text-emerald-400">
                  {myReport.expediteursCount}
                </span>
              </div>
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">شاحنون نشطون</span>
                <span className="text-lg font-bold font-mono-data text-white">
                  {myReport.activeMerchantsCount}
                </span>
              </div>
              <div className="p-3 bg-[#1A1A1A] border border-emerald-900/60">
                <span className="text-[10px] text-emerald-400 block font-bold">تجار أضفتهم يدوياً</span>
                <span className="text-lg font-bold font-mono-data text-emerald-300">
                  {myReport.manuallyAddedCount || 0}
                </span>
              </div>
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">متابعات متأخرة</span>
                <span className={`text-lg font-bold font-mono-data ${myReport.followUpsOverdue > 0 ? 'text-rose-500' : 'text-[#8E8E93]'}`}>
                  {myReport.followUpsOverdue}
                </span>
              </div>
            </div>

            {/* Actionable coaching tips for commercial */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 text-xs text-[#A1A1AA] flex items-start gap-2.5">
              <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">توصيات التحسين المباشرة:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  {myReport.notContacted > 0 && (
                    <li>
                      لديك <strong className="text-rose-400 font-mono-data">{myReport.notContacted}</strong> تاجر مسند لك لم تبادر بالاتصال بهم بعد. إنجاز هذه المكالمات سيرفع معدل الاتصال لديك مباشرة.
                    </li>
                  )}
                  {myReport.followUpsOverdue > 0 && (
                    <li>
                      يوجد <strong className="text-rose-400 font-mono-data">{myReport.followUpsOverdue}</strong> متابعات متأخرة الموعد تؤثر سلباً على نقطة انضباط CRM.
                    </li>
                  )}
                  <li>
                    تأكد من تدوين ملخص المكالمة (Notes) دائماً حيث تشترط خوارزمية التقييم ملاحظات موثقة لكل مكالمة.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SECTION B: MANAGEMENT & LEADERBOARD VIEW (Admin & Commercial Manager) */
        <div className="space-y-6">
          {/* Executive Overview Pipeline Banner */}
          <div className="bg-[#141414] border border-[#262626] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award size={14} className="text-emerald-400" />
                <span>إجمالي نشاط الفريق التجاري ومسار التحويل الفعلي (Team Pipeline Progression)</span>
              </h3>
              <span className="text-[11px] text-[#8E8E93]">
                {allReports.length} موظف تجاري مسجل ومتابع في السحابة
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2 text-center">
              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">إجمالي المسندين</span>
                <span className="text-xl font-bold font-mono-data text-white">{totalAssigned}</span>
                <span className="text-[9px] text-[#545458] block mt-0.5">Assigned Leads</span>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-emerald-900/60">
                <span className="text-[10px] text-emerald-400 block font-bold">تجار مضافون يدوياً</span>
                <span className="text-xl font-bold font-mono-data text-emerald-300">{totalManuallyAdded}</span>
                <span className="text-[9px] text-[#545458] block mt-0.5">Manual Entries</span>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">اتصلوا بهم فعلياً</span>
                <span className="text-xl font-bold font-mono-data text-emerald-400">{totalContacted}</span>
                <span className="text-[9px] text-[#545458] block mt-0.5">Strictly Contacted</span>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">لم يتم الاتصال</span>
                <span className="text-xl font-bold font-mono-data text-rose-400">{totalNotContacted}</span>
                <span className="text-[9px] text-[#545458] block mt-0.5">Not Contacted</span>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">معدل الاتصال</span>
                <span className="text-xl font-bold font-mono-data text-blue-400">{teamContactRate}%</span>
                <span className="text-[9px] text-[#545458] block mt-0.5">Contact Rate</span>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">إجمالي المكالمات</span>
                <span className="text-xl font-bold font-mono-data text-amber-400">{totalCallsCount}</span>
                <span className="text-[9px] text-[#545458] block mt-0.5">Attempts</span>
              </div>

              <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
                <span className="text-[10px] text-[#8E8E93] block">أكدوا التعامل</span>
                <span className="text-xl font-bold font-mono-data text-teal-400">{totalConfirmed}</span>
                <span className="text-[9px] text-[#545458] block mt-0.5">Confirmed</span>
              </div>

              <div className="p-3 bg-[#241414] border border-[#FF0000]/60">
                <span className="text-[10px] text-red-300 block font-bold">شاحنون نشطون VIP</span>
                <span className="text-xl font-bold font-mono-data text-white">{totalActiveMerchants}</span>
                <span className="text-[9px] text-red-300 block mt-0.5">Active Shippers</span>
              </div>
            </div>
          </div>

          {/* LEADERBOARD TABLE */}
          <div className="bg-[#141414] border border-[#262626] overflow-hidden">
            <div className="p-4 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#101010]">
              <div>
                <h3 className="font-bold text-white text-sm">
                  لوحة ترتيب وإنتاجية المندوبين التجاريين (Commercial Leaderboard)
                </h3>
                <p className="text-[11px] text-[#8E8E93]">
                  التقييم يحسب تلقائياً من المكالمات والنتائج المسجلة في CRM. اضغط على أي عمود للترتيب
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white px-2 py-0.5 bg-[#222222]">
                  الفترة: {period === 'today' ? 'اليوم' : period === 'week' ? 'هذا الأسبوع' : period === 'month' ? 'هذا الشهر' : 'كامل السجلات'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#181818] text-[#8E8E93] border-b border-[#262626] uppercase text-[10px] tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-3 text-center">#</th>
                    <th className="py-2.5 px-3">المندوب التجاري</th>
                    <th className="py-2.5 px-3 text-center">المسندون</th>
                    <th
                      onClick={() => handleSort('manuallyAddedCount')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-white text-emerald-400 font-bold"
                    >
                      إضافة يدوية {sortBy === 'manuallyAddedCount' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th className="py-2.5 px-3 text-center">تم الاتصال</th>
                    <th className="py-2.5 px-3 text-center">لم يتصل بعد</th>
                    <th
                      onClick={() => handleSort('contactRate')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-white"
                    >
                      معدل الاتصال % {sortBy === 'contactRate' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th
                      onClick={() => handleSort('totalCalls')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-white"
                    >
                      المكالمات {sortBy === 'totalCalls' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th className="py-2.5 px-3 text-center">ناجحة (ردوا)</th>
                    <th
                      onClick={() => handleSort('confirmedCount')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-white text-teal-400"
                    >
                      أكدوا {sortBy === 'confirmedCount' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th
                      onClick={() => handleSort('expediteursCount')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-white text-emerald-400"
                    >
                      شاحنون {sortBy === 'expediteursCount' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th
                      onClick={() => handleSort('activeMerchantsCount')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-white"
                    >
                      نشطون VIP {sortBy === 'activeMerchantsCount' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th className="py-2.5 px-3 text-center">المتابعات (مكتملة / متأخرة)</th>
                    <th
                      onClick={() => handleSort('score')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-white font-bold text-[#FF0000]"
                    >
                      درجة الأداء {sortBy === 'score' && (sortOrder === 'desc' ? '▼' : '▲')}
                    </th>
                    <th className="py-2.5 px-3 text-center">الرتبة</th>
                    <th className="py-2.5 px-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222] font-mono-data">
                  {sortedReports.map((r, idx) => (
                    <tr key={r.userId} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="py-3 px-3 text-center text-[#71717A] font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#262626] rounded-full flex items-center justify-center text-[10px] text-white">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <span>{r.name}</span>
                            <span className="text-[10px] text-[#71717A] block font-mono">@{r.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-white">{r.assigned}</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">{r.manuallyAddedCount || 0}</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">{r.contacted}</td>
                      <td className="py-3 px-3 text-center text-rose-400 font-semibold">{r.notContacted}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 font-bold border ${
                            r.contactRate >= 70
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : r.contactRate >= 40
                              ? 'bg-amber-950 text-amber-400 border-amber-800'
                              : 'bg-rose-950 text-rose-400 border-rose-800'
                          }`}
                        >
                          {r.contactRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-blue-400 font-bold">{r.totalCalls}</td>
                      <td className="py-3 px-3 text-center text-white">{r.successfulCalls}</td>
                      <td className="py-3 px-3 text-center text-teal-400 font-bold">{r.confirmedCount}</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">{r.expediteursCount}</td>
                      <td className="py-3 px-3 text-center text-white font-bold">{r.activeMerchantsCount}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-emerald-400">{r.followUpsCompleted}</span>
                        <span className="text-[#52525B] mx-1">/</span>
                        <span className={r.followUpsOverdue > 0 ? 'text-rose-500 font-bold' : 'text-[#71717A]'}>
                          {r.followUpsOverdue}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-base text-white">
                        <span className="text-[#FF0000]">{r.score}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold border ${
                            r.rank === 'A+' || r.rank === 'A'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : r.rank === 'B'
                              ? 'bg-blue-950 text-blue-300 border-blue-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {r.rank}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedRep(r)}
                          className="px-2.5 py-1 bg-[#262626] hover:bg-[#333333] text-white text-[10px] font-semibold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>تحليل تفصيلي</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: SOURCE ROI & EXPÉDITEUR CONVERSION YIELD */}
      <div className="bg-[#141414] border border-[#262626] overflow-hidden">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#101010]">
          <div>
            <h3 className="font-bold text-white text-sm">
              عائد قنوات الاستكشاف ومعدل تحويل كل مصدر لشاحنين (Source ROI & Conversion)
            </h3>
            <p className="text-[11px] text-[#8E8E93]">
              تحديد المصادر التي تحقق أعلى نسبة شاحنين نشطين لتقليل الهدر والتركيز على القنوات ذات العائد المرتفع
            </p>
          </div>
          <span className="text-xs font-mono text-white px-2 py-0.5 bg-[#222222]">
            {sourceROI.length} قناة تنقيب نشطة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#181818] text-[#8E8E93] border-b border-[#262626] uppercase text-[10px] tracking-wider font-sans">
              <tr>
                <th className="py-2.5 px-3">القناة / المصدر</th>
                <th className="py-2.5 px-3 text-center">المستكشف</th>
                <th className="py-2.5 px-3 text-center">هاتف موثق</th>
                <th className="py-2.5 px-3 text-center">تم الاتصال</th>
                <th className="py-2.5 px-3 text-center">مهتمون</th>
                <th className="py-2.5 px-3 text-center">أكدوا الاتفاق</th>
                <th className="py-2.5 px-3 text-center">شاحنون مفعلون</th>
                <th className="py-2.5 px-3 text-center font-bold text-white">نسبة التحويل %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] font-mono-data">
              {sourceROI.map(s => (
                <tr key={s.source} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="py-3 px-3 font-bold text-white font-sans">{s.source_name}</td>
                  <td className="py-3 px-3 text-center text-[#8E8E93]">{s.discovered}</td>
                  <td className="py-3 px-3 text-center text-white">{s.phone_verified}</td>
                  <td className="py-3 px-3 text-center text-blue-400">{s.contacted}</td>
                  <td className="py-3 px-3 text-center text-amber-400">{s.interested}</td>
                  <td className="py-3 px-3 text-center text-teal-400">{s.confirmed}</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold">{s.activated}</td>
                  <td className="py-3 px-3 text-center font-bold">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {s.conversion_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DRILLDOWN MODAL FOR COMMERCIAL EVALUATION */}
      {selectedRep && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2E2E2E] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#262626] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedRep.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800">
                    {selectedRep.role}
                  </span>
                  <span className="text-xs text-[#71717A]">@{selectedRep.username}</span>
                </div>
                <p className="text-xs text-[#8E8E93] mt-1">
                  التحليل التفصيلي لمسار المبيعات ومكالمات CRM والتقييم المشتق
                </p>
              </div>
              <button
                onClick={() => setSelectedRep(null)}
                className="text-[#71717A] hover:text-white p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Score & Rank Highlight Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#1A1A1A] border border-[#2E2E2E] p-4">
              <div className="text-center md:border-l border-[#2E2E2E] p-2">
                <span className="text-xs text-[#8E8E93] block">درجة الأداء الإجمالي</span>
                <span className="text-3xl font-black font-mono-data text-[#FF0000]">
                  {selectedRep.score}
                </span>
                <span className="text-[10px] text-[#71717A] block">من 100 نقطة</span>
              </div>
              <div className="text-center md:border-l border-[#2E2E2E] p-2">
                <span className="text-xs text-[#8E8E93] block">التقييم العام</span>
                <span className="text-2xl font-bold font-mono-data text-emerald-400">
                  {selectedRep.rank}
                </span>
                <span className="text-[11px] text-[#A1A1AA] block">{selectedRep.rankTitle}</span>
              </div>
              <div className="text-center md:border-l border-[#2E2E2E] p-2">
                <span className="text-xs text-[#8E8E93] block">معدل الاتصال الفعلي</span>
                <span className="text-2xl font-bold font-mono-data text-white">
                  {selectedRep.contactRate}%
                </span>
                <span className="text-[10px] text-[#71717A] block">
                  ({selectedRep.contacted} تم الاتصال من أصل {selectedRep.assigned})
                </span>
              </div>
              <div className="text-center p-2">
                <span className="text-xs text-emerald-400 font-bold block">إضافة يدوية</span>
                <span className="text-2xl font-bold font-mono-data text-emerald-300">
                  {selectedRep.manuallyAddedCount || 0}
                </span>
                <span className="text-[10px] text-[#71717A] block">
                  تاجر مضاف يدوياً
                </span>
              </div>
            </div>

            {/* 9-Stage Pipeline Funnel Visualization */}
            <div className="space-y-2 bg-[#181818] border border-[#2A2A2A] p-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                مسار التدرج الفعلي للمبيعات (9-Stage Real Pipeline Progression):
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 text-center text-[10px]">
                <div className="bg-[#202020] p-2 border border-[#333333]">
                  <span className="text-[#8E8E93] block">1. المسند</span>
                  <strong className="text-white font-mono-data block text-sm mt-0.5">{selectedRep.assigned}</strong>
                </div>
                <div className="bg-[#202020] p-2 border border-[#333333]">
                  <span className="text-[#8E8E93] block">2. لم يتصل</span>
                  <strong className="text-rose-400 font-mono-data block text-sm mt-0.5">{selectedRep.notContacted}</strong>
                </div>
                <div className="bg-[#202020] p-2 border border-[#333333]">
                  <span className="text-[#8E8E93] block">3. مكالمات</span>
                  <strong className="text-blue-400 font-mono-data block text-sm mt-0.5">{selectedRep.totalCalls}</strong>
                </div>
                <div className="bg-[#202020] p-2 border border-[#333333]">
                  <span className="text-[#8E8E93] block">4. تم الاتصال</span>
                  <strong className="text-emerald-400 font-mono-data block text-sm mt-0.5">{selectedRep.contacted}</strong>
                </div>
                <div className="bg-[#202020] p-2 border border-[#333333]">
                  <span className="text-[#8E8E93] block">5. مهتم</span>
                  <strong className="text-amber-400 font-mono-data block text-sm mt-0.5">{selectedRep.interestedCount}</strong>
                </div>
                <div className="bg-[#202020] p-2 border border-[#333333]">
                  <span className="text-[#8E8E93] block">6. مؤكد</span>
                  <strong className="text-teal-400 font-mono-data block text-sm mt-0.5">{selectedRep.confirmedCount}</strong>
                </div>
                <div className="bg-[#202020] p-2 border border-[#333333]">
                  <span className="text-[#8E8E93] block">7. تفعيل</span>
                  <strong className="text-blue-300 font-mono-data block text-sm mt-0.5">{selectedRep.onboardingCount}</strong>
                </div>
                <div className="bg-[#202020] p-2 border border-[#333333]">
                  <span className="text-[#8E8E93] block">8. شاحن</span>
                  <strong className="text-emerald-300 font-mono-data block text-sm mt-0.5">{selectedRep.expediteursCount}</strong>
                </div>
                <div className="bg-[#241414] p-2 border border-[#FF0000]/60">
                  <span className="text-red-300 block font-bold">9. نشط VIP</span>
                  <strong className="text-white font-mono-data block text-sm mt-0.5">{selectedRep.activeMerchantsCount}</strong>
                </div>
              </div>
            </div>

            {/* Score Weights Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                توزيع درجات الأداء حسب الأوزان الإدارية:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#1C1C1E] border border-[#2E2E2E]">
                  <span className="text-[11px] text-[#8E8E93] block">نشاط الاتصال ({weights.contactActivity}%)</span>
                  <span className="font-bold text-white font-mono-data">
                    {selectedRep.scoreBreakdown.contactActivityScore} / {weights.contactActivity}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1C1E] border border-[#2E2E2E]">
                  <span className="text-[11px] text-[#8E8E93] block">نجاح التواصل ({weights.successfulContacts}%)</span>
                  <span className="font-bold text-white font-mono-data">
                    {selectedRep.scoreBreakdown.successfulContactsScore} / {weights.successfulContacts}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1C1E] border border-[#2E2E2E]">
                  <span className="text-[11px] text-[#8E8E93] block">تأكيد الاتفاق ({weights.confirmedMerchants}%)</span>
                  <span className="font-bold text-white font-mono-data">
                    {selectedRep.scoreBreakdown.confirmedMerchantsScore} / {weights.confirmedMerchants}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1C1E] border border-[#2E2E2E]">
                  <span className="text-[11px] text-[#8E8E93] block">تحويل شاحنين ({weights.expediteurConversion}%)</span>
                  <span className="font-bold text-white font-mono-data">
                    {selectedRep.scoreBreakdown.expediteurConversionScore} / {weights.expediteurConversion}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1C1E] border border-[#2E2E2E]">
                  <span className="text-[11px] text-[#8E8E93] block">انضباط المتابعة ({weights.followUpCompletion}%)</span>
                  <span className="font-bold text-white font-mono-data">
                    {selectedRep.scoreBreakdown.followUpCompletionScore} / {weights.followUpCompletion}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1C1E] border border-[#2E2E2E]">
                  <span className="text-[11px] text-[#8E8E93] block">جودة التدوين ({weights.dataQualityDiscipline}%)</span>
                  <span className="font-bold text-white font-mono-data">
                    {selectedRep.scoreBreakdown.dataQualityScore} / {weights.dataQualityDiscipline}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Calls Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>سجل أحدث المكالمات الموثقة للمندوب ({repCalls.length} مكالمة):</span>
              </h4>
              <div className="max-h-60 overflow-y-auto border border-[#2E2E2E] bg-[#161616]">
                {repCalls.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#71717A]">
                    لا توجد مكالمات مسجلة لهذا المندوب في الفترة المحددة
                  </div>
                ) : (
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#1F1F1F] text-[#8E8E93] text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">التاريخ والوقت</th>
                        <th className="py-2 px-3">التاجر / المعرف</th>
                        <th className="py-2 px-3 text-center">النتيجة</th>
                        <th className="py-2 px-3">ملاحظات المندوب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A] font-mono-data text-[11px]">
                      {repCalls.slice(0, 15).map(c => {
                        const pros = prospects.find(p => p.id === c.prospect_id);
                        return (
                          <tr key={c.id} className="hover:bg-[#1E1E1E]">
                            <td className="py-2 px-3 text-[#A1A1AA] whitespace-nowrap">
                              {c.date.replace('T', ' ').slice(0, 16)}
                            </td>
                            <td className="py-2 px-3 text-white font-sans font-semibold">
                              {pros?.name || c.prospect_id}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-2 py-0.5 bg-[#252525] border border-[#333333] text-white text-[10px]">
                                {c.call_result}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[#8E8E93] font-sans truncate max-w-xs">
                              {c.notes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-[#262626]">
              <button
                onClick={() => setSelectedRep(null)}
                className="px-4 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURABLE PERFORMANCE WEIGHTS (Admin only) */}
      {showWeightsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2E2E2E] w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  ضبط أوزان معادلة تقييم الموظفين (Scoring Weights)
                </h3>
              </div>
              <button
                onClick={() => setShowWeightsModal(false)}
                className="text-[#71717A] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#8E8E93]">
              حدد النسبة المئوية لكل معيار في حساب الدرجة الإجمالية (يجب أن يكون المجموع 100%):
            </p>

            {saveSuccessMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300">
                {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveWeights} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <label className="text-white font-semibold">1. نشاط الاتصال والتغطية (Contact Activity %):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.contactActivity}
                  onChange={e => setWeights(prev => ({ ...prev, contactActivity: Number(e.target.value) }))}
                  className="w-20 bg-[#1C1C1E] border border-[#3A3A3C] px-2.5 py-1 text-white text-center font-mono-data outline-none focus:border-[#FF0000]"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-white font-semibold">2. الاتصالات الناجحة والوصول (Successful Contacts %):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.successfulContacts}
                  onChange={e => setWeights(prev => ({ ...prev, successfulContacts: Number(e.target.value) }))}
                  className="w-20 bg-[#1C1C1E] border border-[#3A3A3C] px-2.5 py-1 text-white text-center font-mono-data outline-none focus:border-[#FF0000]"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-white font-semibold">3. تأكيد الاتفاق مع DROVA (Confirmed Merchants %):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.confirmedMerchants}
                  onChange={e => setWeights(prev => ({ ...prev, confirmedMerchants: Number(e.target.value) }))}
                  className="w-20 bg-[#1C1C1E] border border-[#3A3A3C] px-2.5 py-1 text-white text-center font-mono-data outline-none focus:border-[#FF0000]"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-white font-semibold">4. تحويل الشاحنين الفعلي (Expéditeur Conversion %):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.expediteurConversion}
                  onChange={e => setWeights(prev => ({ ...prev, expediteurConversion: Number(e.target.value) }))}
                  className="w-20 bg-[#1C1C1E] border border-[#3A3A3C] px-2.5 py-1 text-white text-center font-mono-data outline-none focus:border-[#FF0000]"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-white font-semibold">5. إنجاز المتابعات المجدولة (Follow-up Completion %):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.followUpCompletion}
                  onChange={e => setWeights(prev => ({ ...prev, followUpCompletion: Number(e.target.value) }))}
                  className="w-20 bg-[#1C1C1E] border border-[#3A3A3C] px-2.5 py-1 text-white text-center font-mono-data outline-none focus:border-[#FF0000]"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-white font-semibold">6. جودة التدوين وانضباط CRM (CRM Discipline %):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.dataQualityDiscipline}
                  onChange={e => setWeights(prev => ({ ...prev, dataQualityDiscipline: Number(e.target.value) }))}
                  className="w-20 bg-[#1C1C1E] border border-[#3A3A3C] px-2.5 py-1 text-white text-center font-mono-data outline-none focus:border-[#FF0000]"
                />
              </div>

              {/* Total Check */}
              <div className="pt-3 border-t border-[#262626] flex items-center justify-between font-bold">
                <span>المجموع الكلي:</span>
                <span
                  className={`font-mono-data text-sm ${
                    Number(weights.contactActivity) +
                      Number(weights.successfulContacts) +
                      Number(weights.confirmedMerchants) +
                      Number(weights.expediteurConversion) +
                      Number(weights.followUpCompletion) +
                      Number(weights.dataQualityDiscipline) ===
                    100
                      ? 'text-emerald-400'
                      : 'text-rose-500'
                  }`}
                >
                  {Number(weights.contactActivity) +
                    Number(weights.successfulContacts) +
                    Number(weights.confirmedMerchants) +
                    Number(weights.expediteurConversion) +
                    Number(weights.followUpCompletion) +
                    Number(weights.dataQualityDiscipline)}
                  %
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWeightsModal(false)}
                  className="px-3.5 py-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  حفظ الأوزان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
