/**
 * DROVA Express — Commercial CRM & Expéditeur Conversion Service
 * Implements call logging, follow-up scheduling, commercial assignment,
 * contactability scoring, smart call prioritization, activation checklists, and performance analytics.
 */
import {
  Prospect,
  ProspectStatus,
  ExpediteurStatus,
  CallPriority,
  CallResult,
  CRMCall,
  CRMFollowUp,
  ActivationChecklist,
  ExpediteurProfile,
  SourcePerformanceROI
} from '../../types';

export const COMMERCIAL_TEAM = [
  { name: 'cherouik mad', role: 'admin', email: 'cherouik.mad@drova-express.dz', target: 50 },
  { name: 'أحمد بلقاسم', role: 'commercial', email: 'ahmed.b@drova-express.dz', target: 40 },
  { name: 'أمينة منصوري', role: 'commercial', email: 'amina.m@drova-express.dz', target: 40 },
  { name: 'كريم زروقي', role: 'commercial', email: 'karim.z@drova-express.dz', target: 35 },
  { name: 'سارة بوعزيز', role: 'commercial', email: 'sarah.b@drova-express.dz', target: 35 },
];

/**
 * Calculate Contactability Score (Section 9)
 * 100: Verified public phone + WhatsApp + active business
 * 80: Verified public phone + active business
 * 60: Phone probable but needs review
 * 0: No usable public phone
 */
export function calculateContactabilityScore(prospect: Partial<Prospect>): number {
  if (!prospect.phone || prospect.phone_verification_status === 'INVALID' || prospect.phone_verification_status === 'UNVERIFIED') {
    return 0;
  }

  if (prospect.phone_verification_status === 'PROBABLE') {
    return 60;
  }

  // Phone is VERIFIED
  const hasWhatsApp = prospect.whatsapp === 'نعم';
  const isActive = prospect.status !== 'مرفوض' && prospect.status !== 'Do Not Contact';

  if (hasWhatsApp && isActive) {
    return 100;
  }

  if (isActive) {
    return 80;
  }

  return 40;
}

/**
 * Calculate Smart Call Priority (Section 30)
 * Priority: URGENT 🔥, HIGH 🟢, MEDIUM 🟡, LOW ⚪
 */
export function calculateCallPriority(prospect: Partial<Prospect>): CallPriority {
  const contactability = prospect.contactability_score ?? calculateContactabilityScore(prospect);

  if (contactability === 0 || prospect.status === 'Do Not Contact' || prospect.status === 'مرفوض' || prospect.status === 'غير مهتم') {
    return 'LOW';
  }

  // Urgent conditions: A+ with high parcel volume, switching from competitors, or pending high-value follow-up
  const isAPlus = prospect.score === 'A+';
  const highVolume = prospect.parcel_estimate === '20–50' || prospect.parcel_estimate === '50+';
  const isFollowUpDue = prospect.status === 'مهتم' || prospect.status === 'مهتم - متابعة' || prospect.status === 'طلب الاتصال لاحقًا';

  if ((isAPlus && highVolume && contactability >= 80) || isFollowUpDue) {
    return 'URGENT';
  }

  if (isAPlus || (prospect.score === 'A' && contactability >= 80)) {
    return 'HIGH';
  }

  if (prospect.score === 'B' || contactability === 60) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Check for duplicate commercial assignment or conflicting in-progress contact (Section 27)
 */
export function checkDuplicateCommercialAssignment(
  prospect: Prospect,
  targetCommercial: string
): { isConflicting: boolean; message?: string } {
  if (prospect.assigned_commercial && prospect.assigned_commercial !== targetCommercial) {
    return {
      isConflicting: true,
      message: `التاجر مسند مسبقاً للمندوب التجاري: ${prospect.assigned_commercial} (آخر حالة: ${prospect.status} - ${prospect.last_call_at || 'لم يتم الاتصال بعد'})`,
    };
  }

  if (prospect.status === 'Do Not Contact') {
    return {
      isConflicting: true,
      message: `تنبيه حظر الاتصال (Do Not Contact): التاجر طلب عدم التواصل معه بتاريخ ${prospect.do_not_contact_date || 'سابقاً'}. السبب: ${prospect.do_not_contact_reason || 'طلب التاجر'}`,
    };
  }

  return { isConflicting: false };
}

/**
 * Filter follow-ups by timeframe (Section 17)
 */
export function filterFollowUpsByTimeframe(
  followUps: CRMFollowUp[],
  timeframe: 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'upcoming'
): CRMFollowUp[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  return followUps.filter(f => {
    if (f.status === 'completed' || f.status === 'cancelled') return false;

    const fDate = f.scheduled_date;
    if (!fDate) return false;

    if (timeframe === 'overdue') {
      return fDate < todayStr;
    }
    if (timeframe === 'today') {
      return fDate === todayStr;
    }
    if (timeframe === 'tomorrow') {
      return fDate === tomorrowStr;
    }
    if (timeframe === 'this_week') {
      return fDate >= todayStr && fDate <= weekEndStr;
    }
    if (timeframe === 'upcoming') {
      return fDate > weekEndStr;
    }
    return true;
  });
}

/**
 * Create default empty activation checklist (Section 23)
 */
export function createEmptyChecklist(prospect: Prospect): ActivationChecklist {
  return {
    merchant_confirmed_interest: prospect.status === 'أكد التعامل مع DROVA' || prospect.expediteur_status === 'مؤكد',
    phone_verified: prospect.phone_verification_status === 'VERIFIED',
    business_info_confirmed: !!prospect.name && !!prospect.product,
    wilaya_confirmed: !!prospect.wilaya && prospect.business_location_verification === 'VERIFIED',
    commune_confirmed: !!prospect.commune,
    activity_confirmed: !!prospect.category,
    shipping_needs_understood: false,
    tariff_information_provided: false,
    required_commercial_info_received: false,
    drova_onboarding_completed: false,
    expediteur_activated: false,
  };
}

/**
 * Generate unique DROVA Expéditeur ID
 */
export function generateExpediteurId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EXP-${year}-${rand}`;
}
