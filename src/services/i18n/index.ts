/**
 * DROVA Express Centralized i18n Translation Dictionary
 * Arabic (RTL, default), French (LTR), English (LTR)
 */
import { Language } from '../../types';

export const translations = {
  ar: {
    // App Brand
    'app.brand': 'DROVA EXPRESS',
    'app.tagline': 'منصة استخبارات التجار و CRM',
    'app.quality_badge': 'معايير الجودة والامتثال 100%',
    'app.quick_export': 'تصدير سريع (XLSX)',
    'app.new_campaign': 'حملة تنقيب جديدة',
    'app.internal_crm': 'نظام DROVA الداخلي',

    // Workspaces
    'workspace.admin_marketing': 'فضاء الإدارة والاستكشاف',
    'workspace.commercial': 'فضاء المبيعات والاتصالات',
    'workspace.switch_to_commercial': 'التبديل إلى فضاء التجاري',
    'workspace.switch_to_admin': 'التبديل إلى فضاء الإدارة والتنقيب',

    // Navigation sections
    'nav.section.discovery': 'التنقيب والعمليات',
    'nav.section.crm': 'إدارة المبيعات والتفعيل',
    'nav.section.commercial_workspace': 'فضاء التجاري الميداني',
    'nav.section.intelligence': 'البيانات والذكاء الوطني',
    'nav.section.management': 'الإدارة والتصدير',

    // Navigation items
    'nav.dashboard': 'لوحة القيادة والمؤشرات',
    'nav.campaigns': 'حملات التنقيب',
    'nav.new_campaign': 'حملة استكشاف جديدة',
    'nav.prospects': 'قاعدة التجار الوطنية',
    'nav.review_queue': 'طابور المراجعة البشرية',
    'nav.missing_phone': 'مجمع الأرقام المعلقة',
    'nav.my_calls': 'قائمة اتصالاتي اليومية',
    'nav.follow_ups': 'متابعات اليوم والاتصالات',
    'nav.expediteurs': 'الشاحنون المعتمدون (Expéditeurs)',
    'nav.expediteur_import': 'استيراد الشاحنين (Excel)',
    'nav.commercial_queue': 'جاهز للمتابعة (Commercial)',
    'nav.commercial_performance': 'أداء الفريق وعائد القنوات ROI',
    'nav.graph': 'التقاطع الشبكي وتوحيد الكيان',
    'nav.wilayas': 'تغطية الولايات الـ 69',
    'nav.sources': 'محركات المصادر العامة',
    'nav.statistics': 'الإحصائيات والتحليلات',
    'nav.import': 'استيراد ودمج البيانات',
    'nav.exports': 'مركز تصدير التقارير',
    'nav.audit_log': 'سجل العمليات والرقابة',
    'nav.settings': 'إعدادات النظام والأوزان',
    'nav.tests': 'فحص المعايير (Tests)',

    // Commercial workspace tabs
    'commercial.home': 'الرئيسية (Accueil)',
    'commercial.my_prospects': 'تجارِي المعينون (Mes Prospects)',
    'commercial.my_expediteurs': 'شاحنِي المعتمدون (Mes Expéditeurs)',
    'commercial.ready_queue': 'جاهز للمتابعة (À Relancer)',
    'commercial.calls': 'سجل الاتصالات (Appels)',
    'commercial.followups': 'المتابعات والمهام (Suivis)',
    'commercial.profile': 'الملف الشخصي (Profil)',
    'commercial.start_calls': 'بدء جولة المكالمات الآن',
    'commercial.today_calls_due': 'مكالمات اليوم المستحقة',
    'commercial.today_followups': 'متابعات اليوم',
    'commercial.awaiting_reply': 'في انتظار الرد',
    'commercial.interested': 'تجار مهتمون',
    'commercial.active_expediteurs': 'شاحنون نشطون',
    'commercial.needs_reactivation': 'يحتاج إعادة تفعيل',
    'commercial.call_action': 'اتصال هاتف',
    'commercial.whatsapp_action': 'واتساب',
    'commercial.save_result': 'تسجيل نتيجة الاتصال',
    'commercial.report_info': 'الإبلاغ عن معلومة جديدة',

    // Dashboard
    'dashboard.title': 'لوحة القيادة والمؤشرات العامة',
    'dashboard.subtitle': 'نظرة شمولية على قاعدة التجار المؤهلين والشاحنين المعتمدين عبر 69 ولاية',
    'dashboard.total_discovered': 'إجمالي التجار المستكشفين',
    'dashboard.unique_merchants': 'كيانات تجارية موحدة',
    'dashboard.verified': 'تجار موثقون رسمياً',
    'dashboard.with_phone': 'بهاتف جزائري موثق',
    'dashboard.with_whatsapp': 'تواصل واتساب نشط',
    'dashboard.active_ecommerce': 'متاجر شحن طرود نشطة',
    'dashboard.expediteurs_section': 'الشاحنون المعتمدون (DROVA Expéditeurs)',
    'dashboard.total_expediteurs': 'إجمالي الشاحنين',
    'dashboard.active_expediteurs_count': 'شاحنون نشطون حالياً',
    'dashboard.inactive_expediteurs': 'شاحنون متوقفون',
    'dashboard.needs_reactivation_count': 'بحاجة لإعادة تنشيط',
    'dashboard.ready_for_followup': 'جاهز للمتابعة التجارية',
    'dashboard.assigned_expediteurs': 'مسندون لممثل تجاري',
    'dashboard.unassigned_expediteurs': 'غير مسندين (طابور عام)',

    // Common labels
    'common.search': 'بحث سريع...',
    'common.filter': 'تصفية',
    'common.wilaya': 'الولاية',
    'common.commune': 'البلدية',
    'common.all_wilayas': 'كافة الولايات',
    'common.all_commercials': 'كافة الممثلين التجاريين',
    'common.commercial': 'الممثل التجاري',
    'common.phone': 'الهاتف',
    'common.whatsapp': 'الواتساب',
    'common.status': 'الحالة',
    'common.score': 'التقييم',
    'common.actions': 'الإجراءات',
    'common.date': 'التاريخ',
    'common.save': 'حفظ التغييرات',
    'common.cancel': 'إلغاء',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    'common.loading': 'جاري التحميل...',
    'common.no_data': 'لا توجد بيانات متوفرة حالياً',
    'common.unassigned': 'غير مسند',
    'common.language': 'اللغة',

    // Roles
    'role.super_admin': 'مدير عام المنصة (Super Admin)',
    'role.admin': 'مسؤول التسويق والاستكشاف (Admin)',
    'role.commercial_manager': 'مدير المبيعات (Commercial Manager)',
    'role.commercial': 'ممثل تجاري (Commercial)',
    'role.viewer': 'مشاهد فقط (Viewer)',
  },

  fr: {
    // App Brand
    'app.brand': 'DROVA EXPRESS',
    'app.tagline': 'Plateforme d\'Intelligence Marchande & CRM',
    'app.quality_badge': 'Conformité & Qualité 100%',
    'app.quick_export': 'Export Rapide (XLSX)',
    'app.new_campaign': 'Nouvelle Campagne',
    'app.internal_crm': 'Système Interne DROVA',

    // Workspaces
    'workspace.admin_marketing': 'Espace Admin & Découverte',
    'workspace.commercial': 'Espace Commercial & Appels',
    'workspace.switch_to_commercial': 'Basculer vers l\'Espace Commercial',
    'workspace.switch_to_admin': 'Basculer vers l\'Espace Admin',

    // Navigation sections
    'nav.section.discovery': 'PROSPECTION & OPÉRATIONS',
    'nav.section.crm': 'GESTION COMMERCIALE & CRM',
    'nav.section.commercial_workspace': 'ESPACE COMMERCIAL',
    'nav.section.intelligence': 'DONNÉES & INTELLIGENCE',
    'nav.section.management': 'ADMINISTRATION & EXPORT',

    // Navigation items
    'nav.dashboard': 'Tableau de Bord',
    'nav.campaigns': 'Campagnes de Prospection',
    'nav.new_campaign': 'Nouvelle Campagne',
    'nav.prospects': 'Base Nationale Marchands',
    'nav.review_queue': 'File de Révision Humaine',
    'nav.missing_phone': 'Piscine Numéros en Attente',
    'nav.my_calls': 'Ma Liste d\'Appels du Jour',
    'nav.follow_ups': 'Relances & Suivis du Jour',
    'nav.expediteurs': 'Expéditeurs Agréés (CRM)',
    'nav.expediteur_import': 'Import Expéditeurs (Excel)',
    'nav.commercial_queue': 'Prêt pour Relance (Queue)',
    'nav.commercial_performance': 'Performance Équipe & ROI',
    'nav.graph': 'Graphe des Entités Réseau',
    'nav.wilayas': 'Couverture des 69 Wilayas',
    'nav.sources': 'Moteurs de Sources Publiques',
    'nav.statistics': 'Statistiques & Analyses',
    'nav.import': 'Import & Fusion Données',
    'nav.exports': 'Centre d\'Export Rapports',
    'nav.audit_log': 'Journal d\'Audit & Contrôle',
    'nav.settings': 'Paramètres & Règles Système',
    'nav.tests': 'Tests de Conformité (Tests)',

    // Commercial workspace tabs
    'commercial.home': 'Accueil',
    'commercial.my_prospects': 'Mes Prospects',
    'commercial.my_expediteurs': 'Mes Expéditeurs',
    'commercial.ready_queue': 'À Relancer',
    'commercial.calls': 'Historique d\'Appels',
    'commercial.followups': 'Suivis & Tâches',
    'commercial.profile': 'Mon Profil',
    'commercial.start_calls': 'COMMENCER LES APPELS',
    'commercial.today_calls_due': 'À appeler aujourd\'hui',
    'commercial.today_followups': 'Relances aujourd\'hui',
    'commercial.awaiting_reply': 'En attente de réponse',
    'commercial.interested': 'Prospects intéressés',
    'commercial.active_expediteurs': 'Expéditeurs actifs',
    'commercial.needs_reactivation': 'Expéditeurs à relancer',
    'commercial.call_action': 'Appeler',
    'commercial.whatsapp_action': 'WhatsApp',
    'commercial.save_result': 'Enregistrer le résultat',
    'commercial.report_info': 'Signaler une information',

    // Dashboard
    'dashboard.title': 'Tableau de Bord Exécutif',
    'dashboard.subtitle': 'Vue d\'ensemble des marchands qualifiés et des expéditeurs actifs sur 69 Wilayas',
    'dashboard.total_discovered': 'Total Marchands Découverts',
    'dashboard.unique_merchants': 'Entités Unifiées',
    'dashboard.verified': 'Marchands Vérifiés',
    'dashboard.with_phone': 'Avec Téléphone Valide',
    'dashboard.with_whatsapp': 'WhatsApp Actif',
    'dashboard.active_ecommerce': 'E-commerçants Expéditeurs',
    'dashboard.expediteurs_section': 'Expéditeurs DROVA Express',
    'dashboard.total_expediteurs': 'Total Expéditeurs',
    'dashboard.active_expediteurs_count': 'Expéditeurs Actifs',
    'dashboard.inactive_expediteurs': 'Inactifs',
    'dashboard.needs_reactivation_count': 'À Réactiver',
    'dashboard.ready_for_followup': 'Prêts pour Relance',
    'dashboard.assigned_expediteurs': 'Assignés',
    'dashboard.unassigned_expediteurs': 'Non Assignés',

    // Common labels
    'common.search': 'Recherche rapide...',
    'common.filter': 'Filtrer',
    'common.wilaya': 'Wilaya',
    'common.commune': 'Commune',
    'common.all_wilayas': 'Toutes les Wilayas',
    'common.all_commercials': 'Tous les Commerciaux',
    'common.commercial': 'Commercial',
    'common.phone': 'Téléphone',
    'common.whatsapp': 'WhatsApp',
    'common.status': 'Statut',
    'common.score': 'Score',
    'common.actions': 'Actions',
    'common.date': 'Date',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.loading': 'Chargement...',
    'common.no_data': 'Aucune donnée disponible',
    'common.unassigned': 'Non assigné',
    'common.language': 'Langue',

    // Roles
    'role.super_admin': 'Super Administrateur',
    'role.admin': 'Administrateur / Marketing',
    'role.commercial_manager': 'Manager Commercial',
    'role.commercial': 'Délégué Commercial',
    'role.viewer': 'Lecteur Seul',
  },

  en: {
    // App Brand
    'app.brand': 'DROVA EXPRESS',
    'app.tagline': 'Merchant Prospect Intelligence & CRM',
    'app.quality_badge': '100% Quality & Compliance Standards',
    'app.quick_export': 'Quick Export (XLSX)',
    'app.new_campaign': 'New Campaign',
    'app.internal_crm': 'DROVA Internal CRM',

    // Workspaces
    'workspace.admin_marketing': 'Admin & Discovery Workspace',
    'workspace.commercial': 'Commercial & Calling Workspace',
    'workspace.switch_to_commercial': 'Switch to Commercial Workspace',
    'workspace.switch_to_admin': 'Switch to Admin & Marketing',

    // Navigation sections
    'nav.section.discovery': 'DISCOVERY & PIPELINE',
    'nav.section.crm': 'COMMERCIAL & EXPÉDITEUR CRM',
    'nav.section.commercial_workspace': 'COMMERCIAL WORKSPACE',
    'nav.section.intelligence': 'DATA & NATIONAL INTELLIGENCE',
    'nav.section.management': 'GOVERNANCE & EXPORTS',

    // Navigation items
    'nav.dashboard': 'Dashboard & Overview',
    'nav.campaigns': 'Discovery Campaigns',
    'nav.new_campaign': 'New Campaign',
    'nav.prospects': 'National Merchant Database',
    'nav.review_queue': 'Human Review Queue',
    'nav.missing_phone': 'Missing Phone Pool',
    'nav.my_calls': 'My Call List Today',
    'nav.follow_ups': 'Today\'s Follow-ups & Reminders',
    'nav.expediteurs': 'Approved Expéditeurs (CRM)',
    'nav.expediteur_import': 'Expéditeur Excel Import',
    'nav.commercial_queue': 'Ready for Follow-up Queue',
    'nav.commercial_performance': 'Commercial Team Performance & ROI',
    'nav.graph': 'Entity Cross-Graph Resolution',
    'nav.wilayas': '69 Wilayas Coverage',
    'nav.sources': 'Public Source Connectors',
    'nav.statistics': 'Analytics & Reporting',
    'nav.import': 'Excel Database Import',
    'nav.exports': 'Export Reports Hub',
    'nav.audit_log': 'Audit Trail & Operations',
    'nav.settings': 'System Settings & Compliance',
    'nav.tests': 'Standard Tests Runner',

    // Commercial workspace tabs
    'commercial.home': 'Home',
    'commercial.my_prospects': 'My Assigned Prospects',
    'commercial.my_expediteurs': 'My Assigned Expéditeurs',
    'commercial.ready_queue': 'Ready for Follow-up',
    'commercial.calls': 'Calls History',
    'commercial.followups': 'Follow-ups & Tasks',
    'commercial.profile': 'My Profile',
    'commercial.start_calls': 'START CALLING QUEUE',
    'commercial.today_calls_due': 'Calls Due Today',
    'commercial.today_followups': 'Follow-ups Today',
    'commercial.awaiting_reply': 'Awaiting Response',
    'commercial.interested': 'Interested Prospects',
    'commercial.active_expediteurs': 'Active Expéditeurs',
    'commercial.needs_reactivation': 'Expéditeurs to Reactivate',
    'commercial.call_action': 'Call Now',
    'commercial.whatsapp_action': 'WhatsApp',
    'commercial.save_result': 'Record Call Result',
    'commercial.report_info': 'Report Information',

    // Dashboard
    'dashboard.title': 'Executive Dashboard',
    'dashboard.subtitle': 'National overview of parcel-shipping merchants and confirmed Expéditeurs across Algeria',
    'dashboard.total_discovered': 'Total Discovered Merchants',
    'dashboard.unique_merchants': 'Unified Entities',
    'dashboard.verified': 'Verified Merchants',
    'dashboard.with_phone': 'Verified Algerian Phone',
    'dashboard.with_whatsapp': 'Active WhatsApp Channel',
    'dashboard.active_ecommerce': 'Active Shipping E-merchants',
    'dashboard.expediteurs_section': 'DROVA Express Expéditeurs',
    'dashboard.total_expediteurs': 'Total Expéditeurs',
    'dashboard.active_expediteurs_count': 'Active Shippers',
    'dashboard.inactive_expediteurs': 'Inactive Shippers',
    'dashboard.needs_reactivation_count': 'Needs Reactivation',
    'dashboard.ready_for_followup': 'Ready for Follow-up',
    'dashboard.assigned_expediteurs': 'Assigned',
    'dashboard.unassigned_expediteurs': 'Unassigned',

    // Common labels
    'common.search': 'Quick search...',
    'common.filter': 'Filter',
    'common.wilaya': 'Wilaya',
    'common.commune': 'Commune',
    'common.all_wilayas': 'All Wilayas',
    'common.all_commercials': 'All Commercials',
    'common.commercial': 'Commercial Rep',
    'common.phone': 'Phone',
    'common.whatsapp': 'WhatsApp',
    'common.status': 'Status',
    'common.score': 'Score',
    'common.actions': 'Actions',
    'common.date': 'Date',
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.loading': 'Loading...',
    'common.no_data': 'No data available',
    'common.unassigned': 'Unassigned',
    'common.language': 'Language',

    // Roles
    'role.super_admin': 'Super Administrator',
    'role.admin': 'Admin / Marketing Director',
    'role.commercial_manager': 'Commercial Sales Manager',
    'role.commercial': 'Commercial Representative',
    'role.viewer': 'Read-Only Viewer',
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

class I18nManager {
  private currentLanguage: Language = 'ar';
  private listeners: Set<(lang: Language, dir: 'rtl' | 'ltr') => void> = new Set();

  constructor() {
    try {
      const saved = localStorage.getItem('drova_app_language');
      if (saved === 'ar' || saved === 'fr' || saved === 'en') {
        this.currentLanguage = saved;
      }
    } catch {
      this.currentLanguage = 'ar';
    }
    this.applyDirection();
  }

  public getLanguage(): Language {
    return this.currentLanguage;
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public setLanguage(lang: Language) {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    try {
      localStorage.setItem('drova_app_language', lang);
    } catch {}
    this.applyDirection();
    this.listeners.forEach(fn => fn(lang, this.getDirection()));
  }

  public isRTL(): boolean {
    return this.currentLanguage === 'ar';
  }

  public getDirection(): 'rtl' | 'ltr' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  private applyDirection() {
    const dir = this.getDirection();
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', this.currentLanguage);
  }

  public t(key: TranslationKey | string, fallback?: string): string {
    const allDicts = translations as Record<string, Record<string, string>>;
    const dict = allDicts[this.currentLanguage];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to Arabic dictionary if key exists there
    const arDict = allDicts.ar;
    if (arDict && arDict[key]) {
      return arDict[key];
    }
    return fallback || key;
  }

  public subscribe(listener: (lang: Language, dir: 'rtl' | 'ltr') => void): () => void {
    this.listeners.add(listener as any);
    return () => this.listeners.delete(listener as any);
  }
}

export const i18n = new I18nManager();
