/**
 * DROVA Express Algeria — Merchant Prospect Intelligence Platform
 * Main Application Orchestrator
 */
import React, { useState, useEffect } from 'react';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { storage } from './services/storage';
import { i18n } from './services/i18n';
import { Prospect, Campaign } from './types';
import { DashboardView } from './views/DashboardView';
import { CampaignsListView } from './views/CampaignsListView';
import { NewCampaignView } from './views/NewCampaignView';
import { CampaignDetailView } from './views/CampaignDetailView';
import { ProspectsView } from './views/ProspectsView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { WilayasView } from './views/WilayasView';
import { SourcesView } from './views/SourcesView';
import { StatisticsView } from './views/StatisticsView';
import { ImportView } from './views/ImportView';
import { ExportsView } from './views/ExportsView';
import { SettingsView } from './views/SettingsView';
import { AuditLogView } from './views/AuditLogView';
import { TestsRunnerView } from './views/TestsRunnerView';
import { MissingPhonePoolView } from './views/MissingPhonePoolView';
import { DiscoveryGraphView } from './views/DiscoveryGraphView';
import { ExpediteursView } from './views/ExpediteursView';
import { FollowUpsView } from './views/FollowUpsView';
import { MyCallListView } from './views/MyCallListView';
import { CommercialPerformanceView } from './views/CommercialPerformanceView';
import { ExpediteurImportWizard } from './views/ExpediteurImportWizard';
import { CommercialExpediteurWorkspace } from './views/CommercialExpediteurWorkspace';
import { CommercialSimpleWorkspace } from './views/CommercialSimpleWorkspace';
import { ProspectDetailModal } from './components/prospects/ProspectDetailModal';
import { exportToExcel } from './services/excel';
import { LoginView } from './views/LoginView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => storage.isAuthenticated());
  const [currentView, setCurrentView] = useState<NavView>(() => {
    const session = storage.getUserSession();
    return session.role === 'commercial' ? 'commercial_workspace' : 'dashboard';
  });
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // i18n State
  const [currentLang, setCurrentLang] = useState(() => i18n.getCurrentLanguage());
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(() => i18n.getDirection());

  // Live synced state from storage
  const [prospects, setProspects] = useState<Prospect[]>(() => storage.getProspects());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => storage.getCampaigns());
  const [reviewCount, setReviewCount] = useState<number>(() => storage.getNeedsReviewItems().length);
  const [missingPhoneCount, setMissingPhoneCount] = useState<number>(() => storage.getMissingPhonePool().length);
  const [overdueFollowUpsCount, setOverdueFollowUpsCount] = useState<number>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return storage.getAllFollowUps().filter(f => f.status !== 'completed' && f.status !== 'cancelled' && f.scheduled_date <= todayStr).length;
  });
  const [expediteursCount, setExpediteursCount] = useState<number>(() => {
    return storage.getExpediteurs().filter(e => e.status === 'مفعل' || e.status === 'نشط' || e.lifecycle_status === 'نشط' || e.lifecycle_status === 'مفعل').length;
  });

  useEffect(() => {
    const unsubStorage = storage.subscribe(() => {
      setIsAuthenticated(storage.isAuthenticated());
      setProspects(storage.getProspects());
      setCampaigns(storage.getCampaigns());
      setReviewCount(storage.getNeedsReviewItems().length);
      setMissingPhoneCount(storage.getMissingPhonePool().length);
      
      const todayStr = new Date().toISOString().split('T')[0];
      setOverdueFollowUpsCount(
        storage.getAllFollowUps().filter(f => f.status !== 'completed' && f.status !== 'cancelled' && f.scheduled_date <= todayStr).length
      );
      setExpediteursCount(
        storage.getExpediteurs().filter(e => e.status === 'مفعل' || e.status === 'نشط' || e.lifecycle_status === 'نشط' || e.lifecycle_status === 'مفعل').length
      );

      // If a prospect modal is open, keep its state synced
      if (selectedProspect) {
        const fresh = storage.getProspectById(selectedProspect.id);
        if (fresh) setSelectedProspect(fresh);
      }
    });

    const unsubI18n = i18n.subscribe((lang, dir) => {
      setCurrentLang(lang);
      setDirection(dir);
    });

    return () => {
      unsubStorage();
      unsubI18n();
    };
  }, [selectedProspect]);

  const handleLoginSuccess = (role: string) => {
    setIsAuthenticated(true);
    if (role === 'commercial') {
      setCurrentView('commercial_workspace');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleNavigate = (view: NavView, params?: Record<string, any>) => {
    const session = storage.getUserSession();
    // Protect commercial from opening unassigned admin sections
    if (session.role === 'commercial') {
      const allowedViews: NavView[] = ['commercial_workspace', 'my_calls', 'follow_ups', 'commercial_queue', 'prospects', 'wilayas'];
      if (!allowedViews.includes(view)) {
        setCurrentView('commercial_workspace');
        return;
      }
    }

    if (params?.id) {
      setActiveCampaignId(params.id);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCampaignCreated = (campaignId: string) => {
    setActiveCampaignId(campaignId);
    setCurrentView('campaigns');
  };

  const handleQuickExport = () => {
    exportToExcel(prospects, 'DROVA_ALL_PROSPECTS_2026.xlsx');
  };

  const runningCampaignsCount = campaigns.filter(c => c.status === 'Running').length;

  // Header Title & Subtitle Resolver
  const getHeaderInfo = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'لوحة القيادة والمؤشرات العامة', subtitle: 'نظرة شمولية على قاعدة التجار المؤهلين للشحن والطرود عبر الولايات' };
      case 'campaigns':
        return activeCampaignId
          ? { title: 'متابعة مسار الحملة التنقيبية', subtitle: 'مراقبة خط أنابيب الاستكشاف، التوثيق، وكشف التكرارات لحظياً' }
          : { title: 'حملات التنقيب الميدانية', subtitle: 'إدارة وتتبع مسوحات التجار في الولايات الـ 58' };
      case 'campaigns_new':
        return { title: 'إطلاق حملة استكشاف جديدة', subtitle: 'تحديد الولاية، المصادر المتصلة، وفئات السلع المؤهلة للشحن' };
      case 'prospects':
        return { title: 'قاعدة التجار المركزية', subtitle: 'سجل التجار المكتشفين والمؤهلين مع كافة الأدلة وحالات المبيعات' };
      case 'review':
        return { title: 'طابور المراجعة البشرية', subtitle: 'تأكيد الحالات الملتبسة وتثبيت المقر الفعلي دون اعتماد اعتباطي' };
      case 'missing_phone':
        return { title: 'مجمع الأرقام المعلقة والإثراء الثانوي', subtitle: 'حفظ كافة التجار المستكشفين بدون هاتف وإعادة معالجتهم عبر الزحف العكسي والتقاطع الشبكي' };
      case 'graph':
        return { title: 'مخطط التقاطع الشبكي وتوحيد الكيانات', subtitle: 'تمثيل بصري لربط حسابات فيسبوك، واد كنيس، خرائط جوجل والمواقع بكيان تجاري واحد' };
      case 'my_calls':
        return { title: 'قائمة اتصالاتي اليومية (My Call List)', subtitle: 'قائمة المكالمات المستعجلة والمتابعات المجدولة لليوم وفق أولوية الاتصال الذكية' };
      case 'follow_ups':
        return { title: 'متابعات اليوم والاتصالات المجدولة', subtitle: 'مراقبة وإنجاز مواعيد إعادة الاتصال مع التجار والمشرفين التجاريين' };
      case 'expediteurs':
        return { title: 'إدارة الشاحنين المعتمدين (Expéditeurs CRM)', subtitle: 'متابعة مسار التفعيل، لوحة كانبان التجارية، وتوثيق الشاحنين الفعليين لـ DROVA' };
      case 'commercial_performance':
        return { title: 'أداء الفريق وعائد القنوات ROI', subtitle: 'تحليل إنتاجية الممثلين التجاريين ومعدل تحويل كل مصدر إلى شاحن مؤكد' };
      case 'expediteur_import':
        return {
          title: i18n.t('nav.expediteur_import') || 'استيراد الشاحنين (Expéditeurs Excel)',
          subtitle: 'معالج استيراد بيانات الشاحنين الفعليين، فحص التكرارات، وعدم المساس بسجل الاتصالات السابقة'
        };
      case 'commercial_queue':
        return {
          title: i18n.t('nav.commercial_queue') || 'طابور المتابعة التجارية (Expéditeurs)',
          subtitle: 'إدارة الشاحنين الجاهزين للمتابعة، إعادة التفعيل، والمكالمات الدورية'
        };
      case 'commercial_workspace':
        return {
          title: i18n.t('workspace.commercial') || 'فضاء المبيعات والتجاري الميداني',
          subtitle: 'الواجهة الميدانية المبسطة للاتصال السريع، تسجيل المتابعات، والإبلاغ للمسؤول'
        };
      case 'wilayas':
        return { title: 'تغطية الولايات الـ 58', subtitle: 'خريطة وكثافة التجار في كل ولاية وبدء التنقيب السريع' };
      case 'sources':
        return { title: 'محركات استكشاف المصادر العامة', subtitle: 'مراقبة اتصال موصلات جوجل، ميتا، والشبكات العامة المفتوحة' };
      case 'statistics':
        return { title: 'التحليلات ومؤشرات الأداء', subtitle: 'إحصائيات متقدمة لحصص شركات التوصيل وأولويات التجار' };
      case 'import':
        return { title: 'استيراد ودمج البيانات', subtitle: 'استيراد ملفات الإكسيل السابقة مع توحيد الأرقام ومنع التكرار' };
      case 'exports':
        return { title: 'مركز تصدير التقارير', subtitle: 'استخراج جداول إكسيل معتمدة ومطابقة لنموذج مبيعات DROVA' };
      case 'settings':
        return { title: 'إعدادات النظام والامتثال', subtitle: 'تعديل أوزان الخوارزمية وضوابط التحقق الإلزامية' };
      case 'audit_log':
        return { title: 'سجل التدقيق والرقابة', subtitle: 'تتبع كافة التعديلات، الدمج، والقرارات الإدارية للمستخدمين' };
      case 'tests':
        return { title: 'الفحص الآلي للمعايير', subtitle: 'تنفيذ اختبارات الجودة وحالات تطبيع الأرقام الجزائري' };
      default:
        return { title: 'DROVA Express', subtitle: 'منصة استخبارات التجار' };
    }
  };

  const headerInfo = getHeaderInfo();

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#0C0C0C] text-[#EDEDED] overflow-hidden select-none" dir={direction} lang={currentLang}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        reviewCount={reviewCount}
        runningCampaignsCount={runningCampaignsCount}
        missingPhoneCount={missingPhoneCount}
        overdueFollowUpsCount={overdueFollowUpsCount}
        expediteursCount={expediteursCount}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0C0C0C]">
        {/* Top Header */}
        <Header
          currentView={currentView === 'tests' ? 'settings' : currentView}
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onNavigate={handleNavigate}
          onQuickExport={handleQuickExport}
          onLogout={handleLogout}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0C0C0C]">
          {currentView === 'dashboard' && (
            <DashboardView
              prospects={prospects}
              campaigns={campaigns}
              onNavigate={handleNavigate}
              onSelectProspect={setSelectedProspect}
            />
          )}

          {currentView === 'campaigns' && (
            activeCampaignId ? (
              <CampaignDetailView
                campaignId={activeCampaignId}
                onNavigate={handleNavigate}
                onSelectProspect={setSelectedProspect}
              />
            ) : (
              <CampaignsListView
                campaigns={campaigns}
                onNavigate={handleNavigate}
              />
            )
          )}

          {currentView === 'campaigns_new' && (
            <NewCampaignView
              onNavigate={handleNavigate}
              onCampaignCreated={handleCampaignCreated}
            />
          )}

          {currentView === 'prospects' && (
            <ProspectsView
              prospects={prospects}
              onSelectProspect={setSelectedProspect}
              onRefresh={() => setProspects(storage.getProspects())}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'review' && (
            <ReviewQueueView
              onSelectProspect={setSelectedProspect}
              onRefresh={() => {
                setProspects(storage.getProspects());
                setReviewCount(storage.getNeedsReviewItems().length);
              }}
            />
          )}

          {currentView === 'missing_phone' && (
            <MissingPhonePoolView
              onNavigate={handleNavigate}
              onRefresh={() => {
                setProspects(storage.getProspects());
                setReviewCount(storage.getNeedsReviewItems().length);
                setMissingPhoneCount(storage.getMissingPhonePool().length);
              }}
            />
          )}

          {currentView === 'graph' && (
            <DiscoveryGraphView
              onSelectProspect={setSelectedProspect}
            />
          )}

          {currentView === 'my_calls' && (
            <MyCallListView
              onSelectProspect={setSelectedProspect}
              onRefresh={() => setProspects(storage.getProspects())}
            />
          )}

          {currentView === 'follow_ups' && (
            <FollowUpsView
              onSelectProspect={setSelectedProspect}
              onRefresh={() => setProspects(storage.getProspects())}
            />
          )}

          {currentView === 'expediteurs' && (
            <ExpediteursView
              prospects={prospects}
              onSelectProspect={setSelectedProspect}
              onRefresh={() => setProspects(storage.getProspects())}
            />
          )}

          {currentView === 'commercial_performance' && (
            <CommercialPerformanceView />
          )}

          {currentView === 'commercial_workspace' && (
            <CommercialSimpleWorkspace
              onRefresh={() => {
                setProspects(storage.getProspects());
                setExpediteursCount(
                  storage.getExpediteurs().filter(e => e.status === 'مفعل' || e.status === 'نشط' || e.lifecycle_status === 'نشط' || e.lifecycle_status === 'مفعل').length
                );
              }}
            />
          )}

          {currentView === 'commercial_queue' && (
            <CommercialExpediteurWorkspace
              onNavigate={handleNavigate}
              onRefresh={() => {
                setProspects(storage.getProspects());
                setExpediteursCount(
                  storage.getExpediteurs().filter(e => e.status === 'مفعل' || e.status === 'نشط' || e.lifecycle_status === 'نشط' || e.lifecycle_status === 'مفعل').length
                );
              }}
            />
          )}

          {currentView === 'expediteur_import' && (
            <ExpediteurImportWizard
              onNavigate={handleNavigate}
              onImportComplete={() => {
                setProspects(storage.getProspects());
                setExpediteursCount(
                  storage.getExpediteurs().filter(e => e.status === 'مفعل' || e.status === 'نشط' || e.lifecycle_status === 'نشط' || e.lifecycle_status === 'مفعل').length
                );
                handleNavigate('commercial_queue');
              }}
            />
          )}

          {currentView === 'wilayas' && (
            <WilayasView
              prospects={prospects}
              onNavigate={handleNavigate}
              onFilterByWilaya={w => {
                setCurrentView('prospects');
              }}
            />
          )}

          {currentView === 'sources' && <SourcesView />}

          {currentView === 'statistics' && (
            <StatisticsView
              prospects={prospects}
              campaigns={campaigns}
            />
          )}

          {currentView === 'import' && (
            <ImportView
              onNavigate={handleNavigate}
              onImportComplete={() => {
                setProspects(storage.getProspects());
                setReviewCount(storage.getNeedsReviewItems().length);
              }}
            />
          )}

          {currentView === 'exports' && (
            <ExportsView
              prospects={prospects}
              campaigns={campaigns}
            />
          )}

          {currentView === 'settings' && <SettingsView />}

          {currentView === 'audit_log' && <AuditLogView />}

          {currentView === 'tests' && <TestsRunnerView />}
        </main>
      </div>

      {/* Merchant Dossier Modal */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onUpdate={() => {
            setProspects(storage.getProspects());
            setReviewCount(storage.getNeedsReviewItems().length);
          }}
        />
      )}
    </div>
  );
}
