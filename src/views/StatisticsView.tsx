/**
 * DROVA Database Statistics & Analytics Center (Section 29)
 * Comprehensive visual analytics, courier share, category rankings, and phone coverage
 */
import React from 'react';
import {
  BarChart3,
  PieChart,
  MapPin,
  TrendingUp,
  Truck,
  Phone,
  MessageCircle,
  Award,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Prospect, Campaign } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { ScoreBadge } from '../components/ui/Badge';

interface StatisticsViewProps {
  prospects: Prospect[];
  campaigns: Campaign[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  prospects,
  campaigns,
}) => {
  const total = prospects.length || 1;

  // Counts
  const verified = prospects.filter(p => p.verification_status === 'VERIFIED').length;
  const aPlus = prospects.filter(p => p.score === 'A+').length;
  const a = prospects.filter(p => p.score === 'A').length;
  const b = prospects.filter(p => p.score === 'B').length;
  const withPhone = prospects.filter(p => p.phone && p.phone_verification_status === 'VERIFIED').length;
  const withWa = prospects.filter(p => p.whatsapp === 'نعم').length;
  const courierKnown = prospects.filter(p => p.current_courier && p.current_courier !== 'غير معروف').length;
  const courierUnknown = prospects.filter(p => !p.current_courier || p.current_courier === 'غير معروف').length;

  const duplicatesCount = campaigns.reduce((acc, c) => acc + (c.progress.duplicates || 0), 0);
  const rejectedCount = campaigns.reduce((acc, c) => acc + (c.progress.rejected || 0), 0);

  // Couriers distribution
  const courierStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    prospects.forEach(p => {
      const c = p.current_courier || 'غير معروف';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((x, y) => y[1] - x[1]);
  }, [prospects]);

  // Categories distribution
  const categoryStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    prospects.forEach(p => {
      const c = p.category || 'غير محدد';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((x, y) => y[1] - x[1]);
  }, [prospects]);

  // Wilaya distribution
  const wilayaStats = React.useMemo(() => {
    const counts: Record<string, { total: number; aPlus: number; a: number; b: number }> = {};
    prospects.forEach(p => {
      if (!counts[p.wilaya]) counts[p.wilaya] = { total: 0, aPlus: 0, a: 0, b: 0 };
      counts[p.wilaya].total++;
      if (p.score === 'A+') counts[p.wilaya].aPlus++;
      else if (p.score === 'A') counts[p.wilaya].a++;
      else if (p.score === 'B') counts[p.wilaya].b++;
    });
    return Object.entries(counts).sort((x, y) => y[1].total - x[1].total);
  }, [prospects]);

  // Source distribution
  const sourceStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    prospects.forEach(p => {
      const s = p.source || 'أخرى';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).sort((x, y) => y[1] - x[1]);
  }, [prospects]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#262626] pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-[#FF0000]" />
          <span>إحصائيات وتحليلات استخبارات التجار (Database Statistics)</span>
        </h2>
        <p className="text-xs text-[#8E8E93] mt-1">
          رؤى شاملة حول الكثافة الجغرافية، حصة شركات التوصيل الحالية، وتوزيع تصنيفات الجودة
        </p>
      </div>

      {/* KPI Top Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="تغطية الهواتف" value={`${Math.round((withPhone / total) * 100)}%`} subtitle={`${withPhone} رقم مؤكد`} icon={<Phone size={15} className="text-emerald-400" />} />
        <StatCard title="تغطية الواتساب" value={`${Math.round((withWa / total) * 100)}%`} subtitle={`${withWa} قناة موثقة`} icon={<MessageCircle size={15} className="text-emerald-400" />} />
        <StatCard title="الناقل الحالي معروف" value={`${Math.round((courierKnown / total) * 100)}%`} subtitle={`${courierKnown} تاجر`} icon={<Truck size={15} className="text-cyan-400" />} />
        <StatCard title="الناقل غير معروف" value={courierUnknown} subtitle="فرصة استقطاب مباشرة" icon={<Truck size={15} className="text-amber-400" />} />
        <StatCard title="تكرارات مدمجة" value={duplicatesCount} subtitle="تجميع مصادر موحد" icon={<TrendingUp size={15} className="text-amber-400" />} />
        <StatCard title="مستبعد بالجودة" value={rejectedCount} subtitle="استبعاد عدم المطابقة" icon={<ShieldCheck size={15} className="text-neutral-500" />} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wilaya Distribution Table & Bar */}
        <div className="bg-[#141414] border border-[#262626] p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-[#FF0000]" />
              <span>توزيع التجار ومؤشرات A+ حسب الولاية</span>
            </span>
            <span className="text-[11px] text-[#8E8E93] font-normal font-mono-data">
              {wilayaStats.length} ولاية
            </span>
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {wilayaStats.map(([wilayaName, data]) => {
              const pct = Math.round((data.total / total) * 100);
              return (
                <div key={wilayaName} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{wilayaName}</span>
                    <div className="flex items-center gap-2 text-[11px] font-mono-data">
                      <span className="text-[#FF0000] font-bold">A+: {data.aPlus}</span>
                      <span className="text-emerald-400">A: {data.a}</span>
                      <span className="text-[#8E8E93]">المجموع: {data.total} ({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[#202020]">
                    <div className="h-full bg-[#FF0000]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Courier Market Share */}
        <div className="bg-[#141414] border border-[#262626] p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Truck size={14} className="text-cyan-400" />
              <span>حصة شركات التوصيل الحالية (Courier Market Intelligence)</span>
            </span>
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {courierStats.map(([courierName, count]) => {
              const pct = Math.round((count / total) * 100);
              const isUnknown = courierName === 'غير معروف';
              return (
                <div key={courierName} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isUnknown ? 'text-amber-400' : 'text-white'}`}>
                      {courierName}
                    </span>
                    <span className="font-mono-data text-[#8E8E93]">
                      {count} تاجر ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#202020]">
                    <div
                      className={`h-full ${isUnknown ? 'bg-amber-500' : 'bg-cyan-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#141414] border border-[#262626] p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            توزيع التجار حسب النشاط والمنتجات
          </h3>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {categoryStats.map(([cat, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={cat} className="flex items-center justify-between text-xs py-1 border-b border-[#1F1F1F]">
                  <span className="text-[#EDEDED]">{cat}</span>
                  <span className="font-mono-data font-bold text-white">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sources Distribution */}
        <div className="bg-[#141414] border border-[#262626] p-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            توزيع المصادر الاستكشافية الأصلية
          </h3>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {sourceStats.map(([src, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={src} className="flex items-center justify-between text-xs py-1 border-b border-[#1F1F1F]">
                  <span className="text-[#EDEDED] font-mono text-[11px]">{src}</span>
                  <span className="font-mono-data font-bold text-emerald-400">
                    {count} تاجر ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
