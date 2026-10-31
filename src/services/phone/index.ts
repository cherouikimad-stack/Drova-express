/**
 * DROVA Express Algerian Phone Discovery & Normalization Engine
 * Strict compliance: No fake numbers, format strictly +213XXXXXXXXX
 */
import { VerificationLevel } from '../../types';

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // "+213XXXXXXXXX" if valid, or ""
  original: string;
  carrier: 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Fixed' | 'Unknown';
  level: VerificationLevel;
  reason?: string;
}

// Obvious dummy or repetitive test numbers to reject
const BANNED_PATTERNS = [
  /(\d)\1{7,}/, // e.g. 0555555555, 0777777777
  /0123456789/,
  /9876543210/,
  /1234567890/,
  /0000000000/,
  /1111111111/,
];

/**
 * Normalizes an Algerian phone string into the international +213XXXXXXXXX format
 */
export function normalizeAlgerianPhone(input: string | null | undefined): PhoneValidationResult {
  const original = (input || '').trim();
  if (!original) {
    return {
      isValid: false,
      normalized: '',
      original: '',
      carrier: 'Unknown',
      level: 'INVALID',
      reason: 'رقم هاتف فارغ (Empty phone)',
    };
  }

  // Remove non-digit characters except initial '+'
  let cleaned = original.replace(/[\s\-\.\(\)\/\\\_]/g, '');

  // Handle +213, 00213, 00 213, or leading 0
  if (cleaned.startsWith('00213')) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith('+213')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('213')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Algerian local number without country code or initial 0 must have exactly 9 digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      original,
      carrier: 'Unknown',
      level: 'INVALID',
      reason: 'يحتوي على رموز غير رقمية (Non-numeric characters)',
    };
  }

  if (cleaned.length !== 9) {
    return {
      isValid: false,
      normalized: '',
      original,
      carrier: 'Unknown',
      level: 'INVALID',
      reason: `طول غير صالح: يتطلب 9 أرقام بعد الرمز (Found ${cleaned.length} digits, expected 9)`,
    };
  }

  // Check against banned fake sequences
  const fullLocal = '0' + cleaned;
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(fullLocal) || pattern.test(cleaned)) {
      return {
        isValid: false,
        normalized: '',
        original,
        carrier: 'Unknown',
        level: 'INVALID',
        reason: 'رقم وهمي أو تسلسل متكرر غير صالح (Suspicious fake pattern)',
      };
    }
  }

  const firstDigit = cleaned.charAt(0);
  let carrier: 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Fixed' | 'Unknown' = 'Unknown';

  if (firstDigit === '5') {
    carrier = 'Ooredoo';
  } else if (firstDigit === '6') {
    carrier = 'Mobilis';
  } else if (firstDigit === '7') {
    carrier = 'Djezzy';
  } else if (['2', '3', '4'].includes(firstDigit)) {
    carrier = 'Fixed';
  } else {
    return {
      isValid: false,
      normalized: '',
      original,
      carrier: 'Unknown',
      level: 'INVALID',
      reason: 'مفتاح رقم جزائري غير صالح (Invalid operator prefix: must start with 05, 06, 07 or fixed 02/03/04)',
    };
  }

  const normalized = `+213${cleaned}`;
  return {
    isValid: true,
    normalized,
    original,
    carrier,
    level: 'VERIFIED',
  };
}

/**
 * Extracts candidate Algerian phone numbers from raw text (e.g., social media bio, ad text, HTML snippet)
 */
export function extractPhonesFromText(text: string): PhoneValidationResult[] {
  if (!text) return [];

  // Match patterns like +213 550 12 34 56, 0550-12-34-56, 0770123456, 00213661112233, etc.
  const regex = /(?:\+213|00213|0)[5-7]\d(?:[\s\.\-_]?\d{2}){4}|(?:\+213|00213|0)[2-4]\d(?:[\s\.\-_]?\d{2}){3,4}/g;
  const matches = text.match(regex) || [];

  const results: PhoneValidationResult[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const res = normalizeAlgerianPhone(match);
    if (res.isValid && !seen.has(res.normalized)) {
      seen.add(res.normalized);
      results.push(res);
    }
  }

  return results;
}
