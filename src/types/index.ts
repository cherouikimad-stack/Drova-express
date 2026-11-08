/**
 * DROVA Express Algeria — Merchant Prospect Intelligence Platform
 * Master Types & Data Contracts (High-Volume Discovery Architecture)
 */

export type WilayaCode = string; // '01' to '69' (Official 69 Algerian Wilayas)

export interface Wilaya {
  code: string;
  nameAr: string;
  nameFr: string;
  communes: string[];
}

export type LeadScore = 'A+' | 'A' | 'B' | 'C' | 'REJECT';

export type VerificationLevel =
  | 'DISCOVERED'
  | 'ENRICHING'
  | 'VERIFICATION_REQUIRED'
  | 'VERIFIED'
  | 'CONTACTABLE'
  | 'DUPLICATE'
  | 'REJECTED'
  | 'PROBABLE'
  | 'UNVERIFIED'
  | 'INVALID';

export type WhatsAppStatus = 'نعم' | 'لا' | 'غير معروف';

export type CourierLoyalty = 'High' | 'Medium' | 'Low' | 'Unknown';

export type ParcelEstimate = '1–5' | '5–10' | '10–20' | '20–50' | '50+' | 'غير معروف';

export type ShippingPotential = 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECT';

export type ProspectStatus =
  | 'جديد'
  | 'جاهز للاتصال'
  | 'جاهز للتواصل'
  | 'تم التحقق'
  | 'تم الاتصال'
  | 'تم التواصل'
  | 'لم يرد'
  | 'إعادة الاتصال'
  | 'مهتم'
  | 'مهتم - متابعة'
  | 'طلب معلومات'
  | 'أرسل المعلومات'
  | 'طلب الاتصال لاحقًا'
  | 'في طور التفعيل'
  | 'أكد التعامل مع DROVA'
  | 'Expéditeur مفعل'
  | 'Expéditeur نشط'
  | 'عميل'
  | 'متابعة'
  | 'غير مهتم'
  | 'رفض'
  | 'مرفوض'
  | 'رقم خاطئ'
  | 'رقم غير متاح'
  | 'لا علاقة له بالنشاط'
  | 'مكرر'
  | 'Do Not Contact';

export type Language = 'ar' | 'fr' | 'en';

export type UserRole =
  | 'super_admin'
  | 'admin_marketing'
  | 'commercial_manager'
  | 'commercial'
  | 'viewer'
  | 'admin'
  | 'sales'
  | 'manager';

// Section 20: Commercial status for existing Expediteur
export type ExpediteurCommercialStatus =
  | 'جديد'
  | 'جاهز للاتصال'
  | 'تم الاتصال'
  | 'لم يرد'
  | 'إعادة الاتصال'
  | 'نشط'
  | 'نشط - متابعة'
  | 'معلومات ناقصة'
  | 'مشكل'
  | 'متوقف مؤقتًا'
  | 'غير نشط'
  | 'يحتاج إعادة تفعيل'
  | 'تمت إعادة التفعيل'
  | 'غير مهتم'
  | 'مرفوض';

// Section 21: Expediteur Lifecycle Status
export type ExpediteurLifecycleStatus =
  | 'مؤكد'
  | 'قيد التفعيل'
  | 'مفعل'
  | 'نشط'
  | 'غير نشط'
  | 'متوقف'
  | 'إعادة التفعيل'
  | 'مغلق';

export type ExpediteurStatus =
  | 'غير مؤهل'
  | 'Prospect'
  | 'مهتم'
  | 'قيد المتابعة'
  | 'مرشح قوي'
  | 'في طور التفعيل'
  | 'مؤكد'
  | 'مفعل'
  | 'نشط'
  | 'غير نشط'
  | 'متوقف'
  | 'إعادة التفعيل'
  | 'مغلق'
  | 'غير مهتم'
  | 'مرفوض';

export type CallPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type CallResult =
  | 'لم يرد'
  | 'الرقم مشغول'
  | 'الرقم غير متاح'
  | 'رقم خاطئ'
  | 'رفض'
  | 'غير مهتم'
  | 'مهتم'
  | 'طلب الاتصال لاحقًا'
  | 'طلب معلومات'
  | 'موافق مبدئيًا'
  | 'أكد التعامل مع DROVA'
  | 'تم الاتصال';

export type SourceType =
  | 'google_maps'
  | 'cnrc'
  | 'el_mouchir'
  | 'meta_ads'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'ouedkniss'
  | 'pages_jaunes'
  | 'annuaires_dz'
  | 'kompass'
  | 'generic_directory'
  | 'web_search'
  | 'directories'
  | 'ecommerce_web'
  | 'reverse_discovery';

export interface SourceEvidence {
  id: string;
  prospect_id: string;
  field_name: string; // 'phone', 'location', 'product', 'courier', 'whatsapp', 'entity'
  value: string;
  source: SourceType | string;
  source_url: string;
  observed_at: string;
  verification_level: VerificationLevel;
  notes: string;
}

// Layer 1: Raw Discovery Candidate (Everything discovered, accepts partial records)
export interface RawCandidate {
  id: string;
  source: SourceType | string;
  source_url: string;
  name: string;
  raw_text?: string;
  category?: string;
  product?: string;
  wilaya?: string;
  commune?: string;
  raw_phone?: string;
  website?: string;
  social_handle?: string;
  listing_count?: number; // e.g., Ouedkniss store with multiple listings
  discovered_at: string;
  status: 'pending_enrichment' | 'promoted' | 'missing_phone' | 'rejected';
}

// Layer 2: Verified Merchant (Entity resolution & verification passed)
export interface VerifiedMerchant {
  id: string;
  business_name: string;
  normalized_name: string;
  phone: string; // +213XXXXXXXXX
  whatsapp: WhatsAppStatus;
  wilaya: string;
  commune: string;
  category: string;
  product: string;
  source_channels: SourceType[];
  source_urls: string[];
  website?: string;
  email?: string;
  verified_at: string;
  confidence_score: number;
}

// Layer 3: DROVA Qualified Prospect (Master commercial sales database)
export interface Prospect {
  id: string;
  name: string;
  page_name: string;
  merchant_type: string; // "متجر إلكتروني", "علامة تجارية", "متجر بيع بالتجزئة", "موزع جملة"
  product: string;
  category: string;
  wilaya: string;
  commune: string;
  phone: string; // Normalized +213XXXXXXXXX
  whatsapp: WhatsAppStatus;
  email: string;
  page_url: string;
  source: SourceType | string;
  source_urls: string[];
  current_courier: string;
  courier_evidence?: string;
  courier_source_url?: string;
  loyalty_level: CourierLoyalty;
  parcel_estimate: ParcelEstimate;
  status: ProspectStatus;
  contact_date: string;
  next_followup: string;
  responsible: string;
  notes: string;
  alert: string;
  score: LeadScore;
  score_reasons: string[];
  verification_status: VerificationLevel;
  verification_notes: string;
  phone_verification_status: VerificationLevel;
  business_location_verification: VerificationLevel;
  shipping_potential: ShippingPotential;
  created_at: string;
  updated_at: string;
  campaign_id?: string;
  evidence_count?: number;
  // Graph relations
  graph_nodes_count?: number;

  // Commercial & Expéditeur CRM Fields (Section 10 to 33)
  expediteur_status?: ExpediteurStatus;
  contactability_score?: number; // 0 to 100
  call_priority?: CallPriority;
  assigned_commercial?: string;
  last_call_at?: string;
  last_call_result?: CallResult;
  call_count?: number;
  do_not_contact_reason?: string;
  do_not_contact_date?: string;
  cnrc_number?: string;
  commercial_register_name?: string;
  caci_activity_code?: string;
  data_origin?: 'real_imported' | 'real_manual' | 'simulated';

  // Section 10: Official Merchant Discovery Engine Schema
  business_name?: string;
  address?: string;
  source_url?: string;
  phone_source?: string;
  phone_verified?: boolean;
  whatsapp_source?: string;
  whatsapp_verified?: boolean;
  facebook_url?: string;
  instagram_url?: string;
  website_url?: string;
  google_maps_url?: string;
  source_type?: string;
  source_date?: string;
  current_delivery_company?: string;
  estimated_daily_shipments?: string;
  loyalty?: string;
  duplicate_confidence?: number;
  google_place_id?: string;
  added_by?: string;
  creator_id?: string;
}

export interface CRMCall {
  id: string;
  prospect_id: string;
  commercial_name: string;
  commercial_id?: string;
  date: string; // ISO string
  time: string; // HH:mm
  call_result: CallResult;
  is_confirmed_contact?: boolean; // MANDATORY: Reached decision-maker vs Unconfirmed (no answer/busy/wrong)
  notes: string;
  next_followup_date?: string;
  next_followup_time?: string;
  status_before: ProspectStatus;
  status_after: ProspectStatus;
  expediteur_status_before: ExpediteurStatus;
  expediteur_status_after: ExpediteurStatus;
  non_conversion_reason?: string;
  competitor_name?: string;
}

export interface CRMFollowUp {
  id: string;
  prospect_id: string;
  prospect_name: string;
  phone: string;
  wilaya: string;
  category: string;
  commercial_name: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string;
  reason: string;
  status: 'pending' | 'completed' | 'rescheduled' | 'cancelled';
  last_call_result?: CallResult;
  expediteur_status: ExpediteurStatus;
  created_at: string;
}

export interface ActivationChecklist {
  merchant_confirmed_interest: boolean;
  phone_verified: boolean;
  business_info_confirmed: boolean;
  wilaya_confirmed: boolean;
  commune_confirmed: boolean;
  activity_confirmed: boolean;
  shipping_needs_understood: boolean;
  tariff_information_provided: boolean;
  required_commercial_info_received: boolean;
  drova_onboarding_completed: boolean;
  expediteur_activated: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface ExpediteurProfile {
  id: string; // EXP-YYYY-XXXX
  prospect_id?: string;
  business_name: string;
  commercial_name: string;
  owner_name?: string;
  merchant_type?: string;
  phone: string;
  whatsapp: WhatsAppStatus;
  email: string;
  wilaya: string;
  commune: string;
  address?: string;
  activity: string;
  products: string;
  facebook_url?: string;
  instagram_url?: string;
  website?: string;
  current_courier: string;
  previous_courier?: string;
  estimated_parcels: ParcelEstimate;
  estimated_colis_per_day?: number;
  drova_contract_status: 'مسودة' | 'مرسل' | 'موقع' | 'نشط';
  activation_date?: string;
  assigned_commercial?: string;
  commercial_id?: string;
  commercial_status: ExpediteurCommercialStatus;
  lifecycle_status: ExpediteurLifecycleStatus;
  status: 'مؤكد' | 'مفعل' | 'نشط' | 'معلق' | 'غير نشط' | 'متوقف' | 'إعادة التفعيل' | 'مغلق';
  last_contact_date?: string;
  next_followup_date?: string;
  last_shipment_date?: string;
  shipments_count?: number;
  notes: string;
  source_type: 'excel_import' | 'crm_converted' | 'manual_entry';
  import_id?: string;
  checklist?: ActivationChecklist;
  created_at?: string;
  updated_at?: string;
}

export interface ExpediteurImportBatch {
  id: string;
  file_name: string;
  sheet_name: string;
  imported_by: string;
  imported_at: string;
  total_rows: number;
  new_count: number;
  existing_count: number;
  merged_count: number;
  skipped_count: number;
  invalid_count: number;
  import_mode: 'existing_expediteurs' | 'prospects' | 'raw_candidates';
  rows_preview?: any[];
}

export interface ExpediteurCall {
  id: string;
  expediteur_id: string;
  commercial_id: string;
  commercial_name: string;
  date: string;
  time: string;
  result: CallResult | string;
  notes: string;
  next_followup?: string;
  status_before?: ExpediteurCommercialStatus;
  status_after?: ExpediteurCommercialStatus;
}

export interface CommercialAccount {
  user_id: string;
  display_name: string;
  username: string;
  role: UserRole;
  phone: string;
  status: 'active' | 'disabled';
  created_at: string;
  last_login?: string;
  assigned_count?: number;
}

export interface SourcePerformanceROI {
  source: SourceType | string;
  source_name: string;
  discovered: number;
  unique: number;
  verified: number;
  phone_verified: number;
  contacted: number;
  interested: number;
  confirmed: number;
  activated: number;
  active_expediteurs: number;
  conversion_rate: number;
}

export interface PerformanceScoringWeights {
  contactActivity: number;       // default 25%
  successfulContacts: number;    // default 20%
  confirmedMerchants: number;    // default 20%
  expediteurConversion: number;  // default 15%
  followUpCompletion: number;    // default 10%
  dataQualityDiscipline: number; // default 10%
}

export interface CommercialPerformanceReport {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  phone?: string;
  avatar?: string;

  // Real Pipeline Counts
  assigned: number;
  contacted: number;          // STRICT: Distinct prospects with at least 1 recorded call
  notContacted: number;       // assigned - contacted (clamped >= 0)
  totalCalls: number;         // Total call attempts
  successfulCalls: number;    // Confirmed conversations / reached decision-maker
  unansweredCalls: number;    // No answer
  busyCalls: number;          // Busy / unreachable
  wrongNumberCalls: number;   // Wrong number

  // Qualitative outcomes
  manuallyAddedCount: number; // Number of merchants added manually by this commercial
  interestedCount: number;
  notInterestedCount: number;
  callbackCount: number;
  confirmedCount: number;     // Reached 'أكد التعامل مع DROVA'
  onboardingCount: number;    // Checklist in progress or completed
  expediteursCount: number;   // Converted to Expediteur profile
  activeMerchantsCount: number; // Active or activated shipper

  // Follow-ups
  followUpsTotal: number;
  followUpsCompleted: number;
  followUpsOverdue: number;
  followUpsPending: number;

  // Calculated Rates (%)
  contactRate: number;              // (contacted / assigned) * 100
  successfulContactRate: number;    // (successfulCalls / totalCalls) * 100
  interestedRate: number;           // (interestedCount / contacted) * 100
  confirmedRate: number;            // (confirmedCount / contacted) * 100
  onboardingRate: number;           // (onboardingCount / contacted) * 100
  expediteurConversionRate: number; // (expediteursCount / contacted) * 100
  activeMerchantConversionRate: number; // (activeMerchantsCount / contacted) * 100
  followUpCompletionRate: number;   // (followUpsCompleted / (followUpsCompleted + followUpsOverdue)) * 100

  // Performance Score (0 - 100) & Ranking
  score: number;
  rank: 'A+' | 'A' | 'B' | 'C' | 'D';
  rankTitle: string;
  scoreBreakdown: {
    contactActivityScore: number;
    successfulContactsScore: number;
    confirmedMerchantsScore: number;
    expediteurConversionScore: number;
    followUpCompletionScore: number;
    dataQualityScore: number;
  };

  // Period filter applied
  period: 'today' | 'week' | 'month' | 'all' | 'custom';
}

// Missing Phone Pool record (Second-pass enrichment pipeline)
export interface MissingPhoneCandidate {
  id: string;
  name: string;
  source: SourceType | string;
  source_url: string;
  wilaya: string;
  commune: string;
  category: string;
  product: string;
  website?: string;
  social_url?: string;
  retry_count: number;
  last_retry_at?: string;
  discovered_at: string;
  notes: string;
}

// Discovery Graph Model (Section 19)
export interface DiscoveryGraphLink {
  source_entity_id: string;
  source_type: SourceType;
  target_url: string;
  relationship_type: 'same_phone' | 'social_link' | 'website_domain' | 'exact_store' | 'meta_advertiser';
  confidence: number;
  detected_at: string;
}

export type JobStatus = 'Pending' | 'Running' | 'Paused' | 'Completed' | 'Failed' | 'Partially Completed';

export interface CampaignProgress {
  discovered: number;
  enriched: number;
  withPhone: number;
  verified: number;
  duplicates: number;
  rejected: number;
  scoreAPlus: number;
  scoreA: number;
  scoreB: number;
  missingPhonePushed?: number;
}

export interface Campaign {
  id: string;
  name: string;
  wilaya: string;
  commune?: string;
  target_number: number;
  sources: SourceType[];
  categories: string[];
  min_score: LeadScore | 'all';
  phone_required: boolean;
  whatsapp_preference: 'prefer' | 'not_required';
  active_business_required: boolean;
  enable_reverse_discovery?: boolean;
  status: JobStatus;
  progress: CampaignProgress;
  created_at: string;
  updated_at: string;
  logs: { timestamp: string; step: string; message: string; type: 'info' | 'success' | 'warn' | 'error' }[];
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  prospect_id?: string;
  campaign_id?: string;
  timestamp: string;
  old_value?: string;
  new_value?: string;
  source?: string;
  details?: string;
}

export interface ReviewItem {
  id: string;
  prospect: Prospect;
  reason: 'phone_uncertain' | 'location_uncertain' | 'duplicate_uncertain' | 'courier_uncertain' | 'category_uncertain' | 'score_borderline';
  evidence: SourceEvidence[];
  candidate_duplicates?: Prospect[];
  created_at: string;
}

export interface SourceProviderConfig {
  id: SourceType;
  name: string;
  nameAr: string;
  enabled: boolean;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  apiKeyConfigured: boolean;
  rateLimitPerMin: number;
  description: string;
  estimatedYield: number; // estimated monthly candidate discovery capacity
}

export interface GenericDirectoryConfig {
  id: string;
  name: string;
  domain: string;
  searchUrlPattern: string;
  paginationMethod: 'page_param' | 'offset' | 'cursor';
  supportedFields: string[];
  enabled: boolean;
  wilayasSupported: number;
}

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  jobType: 'phone_second_pass' | 'advertiser_sweep' | 'inactive_revalidate' | 'matrix_scan';
  status: 'active' | 'paused';
  lastRun?: string;
  nextRun: string;
  itemsProcessed: number;
}

export interface UserSession {
  user_id?: string;
  name: string;
  username?: string;
  role: UserRole;
  email: string;
  phone?: string;
  language?: Language;
}

// High Volume 10,000 Target Metrics Breakdown (Section 20 & 28)
export interface HighVolumeNationalTarget {
  targetTotal: 10000;
  discoveredCandidates: number;
  uniqueBusinesses: number;
  phoneVerified: number;
  drovaQualified: number;
  missingPhonePool: number;
  needsReview: number;
  rejected: number;
  aPlusCount: number;
  aCount: number;
  bCount: number;
}

// User Account with Secure Password Hashing (Sections 3 & 4)
export interface UserAccount {
  id: string; // user.id (stable database identity)
  full_name: string;
  username: string;
  password_hash: string;
  salt: string;
  role: UserRole;
  phone?: string;
  email?: string;
  status: 'active' | 'disabled';
  created_at: string;
  last_login?: string;
  created_by?: string;
}

// Commercial to Marketing Feedback (Section 40)
export interface CommercialFeedback {
  id: string;
  prospect_id: string;
  prospect_name: string;
  commercial_id: string;
  commercial_name: string;
  category:
    | 'wrong_phone'
    | 'wrong_activity'
    | 'business_changed'
    | 'business_closed'
    | 'moved'
    | 'no_longer_ships'
    | 'high_volume_vip'
    | 'needs_reactivation'
    | 'other';
  field_name: string;
  reported_value: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

// System Notification Model (Section 44)
export interface NotificationItem {
  id: string;
  recipient_role?: UserRole | 'all';
  recipient_user_id?: string;
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  link_view?: string;
  read: boolean;
  created_at: string;
}

// Reactivation Candidate Model (Section 36)
export interface ReactivationCandidate {
  expediteur_id: string;
  business_name: string;
  commercial_name: string;
  phone: string;
  wilaya: string;
  days_inactive: number;
  last_activity_date: string;
  last_contact_date?: string;
  previous_volume_range: ParcelEstimate;
  assigned_commercial?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

// Database Backup Snapshot (Section 50)
export interface DatabaseBackup {
  id: string;
  created_at: string;
  created_by: string;
  filename: string;
  size_bytes: number;
  total_prospects: number;
  total_expediteurs: number;
  total_calls: number;
  status: 'verified' | 'pending';
}
