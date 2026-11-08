/**
 * DROVA Source Connectors & Integrations Monitor (Section 5, 30 & 32)
 */
import React, { useState, useEffect } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { sourceRegistry } from '../services/connectors';
import { SourceType } from '../types';

export const SourcesView: React.FC<{ onNavigate?: (view: any) => void }> = ({ onNavigate }) => {
  const [providers, setProviders] = useState(() => sourceRegistry.getAllProviders());
  const [healthStatus, setHealthStatus] = useState<Record<string, { status: string; latency: number; msg: string }>>({});
  const [loading, setLoading] = useState(false);

  const checkAllHealth = async () => {
    setLoading(true);
    const results: Record<string, { status: string; latency: number; msg: string }> = {};
    for (const p of providers) {
      try {
        const res = await p.health_check();
        results[p.id] = { status: res.status, latency: res.latencyMs, msg: res.message };
      } catch (e: any) {
        results[p.id] = { status: 'offline', latency: 0, msg: e.message || 'Offline' };
      }
    }
    setHealthStatus(results);
    setLoading(false);
  };

  useEffect(() => {
    checkAllHealth();
  }, []);

  const handleToggle = (id: SourceType) => {
    const isCurrentlyEnabled = sourceRegistry.isSourceEnabled(id);
    sourceRegistry.toggleSource(id, !isCurrentlyEnabled);
    setProviders([...sourceRegistry.getAllProviders()]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={20} className="text-[#FF0000]" />
            <span>محركات استكشاف المصادر (Source Discovery Engine)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            إدارة موصلات البيانات العامة المستقلة ومراقبة سرعة الاستجابة ودرجة الموثوقية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
            >
              <KeyRound size={13} />
              <span>إدخال وتعديل مفاتيح API يدوياً</span>
            </button>
          )}

          <button
            onClick={checkAllHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-xs font-medium text-white transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#FF0000]' : 'text-[#8E8E93]'} />
            <span>فحص حالة الاتصال (Health Check)</span>
          </button>
        </div>
      </div>

      {/* Philosophy banner */}
      <div className="p-4 bg-[#141414] border border-[#262626] text-xs text-neutral-300 space-y-1">
        <span className="font-bold text-white block">ميثاق الامتثال والاستخراج العام (Section 21 Compliance Layer):</span>
        <p className="text-[#8E8E93]">
          تعمل كافة المحركات وفق مبادئ الوصول القانوني للمعلومات التجارية العامة المفتوحة للجمهور دون تخطي أنظمة الحماية أو التحايل أو استخدام حسابات وهمية. إذا تعذر العثور على حقل معين، يصنف كـ "غير معروف" دون افتراضات عشوائية.
        </p>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map(p => {
          const isEnabled = sourceRegistry.isSourceEnabled(p.id);
          const health = healthStatus[p.id];

          return (
            <div
              key={p.id}
              className={`p-5 border transition-colors flex flex-col justify-between ${
                isEnabled
                  ? 'bg-[#151515] border-[#2A2A2A]'
                  : 'bg-[#101010] border-[#1E1E1E] opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{p.nameAr}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                        p.reliability === 'HIGH'
                          ? 'border-emerald-900 bg-emerald-950/40 text-emerald-400'
                          : 'border-amber-900 bg-amber-950/40 text-amber-400'
                      }`}
                    >
                      ثقة: {p.reliability}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggle(p.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF0000]"></div>
                  </label>
                </div>

                <p className="text-xs text-[#8E8E93] mb-3">{p.description}</p>
                <span className="text-[10px] text-[#545458] font-latin font-mono block mb-3">
                  ID: {p.id} · Module: /connectors/{p.id}.ts
                </span>
              </div>

              {/* Health Indicator Footer */}
              <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      health?.status === 'healthy'
                        ? 'bg-emerald-400'
                        : health?.status === 'degraded'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <span className="text-[11px] text-[#EDEDED]">
                    {health ? health.msg : 'جاري الفحص...'}
                  </span>
                </div>

                {health && health.latency > 0 && (
                  <span className="text-[10px] font-mono text-[#8E8E93]">
                    {health.latency}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
