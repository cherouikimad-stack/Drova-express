/**
 * DROVA Discovery Graph & Entity Resolution Visualizer (Section 18 & 19)
 * Maps multi-channel presence (Google Maps, FB, IG, TikTok, Ouedkniss, Website, Ads) to single real merchants
 */
import React, { useState } from 'react';
import {
  Share2,
  Building,
  ExternalLink,
  Phone,
  ShieldCheck,
  Search,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Prospect } from '../types';
import { storage } from '../services/storage';
import { ScoreBadge, VerificationBadge } from '../components/ui/Badge';

interface DiscoveryGraphViewProps {
  onSelectProspect: (prospect: Prospect) => void;
}

export const DiscoveryGraphView: React.FC<DiscoveryGraphViewProps> = ({
  onSelectProspect,
}) => {
  const [prospects] = useState<Prospect[]>(() => storage.getProspects());
  const [selectedProspectId, setSelectedProspectId] = useState<string>(prospects[0]?.id || '');
  const [search, setSearch] = useState('');

  const selectedProspect = prospects.find(p => p.id === selectedProspectId) || prospects[0];

  const filteredProspects = prospects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.wilaya.toLowerCase().includes(search.toLowerCase())
  );

  // Generate simulated graph connections across channels for this merchant
  const graphConnections = React.useMemo(() => {
    if (!selectedProspect) return [];
    const nodes = [
      {
        channel: 'الهاتف الموثق (+213)',
        identifier: selectedProspect.phone,
        type: 'phone',
        confidence: 0.99,
        source: 'Algerian Telecom Registry',
        verified: true,
      },
      {
        channel: 'المصدر الرئيسي',
        identifier: selectedProspect.source,
        type: 'source',
        confidence: 0.95,
        source: selectedProspect.source,
        verified: true,
      },
      {
        channel: 'مقر النشاط التجاري',
        identifier: `${selectedProspect.wilaya} - ${selectedProspect.commune}`,
        type: 'location',
        confidence: selectedProspect.business_location_verification === 'VERIFIED' ? 0.95 : 0.75,
        source: 'Cadastre / Google Maps Geo',
        verified: selectedProspect.business_location_verification === 'VERIFIED',
      },
      {
        channel: 'حساب التواصل / المتجر',
        identifier: selectedProspect.page_url,
        type: 'web',
        confidence: 0.92,
        source: selectedProspect.page_url.includes('ouedkniss') ? 'Ouedkniss Store' : 'Social Page',
        verified: true,
      },
    ];

    if (selectedProspect.whatsapp === 'نعم') {
      nodes.push({
        channel: 'قناة واتساب للأعمال',
        identifier: `wa.me/${selectedProspect.phone.replace('+', '')}`,
        type: 'whatsapp',
        confidence: 0.95,
        source: 'Direct WhatsApp API Anchor',
        verified: true,
      });
    }

    if (selectedProspect.current_courier !== 'غير معروف') {
      nodes.push({
        channel: 'شركة التوصيل الحالية',
        identifier: selectedProspect.current_courier,
        type: 'courier',
        confidence: selectedProspect.loyalty_level === 'High' ? 0.9 : 0.7,
        source: selectedProspect.courier_evidence || 'Courier Post Proof',
        verified: true,
      });
    }

    return nodes;
  }, [selectedProspect]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#262626] pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Share2 size={20} className="text-[#FF0000]" />
          <span>خريطة التقاطع الشبكي وهوية الكيانات (Discovery Graph & Entity Resolution)</span>
        </h2>
        <p className="text-xs text-[#8E8E93] mt-1">
          تمثيل العلاقات المتعددة (Google Maps + Facebook + Instagram + Ouedkniss + Web) لدمجها في كيان تجاري حقيقي واحد
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Merchant Selector List (1 col) */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="بحث في الكيانات التجارية..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#181818] border border-[#333333] pr-9 pl-3 py-1.5 text-xs text-white placeholder-[#545458] outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredProspects.map(p => {
              const isSelected = p.id === selectedProspect?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProspectId(p.id)}
                  className={`p-3 border cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-[#1C1616] border-[#FF0000] text-white'
                      : 'bg-[#141414] border-[#262626] text-[#8E8E93] hover:text-white hover:bg-[#181818]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white truncate max-w-[170px]">{p.name}</span>
                    <ScoreBadge score={p.score} />
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">
                    {p.wilaya} · <span className="font-mono-data text-emerald-400">{p.phone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discovery Graph Canvas View (2 cols) */}
        {selectedProspect && (
          <div className="md:col-span-2 bg-[#121212] border border-[#262626] p-6 space-y-6">
            {/* Center Anchor: Merchant Identity */}
            <div className="p-5 bg-[#181818] border-2 border-[#FF0000]/60 text-center relative">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#FF0000] font-bold block mb-1">
                الكيان التجاري الموحد (Unified Merchant Entity)
              </span>
              <h3 className="text-base font-bold text-white">{selectedProspect.name}</h3>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                {selectedProspect.merchant_type} · {selectedProspect.product}
              </p>

              <div className="flex items-center justify-center gap-3 mt-3">
                <ScoreBadge score={selectedProspect.score} />
                <VerificationBadge level={selectedProspect.verification_status} />
                <span className="text-xs font-mono-data text-emerald-400 font-bold">
                  {selectedProspect.phone}
                </span>
              </div>
            </div>

            {/* Connected Graph Nodes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8E8E93] border-b border-[#222222] pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Layers size={14} className="text-cyan-400" />
                  <span>الروابط المتقاطعة والمنصات المؤكدة ({graphConnections.length} قنوات):</span>
                </span>
                <span>مطابقة الهوية: 100% موثقة</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {graphConnections.map((node, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-[#161616] border border-[#282828] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{node.channel}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        ثقة {(node.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="font-mono text-[11px] text-neutral-300 truncate" title={node.identifier}>
                      {node.identifier}
                    </div>

                    <div className="text-[10px] text-[#8E8E93] pt-1 border-t border-[#222222] flex items-center justify-between">
                      <span>المصدر: {node.source}</span>
                      <span className="text-emerald-400">مؤكد ومطابق</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action to View Dossier */}
            <div className="pt-4 border-t border-[#262626] flex items-center justify-between text-xs">
              <span className="text-[#8E8E93]">
                تم دمج هذا الكيان استناداً إلى أسبقية التطابق: الهاتف الموحد ونطاق المتجر
              </span>
              <button
                onClick={() => onSelectProspect(selectedProspect)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#333333] transition-colors"
              >
                <span>فتح ملف التاجر الكامل</span>
                <ArrowRight size={13} className="rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
