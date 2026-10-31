/**
 * DROVA Automated Test Suite (Section 45)
 * Automated assertions for phone normalization, duplicate detection, wilayas, scoring, and excel
 */
import { normalizeAlgerianPhone } from '../phone';
import { checkDuplicate, normalizeBusinessName } from '../deduplication';
import { getWilayaByCode, getWilayaByName } from '../../data/wilayas';
import { calculateLeadScore, detectWhatsApp, verifyBusinessLocation, detectCourierCompany } from '../intelligence';
import { Prospect } from '../../types';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  expected: any;
  received: any;
  durationMs: number;
  message?: string;
}

export function runAllTests(): TestResult[] {
  const results: TestResult[] = [];

  const runTest = (suite: string, name: string, fn: () => { passed: boolean; expected: any; received: any; message?: string }) => {
    const start = performance.now();
    try {
      const res = fn();
      results.push({
        suite,
        name,
        passed: res.passed,
        expected: res.expected,
        received: res.received,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: res.message,
      });
    } catch (e: any) {
      results.push({
        suite,
        name,
        passed: false,
        expected: 'No exception',
        received: e.message,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        message: e.message,
      });
    }
  };

  // --- 1. Algerian Phone Normalization Tests (Section 45: 0550123456, +213550123456, 00213550123456) ---
  runTest('Phone Normalization', 'Local 10-digit 0550123456 -> +213550123456', () => {
    const res = normalizeAlgerianPhone('0550123456');
    return {
      passed: res.isValid && res.normalized === '+213550123456' && res.carrier === 'Ooredoo',
      expected: '+213550123456 (Ooredoo)',
      received: `${res.normalized} (${res.carrier})`,
    };
  });

  runTest('Phone Normalization', 'International +213550123456 -> +213550123456', () => {
    const res = normalizeAlgerianPhone('+213550123456');
    return {
      passed: res.isValid && res.normalized === '+213550123456',
      expected: '+213550123456',
      received: res.normalized,
    };
  });

  runTest('Phone Normalization', 'Double-zero prefix 00213550123456 -> +213550123456', () => {
    const res = normalizeAlgerianPhone('00213550123456');
    return {
      passed: res.isValid && res.normalized === '+213550123456',
      expected: '+213550123456',
      received: res.normalized,
    };
  });

  runTest('Phone Normalization', 'Spaced and hyphenated 0661-45 67 21 (Mobilis) -> +213661456721', () => {
    const res = normalizeAlgerianPhone('0661-45 67 21');
    return {
      passed: res.isValid && res.normalized === '+213661456721' && res.carrier === 'Mobilis',
      expected: '+213661456721 (Mobilis)',
      received: `${res.normalized} (${res.carrier})`,
    };
  });

  runTest('Phone Normalization', 'Djezzy operator 0770 98 41 23 -> +213770984123', () => {
    const res = normalizeAlgerianPhone('0770 98 41 23');
    return {
      passed: res.isValid && res.normalized === '+213770984123' && res.carrier === 'Djezzy',
      expected: '+213770984123 (Djezzy)',
      received: `${res.normalized} (${res.carrier})`,
    };
  });

  runTest('Phone Normalization', 'Reject repetitive fake number 0555555555', () => {
    const res = normalizeAlgerianPhone('0555555555');
    return {
      passed: !res.isValid && res.level === 'INVALID',
      expected: 'Invalid (Rejected suspicious pattern)',
      received: res.level,
    };
  });

  runTest('Phone Normalization', 'Reject short number 0550123', () => {
    const res = normalizeAlgerianPhone('0550123');
    return {
      passed: !res.isValid,
      expected: 'Invalid (Too short)',
      received: res.isValid ? 'Valid' : 'Invalid',
    };
  });

  // --- 2. Wilaya & Commune Detection Tests ---
  runTest('Wilaya Detection', 'Lookup Wilaya by code 03 -> Laghouat', () => {
    const w = getWilayaByCode('03');
    return {
      passed: w?.nameAr === 'الأغواط' && w?.nameFr === 'Laghouat',
      expected: 'الأغواط (Laghouat)',
      received: `${w?.nameAr} (${w?.nameFr})`,
    };
  });

  runTest('Wilaya Detection', 'Lookup Wilaya by French name "Alger" -> الجزائر العاصمة', () => {
    const w = getWilayaByName('Alger');
    return {
      passed: w?.code === '16',
      expected: 'Code 16 (Alger)',
      received: `Code ${w?.code}`,
    };
  });

  runTest('Location Verification', 'Distinguish origin vs "Livraison 58 wilayas" without false Algiers attribution', () => {
    const res = verifyBusinessLocation('الأغواط', 'أفلو', 'متجرنا في أفلو الأغواط، التوصيل متوفر 58 ولاية');
    return {
      passed: res.level === 'VERIFIED' && res.wilaya === 'الأغواط',
      expected: 'VERIFIED: الأغواط',
      received: `${res.level}: ${res.wilaya}`,
    };
  });

  // --- 3. Deduplication Tests (Section 16: Multi-source duplicate detection) ---
  const existingSample: Prospect[] = [
    {
      id: 'p1',
      name: 'Moda Chic Laghouat',
      page_name: 'Moda Chic',
      merchant_type: 'متجر',
      product: 'ملابس',
      category: 'clothing',
      wilaya: 'الأغواط',
      commune: 'الأغواط',
      phone: '+213550123456',
      whatsapp: 'نعم',
      email: '',
      page_url: 'https://facebook.com/modachic.laghouat',
      source: 'facebook',
      source_urls: ['https://facebook.com/modachic.laghouat'],
      current_courier: 'Yalidine Express',
      loyalty_level: 'High',
      parcel_estimate: '10–20',
      status: 'جديد',
      contact_date: '',
      next_followup: '',
      responsible: '',
      notes: 'ملاحظة مهمة من المبيعات',
      alert: '',
      score: 'A+',
      score_reasons: [],
      verification_status: 'VERIFIED',
      verification_notes: '',
      phone_verification_status: 'VERIFIED',
      business_location_verification: 'VERIFIED',
      shipping_potential: 'HIGH',
      created_at: '',
      updated_at: '',
    },
  ];

  runTest('Deduplication', 'Exact phone match across different sources (Google Maps vs Facebook)', () => {
    const match = checkDuplicate(
      {
        name: 'Moda Chic Store',
        phone: '+213550123456',
        page_url: 'https://maps.google.com/?q=Moda+Chic',
      },
      existingSample
    );
    return {
      passed: match.isMatch && match.matchType === 'exact_phone',
      expected: 'Match by exact_phone',
      received: `Match by ${match.matchType}`,
    };
  });

  runTest('Deduplication', 'Exact Facebook Page URL match', () => {
    const match = checkDuplicate(
      {
        name: 'Autre Nom',
        page_url: 'https://facebook.com/modachic.laghouat?ref=share',
      },
      existingSample
    );
    return {
      passed: match.isMatch && match.matchType === 'facebook_url',
      expected: 'Match by facebook_url',
      received: `Match by ${match.matchType}`,
    };
  });

  // --- 4. Scoring Engine Tests (Section 15) ---
  runTest('Lead Scoring', 'A+ score requires phone + e-commerce + national delivery + ads/catalog', () => {
    const scoreRes = calculateLeadScore({
      hasVerifiedPhone: true,
      category: 'clothing',
      isEcommerce: true,
      hasCatalog: true,
      hasActiveAds: true,
      hasNationalShipping: true,
      hasWhatsApp: true,
    });
    return {
      passed: scoreRes.score === 'A+' && scoreRes.parcelEstimate === '10–20',
      expected: 'Score: A+, Parcel: 10–20',
      received: `Score: ${scoreRes.score}, Parcel: ${scoreRes.parcelEstimate}`,
    };
  });

  runTest('Lead Scoring', 'Reject local non-shippable services (e.g. dental clinic, restaurant)', () => {
    const scoreRes = calculateLeadScore({
      hasVerifiedPhone: true,
      category: 'clothing',
      isEcommerce: false,
      hasCatalog: false,
      hasActiveAds: false,
      hasNationalShipping: false,
      hasWhatsApp: false,
      isExcludedService: true,
    });
    return {
      passed: scoreRes.score === 'REJECT',
      expected: 'REJECT',
      received: scoreRes.score,
    };
  });

  // --- 5. WhatsApp Detection Tests (Section 9) ---
  runTest('WhatsApp Detection', 'Detect wa.me link as "نعم"', () => {
    const res = detectWhatsApp('تواصل معنا للطلب', ['https://wa.me/213550123456']);
    return {
      passed: res.status === 'نعم',
      expected: 'نعم',
      received: res.status,
    };
  });

  runTest('WhatsApp Detection', 'Unknown when no WhatsApp evidence is present', () => {
    const res = detectWhatsApp('متجر ملابس في الأغواط هاتف 0550123456', []);
    return {
      passed: res.status === 'غير معروف',
      expected: 'غير معروف',
      received: res.status,
    };
  });

  // --- 6. Courier Detection Tests (Section 12) ---
  runTest('Courier Detection', 'Identify Yalidine Express from post text', () => {
    const res = detectCourierCompany('التوصيل متوفر مع ياليدين إكسبرس 58 ولاية');
    return {
      passed: res.courier === 'Yalidine Express',
      expected: 'Yalidine Express',
      received: res.courier,
    };
  });

  return results;
}
