/**
 * DROVA Master Prospects View (Section 41)
 * Full master table container with refresh and detail modal binding
 */
import React, { useState } from 'react';
import { Users, Plus, Download, FileSpreadsheet, Sparkles } from 'lucide-react';
import { Prospect } from '../types';
import { ProspectsTable } from '../components/prospects/ProspectsTable';
import { NavView } from '../components/layout/Sidebar';
import { exportToExcel } from '../services/excel';
import { BatchAssignmentModal } from '../components/crm/BatchAssignmentModal';
import { storage } from '../services/storage';

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
  initialWilayaFilter,
}) => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeletingSimulated, setIsDeletingSimulated] = useState(false);

  const realCount = prospects.filter(
    p => p.data_origin === 'real_imported' || p.data_origin === 'real_manual' || p.source === 'excel_import'
  ).length;
  const simulatedCount = prospects.length - realCount;

  const handleCleanSimulated = async () => {
    if (simulatedCount === 0) {
      alert('لا توجد بيانات تجريبية مولدة في قاعدة البيانات حالياً.');
      return;
    }
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف ${simulatedCount} تاجراً من البيانات التجريبية المولدة؟\n\nسيتم الاحتفاظ فقط بالتجار الحقيقيين المستوردين (${realCount}) وحذف المحاكاة نهائياً من Firestore.`
    );
    if (!confirmed) return;

    setIsDeletingSimulated(true);
    try {
      const deleted = await storage.deleteSimulatedProspects();
      alert(`تم بنجاح حذف ${deleted} سجلاً تجريبياً. قاعدة البيانات الآن تحتوي فقط على التجار الحقيقيين.`);
      onRefresh();
    } catch (err: any) {
      alert(`خطأ أثناء التنظيف: ${err.message || 'حدث خطأ'}`);
    } finally {
      setIsDeletingSimulated(false);
    }
  };

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
            السجل الموحد للتجار المكتشفين والمؤهلين عبر كافة ولايات الجزائر الـ 69
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {simulatedCount > 0 && (
            <button
              onClick={handleCleanSimulated}
              disabled={isDeletingSimulated}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#261515] hover:bg-[#381818] border border-red-500/40 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              title="حذف البيانات التي تم توليدها للمحاكاة والاحتفاظ فقط بالبيانات الحقيقية المستوردة"
            >
              <span>🗑️ حذف البيانات التجريبية ({simulatedCount})</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#17221A] hover:bg-[#1E2D22] border border-emerald-500/40 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <FileSpreadsheet size={14} />
            <span>📥 استيراد إكسيل حقيقي</span>
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-950 to-[#2A1616] hover:from-red-900 hover:to-[#381818] border border-[#FF0000]/60 text-xs font-bold text-white shadow-sm transition-all"
          >
            <Sparkles size={14} className="text-[#FF0000]" />
            <span>⚡ توزيع ومحاصصة التجار على الفريق</span>
          </button>
          <button
            onClick={() => exportToExcel(prospects, 'DROVA_MASTER_DATABASE.xlsx')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-xs font-medium text-white transition-colors"
          >
            <Download size={14} className="text-[#8E8E93]" />
            <span>تصدير ({prospects.length})</span>
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

      {/* Data Origin & Health Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#141414] border border-[#262626] p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#8E8E93]">إجمالي التجار المسجلين</div>
            <div className="text-xl font-bold font-mono-data text-white mt-0.5">{prospects.length}</div>
          </div>
          <Users size={24} className="text-[#8E8E93]/40" />
        </div>

        <div className="bg-[#141C16] border border-emerald-900/40 p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span>●</span>
              <span>تجار حقيقيون موثقون (مستوردون من ملفات حقيقية)</span>
            </div>
            <div className="text-xl font-bold font-mono-data text-emerald-400 mt-0.5">{realCount}</div>
          </div>
          <div className="text-xs bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded">
            واقعي 100%
          </div>
        </div>

        <div className="bg-[#1C1814] border border-amber-900/40 p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              <span>●</span>
              <span>بيانات محاكاة وتنقيب تجريبي (Simulated)</span>
            </div>
            <div className="text-xl font-bold font-mono-data text-amber-400 mt-0.5">{simulatedCount}</div>
          </div>
          <div className="text-xs bg-amber-950/80 border border-amber-800 text-amber-300 px-2 py-0.5 rounded">
            محاكاة اختبارية
          </div>
        </div>
      </div>

      {/* Main Table */}
      <ProspectsTable
        prospects={prospects}
        onSelectProspect={onSelectProspect}
        onRefresh={onRefresh}
      />

      {/* Bulk Assignment Modal */}
      <BatchAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => onRefresh()}
        initialWilaya={initialWilayaFilter}
      />
    </div>
  );
};
