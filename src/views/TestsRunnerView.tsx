/**
 * DROVA Automated Quality & Invariant Tests View (Section 45)
 */
import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { runAllTests, TestResult } from '../services/tests/suite';

export const TestsRunnerView: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>(() => runAllTests());
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResults(runAllTests());
      setIsRunning(false);
    }, 150);
  };

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            <span>فحص واختبار المعايير الآلية (Automated Verification Test Suite)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            اختبارات جودة البيانات، تطبيع الأرقام الجزائرية، إزالة التكرارات، والامتثال (Section 45)
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold transition-colors shadow-sm"
        >
          <Play size={14} />
          <span>{isRunning ? 'جاري الاختبار...' : 'تشغيل كافة الاختبارات (Run Tests)'}</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-[#141414] border border-[#262626]">
          <span className="text-xs text-[#8E8E93] block">إجمالي الاختبارات الآلية</span>
          <span className="text-xl font-mono-data font-bold text-white mt-1 block">
            {results.length}
          </span>
        </div>

        <div className="p-4 bg-[#141414] border border-[#262626]">
          <span className="text-xs text-[#8E8E93] block">الاختبارات الناجحة (Passed)</span>
          <span className="text-xl font-mono-data font-bold text-emerald-400 mt-1 block">
            {passedCount} / {results.length}
          </span>
        </div>

        <div className="p-4 bg-[#141414] border border-[#262626]">
          <span className="text-xs text-[#8E8E93] block">الإخفاقات (Failed)</span>
          <span className={`text-xl font-mono-data font-bold mt-1 block ${failedCount === 0 ? 'text-neutral-500' : 'text-red-500'}`}>
            {failedCount}
          </span>
        </div>
      </div>

      {/* Tests Results List */}
      <div className="bg-[#141414] border border-[#262626]">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between text-xs text-[#8E8E93]">
          <span className="font-bold text-white">تفاصيل نتائج الاختبارات الفردية:</span>
          <span>زمن التنفيذ الإجمالي: {results.reduce((a, b) => a + b.durationMs, 0).toFixed(2)}ms</span>
        </div>

        <div className="divide-y divide-[#1F1F1F]">
          {results.map((t, idx) => (
            <div key={idx} className="p-3.5 hover:bg-[#181818] transition-colors flex items-start justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#FF0000] bg-[#221414] px-1.5 py-0.5 border border-red-950">
                    {t.suite}
                  </span>
                  <span className="font-semibold text-white">{t.name}</span>
                </div>

                <div className="text-[11px] text-[#8E8E93] font-mono-data">
                  المتوقع: <span className="text-neutral-300">{String(t.expected)}</span> · المحصل: <span className="text-emerald-400">{String(t.received)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-[#545458]">{t.durationMs}ms</span>
                {t.passed ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 size={15} />
                    <span>PASS</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 font-bold text-xs">
                    <XCircle size={15} />
                    <span>FAIL</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
