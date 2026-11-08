/**
 * DROVA Campaign Detail & Live Execution Engine View (Section 25 & 26)
 * Step-by-step pipeline tracker, metrics breakdown, and real-time execution logs
 */
import React, { useState, useEffect } from 'react';
import {
  Compass,
  Play,
  Pause,
  ArrowRight,
  Download,
  Users,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Copy,
  AlertTriangle,
  Award,
  Terminal,
  RefreshCw,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { Campaign, Prospect } from '../types';
import { storage } from '../services/storage';
import { StatCard } from '../components/ui/StatCard';
import { exportToExcel } from '../services/excel';
import { NavView } from '../components/layout/Sidebar';
import { BatchAssignmentModal } from '../components/crm/BatchAssignmentModal';

interface CampaignDetailViewProps {
  campaignId: string;
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onSelectProspect: (prospect: Prospect) => void;
}

export const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({
  campaignId,
  onNavigate,
  onSelectProspect,
}) => {
  const [campaign, setCampaign] = useState<Campaign | undefined>(() => storage.getCampaignById(campaignId));
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setCampaign(storage.getCampaignById(campaignId));
    });
    return unsubscribe;
  }, [campaignId]);

  if (!campaign) {
    return (
      <div className="p-8 text-center text-[#8E8E93]">
        <p className="text-sm">لم يتم العثور على الحملة المحددة.</p>
        <button
          onClick={() => onNavigate('campaigns')}
          className="mt-2 text-xs text-[#FF0000] underline"
        >
          العودة لقائمة الحملات
        </button>
      </div>
    );
  }

  const handleStartScan = async () => {
    setIsExecuting(true);
    await storage.runCampaign(campaign.id);
    setIsExecuting(false);
  };

  const handlePause = () => {
    storage.pauseCampaign(campaign.id);
  };

  const [serverIntegrations, setServerIntegrations] = useState<{ googlePlaces: boolean; metaAds: boolean }>({
    googlePlaces: false,
    metaAds: false,
  });

  useEffect(() => {
    fetch('/api/discovery/status')
      .then(res => res.json())
      .then(data => {
        setServerIntegrations({
          googlePlaces: Boolean(data.googlePlaces?.configured),
          metaAds: Boolean(data.metaAds?.configured),
        });
      })
      .catch(() => {});
  }, []);

  // Associated prospects
  const associatedProspects = storage.getProspects().filter(p => p.campaign_id === campaign.id);
  const needsGoogle = campaign.sources.includes('google_maps') && !serverIntegrations.googlePlaces;
  const needsMeta = campaign.sources.includes('meta_ads') && !serverIntegrations.metaAds;
  const errorLogsCount = campaign.logs.filter(l => l.type === 'error').length;
  const contactableCount = associatedProspects.filter(p => !!p.phone || p.verification_status === 'CONTACTABLE').length;

  const handleExportCampaign = () => {
    const safeName = campaign.name.replace(/[\/\s]/g, '_');
    exportToExcel(associatedProspects, `DROVA_CAMPAIGN_${safeName}.xlsx`);
  };

  const pipelineSteps = [
    { name: 'استكشاف المصادر', sub: 'Source Discovery', active: true, count: campaign.progress.discovered },
    { name: 'إثراء البيانات', sub: 'Data Enrichment', active: campaign.progress.enriched > 0, count: campaign.progress.enriched },
    { name: 'استخراج وتوثيق الهاتف', sub: 'Phone Discovery', active: campaign.progress.withPhone > 0, count: campaign.progress.withPhone },
    { name: 'التحقق من مقر النشاط', sub: 'Location Verification', active: campaign.progress.verified > 0, count: campaign.progress.verified },
    { name: 'كشف وإزالة التكرارات', sub: 'Deduplication', active: campaign.progress.duplicates > 0, count: campaign.progress.duplicates },
    { name: 'التأهيل والتقييم الذكي', sub: 'Lead Scoring', active: campaign.progress.verified > 0, count: campaign.progress.scoreAPlus + campaign.progress.scoreA + campaign.progress.scoreB },
    { name: 'التجار المعتمدون', sub: 'Approved Prospects', active: associatedProspects.length > 0, count: associatedProspects.length },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="bg-[#141414] border border-[#262626] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-white">{campaign.name}</h2>
            <span
              className={`text-xs px-2 py-0.5 font-medium ${
                campaign.status === 'Completed'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                  : campaign.status === 'Running'
                  ? 'bg-red-950 text-[#FF0000] border border-red-900 animate-pulse'
                  : 'bg-[#222222] text-[#8E8E93] border border-[#333333]'
              }`}
            >
              {campaign.status}
            </span>
          </div>

          <div className="text-xs text-[#8E8E93] flex flex-wrap items-center gap-3">
            <span>الولاية: <strong className="text-white">{campaign.wilaya}</strong></span>
            {campaign.commune && <span>البلدية: <strong className="text-white">{campaign.commune}</strong></span>}
            <span>المصادر: <strong className="text-white">{campaign.sources.length}</strong></span>
            <span>الهدف: <strong className="font-mono-data text-white">{campaign.target_number}</strong> تاجر</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {campaign.status !== 'Completed' && campaign.status !== 'Running' && (
            <button
              onClick={handleStartScan}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Play size={14} />
              <span>{isExecuting ? 'جاري الفحص المباشر...' : 'بدء الاستكشاف (Start Discovery)'}</span>
            </button>
          )}

          {campaign.status === 'Running' && (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Pause size={14} />
              <span>إيقاف مؤقت (Pause)</span>
            </button>
          )}

          {associatedProspects.length > 0 && (
            <>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-950 to-[#2A1616] hover:from-red-900 hover:to-[#381818] border border-[#FF0000]/60 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                <Sparkles size={14} className="text-[#FF0000]" />
                <span>⚡ توزيع تجار الحملة ({associatedProspects.length})</span>
              </button>
              <button
                onClick={handleExportCampaign}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-emerald-400" />
                <span>تصدير الحملة ({associatedProspects.length} تاجر)</span>
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate('campaigns')}
            className="px-3 py-2 text-xs text-[#8E8E93] hover:text-white border border-transparent hover:border-[#333333] transition-colors cursor-pointer"
          >
            العودة
          </button>
        </div>
      </div>

      {/* Section 14 Transparent Credential Status Banner */}
      {(needsGoogle || needsMeta) && (
        <div className="p-4 bg-[#1A140A] border border-amber-800/80 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-bold flex items-center gap-2 text-amber-300">
              <AlertTriangle size={15} />
              <span>ميثاق الشفافية (Section 14: Source Credential Requirement):</span>
            </div>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              {needsGoogle && <span>• مصدر Google Maps يتطلب إدخال مفتاح <span className="font-mono bg-amber-950/80 px-1 border border-amber-700">GOOGLE_PLACES_API_KEY</span>. </span>}
              {needsMeta && <span>• مصدر Meta Ads يتطلب رمز وصول <span className="font-mono bg-amber-950/80 px-1 border border-amber-700">META_ACCESS_TOKEN</span>. </span>}
              يواصل النظام العمل عبر المصادر المفتوحة المتاحة ولن يختلق أي بيانات وهمية.
            </p>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            إعداد المفاتيح في الإعدادات
          </button>
        </div>
      )}

      {/* Section 13 Real-time Progress Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <StatCard
          title="المصادر المفحوصة"
          value={campaign.sources.length}
          subtitle="Sources searched"
          icon={<Compass size={15} />}
        />
        <StatCard
          title="الأنشطة المكتشفة"
          value={campaign.progress.discovered}
          subtitle="Businesses discovered"
          icon={<Compass size={15} className="text-blue-400" />}
        />
        <StatCard
          title="التجار الجدد"
          value={associatedProspects.length}
          subtitle="New merchants"
          icon={<Users size={15} className="text-emerald-400" />}
          highlight={true}
        />
        <StatCard
          title="التكرارات"
          value={campaign.progress.duplicates}
          subtitle="Duplicates"
          icon={<Copy size={15} className="text-amber-400" />}
        />
        <StatCard
          title="الموثقون"
          value={campaign.progress.verified}
          subtitle="Verified"
          icon={<ShieldCheck size={15} className="text-emerald-400" />}
        />
        <StatCard
          title="جاهزون للاتصال"
          value={contactableCount}
          subtitle="Contactable"
          icon={<Phone size={15} className="text-emerald-400" />}
        />
        <StatCard
          title="المستبعدون"
          value={campaign.progress.rejected}
          subtitle="Rejected"
          icon={<AlertTriangle size={15} className="text-neutral-500" />}
        />
        <StatCard
          title="الأخطاء والقيود"
          value={errorLogsCount}
          subtitle="Errors"
          icon={<AlertTriangle size={15} className={errorLogsCount > 0 ? 'text-rose-500' : 'text-neutral-500'} />}
        />
      </div>

      {/* Lead Score Tiers Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-[#181818] border border-[#262626] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8E8E93] block">فئة A+ (أولوية مطلقة)</span>
            <span className="text-lg font-mono-data font-bold text-[#FF0000]">
              {campaign.progress.scoreAPlus}
            </span>
          </div>
          <Award size={20} className="text-[#FF0000]" />
        </div>

        <div className="p-3 bg-[#181818] border border-[#262626] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8E8E93] block">فئة A (تأهيل عالي)</span>
            <span className="text-lg font-mono-data font-bold text-emerald-400">
              {campaign.progress.scoreA}
            </span>
          </div>
          <Award size={20} className="text-emerald-400" />
        </div>

        <div className="p-3 bg-[#181818] border border-[#262626] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8E8E93] block">فئة B (تأهيل متوسط)</span>
            <span className="text-lg font-mono-data font-bold text-amber-400">
              {campaign.progress.scoreB}
            </span>
          </div>
          <Award size={20} className="text-amber-400" />
        </div>
      </div>

      {/* Live API Diagnostics & Source Breakdown (Google Places New & Meta Ads) */}
      <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[#FF0000]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              تفصيل أداء المصادر والتشخيص المباشر (Source Breakdown & Diagnostic Logs)
            </h3>
          </div>
          <span className="text-[11px] text-[#8E8E93]">
            مراقبة حية للمكالمات الخارجية مع خوادم Google Places (New) و Meta Ad Library
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Places Card */}
          <div className="p-4 bg-[#181818] border border-[#2E2E2E] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Google Places API (New)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#222222] text-neutral-300">
                POST /v1/places:searchText
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-[#121212] p-2 border border-[#262626]">
                <span className="text-[#8E8E93] block text-[10px]">الطلبات (Requests)</span>
                <span className="font-bold text-white font-mono-data text-sm">
                  {(campaign as any).discovery_breakdown?.googlePlaces?.requestsCount || 0}
                </span>
              </div>
              <div className="bg-[#121212] p-2 border border-[#262626]">
                <span className="text-[#8E8E93] block text-[10px]">الناجحة (Success)</span>
                <span className="font-bold text-emerald-400 font-mono-data text-sm">
                  {(campaign as any).discovery_breakdown?.googlePlaces?.successfulCount || 0}
                </span>
              </div>
              <div className="bg-[#121212] p-2 border border-[#262626]">
                <span className="text-[#8E8E93] block text-[10px]">الأماكن المسترجعة</span>
                <span className="font-bold text-blue-400 font-mono-data text-sm">
                  {(campaign as any).discovery_breakdown?.googlePlaces?.placesReturned || 0}
                </span>
              </div>
              <div className="bg-[#121212] p-2 border border-[#262626]">
                <span className="text-[#8E8E93] block text-[10px]">تجار جدد</span>
                <span className="font-bold text-emerald-300 font-mono-data text-sm">
                  {(campaign as any).discovery_breakdown?.googlePlaces?.newMerchantsAdded || 0}
                </span>
              </div>
              <div className="bg-[#121212] p-2 border border-[#262626]">
                <span className="text-[#8E8E93] block text-[10px]">التكرارات</span>
                <span className="font-bold text-amber-400 font-mono-data text-sm">
                  {(campaign as any).discovery_breakdown?.googlePlaces?.duplicatesFound || 0}
                </span>
              </div>
              <div className="bg-[#121212] p-2 border border-[#262626]">
                <span className="text-[#8E8E93] block text-[10px]">المستبعدون</span>
                <span className="font-bold text-neutral-400 font-mono-data text-sm">
                  {(campaign as any).discovery_breakdown?.googlePlaces?.rejectedCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Meta Ad Library Card */}
          <div className="p-4 bg-[#181818] border border-[#2E2E2E] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${(campaign as any).discovery_breakdown?.metaAds?.status === 'restricted' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                <span>Meta Ad Library API</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                (campaign as any).discovery_breakdown?.metaAds?.status === 'restricted'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-[#222222] text-neutral-300 border-[#333333]'
              }`}>
                {(campaign as any).discovery_breakdown?.metaAds?.status === 'restricted' ? 'مقيد جغرافياً' : 'جاهز'}
              </span>
            </div>

            <div className="bg-[#121212] p-3 border border-[#262626] text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8E8E93]">الحالة الرسمية:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {(campaign as any).discovery_breakdown?.metaAds?.status || 'Restricted / Unavailable'}
                </span>
              </div>
              <div className="text-[11px] text-[#A1A1AA] pt-1 border-t border-[#1C1C1C]">
                السبب: {(campaign as any).discovery_breakdown?.metaAds?.reason || 'قيود Meta Ad Library على الإعلانات التجارية في الجزائر (تقتصر على الإعلانات السياسية والاجتماعية)'}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Errors Callout (Never silently hide API errors) */}
        {((campaign as any).discovery_breakdown?.diagnosticErrors?.length > 0 || campaign.logs.some(l => l.type === 'error')) && (
          <div className="p-3 bg-red-950/40 border border-red-900 text-xs space-y-2">
            <div className="flex items-center gap-2 text-red-300 font-bold">
              <AlertTriangle size={15} className="text-red-400 shrink-0" />
              <span>أخطاء وقيود الـ API الموثقة (Real External API Error Log):</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              {(campaign as any).discovery_breakdown?.diagnosticErrors?.map((err: any, i: number) => (
                <div key={i} className="p-2 bg-[#121212] border border-red-900/60 text-red-200">
                  <div className="flex items-center justify-between text-[10px] text-[#8E8E93] mb-0.5">
                    <span>{err.source} · Query: "{err.query}"</span>
                    <span>{err.timestamp}</span>
                  </div>
                  <div className="font-bold text-red-400">
                    HTTP {err.httpStatus || 0} [{err.errorCode || 'API_ERROR'}]: {err.errorMessage}
                  </div>
                </div>
              ))}
              {(!((campaign as any).discovery_breakdown?.diagnosticErrors?.length) && campaign.logs.filter(l => l.type === 'error').map((l, i) => (
                <div key={i} className="p-2 bg-[#121212] border border-red-900/60 text-red-200">
                  <span className="text-red-400 font-bold">[{l.step}]</span> {l.message}
                </div>
              )))}
            </div>
          </div>
        )}
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="bg-[#141414] border border-[#262626] p-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
          مسار خط أنابيب المعالجة والتحقق (Pipeline Progression)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {pipelineSteps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 border text-center transition-colors ${
                step.active
                  ? 'bg-[#181818] border-[#383838]'
                  : 'bg-[#121212] border-[#222222] opacity-60'
              }`}
            >
              <span className="text-[10px] font-mono text-[#545458] block">0{idx + 1}</span>
              <span className="text-xs font-bold text-white block mt-1 truncate">{step.name}</span>
              <span className="text-[9px] text-[#8E8E93] block font-latin truncate">{step.sub}</span>
              <div className="mt-2 text-sm font-mono-data font-bold text-emerald-400">
                {step.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Terminal Logs (Section 25) */}
      <div className="bg-[#0A0A0A] border border-[#262626] p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222222] text-xs">
          <div className="flex items-center gap-2 text-white font-mono">
            <Terminal size={14} className="text-[#FF0000]" />
            <span>سجل تنفيذ المحرك اللحظي (Pipeline Live Logs)</span>
          </div>
          <span className="text-[10px] text-[#545458] font-mono">
            {campaign.logs.length} أحداث مسجلة
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-xs max-h-56 overflow-y-auto">
          {campaign.logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#545458] shrink-0 text-[10px]">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span
                className={`shrink-0 font-bold text-[10px] px-1 ${
                  log.type === 'success'
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : log.type === 'error'
                    ? 'text-red-400 bg-red-950/40'
                    : log.type === 'warn'
                    ? 'text-amber-400 bg-amber-950/40'
                    : 'text-neutral-300 bg-[#1A1A1A]'
                }`}
              >
                {log.step}
              </span>
              <span className="text-[#EDEDED]">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Discovered Prospects in this Campaign */}
      {associatedProspects.length > 0 && (
        <div className="bg-[#141414] border border-[#262626] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              التجار المؤهلون المستخرجون عبر هذه الحملة ({associatedProspects.length})
            </h3>
            <button
              onClick={() => onNavigate('prospects')}
              className="text-xs text-[#FF0000] hover:underline"
            >
              عرض في جدول البيانات العام
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-[#8E8E93]">
                  <th className="pb-2">التاجر</th>
                  <th className="pb-2">الولاية - البلدية</th>
                  <th className="pb-2">الهاتف الموثق</th>
                  <th className="pb-2">واتساب؟</th>
                  <th className="pb-2">الناقل الحالي</th>
                  <th className="pb-2">colis/يوم</th>
                  <th className="pb-2">التقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C1C]">
                {associatedProspects.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProspect(p)}
                    className="hover:bg-[#1C1C1C] cursor-pointer"
                  >
                    <td className="py-2 text-white font-medium">{p.name}</td>
                    <td className="py-2 text-[#8E8E93]">{p.wilaya} ({p.commune})</td>
                    <td className="py-2 font-mono-data text-emerald-400">{p.phone}</td>
                    <td className="py-2">{p.whatsapp}</td>
                    <td className="py-2 text-[#8E8E93]">{p.current_courier}</td>
                    <td className="py-2 font-mono-data font-bold text-white">{p.parcel_estimate}</td>
                    <td className="py-2 font-bold text-[#FF0000]">{p.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Assignment Modal */}
      <BatchAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          setCampaign(storage.getCampaignById(campaignId));
        }}
        initialCampaignId={campaign.id}
        initialWilaya={campaign.wilaya.includes(',') || campaign.wilaya === 'all' ? undefined : campaign.wilaya}
      />
    </div>
  );
};
