/**
 * DROVA Express Deduplication Engine
 * Deduplication Priority:
 * 1. Exact phone
 * 2. Facebook Page URL / Page ID
 * 3. Instagram URL
 * 4. Website domain
 * 5. Exact normalized business name + commune
 * 6. Fuzzy business name + phone
 * 7. Other strong identity signals
 */

import { Prospect } from '../../types';

export interface DeduplicationMatch {
  isMatch: boolean;
  confidence: 'HIGH' | 'UNCERTAIN' | 'NONE';
  existingRecord?: Prospect;
  matchType?:
    | 'exact_phone'
    | 'facebook_url'
    | 'instagram_url'
    | 'website_domain'
    | 'name_and_commune'
    | 'fuzzy_name_phone';
  reason?: string;
}

/**
 * Normalizes business names for matching
 */
export function normalizeBusinessName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Keep letters and numbers in any script (Arabic/Latin)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts normalized domain from a website URL
 */
export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(fullUrl);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.replace(/^https?:\/\/(?:www\.)?/, '').split('/')[0].toLowerCase();
  }
}

/**
 * Normalizes social profile handles or URLs
 */
export function normalizeSocialUrl(url: string, platform: 'facebook' | 'instagram' | 'tiktok'): string {
  if (!url) return '';
  let clean = url.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\/(?:www\.)?/, '');
  clean = clean.split('?')[0].split('#')[0]; // remove query params
  // remove trailing slashes
  clean = clean.replace(/\/+$/, '');
  return clean;
}

/**
 * Checks if a candidate prospect matches an existing record in the database
 */
export function checkDuplicate(candidate: Partial<Prospect>, existingProspects: Prospect[]): DeduplicationMatch {
  // 1. Exact Phone (High Confidence)
  if (candidate.phone && candidate.phone.startsWith('+213')) {
    const match = existingProspects.find(p => p.phone === candidate.phone);
    if (match) {
      return {
        isMatch: true,
        confidence: 'HIGH',
        existingRecord: match,
        matchType: 'exact_phone',
        reason: `تطابق تام في رقم الهاتف الموثق: ${candidate.phone}`,
      };
    }
  }

  // 2. Facebook Page URL
  if (candidate.page_url && (candidate.page_url.includes('facebook.com') || candidate.page_url.includes('fb.com'))) {
    const candidateFb = normalizeSocialUrl(candidate.page_url, 'facebook');
    const match = existingProspects.find(p => {
      const existingFb = normalizeSocialUrl(p.page_url || '', 'facebook');
      return existingFb && existingFb === candidateFb;
    });
    if (match) {
      return {
        isMatch: true,
        confidence: 'HIGH',
        existingRecord: match,
        matchType: 'facebook_url',
        reason: `تطابق رابط صفحة الفيسبوك: ${candidateFb}`,
      };
    }
  }

  // 3. Instagram URL
  if (candidate.page_url && candidate.page_url.includes('instagram.com')) {
    const candidateIg = normalizeSocialUrl(candidate.page_url, 'instagram');
    const match = existingProspects.find(p => {
      const existingIg = normalizeSocialUrl(p.page_url || '', 'instagram');
      return existingIg && existingIg === candidateIg;
    });
    if (match) {
      return {
        isMatch: true,
        confidence: 'HIGH',
        existingRecord: match,
        matchType: 'instagram_url',
        reason: `تطابق حساب الإنستغرام: ${candidateIg}`,
      };
    }
  }

  // 4. Website Domain
  if (candidate.page_url && !candidate.page_url.includes('facebook') && !candidate.page_url.includes('instagram')) {
    const candidateDomain = extractDomain(candidate.page_url);
    if (candidateDomain && candidateDomain.length > 3) {
      const match = existingProspects.find(p => {
        if (!p.page_url) return false;
        const existingDomain = extractDomain(p.page_url);
        return existingDomain === candidateDomain;
      });
      if (match) {
        return {
          isMatch: true,
          confidence: 'HIGH',
          existingRecord: match,
          matchType: 'website_domain',
          reason: `تطابق نطاق الموقع الإلكتروني: ${candidateDomain}`,
        };
      }
    }
  }

  // 5. Exact normalized business name + commune
  if (candidate.name && candidate.commune) {
    const normName = normalizeBusinessName(candidate.name);
    const match = existingProspects.find(p => {
      return (
        normalizeBusinessName(p.name) === normName &&
        p.commune.trim().toLowerCase() === candidate.commune?.trim().toLowerCase() &&
        p.wilaya === candidate.wilaya
      );
    });
    if (match) {
      return {
        isMatch: true,
        confidence: 'HIGH',
        existingRecord: match,
        matchType: 'name_and_commune',
        reason: `تطابق الاسم التجاري والبلدية في نفس الولاية: ${candidate.name} (${candidate.commune})`,
      };
    }
  }

  // 6. Fuzzy business name with same Wilaya and similar category -> Flag as UNCERTAIN (Send to Human Review)
  if (candidate.name && candidate.wilaya) {
    const normName = normalizeBusinessName(candidate.name);
    const candidateTokens = normName.split(' ').filter(t => t.length > 2);

    for (const p of existingProspects) {
      if (p.wilaya === candidate.wilaya) {
        const existingNorm = normalizeBusinessName(p.name);
        if (normName === existingNorm) {
          // Same name, same wilaya but different commune or missing phone -> Uncertain
          return {
            isMatch: true,
            confidence: 'UNCERTAIN',
            existingRecord: p,
            matchType: 'fuzzy_name_phone',
            reason: `تشابه قوي في الاسم في نفس الولاية (${p.wilaya}) يتطلب مراجعة بشرية للدمج`,
          };
        }

        const existingTokens = existingNorm.split(' ').filter(t => t.length > 2);
        const commonTokens = candidateTokens.filter(t => existingTokens.includes(t));
        if (commonTokens.length >= 2 && commonTokens.length >= candidateTokens.length * 0.7) {
          return {
            isMatch: true,
            confidence: 'UNCERTAIN',
            existingRecord: p,
            matchType: 'fuzzy_name_phone',
            reason: `تقارب أسماء مرتفع (${commonTokens.join(', ')}) في ولاية ${p.wilaya}`,
          };
        }
      }
    }
  }

  return {
    isMatch: false,
    confidence: 'NONE',
  };
}

/**
 * Merges a candidate prospect into an existing record without overwriting manual notes or sales status
 */
export function mergeProspects(target: Prospect, incoming: Partial<Prospect>): Prospect {
  const mergedSourceUrls = Array.from(new Set([...target.source_urls, ...(incoming.source_urls || [])]));

  return {
    ...target,
    // Preserve manual contact or sales status if already present
    status: target.status === 'جديد' && incoming.status ? incoming.status : target.status,
    notes: target.notes ? target.notes : incoming.notes || '',
    responsible: target.responsible || incoming.responsible || '',
    contact_date: target.contact_date || incoming.contact_date || '',
    next_followup: target.next_followup || incoming.next_followup || '',
    // Update missing fields if incoming has them
    whatsapp: target.whatsapp === 'نعم' ? 'نعم' : (incoming.whatsapp || target.whatsapp),
    email: target.email || incoming.email || '',
    current_courier: target.current_courier !== 'غير معروف' ? target.current_courier : (incoming.current_courier || 'غير معروف'),
    source_urls: mergedSourceUrls,
    updated_at: new Date().toISOString(),
  };
}
