/**
 * DROVA Audit Log & Operations Trail (Section 34)
 */
import React, { useState } from 'react';
import { History, Search, Filter, ShieldCheck, User, Calendar } from 'lucide-react';
import { AuditLog } from '../types';
import { storage } from '../services/storage';

export const AuditLogView: React.FC = () => {
  const [logs] = useState<AuditLog[]>(() => storage.getAuditLogs());
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = logs.filter(log => {
    if (search) {
      const q = search.toLowerCase();
      const matchesUser = log.user.toLowerCase().includes(q);
      const matchesAction = log.action.toLowerCase().includes(q);
      const matchesDetails = (log.details || '').toLowerCase().includes(q);
      if (!matchesUser && !matchesAction && !matchesDetails) return false;
    }
    if (filterAction !== 'all' && log.action !== filterAction) {
      return false;
    }
    return true;
  });

  const availableActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History size={20} className="text-[#FF0000]" />
            <span>سجل العمليات والرقابة (Audit & Compliance Log)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            سجل غير قابل للتعديل لجميع تعديلات البيانات، اعتمادات المراجعة، تغييرات أرقام الهواتف، والدمج
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 text-xs">
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="بحث بالمستخدم أو التفاصيل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#181818] border border-[#333333] pr-8 pl-3 py-1.5 text-xs text-white placeholder-[#545458] outline-none"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-[#181818] border border-[#333333] px-2.5 py-1.5 text-xs text-white"
          >
            <option value="all">كل العمليات</option>
            {availableActions.map(act => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#141414] border border-[#262626]">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#181818] border-b border-[#262626] text-[#8E8E93] text-[11px]">
                <th className="p-3">الوقت والتاريخ</th>
                <th className="p-3">المستخدم المسؤول</th>
                <th className="p-3">نوع العملية</th>
                <th className="p-3">التفاصيل والتغييرات</th>
                <th className="p-3">القيمة السابقة</th>
                <th className="p-3">القيمة الجديدة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#545458]">
                    لا توجد عمليات مسجلة مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#181818] transition-colors">
                    <td className="p-3 font-mono-data text-[11px] text-[#8E8E93] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('ar-DZ')}
                    </td>
                    <td className="p-3 text-white font-medium whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-[#FF0000] font-semibold bg-[#221414] px-1.5 py-0.5 border border-red-950">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-[#EDEDED] max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#8E8E93] whitespace-nowrap">
                      {log.old_value || '—'}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-emerald-400 font-medium whitespace-nowrap">
                      {log.new_value || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
