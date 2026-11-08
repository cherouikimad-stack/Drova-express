/**
 * DROVA Express - High-Volume Bulk Merchant Quota Distribution Modal
 * محاصصة وتوزيع آلاف التجار على الفريق التجاري بالتساوي أو بحصص محددة (1,000 تاجر لكل مندوب)
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  AlertCircle,
  Building2,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { Prospect } from '../../types';
import { storage } from '../../services/storage';
import { ALGERIA_WILAYAS } from '../../data/wilayas';

interface BatchAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedProspectIds?: string[];
  initialCampaignId?: string;
  initialWilaya?: string;
}

export const BatchAssignmentModal: React.FC<BatchAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedProspectIds = [],
  initialCampaignId,
  initialWilaya,
}) => {
  const allProspects = storage.getProspects();
  const allCampaigns = storage.getCampaigns();
  const userAccounts = storage.getUserAccounts();

  // Commercials available for assignment
  const commercialUsers = useMemo(() => {
    const list = userAccounts.filter(
      u => u.status === 'active' && (u.role === 'commercial' || u.role === 'commercial_manager' || u.role === 'super_admin')
    );
    // If only 1 account exists, supply realistic team reps for demo/operational convenience
    if (list.length <= 1) {
      return [
        ...list,
        { id: 'usr_ahmed', full_name: 'أحمد بن علي (مندوب مبيعات)', username: 'ahmed.b', role: 'commercial' as const, status: 'active' as const, email: 'ahmed@drova.dz', created_at: new Date().toISOString() },
        { id: 'usr_amina', full_name: 'أمينة منصوري (مندوبة مبيعات)', username: 'amina.m', role: 'commercial' as const, status: 'active' as const, email: 'amina@drova.dz', created_at: new Date().toISOString() },
        { id: 'usr_karim', full_name: 'كريم بلحاج (تطوير أعمال)', username: 'karim.b', role: 'commercial' as const, status: 'active' as const, email: 'karim@drova.dz', created_at: new Date().toISOString() },
      ];
    }
    return list;
  }, [userAccounts]);

  // Selected commercials for this distribution
  const [selectedCommercialNames, setSelectedCommercialNames] = useState<string[]>(() => 
    commercialUsers.map(c => c.full_name)
  );

  // Filters
  const [filterWilaya, setFilterWilaya] = useState(initialWilaya || 'all');
  const [filterCampaignId, setFilterCampaignId] = useState(initialCampaignId || 'all');
  const [unassignedOnly, setUnassignedOnly] = useState(selectedProspectIds.length === 0);

  // Mode: fixed quota vs equal split
  const [distributionMode, setDistributionMode] = useState<'fixed_quota' | 'equal_split'>('fixed_quota');
  const [quotaPerCommercial, setQuotaPerCommercial] = useState<number>(1000);
  const [totalToSplit, setTotalToSplit] = useState<number>(3000);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Calculate target candidate pool
  const candidatePool = useMemo(() => {
    if (selectedProspectIds && selectedProspectIds.length > 0) {
      const idSet = new Set(selectedProspectIds);
      return allProspects.filter(p => idSet.has(p.id));
    }

    return allProspects.filter(p => {
      if (unassignedOnly) {
        if (p.assigned_commercial && p.assigned_commercial !== '' && p.assigned_commercial !== 'غير مسند') {
          return false;
        }
      }
      if (filterWilaya !== 'all' && p.wilaya !== filterWilaya) return false;
      if (filterCampaignId !== 'all' && p.campaign_id !== filterCampaignId) return false;
      return true;
    });
  }, [allProspects, selectedProspectIds, unassignedOnly, filterWilaya, filterCampaignId]);

  // Overall database statistics
  const totalInDb = allProspects.length;
  const totalUnassigned = allProspects.filter(
    p => !p.assigned_commercial || p.assigned_commercial === '' || p.assigned_commercial === 'غير مسند'
  ).length;
  const totalAssigned = totalInDb - totalUnassigned;

  // Commercial assignment counts
  const commercialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allProspects.forEach(p => {
      if (p.assigned_commercial) {
        counts[p.assigned_commercial] = (counts[p.assigned_commercial] || 0) + 1;
      }
    });
    return counts;
  }, [allProspects]);

  // Simulation calculations
  const simulation = useMemo(() => {
    const numCommercials = selectedCommercialNames.length;
    if (numCommercials === 0) return { totalAssigned: 0, perCommercial: 0, remaining: candidatePool.length };

    if (distributionMode === 'fixed_quota') {
      const maxPossible = Math.min(candidatePool.length, quotaPerCommercial * numCommercials);
      return {
        totalAssigned: maxPossible,
        perCommercial: quotaPerCommercial,
        remaining: Math.max(0, candidatePool.length - maxPossible),
      };
    } else {
      const targetCount = totalToSplit > 0 ? Math.min(candidatePool.length, totalToSplit) : candidatePool.length;
      const perComm = Math.floor(targetCount / numCommercials);
      return {
        totalAssigned: targetCount,
        perCommercial: perComm,
        remaining: Math.max(0, candidatePool.length - targetCount),
      };
    }
  }, [candidatePool.length, selectedCommercialNames.length, distributionMode, quotaPerCommercial, totalToSplit]);

  const toggleCommercial = (name: string) => {
    setSelectedCommercialNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleSelectAllCommercials = () => {
    setSelectedCommercialNames(commercialUsers.map(c => c.full_name));
  };

  const handleDeselectAllCommercials = () => {
    setSelectedCommercialNames([]);
  };

  const handleExecute = async () => {
    if (selectedCommercialNames.length === 0) {
      alert('يرجى تحديد ممثل تجاري واحد على الأقل لتوزيع الحصص.');
      return;
    }

    if (candidatePool.length === 0) {
      alert('لا يوجد تجار مطابقون لمعايير التوزيع المحددة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetCommercials = commercialUsers
        .filter(c => selectedCommercialNames.includes(c.full_name))
        .map(c => ({ name: c.full_name, id: c.id }));

      const res = await storage.batchAssignProspects({
        prospectIds: selectedProspectIds.length > 0 ? selectedProspectIds : undefined,
        filter: selectedProspectIds.length === 0 ? {
          unassignedOnly,
          wilaya: filterWilaya,
          campaignId: filterCampaignId,
        } : undefined,
        mode: distributionMode,
        quotaPerCommercial,
        totalToAssign: distributionMode === 'equal_split' ? totalToSplit : undefined,
        targetCommercials,
      });

      setResultMessage(`✓ تم بنجاح توزيع ${res.assignedCount.toLocaleString('ar-DZ')} تاجر ومزامنتهم مباشرة مع Firestore وقواعد بيانات الفريق التجاري.`);
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`حدث خطأ أثناء تنفيذ التوزيع: ${err.message || 'خطأ غير معروف'}`);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141414] border border-[#2E2E2E] w-full max-w-3xl my-6 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#262626] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2A1616] border border-[#FF0000]/40 flex items-center justify-center text-[#FF0000]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>توزيع ومحاصصة التجار على الفريق التجاري</span>
                <span className="text-[11px] px-2 py-0.5 bg-[#FF0000] text-white font-mono-data">
                  DROVA Quota Engine
                </span>
              </h3>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                توزيع الآلاف من التجار المكتشفين بالتساوي أو بحصص محددة (مثل 1,000 تاجر لكل مندوب) مع مزامنة فورية في السحابة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8E8E93] hover:text-white p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1A1A1A] border border-[#262626] p-3 text-center">
              <span className="text-[11px] text-[#8E8E93] block">إجمالي التجار في المنظومة</span>
              <strong className="text-xl font-bold font-mono-data text-white">{totalInDb.toLocaleString('ar-DZ')}</strong>
            </div>

            <div className="bg-[#1C201C] border border-emerald-900/40 p-3 text-center">
              <span className="text-[11px] text-emerald-400 block">تجار غير مسندين (جاهز للتوزيع)</span>
              <strong className="text-xl font-bold font-mono-data text-emerald-400">{totalUnassigned.toLocaleString('ar-DZ')}</strong>
            </div>

            <div className="bg-[#1A1A1A] border border-[#262626] p-3 text-center">
              <span className="text-[11px] text-[#8E8E93] block">تجار مسندين حالياً</span>
              <strong className="text-xl font-bold font-mono-data text-amber-400">{totalAssigned.toLocaleString('ar-DZ')}</strong>
            </div>
          </div>

          {/* Section 1: Selection Pool & Scope */}
          <div className="bg-[#181818] border border-[#262626] p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers size={14} className="text-[#FF0000]" />
                <span>1. نطاق التجار المستهدفين بالتوزيع</span>
              </span>
              <span className="text-xs font-mono-data text-emerald-400">
                المطابق حالياً: {candidatePool.length.toLocaleString('ar-DZ')} تاجر
              </span>
            </h4>

            {selectedProspectIds.length > 0 ? (
              <div className="p-2.5 bg-[#2A1616] border border-[#FF0000]/40 text-xs text-white flex items-center justify-between">
                <span>تم تحديد <strong>{selectedProspectIds.length}</strong> تاجراً يدوياً من الجدول لتوزيعهم على الفريق.</span>
                <span className="text-[10px] text-amber-300">توزيع مخصص</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[#8E8E93] block mb-1">حالة الإسناد:</label>
                  <label className="flex items-center gap-2 p-2 bg-[#141414] border border-[#333333] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unassignedOnly}
                      onChange={e => setUnassignedOnly(e.target.checked)}
                      className="accent-[#FF0000]"
                    />
                    <span className="text-white">التجار غير المسندين فقط</span>
                  </label>
                </div>

                <div>
                  <label className="text-[#8E8E93] block mb-1">الولاية الجغرافية:</label>
                  <select
                    value={filterWilaya}
                    onChange={e => setFilterWilaya(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333333] px-2.5 py-2 text-white outline-none focus:border-[#FF0000]"
                  >
                    <option value="all">كل الـ 69 ولاية</option>
                    {ALGERIA_WILAYAS.map(w => (
                      <option key={w.code} value={w.nameAr}>{w.code} - {w.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#8E8E93] block mb-1">حملة الاستكشاف:</label>
                  <select
                    value={filterCampaignId}
                    onChange={e => setFilterCampaignId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333333] px-2.5 py-2 text-white outline-none focus:border-[#FF0000]"
                  >
                    <option value="all">كل الحملات وقواعد البيانات</option>
                    {allCampaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Distribution Strategy & Quotas */}
          <div className="bg-[#181818] border border-[#262626] p-4 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders size={14} className="text-[#FF0000]" />
              <span>2. طريقة التوزيع والمحاصصة (Quota Strategy)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDistributionMode('fixed_quota')}
                className={`p-3 text-right border transition-colors ${
                  distributionMode === 'fixed_quota'
                    ? 'bg-[#2A1616] border-[#FF0000] text-white'
                    : 'bg-[#141414] border-[#333333] text-[#8E8E93] hover:text-white'
                }`}
              >
                <div className="font-bold mb-1 text-white">حصة محددة لكل مندوب (Fixed Quota)</div>
                <div className="text-[11px] text-[#A0A0A5]">
                  تخصيص عدد ثابت بالضبط لكل ممثل تجاري (مثل 1,000 تاجر لكل مندوب)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDistributionMode('equal_split')}
                className={`p-3 text-right border transition-colors ${
                  distributionMode === 'equal_split'
                    ? 'bg-[#2A1616] border-[#FF0000] text-white'
                    : 'bg-[#141414] border-[#333333] text-[#8E8E93] hover:text-white'
                }`}
              >
                <div className="font-bold mb-1 text-white">تقسيم بالتساوي (Equal Split)</div>
                <div className="text-[11px] text-[#A0A0A5]">
                  تقسيم مجموع التجار بالتساوي على المندوبين المحددين
                </div>
              </button>
            </div>

            {distributionMode === 'fixed_quota' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">الحصة المستهدفة لكل مندوب تجاري:</span>
                  <span className="font-mono-data text-white font-bold">{quotaPerCommercial.toLocaleString('ar-DZ')} تاجر/مندوب</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[250, 500, 1000, 2000, 5000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuotaPerCommercial(val)}
                      className={`px-3 py-1.5 text-xs font-mono-data border transition-colors ${
                        quotaPerCommercial === val
                          ? 'bg-[#FF0000] text-white border-[#FF0000] font-bold'
                          : 'bg-[#141414] border-[#333333] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      {val === 1000 ? '⭐ 1,000 تاجر (موصى به)' : `${val.toLocaleString('ar-DZ')} تاجر`}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-[#8E8E93]">عدد مخصص:</span>
                    <input
                      type="number"
                      min={10}
                      max={20000}
                      step={50}
                      value={quotaPerCommercial}
                      onChange={e => setQuotaPerCommercial(parseInt(e.target.value) || 500)}
                      className="w-24 bg-[#141414] border border-[#333333] px-2 py-1 text-white text-xs font-mono-data outline-none focus:border-[#FF0000]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">المجموع الكلي المراد توزيعه:</span>
                  <span className="font-mono-data text-white font-bold">{totalToSplit.toLocaleString('ar-DZ')} تاجر</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[1000, 2000, 3000, 5000, 10000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTotalToSplit(val)}
                      className={`px-3 py-1.5 text-xs font-mono-data border transition-colors ${
                        totalToSplit === val
                          ? 'bg-[#FF0000] text-white border-[#FF0000] font-bold'
                          : 'bg-[#141414] border-[#333333] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      {val.toLocaleString('ar-DZ')} تاجر
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTotalToSplit(candidatePool.length)}
                    className="px-3 py-1.5 text-xs bg-[#1C1C1C] border border-[#333333] text-emerald-400 hover:text-white"
                  >
                    كل المتاح ({candidatePool.length.toLocaleString('ar-DZ')})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Commercial Team Selection */}
          <div className="bg-[#181818] border border-[#262626] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users size={14} className="text-[#FF0000]" />
                <span>3. تحديد المندوبين التجاريين المستفيدين ({selectedCommercialNames.length} محدد)</span>
              </h4>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllCommercials}
                  className="text-xs text-[#8E8E93] hover:text-white underline"
                >
                  تحديد الكل
                </button>
                <span className="text-[#444]">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllCommercials}
                  className="text-xs text-[#8E8E93] hover:text-white underline"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {commercialUsers.map(comm => {
                const isSelected = selectedCommercialNames.includes(comm.full_name);
                const currentCount = commercialCounts[comm.full_name] || 0;
                return (
                  <label
                    key={comm.id}
                    className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#221616] border-[#FF0000]/60 text-white'
                        : 'bg-[#141414] border-[#2A2A2A] text-[#8E8E93] hover:border-[#444]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCommercial(comm.full_name)}
                        className="accent-[#FF0000]"
                      />
                      <div>
                        <div className="font-semibold text-xs text-white">{comm.full_name}</div>
                        <div className="text-[10px] text-[#8E8E93]">اسم المستخدم: {comm.username} • {comm.role}</div>
                      </div>
                    </div>

                    <div className="text-left font-mono-data text-xs">
                      <span className="text-[11px] text-[#8E8E93] block">الحالي:</span>
                      <strong className="text-amber-400">{currentCount} تاجر</strong>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Simulation Preview Banner */}
          <div className="p-4 bg-[#1B221B] border border-emerald-900/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-emerald-400 font-bold block mb-0.5">معاينة التوزيع المباشر:</span>
              <p className="text-xs text-white">
                سيتم إسناد تقريباً <strong className="text-emerald-300 font-mono-data">{simulation.perCommercial.toLocaleString('ar-DZ')} تاجر</strong> لكل من الـ {selectedCommercialNames.length} مندوب محدد.
                (المجموع الموزع: <strong className="font-mono-data text-white">{simulation.totalAssigned.toLocaleString('ar-DZ')} تاجر</strong>)
              </p>
            </div>

            {simulation.remaining > 0 && (
              <span className="text-[11px] text-[#8E8E93] bg-[#141414] px-2.5 py-1 border border-[#333333]">
                المتبقي في الرصيد: {simulation.remaining.toLocaleString('ar-DZ')} تاجر
              </span>
            )}
          </div>

          {resultMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 font-medium">
              {resultMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#181818] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-xs font-semibold text-white transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={isSubmitting || selectedCommercialNames.length === 0 || candidatePool.length === 0}
            onClick={handleExecute}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={15} />
            <span>{isSubmitting ? 'جاري توزيع الحصص والمزامنة في السحابة...' : `تنفيذ التوزيع الآن (${simulation.totalAssigned.toLocaleString('ar-DZ')} تاجر)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
