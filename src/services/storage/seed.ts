/**
 * DROVA Express Production Seed Configuration
 * CLEAN PRODUCTION STATE — ZERO DEMO / FAKE DATA
 * The database starts clean for real-world enterprise operations.
 */
import {
  Prospect,
  SourceEvidence,
  AuditLog,
  Campaign,
  MissingPhoneCandidate,
  GenericDirectoryConfig,
  ScheduledJob,
  HighVolumeNationalTarget,
  CRMCall,
  CRMFollowUp,
  ExpediteurProfile
} from '../../types';

// Real baseline targets (starts at zero real records, targets 10,000 real merchants)
export const NATIONAL_TARGET_STATS: HighVolumeNationalTarget = {
  targetTotal: 10000,
  discoveredCandidates: 0,
  uniqueBusinesses: 0,
  phoneVerified: 0,
  drovaQualified: 0,
  missingPhonePool: 0,
  needsReview: 0,
  rejected: 0,
  aPlusCount: 0,
  aCount: 0,
  bCount: 0,
};

// Zero demo data: Production pools start empty
export const INITIAL_MISSING_PHONE_POOL: MissingPhoneCandidate[] = [];

export const INITIAL_GENERIC_DIRECTORIES: GenericDirectoryConfig[] = [
  {
    id: 'dir_algeria_invest',
    name: 'دليل المستثمرين والتجارة الجزائري (Algeria Invest)',
    domain: 'algeriainvest.com',
    searchUrlPattern: 'https://algeriainvest.com/companies?q={query}&wilaya={wilaya}',
    paginationMethod: 'page_param',
    supportedFields: ['name', 'phone', 'wilaya', 'sector', 'address'],
    enabled: true,
    wilayasSupported: 69,
  },
  {
    id: 'dir_maghreb_business',
    name: 'بوابة الأعمال والتوزيع المغاربية (Maghreb Emergent B2B)',
    domain: 'maghreb-b2b.dz',
    searchUrlPattern: 'https://maghreb-b2b.dz/directory?cat={category}&w={wilaya}',
    paginationMethod: 'offset',
    supportedFields: ['company', 'mobile', 'email', 'wilaya'],
    enabled: true,
    wilayasSupported: 69,
  }
];

export const INITIAL_SCHEDULED_JOBS: ScheduledJob[] = [
  {
    id: 'job_sched_01',
    name: 'إعادة إثراء مجمع الهواتف المعلقة (Weekly Phone Second-Pass)',
    schedule: 'weekly',
    jobType: 'phone_second_pass',
    status: 'active',
    lastRun: undefined,
    nextRun: new Date(Date.now() + 86400000 * 7).toISOString(),
    itemsProcessed: 0,
  },
  {
    id: 'job_sched_02',
    name: 'مسح المعلنين الجدد عبر مكتبة إعلانات ميتا (Daily Ads Sweep)',
    schedule: 'daily',
    jobType: 'advertiser_sweep',
    status: 'active',
    lastRun: undefined,
    nextRun: new Date(Date.now() + 86400000).toISOString(),
    itemsProcessed: 0,
  },
  {
    id: 'job_sched_03',
    name: 'إعادة التحقق من الأنشطة التجارية الشهرية (30-Day Revalidation)',
    schedule: 'monthly',
    jobType: 'inactive_revalidate',
    status: 'active',
    lastRun: undefined,
    nextRun: new Date(Date.now() + 86400000 * 30).toISOString(),
    itemsProcessed: 0,
  }
];

// Production CRM Data: Starts 100% clean and empty
export const INITIAL_PROSPECTS: Prospect[] = [];
export const INITIAL_EVIDENCE: SourceEvidence[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_CAMPAIGNS: Campaign[] = [];
export const INITIAL_CRM_CALLS: CRMCall[] = [];
export const INITIAL_CRM_FOLLOW_UPS: CRMFollowUp[] = [];
export const INITIAL_EXPEDITEURS: ExpediteurProfile[] = [];
