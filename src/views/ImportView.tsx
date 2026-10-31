/**
 * DROVA Smart Excel / CSV Database Importer (Section 36)
 * Smart column detection, phone normalization, and duplicate-safe merging
 */
import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ArrowRight,
  Info
} from 'lucide-react';
import { parseAndImportFile, ImportResult } from '../services/excel';
import { storage } from '../services/storage';
import { NavView } from '../components/layout/Sidebar';

interface ImportViewProps {
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onImportComplete: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  onNavigate,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const existingProspects = storage.getProspects();
      const res = await parseAndImportFile(file, existingProspects);

      // Add new prospects and save merged records
      if (res.prospects.length > 0) {
        storage.addProspects(res.prospects, [], 'manual_excel_import');
      }

      setResult(res);
      onImportComplete();
    } catch (err: any) {
      alert(`حدث خطأ أثناء قراءة الملف: ${err.message || 'تأكد من صيغة الملف (.xlsx أو .csv)'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-[#FF0000]" />
            <span>استيراد وتحديث قاعدة البيانات (Smart Excel Import)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            دمج قواعد بيانات سابقة مع توحيد أرقام الهواتف (+213) وحماية الملاحظات اليدوية من الاستبدال
          </p>
        </div>

        <button
          onClick={() => onNavigate('prospects')}
          className="text-xs text-[#8E8E93] hover:text-white flex items-center gap-1"
        >
          <span>عرض قاعدة التجار</span>
          <ArrowRight size={14} className="rotate-180" />
        </button>
      </div>

      {/* Rules Banner (Section 36) */}
      <div className="p-4 bg-[#141414] border border-[#262626] text-xs text-neutral-300 space-y-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Info size={15} className="text-cyan-400" />
          <span>ضوابط الاستيراد الذكي (Importer Invariants):</span>
        </span>
        <ul className="list-disc list-inside space-y-1 text-[#8E8E93] text-[11px]">
          <li>التعرف التلقائي على الأعمدة العربية والفرنسية والإنجليزية.</li>
          <li>توحيد وتصحيح أرقام الهواتف الجزائرية بصيغة دولية (+213XXXXXXXXX) مع استبعاد الأرقام الوهمية أو غير الصالحة.</li>
          <li>كشف التكرارات ودمج السجلات المطابقة دون مسح حالات التواصل السابقة أو الملاحظات اليدوية القيمة للمبيعات.</li>
        </ul>
      </div>

      {/* Upload Box */}
      <div className="bg-[#141414] border-2 border-dashed border-[#333333] hover:border-[#FF0000] p-8 text-center transition-colors">
        <FileSpreadsheet size={40} className="mx-auto text-[#FF0000] mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">
          اختر ملف إكسيل (.xlsx) أو ملف قيم مفصولة بفواصل (.csv)
        </h3>
        <p className="text-xs text-[#8E8E93] mb-4">
          يمكنك استيراد قاعدة بيانات سابقة لـ DROVA أو استيراد قوائم التجار المسحوبة خارجياً
        </p>

        <label className="inline-block px-5 py-2.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm">
          <span>{file ? `تغيير الملف: ${file.name}` : 'تصفح واختيار الملف'}</span>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {file && !result && (
        <div className="flex items-center justify-between p-4 bg-[#181818] border border-[#262626]">
          <div className="text-xs">
            <span className="text-white font-medium block">{file.name}</span>
            <span className="text-[#8E8E93] text-[11px]">
              {(file.size / 1024).toFixed(1)} KB · جاهز للمعالجة
            </span>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            {loading ? 'جاري الفحص والدمج...' : 'بدء الاستيراد والدمج الآمن'}
          </button>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-emerald-400 font-bold text-sm">
            <CheckCircle2 size={18} />
            <span>اكتملت معالجة الملف بنجاح!</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#181818] border border-[#262626]">
              <span className="text-[#8E8E93] block">إجمالي أسطر الملف</span>
              <span className="text-base font-mono-data font-bold text-white mt-1 block">
                {result.totalRows}
              </span>
            </div>

            <div className="p-3 bg-[#181818] border border-[#262626]">
              <span className="text-[#8E8E93] block">تجار جدد أضيفوا</span>
              <span className="text-base font-mono-data font-bold text-emerald-400 mt-1 block">
                {result.imported}
              </span>
            </div>

            <div className="p-3 bg-[#181818] border border-[#262626]">
              <span className="text-[#8E8E93] block">تكرارات دمجت بأمان</span>
              <span className="text-base font-mono-data font-bold text-amber-400 mt-1 block">
                {result.mergedDuplicates}
              </span>
            </div>

            <div className="p-3 bg-[#181818] border border-[#262626]">
              <span className="text-[#8E8E93] block">مستبعد (رقم غير صالح)</span>
              <span className="text-base font-mono-data font-bold text-red-400 mt-1 block">
                {result.rejectedInvalidPhone}
              </span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="p-3 bg-[#181212] border border-red-950/60 text-xs">
              <span className="font-bold text-red-400 block mb-1">سجل التنبيهات والأرقام المستبعدة:</span>
              <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] text-[#8E8E93]">
                {result.errors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onNavigate('prospects')}
              className="px-4 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors"
            >
              عرض قاعدة التجار المحدثة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
