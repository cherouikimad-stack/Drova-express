/**
 * DROVA Express — Expéditeurs CRM & Commercial Kanban Board
 * Implements Sections 10, 11, 12, 22 & 25
 */
import React, { useState } from 'react';
import {
  Trello,
  Table,
  PhoneCall,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Flame,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Building,
  MapPin,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Prospect, ProspectStatus, ExpediteurStatus, ExpediteurProfile } from '../types';
import { storage } from '../services/storage';
import { CallModal } from '../components/crm/CallModal';
import { ActivationChecklistModal } from '../components/crm/ActivationChecklistModal';
import { ScoreBadge } from '../components/ui/Badge';
import { COMMERCIAL_TEAM } from '../services/crm';

interface ExpediteursViewProps {
  prospects: Prospect[];
  onSelectProspect: (prospect: Prospect) => void;
  onRefresh: () => void;
}

const KANBAN_STAGES: { id: ProspectStatus | string; label: string; color: string; expStage?: ExpediteurStatus }[] = [
  { id: 'جديد', label: '1. جديد', color: 'border-neutral-700 bg-neutral-900/40 text-neutral-300' },
  { id: 'جاهز للاتصال', label: '2. جاهز للاتصال', color: 'border-blue-800 bg-blue-950/30 text-blue-300' },
  { id: 'تم الاتصال', label: '3. تم الاتصال', color: 'border-purple-800 bg-purple-950/30 text-purple-300' },
  { id: 'مهتم', label: '4. مهتم', color: 'border-amber-700 bg-amber-950/30 text-amber-300' },
  { id: 'متابعة', label: '5. متابعة', color: 'border-amber-600 bg-amber-900/30 text-amber-200' },
  { id: 'أكد التعامل مع DROVA', label: '6. أكد التعامل', color: 'border-emerald-700 bg-emerald-950/30 text-emerald-300' },
  { id: 'في طور التفعيل', label: '7. قيد التفعيل', color: 'border-teal-700 bg-teal-950/30 text-teal-300' },
  { id: 'Expéditeur مفعل', label: '8. Expéditeur مفعل', color: 'border-[#FF0000] bg-red-950/40 text-white font-bold' },
  { id: 'Expéditeur نشط', label: '9. Expéditeur نشط (VIP)', color: 'border-emerald-500 bg-emerald-950/50 text-emerald-300 font-bold' },
  { id: 'غير مهتم', label: 'خارج النطاق / رفض', color: 'border-zinc-800 bg-zinc-950 text-zinc-500' },
];

export const ExpediteursView: React.FC<ExpediteursViewProps> = ({
  prospects,
  onSelectProspect,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedCommercial, setSelectedCommercial] = useState<string>('all');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');

  // Active Modals
  const [callingProspect, setCallingProspect] = useState<Prospect | null>(null);
  const [checklistProspect, setChecklistProspect] = useState<Prospect | null>(null);

  const expediteurs = storage.getExpediteurs();

  // Filters
  const filteredProspects = prospects.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.wilaya.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    if (selectedCommercial !== 'all') {
      if (p.assigned_commercial !== selectedCommercial && p.responsible !== selectedCommercial) {
        return false;
      }
    }
    if (selectedWilaya !== 'all') {
      if (p.wilaya !== selectedWilaya) return false;
    }
    return true;
  });

  // KPIs
  const total = prospects.length;
  const contacted = prospects.filter(p => p.call_count && p.call_count > 0).length;
  const interested = prospects.filter(p => p.status === 'مهتم' || p.status === 'مهتم - متابعة' || p.expediteur_status === 'مهتم' || p.expediteur_status === 'مرشح قوي').length;
  const confirmed = prospects.filter(p => p.status === 'أكد التعامل مع DROVA' || p.expediteur_status === 'مؤكد').length;
  const activated = prospects.filter(p => p.status === 'Expéditeur مفعل' || p.expediteur_status === 'مفعل').length;
  const activeShippers = prospects.filter(p => p.status === 'Expéditeur نشط' || p.expediteur_status === 'نشط').length;
  const conversionRate = total > 0 ? (((confirmed + activated + activeShippers) / total) * 100).toFixed(1) : '0';

  const wilayas = Array.from(new Set(prospects.map(p => p.wilaya))).sort();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trello size={20} className="text-[#FF0000]" />
              <span>إدارة الشاحنين ومسار المبيعات (Expéditeurs CRM)</span>
            </h2>
            <span className="text-[11px] font-mono-data px-2 py-0.5 bg-[#1F1F1F] text-white border border-[#333333]">
              {expediteurs.length} شاحن معتمد
            </span>
          </div>
          <p className="text-xs text-[#8E8E93] mt-1">
            متابعة دورة تحويل التجار: من أول اتصال إلى إتمام تفعيل العقد وبدء شحن الطرود فعلياً
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1A1A1A] border border-[#333333] p-0.5 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#FF0000] text-white font-bold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Trello size={13} />
              <span>لوحة كانبان (Kanban)</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#FF0000] text-white font-bold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Table size={13} />
              <span>سجل الشاحنين المعتمدين ({expediteurs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Conversion Funnel Bar (Section 20 & 34) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="bg-[#141414] border border-[#262626] p-3 text-center">
          <span className="text-[10px] text-[#8E8E93] block">قاعدة التجار</span>
          <span className="text-base font-bold font-mono-data text-white">{total}</span>
        </div>
        <div className="bg-[#141414] border border-[#262626] p-3 text-center">
          <span className="text-[10px] text-[#8E8E93] block">تم الاتصال</span>
          <span className="text-base font-bold font-mono-data text-purple-400">{contacted}</span>
        </div>
        <div className="bg-[#141414] border border-[#262626] p-3 text-center">
          <span className="text-[10px] text-[#8E8E93] block">تجار مهتمون</span>
          <span className="text-base font-bold font-mono-data text-amber-400">{interested}</span>
        </div>
        <div className="bg-[#141414] border border-[#262626] p-3 text-center">
          <span className="text-[10px] text-[#8E8E93] block">أكدوا التعامل</span>
          <span className="text-base font-bold font-mono-data text-teal-400">{confirmed}</span>
        </div>
        <div className="bg-[#141414] border border-[#262626] p-3 text-center">
          <span className="text-[10px] text-[#8E8E93] block">شاحنون مفعلون</span>
          <span className="text-base font-bold font-mono-data text-emerald-400">{activated}</span>
        </div>
        <div className="bg-[#141414] border border-[#262626] p-3 text-center">
          <span className="text-[10px] text-[#8E8E93] block">شاحنون نشطون (VIP)</span>
          <span className="text-base font-bold font-mono-data text-white bg-[#FF0000] px-1">{activeShippers}</span>
        </div>
        <div className="bg-[#141414] border border-[#262626] p-3 text-center">
          <span className="text-[10px] text-[#8E8E93] block">نسبة التحويل الكلية</span>
          <span className="text-base font-bold font-mono-data text-emerald-400">{conversionRate}%</span>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-[#141414] border border-[#262626] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute right-3 top-2.5 text-[#545458]" />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم الهاتف، أو الولاية..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333333] pr-9 pl-3 py-1.5 text-white text-xs outline-none focus:border-[#FF0000]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8E8E93] text-[11px]">المندوب التجاري:</span>
            <select
              value={selectedCommercial}
              onChange={e => setSelectedCommercial(e.target.value)}
              className="bg-[#1A1A1A] border border-[#333333] px-2.5 py-1 text-white text-xs"
            >
              <option value="all">كافة المندوبين</option>
              {COMMERCIAL_TEAM.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8E8E93] text-[11px]">الولاية:</span>
            <select
              value={selectedWilaya}
              onChange={e => setSelectedWilaya(e.target.value)}
              className="bg-[#1A1A1A] border border-[#333333] px-2.5 py-1 text-white text-xs"
            >
              <option value="all">كافة الولايات</option>
              {wilayas.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] text-[#8E8E93] font-mono-data">
          عرض <strong className="text-white">{filteredProspects.length}</strong> سجل
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD (Section 25) */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 select-none min-h-[550px]">
          {KANBAN_STAGES.map(col => {
            const stageProspects = filteredProspects.filter(p => {
              if (col.id === 'غير مهتم') {
                return p.status === 'غير مهتم' || p.status === 'رفض' || p.status === 'مرفوض' || p.status === 'رقم خاطئ' || p.status === 'Do Not Contact';
              }
              if (col.id === 'متابعة') {
                return p.status === 'متابعة' || p.status === 'مهتم - متابعة' || p.status === 'طلب الاتصال لاحقًا';
              }
              if (col.id === 'جاهز للاتصال') {
                return p.status === 'جاهز للاتصال' || p.status === 'جاهز للتواصل' || p.status === 'تم التحقق';
              }
              return p.status === col.id;
            });

            return (
              <div
                key={col.id}
                className="w-72 shrink-0 bg-[#121212] border border-[#262626] flex flex-col max-h-[700px]"
              >
                {/* Column Header */}
                <div className={`p-2.5 border-b border-[#262626] flex items-center justify-between text-xs font-bold ${col.color}`}>
                  <span>{col.label}</span>
                  <span className="font-mono-data px-1.5 py-0.2 bg-black/40 text-xs">
                    {stageProspects.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                  {stageProspects.map(pros => {
                    const cleanPhone = pros.phone.replace(/[^0-9]/g, '');
                    return (
                      <div
                        key={pros.id}
                        className="bg-[#181818] border border-[#2E2E2E] hover:border-[#444444] p-3 space-y-2 text-xs transition-colors shadow-sm"
                      >
                        {/* Title & Priority */}
                        <div className="flex items-start justify-between gap-1.5">
                          <h4
                            onClick={() => onSelectProspect(pros)}
                            className="font-bold text-white hover:text-[#FF0000] cursor-pointer line-clamp-1 text-xs"
                          >
                            {pros.name}
                          </h4>
                          {pros.call_priority === 'URGENT' && (
                            <span className="text-[10px] px-1 bg-red-950 text-red-400 border border-red-800 font-bold flex items-center gap-0.5 shrink-0">
                              <Flame size={10} /> عاجل
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="text-[11px] text-[#8E8E93] space-y-0.5 font-mono-data">
                          <div className="flex items-center gap-1 text-white">
                            <MapPin size={11} className="text-[#FF0000]" />
                            <span className="truncate">{pros.wilaya} · {pros.commune}</span>
                          </div>
                          <div>الهاتف: <strong className="text-white">{pros.phone}</strong></div>
                          <div>الشركة: <span className="text-amber-400">{pros.current_courier}</span> ({pros.parcel_estimate} طرد)</div>
                          {pros.assigned_commercial && (
                            <div>المندوب: <span className="text-neutral-300">{pros.assigned_commercial}</span></div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="pt-2 border-t border-[#262626] flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCallingProspect(pros)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                            >
                              <PhoneCall size={11} />
                              <span>اتصال</span>
                            </button>
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-[#25D366] text-black hover:opacity-90"
                              title="محادثة واتساب"
                            >
                              <MessageCircle size={13} />
                            </a>
                          </div>

                          {(pros.status === 'أكد التعامل مع DROVA' || pros.expediteur_status === 'مؤكد') && (
                            <button
                              onClick={() => setChecklistProspect(pros)}
                              className="flex items-center gap-1 px-2 py-1 bg-[#222222] hover:bg-[#333333] text-teal-400 border border-teal-800 text-[10px] font-bold"
                            >
                              <CheckSquare size={11} />
                              <span>قائمة التفعيل</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {stageProspects.length === 0 && (
                    <div className="text-center py-8 text-[#545458] text-[11px]">
                      لا يوجد تجار في هذه المرحلة
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: EXPÉDITEURS MASTER TABLE / PROFILES (Section 22) */}
      {viewMode === 'table' && (
        <div className="bg-[#141414] border border-[#262626] overflow-hidden">
          <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#101010]">
            <div>
              <h3 className="font-bold text-white text-sm">سجل الشاحنين المعتمدين رسمياً (DROVA Active Expéditeurs)</h3>
              <p className="text-[11px] text-[#8E8E93]">التجار الذين استكملوا قائمة التفعيل وبدأوا الشحن الفعلي للطرود</p>
            </div>
            <span className="font-mono-data text-xs text-white px-2 py-1 bg-[#222222] border border-[#333333]">
              الإجمالي: {expediteurs.length} شاحن
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#181818] text-[#8E8E93] border-b border-[#262626] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">معرف الشاحن (Expéditeur ID)</th>
                  <th className="py-2.5 px-3">اسم المتجر والنشاط</th>
                  <th className="py-2.5 px-3">المسؤول / الهاتف</th>
                  <th className="py-2.5 px-3">المقر (الولاية / البلدية)</th>
                  <th className="py-2.5 px-3">الشركة السابقة</th>
                  <th className="py-2.5 px-3">معدل الطرود</th>
                  <th className="py-2.5 px-3">حالة العقد</th>
                  <th className="py-2.5 px-3">تاريخ التفعيل</th>
                  <th className="py-2.5 px-3">المندوب المشرف</th>
                  <th className="py-2.5 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {expediteurs.map(exp => {
                  const matchingPros = prospects.find(p => p.id === exp.prospect_id);
                  return (
                    <tr key={exp.id} className="hover:bg-[#1A1A1A] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#FF0000] whitespace-nowrap">
                        {exp.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{exp.business_name}</div>
                        <div className="text-[11px] text-[#8E8E93] truncate max-w-xs">{exp.activity}</div>
                      </td>
                      <td className="py-3 px-3 font-mono-data whitespace-nowrap">
                        <div className="text-white font-bold">{exp.phone}</div>
                        <div className="text-[11px] text-[#8E8E93]">{exp.owner_name || 'صاحب المتجر'}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-white">{exp.wilaya}</span> · <span className="text-[#8E8E93]">{exp.commune}</span>
                      </td>
                      <td className="py-3 px-3 text-[#8E8E93] whitespace-nowrap">
                        {exp.previous_courier || 'غير محدد'}
                      </td>
                      <td className="py-3 px-3 font-mono-data font-bold text-emerald-400 whitespace-nowrap">
                        {exp.estimated_parcels} طرد
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 font-mono uppercase ${
                          exp.drova_contract_status === 'نشط' || exp.drova_contract_status === 'موقع'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {exp.drova_contract_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono-data text-[#8E8E93] whitespace-nowrap">
                        {exp.activation_date}
                      </td>
                      <td className="py-3 px-3 text-white whitespace-nowrap">
                        {exp.assigned_commercial}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {matchingPros && (
                          <button
                            onClick={() => setChecklistProspect(matchingPros)}
                            className="text-[11px] px-2.5 py-1 bg-[#222222] hover:bg-[#333333] border border-[#333333] text-teal-400 font-bold"
                          >
                            عرض القائمة
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commercial Call Dialog */}
      {callingProspect && (
        <CallModal
          prospect={callingProspect}
          onClose={() => setCallingProspect(null)}
          onCallLogged={() => {
            onRefresh();
          }}
          onOpenChecklist={() => {
            setChecklistProspect(callingProspect);
            setCallingProspect(null);
          }}
        />
      )}

      {/* Activation Checklist Dialog */}
      {checklistProspect && (
        <ActivationChecklistModal
          prospect={checklistProspect}
          onClose={() => setChecklistProspect(null)}
          onActivated={(exp) => {
            onRefresh();
            alert(`تم اعتماد وتفعيل الشاحن رسميًا برقم المعرف: ${exp.id}`);
          }}
        />
      )}
    </div>
  );
};
