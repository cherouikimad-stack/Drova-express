/**
 * DROVA Express Merchant Intelligence Engine
 * - WhatsApp Detection (نعم, لا, غير معروف)
 * - Location Verification (Origin vs Delivery destination)
 * - Courier Detection & Loyalty
 * - Parcel Volume Estimation
 * - Lead Scoring (A+, A, B, REJECT)
 */

import {
  LeadScore,
  ParcelEstimate,
  CourierLoyalty,
  ShippingPotential,
  WhatsAppStatus,
  VerificationLevel,
  Prospect
} from '../../types';
import { ALGERIA_WILAYAS } from '../../data/wilayas';

export interface LocationVerificationResult {
  level: VerificationLevel;
  wilaya: string;
  commune: string;
  evidence: string;
  isAmbiguous: boolean;
}

export interface WhatsAppDetectionResult {
  status: WhatsAppStatus;
  evidence?: string;
  link?: string;
}

export interface CourierDetectionResult {
  courier: string;
  evidence?: string;
  sourceUrl?: string;
  loyalty: CourierLoyalty;
}

export interface ScoringResult {
  score: LeadScore;
  reasons: string[];
  shippingPotential: ShippingPotential;
  parcelEstimate: ParcelEstimate;
}

// Known Algerian parcel delivery couriers
const KNOWN_COURIERS = [
  { name: 'Yalidine Express', patterns: [/yalidine/i, /ياليدين/i, /yalidin/i] },
  { name: 'Maystro Delivery', patterns: [/maystro/i, /مايسترو/i] },
  { name: 'ZR Express', patterns: [/zr express/i, /زد آر/i, /zr delivery/i] },
  { name: 'Zimou Express', patterns: [/zimou/i, /زيمو/i] },
  { name: 'Kazitour', patterns: [/kazitour/i, /كازيتور/i] },
  { name: 'Echourouk Express', patterns: [/echourouk express/i, /الشروق إكسبرس/i] },
  { name: 'Procolis', patterns: [/procolis/i, /بروكولي/i] },
  { name: 'EMS Champion Post', patterns: [/ems algerie/i, /ems champion/i] },
  { name: 'Colis Privé DZ', patterns: [/colis prive/i, /كولي بريفي/i] },
];

/**
 * Detects WhatsApp presence based on strict public evidence
 */
export function detectWhatsApp(rawText: string, urls: string[]): WhatsAppDetectionResult {
  const combined = `${rawText} ${urls.join(' ')}`.toLowerCase();

  // Check for direct wa.me or api.whatsapp.com links
  const waMatch = combined.match(/https?:\/\/(?:api\.whatsapp\.com\/send\?phone=|wa\.me\/)(\+?213\d{9}|\d{9,13})/i);
  if (waMatch) {
    return {
      status: 'نعم',
      evidence: 'رابط واتساب مباشر موثق (Direct wa.me link found)',
      link: waMatch[0]
    };
  }

  // Check for explicit arabic/french mention in text
  if (
    /واتساب\s*[:\-\=]?\s*(?:\+?213|0)[5-7]\d/i.test(rawText) ||
    /whatsapp\s*[:\-\=]?\s*(?:\+?213|0)[5-7]\d/i.test(rawText) ||
    /commandes?\s*via\s*whatsapp/i.test(rawText) ||
    /للطلب\s*عبر\s*الواتساب/i.test(rawText)
  ) {
    return {
      status: 'نعم',
      evidence: 'رقم واتساب مصرح به في وصف النشاط (Explicit WhatsApp contact in bio/post)',
    };
  }

  // If text explicitly says "لا يوجد واتساب" or "اتصال هاتفي فقط"
  if (/لا يوجد واتساب/i.test(rawText) || /pas de whatsapp/i.test(rawText) || /اتصال هاتفي فقط/i.test(rawText)) {
    return {
      status: 'لا',
      evidence: 'المتجر يوضح عدم استقبال طلبات عبر واتساب (Explicitly no WhatsApp)',
    };
  }

  return {
    status: 'غير معروف',
  };
}

/**
 * Verifies business origin location vs delivery destination
 * Never assigns Algiers just because of "Livraison 58 wilayas"
 */
export function verifyBusinessLocation(
  declaredWilaya: string,
  declaredCommune: string,
  bioOrAddressText: string
): LocationVerificationResult {
  const text = (bioOrAddressText || '').toLowerCase();

  // Delivery destination keywords to discard as physical location
  const deliveryPhrases = [
    'livraison 58 wilayas',
    'التوصيل متوفر 58 ولاية',
    'توصيل لجميع الولايات',
    'livraison vers 58 wilayas',
    'livraison alger',
    'livraison disponible à alger',
    'توصيل متوفر للجزائر العاصمة',
    'توصيل سريع ل 58 ولاية',
  ];

  // Look for origin signals
  const originPhrases = [
    'المقر',
    'متجرنا متواجد في',
    'العنوان',
    'محل رقم',
    'حي',
    'شارع',
    'boutique à',
    'magasin situé à',
    'adresse',
    'local n°',
    'rue',
    'boulevard',
  ];

  const hasOriginSignal = originPhrases.some(phrase => text.includes(phrase));
  const hasDeliveryOnlySignal = deliveryPhrases.some(phrase => text.includes(phrase));

  // Find if a declared wilaya is matched
  const matchedWilaya = ALGERIA_WILAYAS.find(
    w => w.nameAr === declaredWilaya || w.nameFr.toLowerCase() === declaredWilaya.toLowerCase()
  );

  if (!matchedWilaya) {
    return {
      level: 'UNVERIFIED',
      wilaya: declaredWilaya || 'غير محدد',
      commune: declaredCommune || 'غير محدد',
      evidence: 'الولاية غير معترف بها في التقسيم الإداري الجزائري',
      isAmbiguous: true,
    };
  }

  if (hasOriginSignal && (text.includes(matchedWilaya.nameAr) || text.includes(matchedWilaya.nameFr.toLowerCase()))) {
    return {
      level: 'VERIFIED',
      wilaya: matchedWilaya.nameAr,
      commune: declaredCommune || matchedWilaya.communes[0] || 'وسط المدينة',
      evidence: `عنوان المقر والنشاط موثق رسمياً في ولاية ${matchedWilaya.nameAr}`,
      isAmbiguous: false,
    };
  }

  if (hasDeliveryOnlySignal && !hasOriginSignal && (declaredWilaya === 'الجزائر العاصمة' || declaredWilaya === 'Alger')) {
    // Highly suspect: could be a generic delivery claim
    return {
      level: 'PROBABLE',
      wilaya: declaredWilaya,
      commune: declaredCommune || '',
      evidence: 'تنبيه: تم رصد عبارة توصيل، يلزم تأكيد مقر المتجر الفعلي عبر المراجعة اليدوية',
      isAmbiguous: true,
    };
  }

  return {
    level: declaredCommune ? 'VERIFIED' : 'PROBABLE',
    wilaya: matchedWilaya.nameAr,
    commune: declaredCommune || 'غير محدد',
    evidence: `تطابق بيانات الموقع مع سجل النشاط في ${matchedWilaya.nameAr}`,
    isAmbiguous: false,
  };
}

/**
 * Detects current courier company from public posts/reviews
 */
export function detectCourierCompany(text: string): CourierDetectionResult {
  for (const item of KNOWN_COURIERS) {
    for (const pattern of item.patterns) {
      if (pattern.test(text)) {
        // Evaluate loyalty
        let loyalty: CourierLoyalty = 'Medium';
        if (/حساب مع|contrat avec|partenaire officiel|شريك رسمي|حصريا مع/i.test(text)) {
          loyalty = 'High';
        } else if (/احيانا|parfois|أو|sur demande/i.test(text)) {
          loyalty = 'Low';
        }

        return {
          courier: item.name,
          evidence: `تم العثور على إشارة صريحة لشركة ${item.name} في منشورات أو شروط المتجر`,
          loyalty,
        };
      }
    }
  }

  return {
    courier: 'غير معروف',
    loyalty: 'Unknown',
  };
}

/**
 * Lead Scoring Engine
 * A+: Active e-commerce, verified phone, national shipping, active Meta ads or catalog, high parcel potential
 * A: Active e-commerce merchant, verified phone, clear product activity, reasonable shipping potential
 * B: Real merchant, verified phone, products available, weaker or local shipping potential
 * REJECT: No verified phone when mandatory, inactive/fake, local services (restaurant, doctor, salon)
 */
export function calculateLeadScore(data: {
  hasVerifiedPhone: boolean;
  category: string;
  isEcommerce: boolean;
  hasCatalog: boolean;
  hasActiveAds: boolean;
  hasNationalShipping: boolean;
  hasWhatsApp: boolean;
  isPhysicalStoreOnly?: boolean;
  isExcludedService?: boolean; // restaurant, doctor, salon, etc.
  engagementLevel?: 'high' | 'medium' | 'low';
}): ScoringResult {
  const reasons: string[] = [];

  // Excluded service check (Section 11)
  if (data.isExcludedService) {
    return {
      score: 'REJECT',
      reasons: ['خدمة محلية غير قابلة للشحن (صالون، مطعم، عيادة، مهنة حرة)'],
      shippingPotential: 'REJECT',
      parcelEstimate: 'غير معروف',
    };
  }

  // Phone check (Section 8 & 15)
  if (!data.hasVerifiedPhone) {
    return {
      score: 'REJECT',
      reasons: ['لا يوجد رقم هاتف عام موثق (Mandatory verified phone missing)'],
      shippingPotential: 'LOW',
      parcelEstimate: 'غير معروف',
    };
  }

  reasons.push('رقم هاتف جزائري موثق ومطابق للمعايير');

  // Shipping potential assessment
  let potential: ShippingPotential = 'MEDIUM';
  if (data.isEcommerce && data.hasNationalShipping && (data.hasCatalog || data.hasActiveAds)) {
    potential = 'HIGH';
  } else if (data.isPhysicalStoreOnly && !data.hasNationalShipping) {
    potential = 'LOW';
  }

  if (potential === 'HIGH') {
    reasons.push('نشاط تجارة إلكترونية نشط وشحن وطني موثق');
  }

  if (data.hasActiveAds) {
    reasons.push('حملات إعلانية نشطة (Meta Ads Library)');
  }

  if (data.hasCatalog) {
    reasons.push('كتالوج منتجات وأسعار واضحة ومحدثة');
  }

  if (data.hasWhatsApp) {
    reasons.push('قناة واتساب مباشرة لتلقي طلبات الشحن');
  }

  // Parcel estimate calculation based on concrete signals (Section 14)
  let parcelEstimate: ParcelEstimate = 'غير معروف';
  if (data.hasActiveAds && data.engagementLevel === 'high') {
    parcelEstimate = '20–50';
  } else if (data.hasActiveAds || (data.isEcommerce && data.hasNationalShipping)) {
    parcelEstimate = '10–20';
  } else if (data.isEcommerce) {
    parcelEstimate = '5–10';
  } else if (data.isPhysicalStoreOnly) {
    parcelEstimate = '1–5';
  }

  // Score determination
  if (
    data.hasVerifiedPhone &&
    data.isEcommerce &&
    data.hasNationalShipping &&
    (data.hasActiveAds || data.hasCatalog) &&
    potential === 'HIGH'
  ) {
    return {
      score: 'A+',
      reasons,
      shippingPotential: 'HIGH',
      parcelEstimate: parcelEstimate === 'غير معروف' ? '10–20' : parcelEstimate,
    };
  }

  if (data.hasVerifiedPhone && data.isEcommerce && potential !== 'LOW') {
    return {
      score: 'A',
      reasons,
      shippingPotential: 'HIGH',
      parcelEstimate: parcelEstimate === 'غير معروف' ? '5–10' : parcelEstimate,
    };
  }

  if (data.hasVerifiedPhone) {
    return {
      score: 'B',
      reasons,
      shippingPotential: potential,
      parcelEstimate: parcelEstimate === 'غير معروف' ? '1–5' : parcelEstimate,
    };
  }

  return {
    score: 'REJECT',
    reasons: ['معايير غير كافية للتأهيل التجاري'],
    shippingPotential: 'LOW',
    parcelEstimate: 'غير معروف',
  };
}
