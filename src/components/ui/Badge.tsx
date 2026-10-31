/**
 * DROVA Clean Typographic Indicators & Badges
 * Adheres strictly to Zero-Pill Discipline: Unboxed clean text with subtle typographic separators
 */
import React from 'react';
import { LeadScore, VerificationLevel, ProspectStatus, WhatsAppStatus } from '../../types';

export const ScoreBadge: React.FC<{ score: LeadScore }> = ({ score }) => {
  switch (score) {
    case 'A+':
      return <span className="font-mono-data font-bold text-[#FF0000]">A+ (ممتاز)</span>;
    case 'A':
      return <span className="font-mono-data font-semibold text-emerald-400">A (جيد جداً)</span>;
    case 'B':
      return <span className="font-mono-data font-medium text-amber-400">B (متوسط)</span>;
    case 'REJECT':
      return <span className="font-mono-data text-neutral-500 line-through">مرفوض</span>;
  }
};

export const VerificationBadge: React.FC<{ level: VerificationLevel }> = ({ level }) => {
  switch (level) {
    case 'VERIFIED':
      return <span className="text-xs font-medium text-emerald-400">موثق مؤكد</span>;
    case 'PROBABLE':
      return <span className="text-xs font-medium text-amber-400">محتمل (مراجعة)</span>;
    case 'UNVERIFIED':
      return <span className="text-xs text-neutral-400">غير مؤكد</span>;
    case 'INVALID':
      return <span className="text-xs text-red-400">غير صالح</span>;
  }
};

export const StatusBadge: React.FC<{ status: ProspectStatus }> = ({ status }) => {
  let color = 'text-neutral-300';
  if (status === 'جديد') color = 'text-blue-400';
  else if (status === 'تم التحقق' || status === 'جاهز للتواصل') color = 'text-emerald-400';
  else if (status === 'تم التواصل' || status === 'مهتم') color = 'text-cyan-400';
  else if (status === 'عميل') color = 'text-[#FF0000] font-bold';
  else if (status === 'متابعة') color = 'text-amber-400';
  else if (status === 'مرفوض' || status === 'غير مهتم') color = 'text-neutral-500';
  else if (status === 'Do Not Contact') color = 'text-red-500 font-bold';

  return <span className={`text-xs font-medium ${color}`}>{status}</span>;
};

export const WhatsAppBadge: React.FC<{ status: WhatsAppStatus }> = ({ status }) => {
  if (status === 'نعم') {
    return <span className="text-xs font-semibold text-emerald-400">نعم (متاح)</span>;
  }
  if (status === 'لا') {
    return <span className="text-xs text-neutral-500">لا</span>;
  }
  return <span className="text-xs text-neutral-500">غير معروف</span>;
};
