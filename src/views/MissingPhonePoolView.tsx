/**
 * DROVA Missing Phone Pool & Second-Pass Enrichment Hub (Section 22 & 25)
 * Preserves discovered merchants without phones and provides automated secondary enrichment
 */
import React, { useState } from 'react';
import {
  PhoneOff,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building,
  ArrowRight
} from 'lucide-react';
import { MissingPhoneCandidate } from '../types';
import { storage } from '../services/storage';
import { NavView } from '../components/layout/Sidebar';

interface MissingPhonePoolViewProps {
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onRefresh: () => void;
}

export const MissingPhonePoolView: React.FC<MissingPhonePoolViewProps> = ({
  onNavigate,
  onRefresh,
}) => {
  const [candidates, setCandidates] = useState<MissingPhoneCandidate[]>(() => storage.getMissingPhonePool());
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentMessage, setEnrichmentMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleRunSecondPass = async () => {
    setIsEnriching(true);
    setEnrichmentMessage('جاري تشغيل محرك التقاطع الشبكي والزحف العكسي لاستخراج الهواتف...');

    try {
      const res = await storage.runSecondPassEnrichment(msg => setEnrichmentMessage(msg));
      setCandidates(storage.getMissingPhonePool());
      setEnrichmentMessage(`اكتملت الجولة الثانية! تم استرجاع وترقية ${res.recoveredCount} تاجر بنجاح لقاعدة التجار المعتمدين.`);
      onRefresh();
    } catch (e: any) {
      setEnrichmentMessage(`حدث خطأ أثناء الإثراء: ${e.message}`);
    } finally {
      setIsEnriching(false);
    }
  };

  const filtered = candidates.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.wilaya.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PhoneOff size={20} className="text-amber-400" />
            <span>مجمع الأرقام المعلقة (Missing Phone Recovery Pool)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            تطبيق المبدأ الصارم: عدم حذف البيانات الجزئية (Section 25). يتم حفظ الأنشطة بانتظار دورات الإثراء اللاحقة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunSecondPass}
            disabled={isEnriching || candidates.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-40"
          >
            <RefreshCw size={14} className={isEnriching ? 'animate-spin' : ''} />
            <span>{isEnriching ? 'جاري الفحص المتقاطع...' : 'تشغيل الإثراء من الدرجة الثانية (Second-Pass)'}</span>
          </button>
        </div>
      </div>

      {/* Info notice (Section 22 & 25) */}
      <div className="p-4 bg-[#141414] border border-[#262626] text-xs text-neutral-300 space-y-2">
        <span className="font-bold text-white flex items-center gap-2">
          <Zap size={15} className="text-amber-400" />
          <span>منهجية عدم فقدان البيانات والإثراء ثنائي المرحلة:</span>
        </span>
        <p className="text-[#8E8E93] text-[11px] leading-relaxed">
          عندما يتم اكتشاف نشاط تجاري حقيقي عبر المواقع أو الإنستغرام أو واد كنيس دون رقم هاتف مباشر، لا نقوم بإسقاطه فوراً.
          يتم حفظه في هذا المجمع، وعند تشغيل <strong>الإثراء من الدرجة الثانية</strong> يقوم النظام بالبحث العكسي ومطابقة النطاق والاسم عبر خرائط جوجل والأدلة التجارية لاستخراج الهاتف الموثق وترقيته آلياً إلى قاعدة التجار المعتمدة (DROVA Prospects).
        </p>
      </div>

      {/* Live Enrichment Message Alert */}
      {enrichmentMessage && (
        <div className="p-3 bg-[#1C1814] border border-amber-900/50 text-xs text-amber-300 flex items-center gap-2 font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{enrichmentMessage}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative min-w-[280px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
          <input
            type="text"
            placeholder="بحث بالاسم، الولاية، أو النشاط..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-[#333333] pr-9 pl-3 py-1.5 text-xs text-white placeholder-[#545458] outline-none"
          />
        </div>

        <span className="text-xs font-mono-data text-[#8E8E93]">
          إجمالي المرشحين المحفوظين: <strong className="text-white">{candidates.length}</strong> سجل
        </span>
      </div>

      {/* Candidates Grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[#8E8E93] bg-[#141414] border border-[#262626]">
            <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-sm">لا توجد سجلات معلقة حالياً في هذا المجمع.</p>
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="p-4 bg-[#141414] border border-[#262626] hover:border-[#383838] transition-colors flex flex-wrap items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1 min-w-[240px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{item.name}</span>
                  <span className="text-[10px] font-mono text-[#8E8E93] bg-[#1F1F1F] px-1.5 py-0.5">
                    {item.source}
                  </span>
                </div>
                <div className="text-[11px] text-[#8E8E93]">
                  {item.category} · {item.wilaya} - {item.commune}
                </div>
                <p className="text-[11px] text-neutral-400">{item.product}</p>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[#8E8E93] text-[11px] block">محاولات الإثراء السابقة:</span>
                <span className="font-mono-data text-amber-400 font-semibold block">
                  {item.retry_count} محاولات
                </span>
                <span className="text-[10px] text-[#545458]">
                  تاريخ الالتقاط: {new Date(item.discovered_at).toLocaleDateString('ar-DZ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#282828] text-xs text-blue-400 border border-[#333333]"
                >
                  <ExternalLink size={12} />
                  <span>فتح الرابط الأصلي</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
