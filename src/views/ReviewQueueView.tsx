/**
 * DROVA "Needs Review" Human Review Queue (Section 24)
 * Overrides automated classification with human verification
 */
import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Edit3,
  HelpCircle,
  Copy,
  ExternalLink,
  Phone,
  Building,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ReviewItem, Prospect } from '../types';
import { storage } from '../services/storage';
import { ALGERIA_WILAYAS } from '../data/wilayas';
import { ScoreBadge, VerificationBadge } from '../components/ui/Badge';

interface ReviewQueueViewProps {
  onSelectProspect: (prospect: Prospect) => void;
  onRefresh: () => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  onSelectProspect,
  onRefresh,
}) => {
  const [items, setItems] = useState<ReviewItem[]>(() => storage.getNeedsReviewItems());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null);
  const [editingWilaya, setEditingWilaya] = useState<string>('');
  const [editingCommune, setEditingCommune] = useState<string>('');

  const refreshItems = () => {
    const fresh = storage.getNeedsReviewItems();
    setItems(fresh);
    if (!fresh.some(i => i.id === selectedItemId)) {
      setSelectedItemId(fresh[0]?.id || null);
    }
    onRefresh();
  };

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleApprove = (item: ReviewItem) => {
    storage.approveReview(item.prospect.id, editingWilaya || undefined, editingCommune || undefined);
    refreshItems();
  };

  const handleReject = (item: ReviewItem) => {
    const reason = prompt('يرجى كتابة سبب استبعاد التاجر:', 'بيانات غير مؤكدة أو نشاط محلي غير قابل للشحن');
    if (reason) {
      storage.rejectReview(item.prospect.id, reason);
      refreshItems();
    }
  };

  const handleMarkUnknown = (item: ReviewItem) => {
    storage.updateProspect(item.prospect.id, {
      alert: 'بيانات غير مؤكدة (Marked Unknown)',
      business_location_verification: 'UNVERIFIED',
    }, 'Marked as unknown by reviewer');
    refreshItems();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-amber-400" />
            <span>طابور المراجعة البشرية (Needs Review Queue)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            مراجعة الحالات غير المؤكدة آلياً (مقر النشاط، موثوقية الهاتف، تضارب الأدلة). القرار البشري يتجاوز التصنيف الآلي.
          </p>
        </div>

        <div className="text-xs font-mono-data text-amber-400 font-bold bg-[#261C14] px-3 py-1.5 border border-amber-900/40">
          {items.length} حالات بانتظار المراجعة
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-12 text-center text-[#8E8E93] bg-[#141414] border border-[#262626]">
          <CheckCircle size={36} className="mx-auto mb-3 text-emerald-400" />
          <h3 className="text-base font-bold text-white mb-1">طابور المراجعة فارغ تماماً</h3>
          <p className="text-xs text-[#545458]">
            كافة التجار في قاعدة البيانات مستوفون لضوابط التحقق المعتمدة 100%.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Items Sidebar List (1 col) */}
          <div className="space-y-2 max-h-[700px] overflow-y-auto">
            {items.map(item => {
              const isSelected = item.id === selectedItemId;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setEditingWilaya(item.prospect.wilaya);
                    setEditingCommune(item.prospect.commune);
                  }}
                  className={`p-3.5 border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#1C1818] border-[#FF0000] text-white'
                      : 'bg-[#141414] border-[#262626] text-[#8E8E93] hover:text-white hover:bg-[#181818]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white truncate max-w-[170px]">
                      {item.prospect.name}
                    </span>
                    <ScoreBadge score={item.prospect.score} />
                  </div>

                  <div className="text-[11px] text-[#8E8E93] space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 font-medium">السبب:</span>
                      <span className="text-neutral-300">
                        {item.prospect.alert || 'اشتباه في تحديد موقع المقر'}
                      </span>
                    </div>
                    <div>{item.prospect.wilaya} - {item.prospect.commune}</div>
                    <div className="font-mono-data text-emerald-400">{item.prospect.phone}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Item Review & Action Panel (2 cols) */}
          {selectedItem && (
            <div className="md:col-span-2 bg-[#141414] border border-[#262626] p-5 space-y-5">
              {/* Item Header */}
              <div className="border-b border-[#262626] pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedItem.prospect.name}</span>
                    <VerificationBadge level={selectedItem.prospect.verification_status} />
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    {selectedItem.prospect.product} · مصدر البيانات: {selectedItem.prospect.source}
                  </p>
                </div>

                <button
                  onClick={() => onSelectProspect(selectedItem.prospect)}
                  className="px-3 py-1 bg-[#1F1F1F] hover:bg-[#282828] text-xs text-white border border-[#333333]"
                >
                  الملف الكامل
                </button>
              </div>

              {/* Conflict / Ambiguity Explanation */}
              <div className="p-3 bg-[#1F1616] border border-[#441C1C] text-xs text-neutral-300 flex items-start gap-2">
                <AlertTriangle size={16} className="text-[#FF0000] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">تنبيه المراجعة الإلزامية:</span>
                  <p>
                    {selectedItem.prospect.alert ||
                      'تم رصد عبارة شحن وتوصيل، يلزم التأكد من أن الولاية المسجلة تمثل مقر ونشاط المتجر الفعلي وليس مجرد وجهة استلام الطرود.'}
                  </p>
                </div>
              </div>

              {/* Location Verification & Correction Editor */}
              <div className="p-4 bg-[#181818] border border-[#262626] space-y-3">
                <span className="text-xs font-bold text-white block">
                  تعديل وتثبيت المقر الفعلي للنشاط:
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[#8E8E93] block mb-1">الولاية الحقيقية:</label>
                    <select
                      value={editingWilaya || selectedItem.prospect.wilaya}
                      onChange={e => setEditingWilaya(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] px-2 py-1.5 text-white text-xs"
                    >
                      {ALGERIA_WILAYAS.map(w => (
                        <option key={w.code} value={w.nameAr}>
                          {w.code} - {w.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#8E8E93] block mb-1">البلدية الحقيقية:</label>
                    <input
                      type="text"
                      value={editingCommune || selectedItem.prospect.commune}
                      onChange={e => setEditingCommune(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333333] px-2 py-1.5 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Source Evidence Inspection */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white block">
                  الأدلة المسجلة في النظام:
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-[#181818] border border-[#262626]">
                    <span className="text-[#8E8E93] text-[11px] block">رابط الصفحة / المصدر:</span>
                    <a
                      href={selectedItem.prospect.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <ExternalLink size={12} />
                      <span className="truncate">{selectedItem.prospect.page_url}</span>
                    </a>
                  </div>

                  <div className="p-2.5 bg-[#181818] border border-[#262626]">
                    <span className="text-[#8E8E93] text-[11px] block">رقم الهاتف المستخرج:</span>
                    <span className="font-mono-data text-emerald-400 font-bold block mt-0.5">
                      {selectedItem.prospect.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Buttons (Section 24: Approve, Reject, Merge, Edit, Mark Unknown) */}
              <div className="pt-4 border-t border-[#262626] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(selectedItem)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    <CheckCircle size={14} />
                    <span>اعتماد التاجر (Approve)</span>
                  </button>

                  <button
                    onClick={() => handleReject(selectedItem)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#221818] hover:bg-red-950 text-red-400 border border-red-900/50 text-xs font-medium transition-colors"
                  >
                    <XCircle size={14} />
                    <span>استبعاد ومرفوض (Reject)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkUnknown(selectedItem)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1F1F1F] hover:bg-[#282828] text-[#8E8E93] hover:text-white border border-[#333333] text-xs transition-colors"
                  >
                    <HelpCircle size={14} />
                    <span>تحديد كغير معروف (Mark Unknown)</span>
                  </button>

                  <button
                    onClick={() => onSelectProspect(selectedItem.prospect)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1F1F1F] hover:bg-[#282828] text-[#8E8E93] hover:text-white border border-[#333333] text-xs transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>تعديل يدوي (Edit)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
