/**
 * DROVA Exports Hub (Section 35)
 * Dedicated export center with pre-configured filters and exact 20-column Excel schemas
 */
import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Award,
  MapPin,
  Compass,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Prospect, Campaign } from '../types';
import { ALGERIA_WILAYAS } from '../data/wilayas';
import { exportToExcel, exportToCSV } from '../services/excel';

interface ExportsViewProps {
  prospects: Prospect[];
  campaigns: Campaign[];
}

export const ExportsView: React.FC<ExportsViewProps> = ({
  prospects,
  campaigns,
}) => {
  const [selectedWilaya, setSelectedWilaya] = useState(ALGERIA_WILAYAS[0].nameAr);
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id || '');
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const currentYear = new Date().getFullYear();

  const handleExport = (list: Prospect[], nameTag: string) => {
    const filename = `DROVA_${nameTag.toUpperCase()}_PROSPECTS_${currentYear}.${format}`;
    if (format === 'xlsx') {
      exportToExcel(list, filename);
    } else {
      exportToCSV(list, filename);
    }
  };

  // Preset Filters
  const allVerified = prospects.filter(p => p.verification_status === 'VERIFIED');
  const aPlusOnly = prospects.filter(p => p.score === 'A+');
  const aOnly = prospects.filter(p => p.score === 'A');
  const aPlusAndA = prospects.filter(p => p.score === 'A+' || p.score === 'A');
  const byWilaya = prospects.filter(p => p.wilaya === selectedWilaya);
  const byCampaign = prospects.filter(p => p.campaign_id === selectedCampaignId);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download size={20} className="text-[#FF0000]" />
            <span>مركز تصدير البيانات وقوائم المبيعات (DROVA Exports Hub)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            استخراج ملفات إكسيل جاهزة ومطابقة للأعمدة العشرين المعتمدة لفريق المبيعات
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex bg-[#181818] border border-[#333333] p-1 text-xs">
          <button
            onClick={() => setFormat('xlsx')}
            className={`flex items-center gap-1.5 px-3 py-1 font-medium transition-colors ${
              format === 'xlsx' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <FileSpreadsheet size={13} />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => setFormat('csv')}
            className={`flex items-center gap-1.5 px-3 py-1 font-medium transition-colors ${
              format === 'csv' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>CSV (UTF-8)</span>
          </button>
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preset 1: All Verified */}
        <div className="p-5 bg-[#141414] border border-[#262626] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>كافة التجار الموثقين (All Verified)</span>
              </h3>
              <span className="text-xs font-mono-data font-bold text-emerald-400">
                {allVerified.length} تاجر
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              تصدير السجلات التي اجتازت شروط التحقق الصارمة بهواتف مؤكدة ومواقع نشاط واضحة
            </p>
          </div>

          <button
            onClick={() => handleExport(allVerified, 'ALL_VERIFIED')}
            disabled={allVerified.length === 0}
            className="w-full py-2 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          >
            <Download size={14} className="text-[#FF0000]" />
            <span>تنزيل الملف المعتمد</span>
          </button>
        </div>

        {/* Preset 2: A+ Priority */}
        <div className="p-5 bg-[#141414] border border-[#262626] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award size={16} className="text-[#FF0000]" />
                <span>تجار فئة A+ فقط (Highest Priority)</span>
              </h3>
              <span className="text-xs font-mono-data font-bold text-[#FF0000]">
                {aPlusOnly.length} تاجر
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              تجار التجارة الإلكترونية الأكثر نشاطاً مع إعلانات جارية وشحن وطني وحجم طرود مرتفع
            </p>
          </div>

          <button
            onClick={() => handleExport(aPlusOnly, 'PRIORITY_A_PLUS')}
            disabled={aPlusOnly.length === 0}
            className="w-full py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-40"
          >
            <Download size={14} />
            <span>تنزيل قائمة A+</span>
          </button>
        </div>

        {/* Preset 3: A+ and A combined */}
        <div className="p-5 bg-[#141414] border border-[#262626] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award size={16} className="text-cyan-400" />
                <span>تجار الفئتين A+ و A معاً (Commercial Ready)</span>
              </h3>
              <span className="text-xs font-mono-data font-bold text-cyan-400">
                {aPlusAndA.length} تاجر
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              القائمة المفضلة للمبيعات: تجمع بين أعلى وأقوى التجار تأهيلاً للشحن السريع
            </p>
          </div>

          <button
            onClick={() => handleExport(aPlusAndA, 'TIER_A_PLUS_AND_A')}
            disabled={aPlusAndA.length === 0}
            className="w-full py-2 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          >
            <Download size={14} className="text-cyan-400" />
            <span>تنزيل قائمة A+ و A</span>
          </button>
        </div>

        {/* Preset 4: By Wilaya */}
        <div className="p-5 bg-[#141414] border border-[#262626] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin size={16} className="text-amber-400" />
                <span>تصدير تجار ولاية محددة</span>
              </h3>
              <span className="text-xs font-mono-data font-bold text-white">
                {byWilaya.length} تاجر
              </span>
            </div>

            <select
              value={selectedWilaya}
              onChange={e => setSelectedWilaya(e.target.value)}
              className="w-full bg-[#181818] border border-[#333333] px-2.5 py-1.5 text-xs text-white"
            >
              {ALGERIA_WILAYAS.map(w => (
                <option key={w.code} value={w.nameAr}>
                  {w.code} - {w.nameAr} ({w.nameFr})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleExport(byWilaya, selectedWilaya.replace(/\s+/g, '_'))}
            disabled={byWilaya.length === 0}
            className="w-full py-2 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          >
            <Download size={14} className="text-amber-400" />
            <span>تنزيل ملف ولاية {selectedWilaya}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
