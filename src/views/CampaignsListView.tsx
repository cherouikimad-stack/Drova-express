/**
 * DROVA Campaigns List View
 * Management of all merchant collection campaigns across Algeria
 */
import React from 'react';
import {
  Compass,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  AlertCircle
} from 'lucide-react';
import { Campaign } from '../types';
import { NavView } from '../components/layout/Sidebar';
import { exportToExcel } from '../services/excel';
import { storage } from '../services/storage';

interface CampaignsListViewProps {
  campaigns: Campaign[];
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
}

export const CampaignsListView: React.FC<CampaignsListViewProps> = ({
  campaigns,
  onNavigate,
}) => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass size={20} className="text-[#FF0000]" />
            <span>حملات التنقيب والاستكشاف (Collection Campaigns)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            سجل وتاريخ حملات الاستكشاف الموجهة للولايات مع تفصيل مؤشرات الجودة والتقدم
          </p>
        </div>

        <button
          onClick={() => onNavigate('campaigns_new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>إنشاء حملة تنقيب جديدة</span>
        </button>
      </div>

      {/* Campaigns Grid / List */}
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center text-[#8E8E93] bg-[#141414] border border-[#262626]">
            <Compass size={32} className="mx-auto mb-2 text-[#545458]" />
            <p className="text-sm">لم يتم إنشاء أي حملة تنقيب بعد.</p>
            <button
              onClick={() => onNavigate('campaigns_new')}
              className="mt-3 px-4 py-2 bg-[#FF0000] text-white text-xs font-bold inline-block"
            >
              إطلاق أول حملة الآن
            </button>
          </div>
        ) : (
          campaigns.map(camp => {
            const isCompleted = camp.status === 'Completed';
            const isRunning = camp.status === 'Running';
            const verifiedCount = camp.progress.verified;

            return (
              <div
                key={camp.id}
                onClick={() => onNavigate('campaigns', { id: camp.id })}
                className="p-5 bg-[#141414] border border-[#262626] hover:border-[#383838] cursor-pointer transition-colors space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white hover:text-[#FF0000] transition-colors">
                        {camp.name}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 font-medium ${
                          isCompleted
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            : isRunning
                            ? 'bg-red-950 text-[#FF0000] border border-red-900 animate-pulse'
                            : 'bg-[#222222] text-[#8E8E93] border border-[#333333]'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#8E8E93] flex flex-wrap items-center gap-3 mt-1.5">
                      <span>الولاية: <strong className="text-white">{camp.wilaya}</strong></span>
                      {camp.commune && <span>البلدية: <strong className="text-white">{camp.commune}</strong></span>}
                      <span>المصادر: <strong className="text-white">{camp.sources.length}</strong></span>
                      <span>تاريخ البدء: <strong className="text-white">{new Date(camp.created_at).toLocaleDateString('ar-DZ')}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onNavigate('campaigns', { id: camp.id });
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#282828] text-xs text-[#EDEDED] border border-[#333333]"
                    >
                      <span>عرض تفاصيل المسار</span>
                      <ArrowRight size={13} className="rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Metric Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2 border-t border-[#1F1F1F] text-xs">
                  <div className="bg-[#181818] p-2 border border-[#262626]">
                    <span className="text-[10px] text-[#8E8E93] block">اكتشف</span>
                    <span className="font-mono-data font-bold text-white">{camp.progress.discovered}</span>
                  </div>

                  <div className="bg-[#181818] p-2 border border-[#262626]">
                    <span className="text-[10px] text-[#8E8E93] block">أثري</span>
                    <span className="font-mono-data font-bold text-cyan-400">{camp.progress.enriched}</span>
                  </div>

                  <div className="bg-[#181818] p-2 border border-[#262626]">
                    <span className="text-[10px] text-[#8E8E93] block">بهاتف</span>
                    <span className="font-mono-data font-bold text-emerald-400">{camp.progress.withPhone}</span>
                  </div>

                  <div className="bg-[#181818] p-2 border border-[#262626]">
                    <span className="text-[10px] text-[#8E8E93] block">موثق مؤكد</span>
                    <span className="font-mono-data font-bold text-emerald-400">{camp.progress.verified}</span>
                  </div>

                  <div className="bg-[#181818] p-2 border border-[#262626]">
                    <span className="text-[10px] text-[#8E8E93] block">تكرارات</span>
                    <span className="font-mono-data font-bold text-amber-400">{camp.progress.duplicates}</span>
                  </div>

                  <div className="bg-[#181818] p-2 border border-[#262626]">
                    <span className="text-[10px] text-[#8E8E93] block">مستبعد</span>
                    <span className="font-mono-data font-bold text-neutral-500">{camp.progress.rejected}</span>
                  </div>

                  <div className="bg-[#181818] p-2 border border-[#262626]">
                    <span className="text-[10px] text-[#8E8E93] block">A+ / A / B</span>
                    <span className="font-mono-data font-bold text-[#FF0000]">
                      {camp.progress.scoreAPlus}/{camp.progress.scoreA}/{camp.progress.scoreB}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
