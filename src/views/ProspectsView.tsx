/**
 * DROVA Master Prospects View (Section 41)
 * Full master table container with refresh and detail modal binding
 */
import React, { useState } from 'react';
import { Users, Plus, Download, FileSpreadsheet } from 'lucide-react';
import { Prospect } from '../types';
import { ProspectsTable } from '../components/prospects/ProspectsTable';
import { NavView } from '../components/layout/Sidebar';
import { exportToExcel } from '../services/excel';

interface ProspectsViewProps {
  prospects: Prospect[];
  onSelectProspect: (prospect: Prospect) => void;
  onRefresh: () => void;
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  initialWilayaFilter?: string;
}

export const ProspectsView: React.FC<ProspectsViewProps> = ({
  prospects,
  onSelectProspect,
  onRefresh,
  onNavigate,
}) => {
  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-[#FF0000]" />
            <span>قاعدة التجار المستهدفين (Master Prospect Intelligence Database)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            السجل الموحد للتجار المكتشفين والمؤهلين عبر كافة ولايات الجزائر الـ 58
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToExcel(prospects, 'DROVA_MASTER_DATABASE.xlsx')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-xs font-medium text-white transition-colors"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>تصدير الكل إكسيل ({prospects.length})</span>
          </button>
          <button
            onClick={() => onNavigate('campaigns_new')}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} />
            <span>حملة استكشاف جديدة</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <ProspectsTable
        prospects={prospects}
        onSelectProspect={onSelectProspect}
        onRefresh={onRefresh}
      />
    </div>
  );
};
