/**
 * DROVA Express High-Volume Source Connectors Registry and Two-Pass Discovery Pipeline
 * Incorporates all 14 discovery channels, reverse discovery, and missing phone preservation
 */
import { SourceType, Prospect, SourceEvidence, RawCandidate, MissingPhoneCandidate } from '../../types';
import { SourceProvider, ScanCriteria, RawDiscoveryRecord } from './base';
import { GoogleMapsProvider } from './google_maps';
import { MetaAdsProvider } from './meta_ads';
import { FacebookProvider, InstagramProvider, TikTokProvider } from './social';
import { WebSearchProvider, DirectoriesProvider } from './web_and_directories';
import { OuedknissProvider } from './ouedkniss';
import {
  PagesJaunesAlgerieProvider,
  AnnuairesDZProvider,
  ElMouchirProvider,
  KompassAlgeriaProvider,
  GenericDirectoryProvider
} from './directories_expanded';
import { CnrcProvider } from './cnrc';
import { ReverseDiscoveryProvider, reverseDiscoveryEngine } from './reverse_discovery';
import { normalizeAlgerianPhone } from '../phone';
import { detectWhatsApp, verifyBusinessLocation, detectCourierCompany, calculateLeadScore } from '../intelligence';
import { checkDuplicate, mergeProspects } from '../deduplication';

export class SourceRegistry {
  private providers: Map<SourceType, SourceProvider> = new Map();
  private enabledSources: Set<SourceType> = new Set([
    'google_maps',
    'cnrc',
    'el_mouchir',
    'meta_ads',
    'facebook',
    'instagram',
    'tiktok',
    'ouedkniss',
    'pages_jaunes',
    'annuaires_dz',
    'kompass',
    'generic_directory',
    'web_search',
    'reverse_discovery',
  ]);

  constructor() {
    this.register(new GoogleMapsProvider());
    this.register(new CnrcProvider());
    this.register(new MetaAdsProvider());
    this.register(new FacebookProvider());
    this.register(new InstagramProvider());
    this.register(new TikTokProvider());
    this.register(new OuedknissProvider());
    this.register(new PagesJaunesAlgerieProvider());
    this.register(new AnnuairesDZProvider());
    this.register(new ElMouchirProvider());
    this.register(new KompassAlgeriaProvider());
    this.register(new GenericDirectoryProvider());
    this.register(new WebSearchProvider());
    this.register(new ReverseDiscoveryProvider());
  }

  register(provider: SourceProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: SourceType): SourceProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): SourceProvider[] {
    return Array.from(this.providers.values());
  }

  isSourceEnabled(id: SourceType): boolean {
    return this.enabledSources.has(id);
  }

  toggleSource(id: SourceType, enabled: boolean) {
    if (enabled) {
      this.enabledSources.add(id);
    } else {
      this.enabledSources.delete(id);
    }
  }

  /**
   * Executes discovery pipeline across all selected sources
   * Pipeline A: High-volume raw discovery
   * Pipeline B: Qualification, phone second-pass enrichment, deduplication, scoring
   */
  async executePipeline(
    criteria: ScanCriteria,
    selectedSources: SourceType[],
    existingProspects: Prospect[],
    onProgress?: (step: string, stats: Record<string, number>) => void
  ): Promise<{
    addedProspects: Prospect[];
    missingPhoneCandidates: MissingPhoneCandidate[];
    rawDiscoveredCount: number;
    duplicatesFound: number;
    rejectedCount: number;
    evidenceList: SourceEvidence[];
    googleStats?: any;
    metaStatus?: any;
    diagnosticErrors: any[];
  }> {
    const rawDiscovered: RawDiscoveryRecord[] = [];
    const activeProviders = selectedSources
      .filter(s => this.isSourceEnabled(s))
      .map(s => this.providers.get(s))
      .filter((p): p is SourceProvider => !!p);

    const diagnosticErrors: any[] = [];

    // 1. PIPELINE A: RAW DISCOVERY
    onProgress?.('discovery_start', { activeSources: activeProviders.length });

    for (const provider of activeProviders) {
      try {
        const found = await provider.discover(criteria);
        rawDiscovered.push(...found);

        // Capture provider-specific diagnostics
        if (provider.id === 'google_maps' && (provider as any).lastExecutionStats) {
          const gStats = (provider as any).lastExecutionStats;
          if (gStats.errors && gStats.errors.length > 0) {
            diagnosticErrors.push(...gStats.errors);
          }
        }
        if (provider.id === 'meta_ads' && (provider as any).lastExecutionStatus) {
          const mStatus = (provider as any).lastExecutionStatus;
          if (mStatus.status === 'Error' || mStatus.status === 'Restricted') {
            diagnosticErrors.push({
              httpStatus: mStatus.httpStatus || 400,
              errorCode: mStatus.errorCode || 'META_API_RESTRICTED',
              errorMessage: mStatus.reason,
              source: 'Meta Ad Library API',
              query: criteria.categories[0] || 'vente en ligne',
              timestamp: mStatus.timestamp || new Date().toISOString(),
            });
          }
        }
      } catch (err: any) {
        console.warn(`Provider ${provider.name} encountered error:`, err);
        diagnosticErrors.push({
          httpStatus: 500,
          errorCode: 'PROVIDER_EXECUTION_ERROR',
          errorMessage: err?.message || `Error in ${provider.name}`,
          source: provider.name,
          query: criteria.categories[0] || '',
          timestamp: new Date().toISOString(),
        });
      }
    }

    onProgress?.('discovery_complete', { totalDiscovered: rawDiscovered.length });

    const addedProspects: Prospect[] = [];
    const missingPhoneCandidates: MissingPhoneCandidate[] = [];
    const evidenceList: SourceEvidence[] = [];
    let duplicatesFound = 0;
    let rejectedCount = 0;

    const workingProspects = [...existingProspects];

    // 2. PIPELINE B: ENRICHMENT, QUALIFICATION & REVERSE DISCOVERY
    for (const record of rawDiscovered) {
      const provider = this.providers.get(record.source as SourceType);
      const enrichment = provider ? await provider.enrich(record) : {
        phone: record.phone,
        catalogDetected: true,
        nationalShippingDetected: true,
        activeAdsDetected: false,
      };

      // Reverse Discovery cross-pollination to pull missing phone from graph
      let phoneCandidate = enrichment.phone || record.phone || record.rawPhone || '';
      if (!phoneCandidate && record.website) {
        const reverseRes = await reverseDiscoveryEngine.crossPollinateMerchant({
          name: record.businessName,
          website: record.website,
          wilaya: record.wilaya,
          commune: record.commune,
        });
        if (reverseRes.enrichedPhones.length > 0) {
          phoneCandidate = reverseRes.enrichedPhones[0];
        }
      }

      // Check phone normalization
      const phoneRes = normalizeAlgerianPhone(phoneCandidate);

      // Section 25: If no valid phone yet, save to Missing Phone Pool for secondary batch pass
      // CRITICAL: NEVER discard the real place! Keep it in CRM as VERIFICATION_REQUIRED
      if (!phoneRes.isValid) {
        missingPhoneCandidates.push({
          id: `miss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: record.businessName,
          source: record.source,
          source_url: record.sourceUrl,
          wilaya: record.wilaya,
          commune: record.commune,
          category: record.category,
          product: record.product || 'منتجات عامة',
          website: record.website,
          retry_count: 0,
          discovered_at: new Date().toISOString(),
          notes: `تم حفظ النشاط في مجمع الأرقام المعلقة لجدولة الإثراء بالدفعة الثانية (المصدر: ${record.source})`,
        });
      }

      // Location Verification
      const rawText = `${record.businessName} ${record.product || ''} ${record.rawText || ''} ${enrichment.rawTextBio || ''}`;
      const locRes = verifyBusinessLocation(record.wilaya, record.commune, `${record.address || ''} ${rawText}`);

      // WhatsApp Detection
      const waRes = detectWhatsApp(rawText, [record.sourceUrl, record.website || '']);

      // Courier Detection
      const courierRes = detectCourierCompany(`${rawText} ${enrichment.courier || ''}`);

      // Lead Scoring
      const scoring = calculateLeadScore({
        hasVerifiedPhone: phoneRes.isValid,
        category: record.category,
        isEcommerce: enrichment.catalogDetected || enrichment.nationalShippingDetected,
        hasCatalog: enrichment.catalogDetected,
        hasActiveAds: enrichment.activeAdsDetected || (record.activeAdsCount ? record.activeAdsCount > 0 : false),
        hasNationalShipping: enrichment.nationalShippingDetected,
        hasWhatsApp: waRes.status === 'نعم',
        engagementLevel: record.activeAdsCount && record.activeAdsCount > 2 ? 'high' : 'medium',
      });

      if (scoring.score === 'REJECT') {
        rejectedCount++;
        continue;
      }

      // Deduplication Check following exact priority:
      // 1. google_place_id, 2. normalized phone, 3. website, 4. name + address, 5. social URL
      const candidatePartial: Partial<Prospect> = {
        name: record.businessName,
        phone: phoneRes.isValid ? phoneRes.normalized : '',
        page_url: record.sourceUrl,
        website_url: record.website,
        google_maps_url: record.source === 'google_maps' ? record.sourceUrl : undefined,
        google_place_id: (record as any).googlePlaceId,
        commune: locRes.commune,
        wilaya: locRes.wilaya,
        address: record.address,
        source_urls: [record.sourceUrl],
      };

      const dupCheck = checkDuplicate(candidatePartial, workingProspects);
      if (dupCheck.isMatch) {
        duplicatesFound++;
        if (dupCheck.existingRecord && dupCheck.confidence === 'HIGH') {
          const updated = mergeProspects(dupCheck.existingRecord, candidatePartial);
          const idx = workingProspects.findIndex(p => p.id === updated.id);
          if (idx !== -1) workingProspects[idx] = updated;
        }
        continue;
      }

      // Create new Qualified Prospect (Layer 3)
      const newId = `pros_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const newProspect: Prospect = {
        id: newId,
        name: record.businessName,
        business_name: record.businessName,
        page_name: record.businessName,
        merchant_type: enrichment.catalogDetected ? 'متجر إلكتروني' : 'متجر بيع وتوزيع',
        product: record.product || 'منتجات قابلة للشحن',
        category: record.category,
        wilaya: locRes.wilaya,
        commune: locRes.commune,
        address: record.address || `${locRes.commune} ${locRes.wilaya}`,
        phone: phoneRes.isValid ? phoneRes.normalized : '',
        whatsapp: waRes.status,
        email: enrichment.email || '',
        page_url: record.sourceUrl,
        source: record.source,
        source_url: record.sourceUrl,
        source_urls: [record.sourceUrl, ...(record.website ? [record.website] : [])],
        google_maps_url: record.source === 'google_maps' ? record.sourceUrl : undefined,
        google_place_id: (record as any).googlePlaceId,
        website_url: record.website,
        current_courier: courierRes.courier,
        current_delivery_company: courierRes.courier,
        courier_evidence: courierRes.evidence,
        loyalty_level: courierRes.loyalty,
        parcel_estimate: scoring.parcelEstimate,
        status: phoneRes.isValid ? 'جاهز للاتصال' : 'جديد',
        contact_date: '',
        next_followup: '',
        responsible: '',
        notes: `تم الاكتشاف عبر ${record.source}`,
        alert: !phoneRes.isValid ? 'يتطلب إثراء رقم الهاتف' : (locRes.isAmbiguous ? 'مراجعة الولاية' : ''),
        score: phoneRes.isValid ? scoring.score : 'B',
        score_reasons: phoneRes.isValid ? scoring.reasons : ['نشاط تجاري حقيقي مكتشف ينقصه رقم الهاتف'],
        verification_status: phoneRes.isValid && locRes.level === 'VERIFIED' ? 'CONTACTABLE' : 'VERIFICATION_REQUIRED',
        verification_notes: `توثيق عبر ${record.source}. ${phoneRes.isValid ? `هاتف جزائري معتمد (${phoneRes.carrier})` : 'بانتظار إثراء رقم الهاتف'}.`,
        phone_verification_status: phoneRes.level,
        business_location_verification: locRes.level,
        shipping_potential: scoring.shippingPotential,
        source_date: now,
        phone_verified: phoneRes.isValid,
        phone_source: phoneRes.isValid ? record.sourceUrl : undefined,
        whatsapp_verified: waRes.status === 'نعم',
        whatsapp_source: waRes.status === 'نعم' ? record.sourceUrl : undefined,
        data_origin: 'real_imported',
        created_at: now,
        updated_at: now,
      };

      workingProspects.push(newProspect);
      addedProspects.push(newProspect);

      // Add evidence records
      if (phoneRes.normalized) {
        evidenceList.push({
          id: `evi_${Date.now()}_ph`,
          prospect_id: newId,
          field_name: 'phone',
          value: phoneRes.normalized,
          source: record.source,
          source_url: record.sourceUrl,
          observed_at: now,
          verification_level: phoneRes.level,
          notes: `رقم هاتف عام مستخرج ومطابق لمشغل ${phoneRes.carrier}`,
        });
      }

      if (locRes.wilaya) {
        evidenceList.push({
          id: `evi_${Date.now()}_loc`,
          prospect_id: newId,
          field_name: 'location',
          value: `${locRes.wilaya} - ${locRes.commune}`,
          source: record.source,
          source_url: record.sourceUrl,
          observed_at: now,
          verification_level: locRes.level,
          notes: locRes.evidence,
        });
      }

      if (addedProspects.length >= criteria.targetNumber) {
        break;
      }
    }

    const googleProvider = this.providers.get('google_maps') as any;
    const metaProvider = this.providers.get('meta_ads') as any;

    return {
      addedProspects,
      missingPhoneCandidates,
      rawDiscoveredCount: rawDiscovered.length,
      duplicatesFound,
      rejectedCount,
      evidenceList,
      googleStats: googleProvider?.lastExecutionStats,
      metaStatus: metaProvider?.lastExecutionStatus,
      diagnosticErrors,
    };
  }
}

export const sourceRegistry = new SourceRegistry();
