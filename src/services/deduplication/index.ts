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
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel (kashida)
    .replace(/\u0640/g, '')
    // Normalize Alef variants
    .replace(/[إأآا]/g, 'ا')
    // Normalize Teh Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Alef Maqsura
    .replace(/ى/g, 'ي')
    // Normalize Hamza forms
    .replace(/[ؤئ]/g, 'ء')
    // Keep only letters, digits, and whitespace across scripts
    .replace(/[^\p{L}\p{N}\s]/gu, '')
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
  // PRIORITY 1: Google Place ID (Definitive entity match)
  if (candidate.google_place_id) {
    const match = existingProspects.find(p => p.google_place_id && p.google_place_id === candidate.google_place_id);
    if (match) {
      return {
        isMatch: true,
        confidence: 'HIGH',
        existingRecord: match,
        matchType: 'google_place_id' as any,
        reason: `تطابق معرّف نشاط خرائط جوجل الموثق: ${candidate.google_place_id}`,
      };
    }
  }

  // PRIORITY 2: Normalized Phone (High Confidence)
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

  // PRIORITY 3: Website Domain
  const candidateWeb = candidate.website_url || (candidate.page_url && !candidate.page_url.includes('facebook') && !candidate.page_url.includes('instagram') ? candidate.page_url : '');
  if (candidateWeb) {
    const candidateDomain = extractDomain(candidateWeb);
    if (candidateDomain && candidateDomain.length > 3) {
      const match = existingProspects.find(p => {
        const pWeb = p.website_url || (p.page_url && !p.page_url.includes('facebook') && !p.page_url.includes('instagram') ? p.page_url : '');
        if (!pWeb) return false;
        const existingDomain = extractDomain(pWeb);
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

  // PRIORITY 4: Normalized Business Name + Address / Commune
  if (candidate.name && (candidate.address || candidate.commune)) {
    const normName = normalizeBusinessName(candidate.name);
    const candidateAddress = (candidate.address || candidate.commune || '').toLowerCase().trim();
    const match = existingProspects.find(p => {
      const existingNorm = normalizeBusinessName(p.name);
      if (normName !== existingNorm) return false;
      if (p.wilaya && candidate.wilaya && p.wilaya !== candidate.wilaya) return false;

      // Address or commune match
      const pAddress = (p.address || p.commune || '').toLowerCase().trim();
      return (
        pAddress.includes(candidateAddress) ||
        candidateAddress.includes(pAddress) ||
        (p.commune && candidate.commune && p.commune.trim().toLowerCase() === candidate.commune.trim().toLowerCase())
      );
    });
    if (match) {
      return {
        isMatch: true,
        confidence: 'HIGH',
        existingRecord: match,
        matchType: 'name_and_commune',
        reason: `تطابق الاسم التجاري والعنوان/البلدية: ${candidate.name} (${candidate.commune || candidate.wilaya})`,
      };
    }
  }

  // PRIORITY 5: Social URLs (Facebook / Instagram)
  const candidateFb = candidate.facebook_url || (candidate.page_url && (candidate.page_url.includes('facebook.com') || candidate.page_url.includes('fb.com')) ? candidate.page_url : '');
  if (candidateFb) {
    const normFb = normalizeSocialUrl(candidateFb, 'facebook');
    const match = existingProspects.find(p => {
      const pFb = p.facebook_url || (p.page_url && (p.page_url.includes('facebook.com') || p.page_url.includes('fb.com')) ? p.page_url : '');
      return pFb && normalizeSocialUrl(pFb, 'facebook') === normFb;
    });
    if (match) {
      return {
        isMatch: true,
        confidence: 'HIGH',
        existingRecord: match,
        matchType: 'facebook_url',
        reason: `تطابق رابط صفحة الفيسبوك: ${normFb}`,
      };
    }
  }

  const candidateIg = candidate.instagram_url || (candidate.page_url && candidate.page_url.includes('instagram.com') ? candidate.page_url : '');
  if (candidateIg) {
    const normIg = normalizeSocialUrl(candidateIg, 'instagram');
    const match = existingProspects.find(p => {
      const pIg = p.instagram_url || (p.page_url && p.page_url.includes('instagram.com') ? p.page_url : '');
      return pIg && normalizeSocialUrl(pIg, 'instagram') === normIg;
    });
    if (match) {
      return {
        isMatch: true,
        confidence: 'HIGH',
        existingRecord: match,
        matchType: 'instagram_url',
        reason: `تطابق حساب الإنستغرام: ${normIg}`,
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
