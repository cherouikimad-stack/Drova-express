/**
 * DROVA Express Source Connectors Base Interface
 */
import { SourceType, VerificationLevel } from '../../types';

export interface ScanCriteria {
  wilaya: string;
  commune?: string;
  categories: string[];
  targetNumber: number;
  phoneRequired: boolean;
  activeBusinessRequired: boolean;
}

export interface RawDiscoveryRecord {
  id: string;
  source: SourceType | string;
  sourceUrl: string;
  businessName: string;
  category: string;
  product?: string;
  phone?: string;
  rawPhone?: string;
  website?: string;
  address?: string;
  wilaya: string;
  commune: string;
  rawText?: string;
  adText?: string;
  rating?: number;
  reviewCount?: number;
  activeAdsCount?: number;
  hasCatalog?: boolean;
  hasNationalDelivery?: boolean;
  courierMentioned?: string;
  observedAt: string;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface EnrichmentResult {
  phone?: string;
  phoneEvidence?: string;
  whatsapp?: 'نعم' | 'لا' | 'غير معروف';
  whatsappEvidence?: string;
  website?: string;
  email?: string;
  courier?: string;
  courierEvidence?: string;
  catalogDetected: boolean;
  nationalShippingDetected: boolean;
  activeAdsDetected: boolean;
  rawTextBio?: string;
}

export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'offline';
  message: string;
  latencyMs: number;
}

export interface SourceProvider {
  id: SourceType;
  name: string;
  nameAr: string;
  description: string;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  health_check(): Promise<ProviderHealth>;
  discover(criteria: ScanCriteria): Promise<RawDiscoveryRecord[]>;
  enrich(record: RawDiscoveryRecord): Promise<EnrichmentResult>;
  verify(record: RawDiscoveryRecord): Promise<{ status: VerificationLevel; notes: string }>;
}
