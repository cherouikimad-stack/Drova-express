/**
 * DROVA Express — Commercial Expediteurs Workspace (Sections 18 - 28)
 * Dedicated workspace for contacting, managing, and reactivating existing/imported Expéditeurs.
 * Features:
 * - Ready for Follow-up Queue (Section 19 & 26)
 * - Separate Commercial Status & Lifecycle Status (Section 20 & 21)
 * - Fast Call logging & Timeline
 * - Bulk Commercial Assignment & Reassignment (Section 27 & 30)
 * - Filter by Commercial, Wilaya, and Status
 */
import React, { useState } from 'react';
import {
  Users,
  PhoneCall,
  CalendarCheck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Search,
  Filter,
  UserCheck,
  Building,
  MapPin,
  ExternalLink,
  MessageCircle,
  FileSpreadsheet,
  PlusCircle,
  History,
  ShieldCheck,
  Award
} from 'lucide-react';
import { storage } from '../services/storage';
import { i18n } from '../services/i18n';
import {
  ExpediteurProfile,
  ExpediteurCommercialStatus,
  ExpediteurLifecycleStatus,
  ExpediteurCall,
  CallResult
} from '../types';
import { NavView } from '../components/layout/Sidebar';

interface CommercialExpediteurWorkspaceProps {
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onRefresh: () => void;
}

export const CommercialExpediteurWorkspace: React.FC<CommercialExpediteurWorkspaceProps> = ({
  onNavigate,
  onRefresh,
}) => {
  const session = storage.getUserSession();
  const expediteurs = storage.getExpediteurs();
  const commercialAccounts = storage.getCommercialAccounts();

  // Filters
  const [activeTab, setActiveTab] = useState<'ready' | 'all' | 'inactive' | 'history'>('ready');
  const [search, setSearch] = useState('');
  const [selectedCommercial, setSelectedCommercial] = useState<string>(
    session.role === 'commercial' ? session.name : 'all'
  );
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Selected for Call modal
  const [callingExpediteur, setCallingExpediteur] = useState<ExpediteurProfile | null>(null);
  const [callResult, setCallResult] = useState<CallResult>('تم الاتصال');
  const [commercialStatusAfter, setCommercialStatusAfter] = useState<ExpediteurCommercialStatus>('نشط - متابعة');
  const [callNotes, setCallNotes] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');

  // Bulk action selection
  const [selectedExpediteurIds, setSelectedExpediteurIds] = useState<string[]>([]);
  const [bulkCommercialName, setBulkCommercialName] = useState('');
  const [bulkStatus, setBulkStatus] = useState<ExpediteurCommercialStatus>('جاهز للاتصال');

  // Ready Queue calculation (Section 26)
  const readyExpediteurs = storage.getExpediteursReadyForFollowUp(selectedCommercial);

  // Filtered dataset
  const currentDataset = activeTab === 'ready'
    ? readyExpediteurs
    : activeTab === 'inactive'
    ? expediteurs.filter(e => e.commercial_status === 'غير نشط' || e.commercial_status === 'يحتاج إعادة تفعيل' || e.lifecycle_status === 'غير نشط' || e.lifecycle_status === 'متوقف')
    : expediteurs;

  const filteredExpediteurs = currentDataset.filter(exp => {
    // Commercial role security: normal commercial only sees assigned unless manager/admin
    if (session.role === 'commercial' && exp.assigned_commercial !== session.name && exp.commercial_id !== session.user_id) {
      return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matchName = exp.business_name.toLowerCase().includes(q) || exp.commercial_name.toLowerCase().includes(q);
      const matchPhone = exp.phone.includes(q);
      const matchId = exp.id.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId) return false;
    }

    if (selectedCommercial !== 'all' && session.role !== 'commercial') {
      if (exp.assigned_commercial !== selectedCommercial && exp.commercial_id !== selectedCommercial) {
        return false;
      }
    }

    if (selectedWilaya !== 'all' && exp.wilaya !== selectedWilaya) {
      return false;
    }

    if (selectedStatus !== 'all' && exp.commercial_status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const handleOpenCallModal = (exp: ExpediteurProfile) => {
    setCallingExpediteur(exp);
    setCallResult('تم الاتصال');
    setCommercialStatusAfter(exp.commercial_status || 'نشط - متابعة');
    setCallNotes('');
    setNextFollowupDate('');
  };

  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callingExpediteur) return;

    storage.recordExpediteurCall({
      expediteur_id: callingExpediteur.id,
      commercial_id: session.user_id || session.name,
      commercial_name: session.name,
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      result: callResult,
      notes: callNotes,
      next_followup: nextFollowupDate || undefined,
      status_before: callingExpediteur.commercial_status,
      status_after: commercialStatusAfter,
    });

    storage.updateExpediteur(callingExpediteur.id, {
      commercial_status: commercialStatusAfter,
      last_contact_date: new Date().toISOString().split('T')[0],
      next_followup_date: nextFollowupDate || undefined,
    });

    setCallingExpediteur(null);
    onRefresh();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedExpediteurIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedExpediteurIds.length === filteredExpediteurs.length) {
      setSelectedExpediteurIds([]);
    } else {
      setSelectedExpediteurIds(filteredExpediteurs.map(e => e.id));
    }
  };

  const handleExecuteBulkAssign = () => {
    if (!bulkCommercialName || selectedExpediteurIds.length === 0) return;
    storage.bulkAssignExpediteurs(selectedExpediteurIds, bulkCommercialName);
    setSelectedExpediteurIds([]);
    onRefresh();
  };

  const handleExecuteBulkStatus = () => {
    if (selectedExpediteurIds.length === 0) return;
    storage.bulkUpdateExpediteurStatus(selectedExpediteurIds, bulkStatus);
    setSelectedExpediteurIds([]);
    onRefresh();
  };

  // KPIs for Expediteur Commercial Workspace (Section 28)
  const totalCount = expediteurs.length;
  const readyCount = readyExpediteurs.length;
  const activeCount = expediteurs.filter(e => e.commercial_status === 'نشط' || e.lifecycle_status === 'نشط').length;
  const inactiveCount = expediteurs.filter(e => e.commercial_status === 'غير نشط' || e.lifecycle_status === 'غير نشط').length;
  const reactivationCount = expediteurs.filter(e => e.commercial_status === 'يحتاج إعادة تفعيل' || e.commercial_status === 'تمت إعادة التفعيل').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-[#FF0000]" />
            <span>إدارة الشاحنين ومتابعات المبيعات (Commercial Expéditeurs Hub)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            متابعة الشاحنين المعتمدين والمستوردين من إكسيل، تسجيل المكالمات، وإعادة تنشيط العملاء المتوقفين
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('expediteur_import')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold shadow-md transition-colors"
          >
            <FileSpreadsheet size={15} />
            <span>استيراد إكسيل للشاحنين</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Section 28) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('ready')}
          className={`p-3 border cursor-pointer transition-colors ${
            activeTab === 'ready' ? 'bg-[#1D1616] border-[#FF0000]' : 'bg-[#141414] border-[#262626]'
          }`}
        >
          <span className="text-[11px] text-[#8E8E93] block">جاهز للمتابعة (Ready Queue)</span>
          <span className="text-xl font-bold font-mono text-[#FF0000] mt-1 block">
            {readyCount}
          </span>
          <span className="text-[10px] text-red-400">يتطلب اتصالاً أو متابعة اليوم</span>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`p-3 border cursor-pointer transition-colors ${
            activeTab === 'all' ? 'bg-[#1D1616] border-[#FF0000]' : 'bg-[#141414] border-[#262626]'
          }`}
        >
          <span className="text-[11px] text-[#8E8E93] block">إجمالي الشاحنين المسجلين</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {totalCount}
          </span>
          <span className="text-[10px] text-[#545458]">معتمدون ومستوردون</span>
        </div>

        <div className="p-3 bg-[#141414] border border-[#262626]">
          <span className="text-[11px] text-[#8E8E93] block">شاحنون نشطون حالياً</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {activeCount}
          </span>
          <span className="text-[10px] text-emerald-600">يشحنون طروداً بانتظام</span>
        </div>

        <div
          onClick={() => setActiveTab('inactive')}
          className={`p-3 border cursor-pointer transition-colors ${
            activeTab === 'inactive' ? 'bg-[#1D1616] border-[#FF0000]' : 'bg-[#141414] border-[#262626]'
          }`}
        >
          <span className="text-[11px] text-[#8E8E93] block">شاحنون متوقفون (غير نشط)</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {inactiveCount}
          </span>
          <span className="text-[10px] text-amber-500">توقفوا عن إرسال الشحنات</span>
        </div>

        <div className="p-3 bg-[#141414] border border-[#262626]">
          <span className="text-[11px] text-[#8E8E93] block">فرص إعادة التفعيل</span>
          <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
            {reactivationCount}
          </span>
          <span className="text-[10px] text-cyan-600">إعادة إحياء العلاقة التجارية</span>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141414] p-3 border border-[#262626]">
          {/* Main Subtabs */}
          <div className="flex bg-[#1E1E1E] border border-[#333333] text-xs">
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 flex items-center gap-1.5 ${
                activeTab === 'ready' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Clock size={13} />
              <span>طابور المتابعة الفورية ({readyCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 flex items-center gap-1.5 ${
                activeTab === 'all' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Users size={13} />
              <span>كافة الشاحنين ({totalCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-3 py-1.5 flex items-center gap-1.5 ${
                activeTab === 'inactive' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <RotateCcw size={13} />
              <span>المتوقفون والمحتاجون لإعادة التفعيل ({inactiveCount})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute right-3 top-2.5 text-[#545458]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم، المعرف، أو الهاتف..."
              className="w-full bg-[#1A1A1A] border border-[#333333] pr-9 pl-3 py-1.5 text-xs text-white outline-none focus:border-[#FF0000]"
            />
          </div>
        </div>

        {/* Detailed Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {session.role !== 'commercial' && (
            <div>
              <label className="text-[#8E8E93] block mb-1">تصفية حسب الممثل التجاري:</label>
              <select
                value={selectedCommercial}
                onChange={e => setSelectedCommercial(e.target.value)}
                className="w-full bg-[#141414] border border-[#2E2E2E] px-2.5 py-1.5 text-xs text-white"
              >
                <option value="all">كافة الممثلين التجاريين</option>
                {commercialAccounts.map(acc => (
                  <option key={acc.user_id} value={acc.display_name}>
                    {acc.display_name} ({acc.assigned_count || 0})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[#8E8E93] block mb-1">الحالة التجارية (Commercial Status):</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-[#141414] border border-[#2E2E2E] px-2.5 py-1.5 text-xs text-white"
            >
              <option value="all">كافة الحالات التجارية</option>
              <option value="جديد">جديد</option>
              <option value="جاهز للاتصال">جاهز للاتصال</option>
              <option value="تم الاتصال">تم الاتصال</option>
              <option value="لم يرد">لم يرد</option>
              <option value="إعادة الاتصال">إعادة الاتصال</option>
              <option value="نشط">نشط</option>
              <option value="نشط - متابعة">نشط - متابعة</option>
              <option value="غير نشط">غير نشط</option>
              <option value="يحتاج إعادة تفعيل">يحتاج إعادة تفعيل</option>
              <option value="تمت إعادة التفعيل">تمت إعادة التفعيل</option>
            </select>
          </div>

          <div>
            <label className="text-[#8E8E93] block mb-1">الولاية:</label>
            <select
              value={selectedWilaya}
              onChange={e => setSelectedWilaya(e.target.value)}
              className="w-full bg-[#141414] border border-[#2E2E2E] px-2.5 py-1.5 text-xs text-white"
            >
              <option value="all">كافة الولايات (58 ولاية)</option>
              {Array.from(new Set(expediteurs.map(e => e.wilaya))).filter(Boolean).map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Operations Toolbar (Section 27 & 30) */}
      {selectedExpediteurIds.length > 0 && (
        <div className="bg-[#1C1616] border border-[#551C1C] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">تم تحديد {selectedExpediteurIds.length} شاحن:</span>
            <button
              onClick={() => setSelectedExpediteurIds([])}
              className="text-[#8E8E93] hover:text-white underline text-[11px]"
            >
              إلغاء التحديد
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bulk Assign */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkCommercialName}
                onChange={e => setBulkCommercialName(e.target.value)}
                className="bg-[#121212] border border-[#333333] px-2 py-1 text-white text-xs"
              >
                <option value="">إسناد إلى ممثل تجاري...</option>
                {commercialAccounts.map(acc => (
                  <option key={acc.user_id} value={acc.display_name}>{acc.display_name}</option>
                ))}
              </select>
              <button
                onClick={handleExecuteBulkAssign}
                disabled={!bulkCommercialName}
                className="px-3 py-1 bg-[#FF0000] text-white font-bold disabled:opacity-50"
              >
                إسناد
              </button>
            </div>

            {/* Bulk Status */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value as any)}
                className="bg-[#121212] border border-[#333333] px-2 py-1 text-white text-xs"
              >
                <option value="جاهز للاتصال">جاهز للاتصال</option>
                <option value="نشط - متابعة">نشط - متابعة</option>
                <option value="يحتاج إعادة تفعيل">يحتاج إعادة تفعيل</option>
                <option value="غير نشط">غير نشط</option>
              </select>
              <button
                onClick={handleExecuteBulkStatus}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-700"
              >
                تحديث الحالة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Expediteur Table (Section 17 & 29) */}
      <div className="bg-[#141414] border border-[#262626] overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#1A1A1A] text-[#8E8E93] border-b border-[#262626]">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={selectedExpediteurIds.length > 0 && selectedExpediteurIds.length === filteredExpediteurs.length}
                  onChange={handleSelectAll}
                  className="rounded bg-[#222222] border-[#444444]"
                />
              </th>
              <th className="p-3 font-medium">معرف الشاحن</th>
              <th className="p-3 font-medium">اسم الشاحن / المتجر</th>
              <th className="p-3 font-medium">الولاية والبلدية</th>
              <th className="p-3 font-medium">الهاتف والواتساب</th>
              <th className="p-3 font-medium">النشاط التجاري</th>
              <th className="p-3 font-medium">المسؤول التجاري</th>
              <th className="p-3 font-medium">الحالة التجارية</th>
              <th className="p-3 font-medium">حالة الشاحن (Lifecycle)</th>
              <th className="p-3 font-medium">آخر تواصل ومتابعة</th>
              <th className="p-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {filteredExpediteurs.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-[#8E8E93]">
                  لا توجد سجلات مطابقة لمعايير البحث في هذا الطابور.
                </td>
              </tr>
            ) : (
              filteredExpediteurs.map(exp => {
                const isSelected = selectedExpediteurIds.includes(exp.id);
                const calls = storage.getExpediteurCalls(exp.id);

                return (
                  <tr key={exp.id} className={`hover:bg-[#181818] transition-colors ${isSelected ? 'bg-red-950/10' : ''}`}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(exp.id)}
                        className="rounded bg-[#222222] border-[#444444]"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-white text-[11px] whitespace-nowrap">
                      {exp.id}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white text-xs">{exp.business_name}</div>
                      {exp.commercial_name && exp.commercial_name !== exp.business_name && (
                        <div className="text-[10px] text-[#8E8E93]">{exp.commercial_name}</div>
                      )}
                      <span className="text-[9px] font-mono text-[#545458] bg-[#1C1C1C] px-1 py-0.2 mt-0.5 inline-block">
                        {exp.source_type}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-300 whitespace-nowrap">
                      <div>{exp.wilaya}</div>
                      <div className="text-[10px] text-[#8E8E93]">{exp.commune}</div>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="text-emerald-400 font-bold">{exp.phone}</div>
                      {exp.whatsapp === 'نعم' && (
                        <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                          <MessageCircle size={10} /> واتساب متاح
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-neutral-300 max-w-[140px] truncate">
                      {exp.activity || exp.products}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {exp.assigned_commercial ? (
                        <span className="text-white text-xs flex items-center gap-1">
                          <UserCheck size={12} className="text-[#FF0000]" />
                          <span>{exp.assigned_commercial}</span>
                        </span>
                      ) : (
                        <span className="text-[#8E8E93] text-[11px] italic">غير مسند</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold border border-neutral-700 bg-neutral-900 text-neutral-200">
                        {exp.commercial_status || 'جديد'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold ${
                        exp.lifecycle_status === 'نشط'
                          ? 'text-emerald-400 border border-emerald-800 bg-emerald-950/40'
                          : exp.lifecycle_status === 'مفعل'
                          ? 'text-white border border-[#FF0000] bg-red-950/40'
                          : 'text-[#8E8E93] border border-neutral-800 bg-neutral-900'
                      }`}>
                        {exp.lifecycle_status || exp.status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] whitespace-nowrap">
                      <div className="text-[#8E8E93]">
                        آخر تواصل: <span className="font-mono text-white">{exp.last_contact_date || 'لم يتم'}</span>
                      </div>
                      {exp.next_followup_date && (
                        <div className="text-amber-400 font-bold">
                          متابعة: <span className="font-mono">{exp.next_followup_date}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-[#545458] mt-0.5">
                        {calls.length} مكالمة مسجلة
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenCallModal(exp)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors"
                        title="تسجيل مكالمة تجارية مع الشاحن"
                      >
                        <PhoneCall size={12} />
                        <span>اتصال</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Expediteur Call Modal (Section 9 & 23) */}
      {callingExpediteur && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#2E2E2E] w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PhoneCall size={16} className="text-[#FF0000]" />
                  <span>اتصال تجاري: {callingExpediteur.business_name}</span>
                </h3>
                <span className="text-[11px] font-mono text-[#8E8E93]">{callingExpediteur.id} · {callingExpediteur.wilaya}</span>
              </div>
              <button
                onClick={() => setCallingExpediteur(null)}
                className="text-[#8E8E93] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Direct Call Link */}
            <div className="p-3 bg-[#1A1A1A] border border-[#262626] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8E8E93] block">الهاتف الموثق:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">{callingExpediteur.phone}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${callingExpediteur.phone}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                >
                  <PhoneCall size={12} />
                  <span>اتصال هاتفي</span>
                </a>
                {callingExpediteur.whatsapp === 'نعم' && (
                  <a
                    href={`https://wa.me/213${callingExpediteur.phone.replace(/^(\+213|0)/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1"
                  >
                    <MessageCircle size={12} />
                    <span>واتساب</span>
                  </a>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveCall} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8E8E93] block mb-1">نتيجة الاتصال:</label>
                <select
                  value={callResult}
                  onChange={e => setCallResult(e.target.value as any)}
                  className="w-full bg-[#181818] border border-[#333333] p-2 text-white text-xs font-medium"
                >
                  <option value="تم الاتصال">تم الاتصال ومناقشة الشحنات</option>
                  <option value="لم يرد">لم يرد على الاتصال</option>
                  <option value="إعادة الاتصال">طلب إعادة الاتصال في موعد محدد</option>
                  <option value="مهتم">مهتم بزيادة حجم الطرود مع دروفا</option>
                  <option value="طلب معلومات">طلب معلومات إضافية أو تسعيرة جديدة</option>
                  <option value="مشكل">سجل مشكلة في الاستلام أو التسليم</option>
                  <option value="غير مهتم">غير مهتم حالياً</option>
                  <option value="رقم خاطئ">رقم خاطئ أو مغلق</option>
                </select>
              </div>

              <div>
                <label className="text-[#8E8E93] block mb-1">تحديث الحالة التجارية للشاحن:</label>
                <select
                  value={commercialStatusAfter}
                  onChange={e => setCommercialStatusAfter(e.target.value as any)}
                  className="w-full bg-[#181818] border border-[#333333] p-2 text-white text-xs font-medium"
                >
                  <option value="نشط">نشط (يشحن بانتظام)</option>
                  <option value="نشط - متابعة">نشط - متابعة دورية</option>
                  <option value="يحتاج إعادة تفعيل">يحتاج إعادة تفعيل (Reactivation Candidate)</option>
                  <option value="تمت إعادة التفعيل">تمت إعادة التفعيل بنجاح</option>
                  <option value="متوقف مؤقتًا">متوقف مؤقتاً</option>
                  <option value="غير نشط">غير نشط</option>
                  <option value="مشكل">مشكلة قيد المعالجة</option>
                </select>
              </div>

              <div>
                <label className="text-[#8E8E93] block mb-1">تاريخ المتابعة القادمة (Next Follow-up):</label>
                <input
                  type="date"
                  value={nextFollowupDate}
                  onChange={e => setNextFollowupDate(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333333] p-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[#8E8E93] block mb-1">ملاحظات المكالمة التجارية:</label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  placeholder="سجل ملخص المكالمة، المشاكل المطروحة، أو متطلبات الشاحن الخاصة..."
                  className="w-full bg-[#181818] border border-[#333333] p-2 text-white text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setCallingExpediteur(null)}
                  className="px-3 py-1.5 text-xs text-[#8E8E93] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold"
                >
                  حفظ نتيجة الاتصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
