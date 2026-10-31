/**
 * DROVA Express Main Sidebar Navigation
 * Strict Role-Based View Access Control & System Navigation
 */
import React from 'react';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Users,
  ShieldAlert,
  PhoneOff,
  Share2,
  MapPin,
  Radio,
  BarChart3,
  Upload,
  Download,
  Settings,
  History,
  Truck,
  UserCheck,
  PhoneCall,
  CalendarCheck,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Headphones,
  CheckCircle2,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { storage } from '../../services/storage';
import { i18n } from '../../services/i18n';
import { UserRole } from '../../types';

export type NavView =
  | 'dashboard'
  | 'campaigns'
  | 'campaigns_new'
  | 'prospects'
  | 'review'
  | 'missing_phone'
  | 'graph'
  | 'my_calls'
  | 'follow_ups'
  | 'expediteurs'
  | 'expediteur_import'
  | 'commercial_queue'
  | 'commercial_workspace'
  | 'commercial_performance'
  | 'wilayas'
  | 'sources'
  | 'statistics'
  | 'import'
  | 'exports'
  | 'settings'
  | 'audit_log'
  | 'tests';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  reviewCount: number;
  runningCampaignsCount: number;
  missingPhoneCount?: number;
  overdueFollowUpsCount?: number;
  expediteursCount?: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  reviewCount,
  runningCampaignsCount,
  missingPhoneCount = 0,
  overdueFollowUpsCount = 0,
  expediteursCount = 0,
  onLogout,
}) => {
  const [session, setSession] = React.useState(() => storage.getUserSession());
  const [, setLangTick] = React.useState(0);

  React.useEffect(() => {
    const unsubStorage = storage.subscribe(() => {
      setSession(storage.getUserSession());
    });
    const unsubI18n = i18n.subscribe(() => {
      setLangTick(t => t + 1);
    });
    return () => {
      unsubStorage();
      unsubI18n();
    };
  }, []);

  // Section 1: Discovery & Pipeline (Admin / Marketing)
  const discoveryItems: {
    id: NavView;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: i18n.t('nav.dashboard') || 'لوحة القيادة', icon: <LayoutDashboard size={17} /> },
    {
      id: 'campaigns',
      label: i18n.t('nav.campaigns') || 'حملات التنقيب',
      icon: <Compass size={17} />,
      badge: runningCampaignsCount > 0 ? runningCampaignsCount : undefined,
      badgeColor: 'text-[#FF0000]',
    },
    { id: 'campaigns_new', label: i18n.t('campaigns.create_btn') || 'حملة استكشاف جديدة', icon: <PlusCircle size={17} /> },
    { id: 'prospects', label: i18n.t('nav.prospects') || 'قاعدة التجار المركزية', icon: <Users size={17} /> },
    {
      id: 'review',
      label: i18n.t('nav.review') || 'طابور المراجعة البشرية',
      icon: <ShieldAlert size={17} />,
      badge: reviewCount > 0 ? reviewCount : undefined,
      badgeColor: 'text-amber-400 font-bold',
    },
    {
      id: 'missing_phone',
      label: i18n.t('nav.missing_phone') || 'الأرقام المعلقة',
      icon: <PhoneOff size={17} />,
      badge: missingPhoneCount > 0 ? missingPhoneCount : undefined,
      badgeColor: 'text-amber-500 font-mono-data',
    },
  ];

  // Section 2: Expéditeur CRM & Sales Hub
  const crmItems: {
    id: NavView;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'commercial_workspace',
      label: i18n.t('workspace.commercial') || 'فضاء التجاري الميداني',
      icon: <Headphones size={17} className="text-[#FF0000]" />,
      badge: 'TOP 20',
      badgeColor: 'bg-red-950/60 text-[#FF0000] px-1.5 py-0.2 text-[9px] font-bold border border-red-900/40'
    },
    { id: 'my_calls', label: i18n.t('nav.calls') || 'سجل اتصالاتي', icon: <PhoneCall size={17} /> },
    {
      id: 'follow_ups',
      label: i18n.t('nav.followups') || 'المتابعات المجدولة',
      icon: <CalendarCheck size={17} />,
      badge: overdueFollowUpsCount > 0 ? `${overdueFollowUpsCount} متأخر` : undefined,
      badgeColor: 'text-rose-500 font-bold text-[10px]',
    },
    {
      id: 'commercial_queue',
      label: i18n.t('nav.commercial_queue') || 'طابور المتابعة التجارية',
      icon: <Truck size={17} />,
    },
    {
      id: 'expediteur_import',
      label: i18n.t('nav.expediteur_import') || 'استيراد الشاحنين (Excel)',
      icon: <FileSpreadsheet size={17} className="text-emerald-400" />,
      badge: 'XLSX',
      badgeColor: 'text-emerald-400 font-mono text-[9px]'
    },
    {
      id: 'expediteurs',
      label: i18n.t('nav.expediteurs') || 'الشاحنون المعتمدون (CRM)',
      icon: <Award size={17} />,
      badge: expediteursCount > 0 ? expediteursCount : undefined,
      badgeColor: 'text-emerald-400 font-mono-data',
    },
    {
      id: 'commercial_performance',
      label: i18n.t('nav.performance') || 'أداء الفريق وعائد القنوات ROI',
      icon: <TrendingUp size={17} />,
    },
  ];

  // Section 3: Data & Intelligence
  const dataItems: {
    id: NavView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'graph', label: i18n.t('nav.graph') || 'التقاطع الشبكي وتوحيد الكيان', icon: <Share2 size={17} /> },
    { id: 'wilayas', label: i18n.t('nav.wilayas') || 'تغطية الولايات الـ 58', icon: <MapPin size={17} /> },
    { id: 'sources', label: i18n.t('nav.sources') || 'محركات استكشاف المصادر', icon: <Radio size={17} /> },
    { id: 'statistics', label: i18n.t('nav.statistics') || 'التحليلات والمؤشرات', icon: <BarChart3 size={17} /> },
  ];

  // Section 4: Admin & Governance
  const adminItems: {
    id: NavView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'import', label: i18n.t('nav.import') || 'استيراد ودمج البيانات', icon: <Upload size={17} /> },
    { id: 'exports', label: i18n.t('nav.export') || 'مركز تصدير التقارير', icon: <Download size={17} /> },
    { id: 'audit_log', label: i18n.t('nav.audit') || 'سجل التدقيق والرقابة', icon: <History size={17} /> },
    { id: 'settings', label: i18n.t('nav.settings') || 'الإعدادات والنسخ الاحتياطي', icon: <Settings size={17} /> },
    { id: 'tests', label: i18n.t('nav.tests') || 'فحص المعايير (Tests)', icon: <CheckCircle2 size={17} className="text-emerald-400" /> },
  ];

  const role = session.role;
  const isCommercial = role === 'commercial';
  const isManager = role === 'commercial_manager';
  const isMarketing = role === 'admin_marketing';
  const isSuperAdmin = role === 'super_admin';

  const renderNavGroup = (title: string, items: typeof discoveryItems) => (
    <div className="space-y-0.5">
      <div className="px-3 pt-3 pb-1.5 text-[10px] font-bold text-[#545458] uppercase tracking-wider">
        {title}
      </div>
      {items.map(item => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#1C1C1C] text-white border-r-2 border-[#FF0000]'
                : 'text-[#8E8E93] hover:text-white hover:bg-[#141414]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`shrink-0 ${isActive ? 'text-[#FF0000]' : 'text-[#8E8E93]'}`}>
                {item.icon}
              </span>
              <span className="truncate text-[12px]">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span className={`text-[11px] shrink-0 mr-1.5 ${item.badgeColor || 'text-white'}`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 bg-[#0C0C0C] border-l border-[#262626] flex flex-col shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#FF0000] text-white flex items-center justify-center font-black tracking-wider text-sm font-latin shadow-lg shadow-red-950/40">
            D
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-latin font-extrabold text-white text-base tracking-tight">DROVA</span>
              <span className="text-xs font-latin text-[#FF0000] font-semibold tracking-wider">EXPRESS</span>
            </div>
            <p className="text-[10px] text-[#8E8E93] leading-none mt-0.5">
              {i18n.t('header.app_subtitle') || 'منصة استخبارات التجار و CRM'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links with Role-based filtering */}
      <nav className="flex-1 px-2 py-2 space-y-2 overflow-y-auto">
        {isCommercial ? (
          // Commercial representative only sees commercial actions & prospects assigned
          <>
            {renderNavGroup(
              'مهامي الميدانية (Sales Hub)',
              crmItems.filter(i => ['commercial_workspace', 'my_calls', 'follow_ups', 'commercial_queue'].includes(i.id))
            )}
            {renderNavGroup(
              'البيانات الميدانية',
              [
                { id: 'prospects', label: 'تجار الحقيبة المسندة', icon: <Users size={17} /> },
                { id: 'wilayas', label: 'دليل الولايات', icon: <MapPin size={17} /> },
              ]
            )}
          </>
        ) : isManager ? (
          // Commercial Manager sees CRM, Performance, Prospects, Expediteurs, Wilayas, Statistics
          <>
            {renderNavGroup('إدارة المبيعات والتفعيل (CRM)', crmItems)}
            {renderNavGroup('قاعدة البيانات', [
              { id: 'dashboard', label: 'لوحة القيادة', icon: <LayoutDashboard size={17} /> },
              { id: 'prospects', label: 'قاعدة التجار', icon: <Users size={17} /> },
              { id: 'wilayas', label: 'تغطية الولايات الـ 58', icon: <MapPin size={17} /> },
              { id: 'statistics', label: 'التحليلات والمؤشرات', icon: <BarChart3 size={17} /> },
              { id: 'exports', label: 'تصدير التقارير', icon: <Download size={17} /> },
            ])}
          </>
        ) : isMarketing ? (
          // Admin Marketing sees Discovery, Campaigns, Sources, Raw leads, Deduplication, Verification, Exports
          <>
            {renderNavGroup('التنقيب والمصادر (Discovery)', discoveryItems)}
            {renderNavGroup('الذكاء والتحليل الوطني', dataItems)}
            {renderNavGroup('التكامل والتصدير', [
              { id: 'import', label: 'استيراد البيانات', icon: <Upload size={17} /> },
              { id: 'exports', label: 'مركز تصدير التقارير', icon: <Download size={17} /> },
              { id: 'expediteur_import', label: 'استيراد الشاحنين', icon: <FileSpreadsheet size={17} /> },
            ])}
          </>
        ) : (
          // Super Admin / Management sees EVERYTHING
          <>
            {renderNavGroup(i18n.t('nav.prospects') || 'التنقيب والعمليات', discoveryItems)}
            {renderNavGroup(i18n.t('nav.crm') || 'إدارة المبيعات والتفعيل (CRM)', crmItems)}
            {renderNavGroup('البيانات والذكاء الوطني', dataItems)}
            {renderNavGroup(i18n.t('nav.settings') || 'الإدارة والتصدير', adminItems)}
          </>
        )}
      </nav>

      {/* Role Profile & Developed by Cherouik Imad */}
      <div className="p-3 border-t border-[#262626] bg-[#101010] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck size={14} className="text-[#FF0000] shrink-0" />
            <span className="font-medium text-white truncate text-[11px]" title={session.name}>
              {session.name}
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase text-[#8E8E93] bg-[#1C1C1C] px-1.5 py-0.5 shrink-0 border border-[#2E2E2E]">
            {session.role}
          </span>
        </div>

        {/* Developer Credit Footer */}
        <div className="pt-2 border-t border-[#1C1C1C] text-[10px] text-[#71717A] flex items-center justify-between">
          <span className="font-semibold text-[#8E8E93]">Developed by Cherouik Imad</span>
          <span className="font-mono text-[#52525B]">DROVA v2.0</span>
        </div>
      </div>
    </aside>
  );
};
