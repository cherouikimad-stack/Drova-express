/**
 * DROVA Express — Commercial Performance & Source ROI Analytics
 * Implements Sections 20, 21, 34, 35 & 36
 */
import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  DollarSign,
  Layers,
  PieChart,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { storage } from '../services/storage';

export const CommercialPerformanceView: React.FC = () => {
  const teamPerformance = storage.getCommercialPerformanceMetrics();
  const sourceROI = storage.getSourceROIMetrics();
  const prospects = storage.getProspects();
  const calls = storage.getAllCalls();
  const expediteurs = storage.getExpediteurs();

  // Aggregate Master KPIs (Section 34)
  const contactable = prospects.filter(p => p.phone_verification_status === 'VERIFIED').length;
  const contacted = prospects.filter(p => p.call_count && p.call_count > 0).length;
  const reached = calls.filter(c => c.call_result !== 'لم يرد' && c.call_result !== 'الرقم غير متاح' && c.call_result !== 'الرقم مشغول').length;
  const interested = prospects.filter(p => p.status === 'مهتم' || p.status === 'مهتم - متابعة' || p.expediteur_status === 'مهتم' || p.expediteur_status === 'مرشح قوي').length;
  const confirmed = prospects.filter(p => p.status === 'أكد التعامل مع DROVA' || p.expediteur_status === 'مؤكد').length;
  const activated = expediteurs.filter(e => e.status === 'مفعل' || e.status === 'نشط').length;
  const activeShippers = expediteurs.filter(e => e.status === 'نشط').length;

  // Conversion Rates
  const reachRate = contacted > 0 ? ((reached / calls.length) * 100).toFixed(1) : '0';
  const interestRate = reached > 0 ? ((interested / reached) * 100).toFixed(1) : '0';
  const activationRate = confirmed > 0 ? ((activated / confirmed) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-[#FF0000]" />
            <span>لوحة أداء الفريق التجاري وعائد قنوات الاستكشاف (Commercial Performance & Source ROI)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            التقييم الحقيقي لإنتاجية المبيعات والتحقق من القنوات التي تولّد شاحنين فعليين لشركة DROVA
          </p>
        </div>
      </div>

      {/* Real Master Business KPI Pipeline (Section 34) */}
      <div className="bg-[#141414] border border-[#262626] p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#262626] pb-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award size={14} className="text-emerald-400" />
            <span>مسار التحويل الفعلي للشاحنين (Real Expéditeur Conversion Pipeline - Section 34)</span>
          </h3>
          <span className="text-[11px] text-[#8E8E93]">معيار النجاح: تحويل التجار لشاحنين نشطين</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-center">
          <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
            <span className="text-[10px] text-[#8E8E93] block">تجار بهاتف موثق</span>
            <span className="text-xl font-bold font-mono-data text-white">{contactable}</span>
            <span className="text-[9px] text-[#545458] block mt-0.5">Contactable Prospects</span>
          </div>

          <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
            <span className="text-[10px] text-[#8E8E93] block">تواصل ناجح (ردوا)</span>
            <span className="text-xl font-bold font-mono-data text-blue-400">{reached}</span>
            <span className="text-[9px] text-[#545458] block mt-0.5">Reach Rate {reachRate}%</span>
          </div>

          <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
            <span className="text-[10px] text-[#8E8E93] block">تجار مهتمون</span>
            <span className="text-xl font-bold font-mono-data text-amber-400">{interested}</span>
            <span className="text-[9px] text-[#545458] block mt-0.5">Interest Rate {interestRate}%</span>
          </div>

          <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
            <span className="text-[10px] text-[#8E8E93] block">أكدوا الاتفاق</span>
            <span className="text-xl font-bold font-mono-data text-teal-400">{confirmed}</span>
            <span className="text-[9px] text-[#545458] block mt-0.5">Confirmed Expéditeurs</span>
          </div>

          <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E]">
            <span className="text-[10px] text-[#8E8E93] block">شاحنون مفعلون</span>
            <span className="text-xl font-bold font-mono-data text-emerald-400">{activated}</span>
            <span className="text-[9px] text-[#545458] block mt-0.5">Activation Rate {activationRate}%</span>
          </div>

          <div className="p-3 bg-[#241414] border border-[#FF0000]/60">
            <span className="text-[10px] text-red-300 block font-bold">شاحنون نشطون VIP</span>
            <span className="text-xl font-bold font-mono-data text-white">{activeShippers}</span>
            <span className="text-[9px] text-red-300 block mt-0.5">Active Shippers</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: COMMERCIAL TEAM PERFORMANCE TABLE (Section 21) */}
      <div className="bg-[#141414] border border-[#262626] overflow-hidden">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#101010]">
          <div>
            <h3 className="font-bold text-white text-sm">أداء المندوبين التجاريين (Commercial Reps Performance)</h3>
            <p className="text-[11px] text-[#8E8E93]">محسوب من سجل المكالمات الفعلي والصفقات المؤكدة دون تزييف</p>
          </div>
          <span className="text-xs font-mono text-white px-2 py-0.5 bg-[#222222]">
            الفريق: {teamPerformance.length} مندوبين
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#181818] text-[#8E8E93] border-b border-[#262626] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">المندوب التجاري</th>
                <th className="py-2.5 px-3 text-center">التجار المسندون</th>
                <th className="py-2.5 px-3 text-center">المكالمات المنجزة</th>
                <th className="py-2.5 px-3 text-center">اتصالات ناجحة</th>
                <th className="py-2.5 px-3 text-center">تجار مهتمون</th>
                <th className="py-2.5 px-3 text-center">أكدوا التعامل</th>
                <th className="py-2.5 px-3 text-center">شاحنون مفعلون</th>
                <th className="py-2.5 px-3 text-center font-bold text-white">نسبة التحويل %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] font-mono-data">
              {teamPerformance.map(m => (
                <tr key={m.name} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="py-3 px-3 font-bold text-white whitespace-nowrap font-sans">
                    {m.name}
                  </td>
                  <td className="py-3 px-3 text-center text-[#8E8E93]">
                    {m.assigned}
                  </td>
                  <td className="py-3 px-3 text-center text-blue-400 font-bold">
                    {m.calls}
                  </td>
                  <td className="py-3 px-3 text-center text-white">
                    {m.reached}
                  </td>
                  <td className="py-3 px-3 text-center text-amber-400">
                    {m.interested}
                  </td>
                  <td className="py-3 px-3 text-center text-teal-400">
                    {m.confirmed}
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                    {m.activated}
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {m.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SOURCE ROI ANALYSIS (Section 35 & 36) */}
      <div className="bg-[#141414] border border-[#262626] overflow-hidden">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#101010]">
          <div>
            <h3 className="font-bold text-white text-sm">عائد قنوات الاستكشاف ومعدل تحويل كل مصدر (Source ROI & Yield)</h3>
            <p className="text-[11px] text-[#8E8E93]">معرفة أي مصادر الاستكشاف تنتج أكبر عدد من الشاحنين الحقيقيين الملتزمين</p>
          </div>
          <span className="text-xs font-mono text-white px-2 py-0.5 bg-[#222222]">
            12 قناة تنقيب نشطة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#181818] text-[#8E8E93] border-b border-[#262626] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">مصدر الاستكشاف</th>
                <th className="py-2.5 px-3 text-center">المستكشف الإجمالي</th>
                <th className="py-2.5 px-3 text-center">كيانات فريدة</th>
                <th className="py-2.5 px-3 text-center">موثقة قانونياً</th>
                <th className="py-2.5 px-3 text-center">هاتف موثق (+213)</th>
                <th className="py-2.5 px-3 text-center">تم الاتصال</th>
                <th className="py-2.5 px-3 text-center">أبدوا اهتماماً</th>
                <th className="py-2.5 px-3 text-center">أكدوا التعامل</th>
                <th className="py-2.5 px-3 text-center">شاحنون مفعلون</th>
                <th className="py-2.5 px-3 text-center font-bold text-white">العائد النهائي %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] font-mono-data">
              {sourceROI.map(s => (
                <tr key={s.source} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="py-3 px-3 font-bold text-white whitespace-nowrap font-sans">
                    {s.source_name}
                  </td>
                  <td className="py-3 px-3 text-center text-[#8E8E93]">
                    {s.discovered}
                  </td>
                  <td className="py-3 px-3 text-center text-white">
                    {s.unique}
                  </td>
                  <td className="py-3 px-3 text-center text-teal-400">
                    {s.verified}
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                    {s.phone_verified}
                  </td>
                  <td className="py-3 px-3 text-center text-blue-400">
                    {s.contacted}
                  </td>
                  <td className="py-3 px-3 text-center text-amber-400">
                    {s.interested}
                  </td>
                  <td className="py-3 px-3 text-center text-teal-300">
                    {s.confirmed}
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-300 font-bold">
                    {s.activated + s.active_expediteurs}
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    <span className="px-2 py-0.5 bg-[#1F1F1F] text-white border border-[#333333]">
                      {s.conversion_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
