/**
 * DROVA Master Prospects Database Table (Section 18 & 41)
 * High-density table with full filters, search, selection, and direct Excel export
 */
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  Phone,
  MessageCircle,
  Eye,
  CheckSquare,
  Square,
  RefreshCw,
  X,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { Prospect, LeadScore, ProspectStatus, WhatsAppStatus } from '../../types';
import { ALGERIA_WILAYAS } from '../../data/wilayas';
import { MERCHANT_CATEGORIES } from '../../data/categories';
import { ScoreBadge, VerificationBadge, StatusBadge, WhatsAppBadge } from '../ui/Badge';
import { exportToExcel, exportToCSV } from '../../services/excel';
import { storage } from '../../services/storage';
import { BatchAssignmentModal } from '../crm/BatchAssignmentModal';

interface ProspectsTableProps {
  prospects: Prospect[];
  onSelectProspect: (prospect: Prospect) => void;
  onRefresh: () => void;
}

export const ProspectsTable: React.FC<ProspectsTableProps> = ({
  prospects,
  onSelectProspect,
  onRefresh,
}) => {
  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('all');
  const [selectedScore, setSelectedScore] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedWhatsApp, setSelectedWhatsApp] = useState<string>('all');
  const [selectedCourier, setSelectedCourier] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Unique couriers present in database
  const availableCouriers = useMemo(() => {
    const set = new Set<string>();
    prospects.forEach(p => {
      if (p.current_courier) set.add(p.current_courier);
    });
    return Array.from(set);
  }, [prospects]);

  // Filtered Prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      // Search match
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPhone = p.phone.includes(q);
        const matchesProduct = (p.product || '').toLowerCase().includes(q);
        const matchesCommune = (p.commune || '').toLowerCase().includes(q);
        const matchesUrl = (p.page_url || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesProduct && !matchesCommune && !matchesUrl) {
          return false;
        }
      }

      // Wilaya filter
      if (selectedWilaya !== 'all' && p.wilaya !== selectedWilaya) {
        return false;
      }

      // Score filter
      if (selectedScore !== 'all' && p.score !== selectedScore) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }

      // WhatsApp filter
      if (selectedWhatsApp !== 'all' && p.whatsapp !== selectedWhatsApp) {
        return false;
      }

      // Courier filter
      if (selectedCourier !== 'all' && p.current_courier !== selectedCourier) {
        return false;
      }

      // Verification filter
      if (selectedVerification !== 'all' && p.verification_status !== selectedVerification) {
        return false;
      }

      // Origin filter (Real vs Simulated)
      if (selectedOrigin === 'real_only') {
        const isReal = p.data_origin === 'real_imported' || p.data_origin === 'real_manual' || p.source === 'excel_import';
        if (!isReal) return false;
      } else if (selectedOrigin === 'simulated_only') {
        const isReal = p.data_origin === 'real_imported' || p.data_origin === 'real_manual' || p.source === 'excel_import';
        if (isReal) return false;
      }

      return true;
    });
  }, [
    prospects,
    searchQuery,
    selectedWilaya,
    selectedScore,
    selectedCategory,
    selectedStatus,
    selectedWhatsApp,
    selectedCourier,
    selectedVerification,
    selectedOrigin,
  ]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredProspects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProspects.map(p => p.id)));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Bulk actions
  const handleExportFiltered = (format: 'xlsx' | 'csv') => {
    const listToExport = selectedIds.size > 0
      ? filteredProspects.filter(p => selectedIds.has(p.id))
      : filteredProspects;

    const wilayaTag = selectedWilaya !== 'all' ? selectedWilaya.replace(/\s+/g, '_') : 'ALGERIA';
    const filename = `DROVA_${wilayaTag}_PROSPECTS_${new Date().getFullYear()}.${format}`;

    if (format === 'xlsx') {
      exportToExcel(listToExport, filename);
    } else {
      exportToCSV(listToExport, filename);
    }
  };

  const handleBulkStatusChange = async (newStatus: ProspectStatus) => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => storage.updateProspectStatus(id, newStatus)));
      setSelectedIds(new Set());
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'فشل تحديث حالة التجار المحددين في Firestore');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.size} تاجر محدد من Firestore؟`)) {
      try {
        await Promise.all(Array.from(selectedIds).map(id => storage.deleteProspect(id)));
        setSelectedIds(new Set());
        onRefresh();
      } catch (err: any) {
        alert(err?.message || 'فشل حذف التجار المحددين من Firestore');
      }
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedWilaya('all');
    setSelectedScore('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedWhatsApp('all');
    setSelectedCourier('all');
    setSelectedVerification('all');
    setSelectedOrigin('all');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedWilaya !== 'all' ||
    selectedScore !== 'all' ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all' ||
    selectedWhatsApp !== 'all' ||
    selectedCourier !== 'all' ||
    selectedVerification !== 'all' ||
    selectedOrigin !== 'all';

  return (
    <div className="bg-[#121212] border border-[#262626] flex flex-col min-h-0">
      {/* Top Filter & Search Toolbar */}
      <div className="p-4 border-b border-[#262626] bg-[#141414] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم الهاتف، البلدية، رابط الصفحة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-[#333333] pr-9 pl-3 py-1.5 text-xs text-white placeholder-[#545458] focus:border-[#FF0000] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Export & Actions Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 pl-3 border-l border-[#333333] text-xs">
                <span className="font-mono-data text-white font-medium">
                  {selectedIds.size} محدد
                </span>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-950 to-[#2A1616] hover:from-red-900 hover:to-[#381818] border border-[#FF0000]/60 text-white font-bold text-[11px] shadow-sm transition-all"
                >
                  <Sparkles size={12} className="text-[#FF0000]" />
                  <span>توزيع المحدد على المندوبين ({selectedIds.size})</span>
                </button>
                <select
                  onChange={e => {
                    if (e.target.value) handleBulkStatusChange(e.target.value as ProspectStatus);
                  }}
                  defaultValue=""
                  className="bg-[#1C1C1C] border border-[#333333] text-xs text-white px-2 py-1"
                >
                  <option value="" disabled>تغيير الحالة لـ...</option>
                  <option value="تم التحقق">تم التحقق</option>
                  <option value="جاهز للتواصل">جاهز للتواصل</option>
                  <option value="تم التواصل">تم التواصل</option>
                  <option value="متابعة">متابعة</option>
                  <option value="عميل">عميل</option>
                  <option value="مرفوض">مرفوض</option>
                  <option value="Do Not Contact">Do Not Contact</option>
                </select>
                <button
                  onClick={handleBulkDelete}
                  title="حذف المحدد"
                  className="p-1.5 text-red-400 hover:bg-[#261616] border border-red-900/40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <button
              onClick={() => handleExportFiltered('xlsx')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#242424] border border-[#333333] text-xs font-medium text-white transition-colors"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span>تصدير Excel ({filteredProspects.length})</span>
            </button>

            <button
              onClick={() => handleExportFiltered('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#242424] border border-[#333333] text-xs font-medium text-[#EDEDED] transition-colors"
            >
              <Download size={14} className="text-[#8E8E93]" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Multi-Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-xs">
          {/* Wilaya Filter */}
          <select
            value={selectedWilaya}
            onChange={e => setSelectedWilaya(e.target.value)}
            className="bg-[#181818] border border-[#333333] text-[#EDEDED] px-2 py-1 text-xs outline-none"
          >
            <option value="all">كل الولايات (69)</option>
            {ALGERIA_WILAYAS.map(w => (
              <option key={w.code} value={w.nameAr}>
                {w.code} - {w.nameAr}
              </option>
            ))}
          </select>

          {/* Score Filter */}
          <select
            value={selectedScore}
            onChange={e => setSelectedScore(e.target.value)}
            className="bg-[#181818] border border-[#333333] text-[#EDEDED] px-2 py-1 text-xs outline-none"
          >
            <option value="all">كل التقييمات</option>
            <option value="A+">A+ (أعلى أولوية)</option>
            <option value="A">A (جيد جداً)</option>
            <option value="B">B (متوسط)</option>
            <option value="REJECT">مرفوض</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-[#181818] border border-[#333333] text-[#EDEDED] px-2 py-1 text-xs outline-none"
          >
            <option value="all">كل التصنيفات</option>
            {MERCHANT_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.nameAr}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-[#181818] border border-[#333333] text-[#EDEDED] px-2 py-1 text-xs outline-none"
          >
            <option value="all">كل الحالات</option>
            <option value="جديد">جديد</option>
            <option value="تم التحقق">تم التحقق</option>
            <option value="جاهز للتواصل">جاهز للتواصل</option>
            <option value="تم التواصل">تم التواصل</option>
            <option value="مهتم">مهتم</option>
            <option value="متابعة">متابعة</option>
            <option value="عميل">عميل</option>
            <option value="مرفوض">مرفوض</option>
            <option value="Do Not Contact">Do Not Contact</option>
          </select>

          {/* WhatsApp Filter */}
          <select
            value={selectedWhatsApp}
            onChange={e => setSelectedWhatsApp(e.target.value)}
            className="bg-[#181818] border border-[#333333] text-[#EDEDED] px-2 py-1 text-xs outline-none"
          >
            <option value="all">الواتساب: الكل</option>
            <option value="نعم">واتساب متوفر</option>
            <option value="لا">لا يوجد واتساب</option>
            <option value="غير معروف">غير معروف</option>
          </select>

          {/* Courier Filter */}
          <select
            value={selectedCourier}
            onChange={e => setSelectedCourier(e.target.value)}
            className="bg-[#181818] border border-[#333333] text-[#EDEDED] px-2 py-1 text-xs outline-none"
          >
            <option value="all">شركة الشحن: الكل</option>
            {availableCouriers.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Origin Filter */}
          <select
            value={selectedOrigin}
            onChange={e => setSelectedOrigin(e.target.value)}
            className="bg-[#181818] border border-[#333333] text-[#EDEDED] px-2 py-1 text-xs outline-none font-medium"
          >
            <option value="all">نوع السجل: الكل</option>
            <option value="real_only">🟢 تجار حقيقيون موثقون</option>
            <option value="simulated_only">🟡 محاكاة تجريبية</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center justify-center gap-1 text-[11px] text-[#FF0000] hover:text-white bg-[#1F1414] hover:bg-[#281818] border border-[#441C1C] py-1"
            >
              <RefreshCw size={11} />
              <span>إعادة الضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="bg-[#181818] border-b border-[#262626] text-[#8E8E93] text-[11px] uppercase tracking-wider sticky top-0 z-10">
              <th className="p-3 w-10 text-center">
                <button
                  onClick={handleSelectAll}
                  className="text-[#8E8E93] hover:text-white"
                >
                  {selectedIds.size === filteredProspects.length && filteredProspects.length > 0 ? (
                    <CheckSquare size={14} className="text-[#FF0000]" />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
              </th>
              <th className="p-3 font-semibold w-10">#</th>
              <th className="p-3 font-semibold min-w-[220px]">الاسم / الصفحة</th>
              <th className="p-3 font-semibold min-w-[120px]">نوع التاجر</th>
              <th className="p-3 font-semibold min-w-[200px]">المنتج</th>
              <th className="p-3 font-semibold min-w-[120px]">الولاية</th>
              <th className="p-3 font-semibold min-w-[120px]">البلدية</th>
              <th className="p-3 font-semibold min-w-[130px]">الهاتف</th>
              <th className="p-3 font-semibold w-24">واتساب؟</th>
              <th className="p-3 font-semibold min-w-[130px]">شركة التوصيل</th>
              <th className="p-3 font-semibold w-24">الولاء</th>
              <th className="p-3 font-semibold w-24">colis/يوم</th>
              <th className="p-3 font-semibold w-24">الحالة</th>
              <th className="p-3 font-semibold w-24">التقييم</th>
              <th className="p-3 font-semibold w-28">التوثيق</th>
              <th className="p-3 font-semibold w-20 text-center">إجراء</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1F1F1F]">
            {filteredProspects.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-[#545458]">
                  <p className="text-sm">لا توجد نتائج مطابقة لمعايير البحث الحالية.</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 text-xs text-[#FF0000] hover:underline"
                  >
                    إعادة ضبط الفلاتر
                  </button>
                </td>
              </tr>
            ) : (
              filteredProspects.map((p, idx) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProspect(p)}
                    className={`cursor-pointer transition-colors hover:bg-[#1A1A1A] ${
                      isSelected ? 'bg-[#1F1616]' : idx % 2 === 0 ? 'bg-[#121212]' : 'bg-[#151515]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center" onClick={e => handleToggleSelect(p.id, e)}>
                      {isSelected ? (
                        <CheckSquare size={14} className="text-[#FF0000]" />
                      ) : (
                        <Square size={14} className="text-[#545458] hover:text-white" />
                      )}
                    </td>

                    {/* # */}
                    <td className="p-3 font-mono-data text-[#545458] text-[11px]">
                      {idx + 1}
                    </td>

                    {/* الاسم / الصفحة */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white truncate max-w-[180px]" title={p.name}>
                          {p.name}
                        </span>
                        {p.page_url && (
                          <a
                            href={p.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[#8E8E93] hover:text-[#FF0000] transition-colors p-0.5"
                            title="فتح رابط المتجر / الصفحة الحقيقية"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8E8E93] truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                        <span className="truncate">{p.page_url ? p.page_url.replace(/^https?:\/\//, '') : p.source}</span>
                        {p.alert && (
                          <span className="text-[#FF0000] font-bold">· {p.alert}</span>
                        )}
                      </div>
                    </td>

                    {/* نوع التاجر */}
                    <td className="p-3 text-[#EDEDED] whitespace-nowrap">
                      {p.merchant_type}
                    </td>

                    {/* المنتج */}
                    <td className="p-3 text-[#EDEDED] truncate max-w-[190px]" title={p.product}>
                      {p.product}
                    </td>

                    {/* الولاية */}
                    <td className="p-3 font-medium text-white whitespace-nowrap">
                      {p.wilaya}
                    </td>

                    {/* البلدية */}
                    <td className="p-3 text-[#8E8E93] whitespace-nowrap">
                      {p.commune || '—'}
                    </td>

                    {/* الهاتف */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-data text-emerald-400 font-semibold">{p.phone}</span>
                        {p.phone && (
                          <a
                            href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-1 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/60 rounded transition-colors"
                            title="اختبار الرقم وفتح محادثة واتساب للتأكد"
                          >
                            <MessageCircle size={13} />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* واتساب؟ */}
                    <td className="p-3 whitespace-nowrap">
                      <WhatsAppBadge status={p.whatsapp} />
                    </td>

                    {/* شركة التوصيل الحالية */}
                    <td className="p-3 text-[#EDEDED] whitespace-nowrap font-medium">
                      {p.current_courier}
                    </td>

                    {/* مستوى الولاء */}
                    <td className="p-3 text-[#8E8E93] text-[11px] whitespace-nowrap">
                      {p.loyalty_level}
                    </td>

                    {/* colis/يوم (تقدير) */}
                    <td className="p-3 font-mono-data font-bold text-white whitespace-nowrap">
                      {p.parcel_estimate}
                    </td>

                    {/* الحالة */}
                    <td className="p-3 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Score */}
                    <td className="p-3 whitespace-nowrap">
                      <ScoreBadge score={p.score} />
                    </td>

                    {/* Verification & Data Origin */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <VerificationBadge level={p.verification_status} />
                        {(p.data_origin === 'real_imported' || p.data_origin === 'real_manual' || p.source === 'excel_import') ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 w-fit">
                            ● حقيقي موثق
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium bg-amber-950/60 border border-amber-800/40 text-amber-400 w-fit">
                            ○ محاكاة اختبارية
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectProspect(p)}
                        className="p-1 text-[#8E8E93] hover:text-white transition-colors"
                        title="عرض الملف الاستخباري"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Counts & Quick Summary */}
      <div className="p-3 border-t border-[#262626] bg-[#141414] flex items-center justify-between text-xs text-[#8E8E93]">
        <div className="flex items-center gap-4">
          <span>
            إجمالي السجلات المعروضة: <strong className="font-mono-data text-white">{filteredProspects.length}</strong> من أصل <strong className="font-mono-data text-white">{prospects.length}</strong>
          </span>
          <span className="text-[#333333]">|</span>
          <span>
            A+: <strong className="font-mono-data text-[#FF0000]">{filteredProspects.filter(p => p.score === 'A+').length}</strong>
          </span>
          <span>
            A: <strong className="font-mono-data text-emerald-400">{filteredProspects.filter(p => p.score === 'A').length}</strong>
          </span>
          <span>
            مع واتساب: <strong className="font-mono-data text-emerald-400">{filteredProspects.filter(p => p.whatsapp === 'نعم').length}</strong>
          </span>
        </div>

        <div className="text-[11px] text-[#545458]">
          مطابق لمعايير الامتثال والجودة المعتمدة في DROVA Express
        </div>
      </div>

      <BatchAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          setSelectedIds(new Set());
          onRefresh();
        }}
        selectedProspectIds={Array.from(selectedIds)}
      />
    </div>
  );
};
