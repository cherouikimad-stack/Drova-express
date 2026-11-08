/**
 * DROVA 69 Algerian Wilayas Directory & Prospect Density Matrix (Section 28 & 29)
 */
import React, { useState } from 'react';
import { MapPin, Search, Plus, Users, Award, ExternalLink } from 'lucide-react';
import { ALGERIA_WILAYAS, searchWilayas } from '../data/wilayas';
import { Prospect } from '../types';
import { NavView } from '../components/layout/Sidebar';

interface WilayasViewProps {
  prospects: Prospect[];
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onFilterByWilaya: (wilayaName: string) => void;
}

export const WilayasView: React.FC<WilayasViewProps> = ({
  prospects,
  onNavigate,
  onFilterByWilaya,
}) => {
  const [search, setSearch] = useState('');

  const wilayaStats = React.useMemo(() => {
    const map: Record<string, { total: number; aPlus: number; withPhone: number; withWa: number }> = {};
    prospects.forEach(p => {
      if (!map[p.wilaya]) {
        map[p.wilaya] = { total: 0, aPlus: 0, withPhone: 0, withWa: 0 };
      }
      map[p.wilaya].total++;
      if (p.score === 'A+') map[p.wilaya].aPlus++;
      if (p.phone && p.phone_verification_status === 'VERIFIED') map[p.wilaya].withPhone++;
      if (p.whatsapp === 'نعم') map[p.wilaya].withWa++;
    });
    return map;
  }, [prospects]);

  const filteredWilayas = searchWilayas(search);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin size={20} className="text-[#FF0000]" />
            <span>دليل الولايات الـ 69 (69 Algerian Wilayas Coverage)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            كثافة وتغطية التجار عبر كافة الولايات الجزائرية، مع إمكانية بدء حملة تنقيب موجهة بضغطة زر
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
          <input
            type="text"
            placeholder="بحث برقم الولاية، الاسم العربي، أو الفرنسي..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#181818] border border-[#333333] pr-9 pl-3 py-1.5 text-xs text-white placeholder-[#545458] outline-none focus:border-[#FF0000]"
          />
        </div>
      </div>

      {/* Wilayas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredWilayas.map(w => {
          const stats = wilayaStats[w.nameAr] || { total: 0, aPlus: 0, withPhone: 0, withWa: 0 };
          const hasProspects = stats.total > 0;

          return (
            <div
              key={w.code}
              className={`p-4 border transition-colors flex flex-col justify-between ${
                hasProspects
                  ? 'bg-[#151515] border-[#2A2A2A] hover:border-[#FF0000]/60'
                  : 'bg-[#121212] border-[#202020] opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#1F1F1F] text-xs font-mono-data font-bold text-[#FF0000] flex items-center justify-center">
                      {w.code}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">{w.nameAr}</h3>
                      <span className="text-[10px] text-[#8E8E93] font-latin">{w.nameFr}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono-data font-bold text-white">
                    {stats.total} تاجر
                  </span>
                </div>

                <div className="text-[11px] text-[#8E8E93] space-y-1 py-2 border-t border-[#222222]">
                  <div className="flex items-center justify-between">
                    <span>تجار فئة A+:</span>
                    <span className="font-mono-data font-semibold text-[#FF0000]">{stats.aPlus}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>هواتف مؤكدة:</span>
                    <span className="font-mono-data text-emerald-400">{stats.withPhone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>قناة واتساب:</span>
                    <span className="font-mono-data text-emerald-400">{stats.withWa}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#222222] flex items-center justify-between gap-2 text-xs">
                {hasProspects ? (
                  <button
                    onClick={() => onFilterByWilaya(w.nameAr)}
                    className="text-xs text-[#EDEDED] hover:text-[#FF0000] underline"
                  >
                    عرض التجار ({stats.total})
                  </button>
                ) : (
                  <span className="text-[11px] text-[#545458]">لا توجد بيانات حالياً</span>
                )}

                <button
                  onClick={() => onNavigate('campaigns_new')}
                  className="p-1 text-[#8E8E93] hover:text-[#FF0000] hover:bg-[#1C1C1C] transition-colors"
                  title={`بدء حملة تنقيب في ولاية ${w.nameAr}`}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
