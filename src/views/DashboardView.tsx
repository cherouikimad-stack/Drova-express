/**
 * DROVA Express Main Intelligence Dashboard (Section 3, 20 & 28)
 * Modern dark enterprise layout with strict tabular metrics, 10,000 Target Tracker, and 14-source fusion matrix
 */
import React from 'react';
import {
  Users,
  CheckCircle2,
  Award,
  Phone,
  MessageCircle,
  ShoppingBag,
  MapPin,
  Compass,
  AlertOctagon,
  ArrowRight,
  Plus,
  Download,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Target,
  Layers,
  PhoneOff,
  Share2,
  Truck,
  PhoneCall,
  RotateCcw,
  Headphones,
  UserCheck
} from 'lucide-react';
import { Prospect, Campaign } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { ScoreBadge, StatusBadge, VerificationBadge } from '../components/ui/Badge';
import { NavView } from '../components/layout/Sidebar';
import { exportToExcel } from '../services/excel';
import { storage } from '../services/storage';

interface DashboardViewProps {
  prospects: Prospect[];
  campaigns: Campaign[];
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onSelectProspect: (prospect: Prospect) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  prospects,
  campaigns,
  onNavigate,
  onSelectProspect,
}) => {
  const nationalStats = storage.getNationalTargetStats();
  const missingPhonePool = storage.getMissingPhonePool();
  const expediteurs = storage.getExpediteurs();
  const readyExpediteurs = storage.getExpediteursReadyForFollowUp();

  const totalProspects = prospects.length;
  const verifiedProspects = prospects.filter(p => p.verification_status === 'VERIFIED').length;
  const aPlusProspects = prospects.filter(p => p.score === 'A+').length;
  const aProspects = prospects.filter(p => p.score === 'A').length;
  const bProspects = prospects.filter(p => p.score === 'B').length;
  const withPhone = prospects.filter(p => p.phone && p.phone_verification_status === 'VERIFIED').length;
  const withWhatsApp = prospects.filter(p => p.whatsapp === 'نعم').length;
  const activeEcommerce = prospects.filter(p => p.shipping_potential === 'HIGH').length;

  // Expéditeurs CRM KPIs (Section 35)
  const totalExpediteurs = expediteurs.length;
  const activeExpediteurs = expediteurs.filter(e => e.lifecycle_status === 'نشط' || e.status === 'نشط' || e.commercial_status === 'نشط').length;
  const inactiveExpediteurs = expediteurs.filter(e => e.lifecycle_status === 'غير نشط' || e.lifecycle_status === 'متوقف' || e.commercial_status === 'غير نشط' || e.commercial_status === 'متوقف مؤقتًا').length;
  const reactivationCandidates = expediteurs.filter(e => e.commercial_status === 'يحتاج إعادة تفعيل' || e.lifecycle_status === 'إعادة التفعيل').length;
  const assignedExpediteurs = expediteurs.filter(e => e.assigned_commercial && e.assigned_commercial !== 'غير معين').length;
  const unassignedExpediteurs = expediteurs.filter(e => !e.assigned_commercial || e.assigned_commercial === 'غير معين').length;

  const distinctWilayas = new Set(prospects.map(p => p.wilaya)).size;
  const activeJobs = campaigns.filter(c => c.status === 'Running' || c.status === 'Pending').length;

  // Percentage towards 10,000 target
  const targetPercent = Math.min(100, Math.round((nationalStats.drovaQualified / nationalStats.targetTotal) * 100));

  const wilayaBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {};
    prospects.forEach(p => {
      counts[p.wilaya] = (counts[p.wilaya] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [prospects]);

  const recentProspects = prospects.slice(0, 6);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* 10,000 Target Progress Tracker (Section 20 & 28) */}
      <div className="bg-[#141414] border-2 border-[#FF0000]/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FF0000] text-white flex items-center justify-center font-bold font-latin text-xl shadow-lg shadow-red-950/40">
              10K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  الهدف الوطني: قاعدة بيانات 10,000 تاجر حقيقي مؤهل للشحن
                </h2>
                <span className="text-[10px] font-mono font-bold bg-[#261414] text-[#FF0000] px-2 py-0.5 border border-red-950">
                  NATIONAL OBJECTIVE
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                تجميع متعدد المصادر متواصل عبر الولايات الـ 58 دون اعتماد على مصدر واحد ودون اصطناع أرقام وهمية
              </p>
            </div>
          </div>

          <div className="text-left font-mono-data">
            <span className="text-2xl font-bold text-white">
              {nationalStats.drovaQualified.toLocaleString()}
            </span>
            <span className="text-xs text-[#8E8E93]"> / 10,000 ({targetPercent}%)</span>
          </div>
        </div>

        {/* Multi-layered Progress Funnel Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-[#202020] overflow-hidden flex">
            <div
              className="h-full bg-[#FF0000] transition-all duration-500"
              style={{ width: `${targetPercent}%` }}
              title={`المؤهلون للشحن: ${nationalStats.drovaQualified}`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#8E8E93] font-mono-data">
            <span>تم استكشافهم إجمالاً: <strong className="text-white">{nationalStats.discoveredCandidates.toLocaleString()}</strong></span>
            <span>كيانات فريدة: <strong className="text-white">{nationalStats.uniqueBusinesses.toLocaleString()}</strong></span>
            <span>موثق بهاتف (+213): <strong className="text-emerald-400">{nationalStats.phoneVerified.toLocaleString()}</strong></span>
            <span>مؤهل للشحن التجاري (DROVA): <strong className="text-[#FF0000] font-bold">{nationalStats.drovaQualified.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Secondary Funnel Strip (Missing Phone, Review, Rejected) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#262626] text-xs">
          <div
            onClick={() => onNavigate('missing_phone' as any)}
            className="p-2.5 bg-[#181818] border border-[#2E2E2E] hover:border-amber-500/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span className="flex items-center gap-1">
                <PhoneOff size={13} className="text-amber-400" />
                <span>أرقام معلقة (Missing Phone)</span>
              </span>
              <span className="text-amber-400 font-bold font-mono-data">
                {nationalStats.missingPhonePool.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-[#545458] block mt-1">محفوظة لجدولة الإثراء الثاني</span>
          </div>

          <div
            onClick={() => onNavigate('review')}
            className="p-2.5 bg-[#181818] border border-[#2E2E2E] hover:border-amber-500/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-amber-400" />
                <span>بحاجة لمراجعة (Needs Review)</span>
              </span>
              <span className="text-amber-400 font-bold font-mono-data">
                {nationalStats.needsReview.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-[#545458] block mt-1">تأكيد بشري لمقر النشاط</span>
          </div>

          <div className="p-2.5 bg-[#181818] border border-[#2E2E2E]">
            <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span className="flex items-center gap-1">
                <AlertOctagon size={13} className="text-neutral-500" />
                <span>مستبعد ومرفوض (Rejected)</span>
              </span>
              <span className="text-neutral-400 font-bold font-mono-data">
                {nationalStats.rejected.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-[#545458] block mt-1">خدمات محلية / بلا هاتف</span>
          </div>

          <div
            onClick={() => onNavigate('graph' as any)}
            className="p-2.5 bg-[#181818] border border-[#2E2E2E] hover:border-[#FF0000]/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span className="flex items-center gap-1">
                <Share2 size={13} className="text-[#FF0000]" />
                <span>التقاطع الشبكي (Graph)</span>
              </span>
              <span className="text-white font-bold font-mono-data">14 مصدراً</span>
            </div>
            <span className="text-[10px] text-[#545458] block mt-1">عرض دمج الكيانات المتعددة</span>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="إجمالي التجار المسجلين"
          value={totalProspects}
          subtitle="في قاعدة البيانات الحالية"
          icon={<Users size={16} />}
          onClick={() => onNavigate('prospects')}
        />
        <StatCard
          title="تجار موثقون رسمياً"
          value={verifiedProspects}
          subtitle={`${totalProspects > 0 ? Math.round((verifiedProspects / totalProspects) * 100) : 0}% نسبة التوثيق`}
          icon={<CheckCircle2 size={16} className="text-emerald-400" />}
          highlight={true}
          onClick={() => onNavigate('prospects')}
        />
        <StatCard
          title="فئة A+ (أولوية قصوى)"
          value={aPlusProspects}
          subtitle="شحن وطني + إعلانات نشطة"
          icon={<Award size={16} className="text-[#FF0000]" />}
          highlight={true}
          onClick={() => onNavigate('prospects')}
        />
        <StatCard
          title="فئة A (تأهيل عالي)"
          value={aProspects}
          subtitle="تجارة إلكترونية نشطة"
          icon={<Award size={16} className="text-emerald-400" />}
          onClick={() => onNavigate('prospects')}
        />
        <StatCard
          title="فئة B (تأهيل متوسط)"
          value={bProspects}
          subtitle="بضائع قابلة للشحن"
          icon={<Award size={16} className="text-amber-400" />}
          onClick={() => onNavigate('prospects')}
        />
        <StatCard
          title="هواتف مؤكدة (+213)"
          value={withPhone}
          subtitle="مطابقة للمشغلين الجزائريين"
          icon={<Phone size={16} className="text-emerald-400" />}
          onClick={() => onNavigate('prospects')}
        />
      </div>

      {/* Expéditeurs & Commercial Operations KPI Strip (Section 35) */}
      <div className="bg-[#141414] border border-[#262626] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Truck size={17} className="text-[#FF0000]" />
            <span className="font-bold text-white text-sm">مؤشرات الشاحنين والعمليات التجارية (Expéditeurs & Commercial CRM)</span>
            <span className="text-[10px] bg-red-950/60 text-[#FF0000] border border-red-900/40 px-2 py-0.5 font-mono">
              SECTION 35
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('commercial_workspace')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1414] hover:bg-[#281818] border border-red-900/50 text-[#FF0000] text-xs font-bold transition-colors cursor-pointer"
            >
              <Headphones size={13} />
              <span>فضاء التجاري الميداني</span>
            </button>
            <button
              onClick={() => onNavigate('commercial_queue')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#333333] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <PhoneCall size={13} className="text-emerald-400" />
              <span>طابور المتابعة ({readyExpediteurs.length})</span>
            </button>
            <button
              onClick={() => onNavigate('expediteur_import')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>معالج استيراد ملفات الإكسيل (XLSX)</span>
            </button>
          </div>
        </div>

        {/* 6 Grid Metric Cards for Expéditeurs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div
            onClick={() => onNavigate('commercial_queue')}
            className="p-3 bg-[#181818] border border-[#2A2A2A] hover:border-[#FF0000]/60 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-[#8E8E93] block">إجمالي الشاحنين المسجلين</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono-data text-white">{totalExpediteurs}</span>
              <span className="text-[10px] text-[#8E8E93]">شاحن</span>
            </div>
            <span className="text-[10px] text-[#555555] block mt-1">المستوردون + المحولون</span>
          </div>

          <div
            onClick={() => onNavigate('commercial_queue')}
            className="p-3 bg-[#181818] border border-emerald-950/60 hover:border-emerald-600/50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-emerald-400 block">شاحنون نشطون حالياً</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono-data text-emerald-400">{activeExpediteurs}</span>
              <span className="text-[10px] text-emerald-500">نشط</span>
            </div>
            <span className="text-[10px] text-[#555555] block mt-1">شحن منتظم مع DROVA</span>
          </div>

          <div
            onClick={() => onNavigate('commercial_queue')}
            className="p-3 bg-[#181818] border border-[#2A2A2A] hover:border-amber-600/50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-amber-400 block">غير نشط / متوقف مؤقتاً</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono-data text-amber-400">{inactiveExpediteurs}</span>
              <span className="text-[10px] text-amber-500">متوقف</span>
            </div>
            <span className="text-[10px] text-[#555555] block mt-1">بحاجة للتحفيز واستطلاع السبب</span>
          </div>

          <div
            onClick={() => onNavigate('commercial_queue')}
            className="p-3 bg-[#181818] border border-rose-950/60 hover:border-rose-600/50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-rose-400 block">مرشحو إعادة التفعيل</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono-data text-rose-400">{reactivationCandidates}</span>
              <span className="text-[10px] text-rose-500">أولوية</span>
            </div>
            <span className="text-[10px] text-[#555555] block mt-1">توقف الشحن &gt; 30 يوماً</span>
          </div>

          <div
            onClick={() => onNavigate('commercial_queue')}
            className="p-3 bg-[#181818] border border-blue-950/60 hover:border-blue-600/50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-blue-400 block">طابور المتابعة الفورية</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono-data text-blue-400">{readyExpediteurs.length}</span>
              <span className="text-[10px] text-blue-500">جاهز</span>
            </div>
            <span className="text-[10px] text-[#555555] block mt-1">اتصال مستحق أو جديد</span>
          </div>

          <div
            onClick={() => onNavigate('commercial_queue')}
            className="p-3 bg-[#181818] border border-[#2A2A2A] hover:border-purple-600/50 transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-purple-400 block">توزيع المسؤوليات</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono-data text-white">{assignedExpediteurs}</span>
              <span className="text-[10px] text-[#8E8E93]">/ {unassignedExpediteurs} حر</span>
            </div>
            <span className="text-[10px] text-[#555555] block mt-1">معين لمندوب / بدون تعيين</span>
          </div>
        </div>
      </div>

      {/* 14 Discovery Sources Status Strip */}
      <div className="bg-[#141414] border border-[#262626] p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <Layers size={14} className="text-[#FF0000]" />
            <span>بنية موصلات استكشاف المصادر الـ 14 (Source Fusion Architecture):</span>
          </span>
          <button
            onClick={() => onNavigate('sources')}
            className="text-xs text-[#FF0000] hover:underline"
          >
            إدارة الموصلات والجاهزية
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-mono">
          {[
            { label: 'Google Maps / Business', online: true },
            { label: 'Meta Ads Library', online: true },
            { label: 'Facebook Pages', online: true },
            { label: 'Instagram Profiles', online: true },
            { label: 'TikTok Profiles', online: true },
            { label: 'Ouedkniss Stores', online: true },
            { label: 'Pages Jaunes DZ', online: true },
            { label: 'AnnuairesDZ 58W', online: true },
            { label: 'El Mouchir / CACI', online: true },
            { label: 'Kompass B2B', online: true },
            { label: 'Generic Directories', online: true },
            { label: 'E-commerce Standalone', online: true },
            { label: 'Web Dorks Indexer', online: true },
            { label: 'Reverse Discovery', online: true },
          ].map((s, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-[#1A1A1A] border border-[#2A2A2A] text-neutral-300 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Recent Prospects & Top Wilayas Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>أحدث التجار المؤهلين للشحن</span>
                  <span className="text-xs text-[#8E8E93] font-normal">· المضافون مؤخراً</span>
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  تجار تم توثيق أرقامهم وتقدير حجم طرودهم اليومية
                </p>
              </div>

              <button
                onClick={() => onNavigate('prospects')}
                className="text-xs text-[#FF0000] hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>عرض قاعدة التجار كاملة</span>
                <ArrowRight size={13} className="rotate-180" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-[#8E8E93] text-[11px]">
                    <th className="pb-2 font-medium">التاجر</th>
                    <th className="pb-2 font-medium">الولاية</th>
                    <th className="pb-2 font-medium">الهاتف</th>
                    <th className="pb-2 font-medium">المصدر الأصلي</th>
                    <th className="pb-2 font-medium">الناقل الحالي</th>
                    <th className="pb-2 font-medium">colis/يوم</th>
                    <th className="pb-2 font-medium">التقييم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1C]">
                  {recentProspects.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProspect(p)}
                      className="hover:bg-[#1A1A1A] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-medium text-white truncate max-w-[150px]">
                        {p.name}
                      </td>
                      <td className="py-2.5 text-[#EDEDED]">{p.wilaya}</td>
                      <td className="py-2.5 font-mono-data text-emerald-400">{p.phone}</td>
                      <td className="py-2.5 text-[#8E8E93] font-mono text-[11px]">{p.source}</td>
                      <td className="py-2.5 text-[#8E8E93]">{p.current_courier}</td>
                      <td className="py-2.5 font-mono-data font-bold text-white">{p.parcel_estimate}</td>
                      <td className="py-2.5">
                        <ScoreBadge score={p.score} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#262626] flex items-center justify-between text-xs text-[#8E8E93]">
            <span>عرض {recentProspects.length} من أصل {prospects.length} تجار</span>
            <button
              onClick={() => onNavigate('prospects')}
              className="text-xs text-[#EDEDED] hover:text-[#FF0000] underline"
            >
              الانتقال إلى الفلاتر المتقدمة
            </button>
          </div>
        </div>

        {/* Top Wilayas Density */}
        <div className="bg-[#121212] border border-[#262626] p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <MapPin size={15} className="text-[#FF0000]" />
              <span>أعلى الولايات كثافة تجارية</span>
            </h3>
            <p className="text-xs text-[#8E8E93] mb-4">
              توزيع التجار المؤهلين حسب الولاية ومقر النشاط
            </p>

            <div className="space-y-3">
              {wilayaBreakdown.map(([wilayaName, count], idx) => {
                const percentage = Math.round((count / (totalProspects || 1)) * 100);
                return (
                  <div key={wilayaName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white">{idx + 1}. {wilayaName}</span>
                      <span className="font-mono-data text-[#8E8E93]">
                        {count} تاجر ({percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1F1F1F]">
                      <div
                        className="h-full bg-[#FF0000]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-[#262626]">
            <div className="p-3 bg-[#181818] border border-[#262626]">
              <span className="text-xs font-bold text-white block mb-1">
                تنقيب واسع النطاق في ولاية جديدة
              </span>
              <p className="text-[11px] text-[#8E8E93] mb-3">
                ربط واد كنيس، مكتبة ميتا، وخرائط جوجل بمسح موحد
              </p>
              <button
                onClick={() => onNavigate('campaigns_new')}
                className="w-full py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-semibold transition-colors"
              >
                بدء مسح متعدد المصادر
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
