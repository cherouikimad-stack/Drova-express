/**
 * DROVA Admin Settings, User Management & Compliance Configuration
 * Sections: About (Developed by Cherouik Imad), User Accounts (Salted PBKDF2), Backup & Recovery, Scoring & Directory Adapters
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  ShieldCheck,
  Sliders,
  RotateCcw,
  Save,
  Check,
  Radio,
  UserCheck,
  Globe,
  FolderPlus,
  Clock,
  Play,
  RefreshCw,
  Edit3,
  Users,
  Plus,
  Phone,
  Lock,
  Building2,
  AlertTriangle,
  Download,
  Upload,
  HardDrive,
  FileCheck,
  KeyRound,
  Trash2,
  CheckCircle2,
  Sparkles,
  Info,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Activity
} from 'lucide-react';
import { storage, AdminSettings } from '../services/storage';
import { i18n } from '../services/i18n';
import { sourceRegistry } from '../services/connectors';
import {
  GenericDirectoryConfig,
  ScheduledJob,
  CommercialAccount,
  Language,
  UserRole,
  UserAccount,
  DatabaseBackup
} from '../types';

export const SettingsView: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'users' | 'discovery_api' | 'backup' | 'general' | 'directories'>(
    (initialTab as any) || 'about'
  );

  const [settings, setSettings] = useState<AdminSettings>(() => storage.getSettings());
  const [saved, setSaved] = useState(false);
  const [session, setSession] = useState(() => storage.getUserSession());
  const [currentLang, setCurrentLang] = useState<Language>(() => i18n.getCurrentLanguage());

  // Discovery API Keys State (Manual Configuration)
  const [googleKeyInput, setGoogleKeyInput] = useState('');
  const [metaTokenInput, setMetaTokenInput] = useState('');
  const [customRefererInput, setCustomRefererInput] = useState('');
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState<string | null>(null);
  const [apiSaveError, setApiSaveError] = useState<string | null>(null);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<{
    google?: { success: boolean; status: number; message: string; isReferrerBlocked?: boolean };
    meta?: { success: boolean; status: number; message: string; isRestricted?: boolean };
  } | null>(null);
  const [serverApiStatus, setServerApiStatus] = useState<{
    googlePlaces?: { configured: boolean; maskedKey: string; customReferer: string; status: string };
    metaAds?: { configured: boolean; maskedToken: string; status: string };
  } | null>(null);

  const fetchDiscoveryStatus = async () => {
    try {
      const res = await fetch('/api/discovery/status');
      if (res.ok) {
        const data = await res.json();
        setServerApiStatus(data);
        if (data.googlePlaces?.customReferer) {
          setCustomRefererInput(data.googlePlaces.customReferer);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchDiscoveryStatus();
  }, []);

  const handleSaveApiKeys = async () => {
    setApiTesting(true);
    setApiSaveStatus(null);
    setApiSaveError(null);
    setApiTestResults(null);
    try {
      const saveRes = await fetch('/api/discovery/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googlePlacesApiKey: googleKeyInput.trim() || undefined,
          metaAccessToken: metaTokenInput.trim() || undefined,
          customReferer: customRefererInput.trim(),
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) {
        setApiSaveError(saveData.message || 'فشل حفظ المفاتيح');
        setApiTesting(false);
        return;
      }

      setApiSaveStatus('تم حفظ وتحديث المفاتيح على الخادم بنجاح! جاري اختبار الاتصال الحي...');

      // Test Google Places
      let googleTest: any = null;
      try {
        const gRes = await fetch('/api/discovery/google-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'clothing stores in Laghouat Algeria' }),
        });
        const gData = await gRes.json();
        googleTest = {
          success: gData.success,
          status: gData.httpStatus || gRes.status,
          message: gData.errorMessage || (gData.success ? `اتصال ناجح (أعيد ${gData.places?.length || 0} مكان)` : 'فشل الطلب'),
          isReferrerBlocked: gData.isReferrerBlocked,
        };
      } catch (err: any) {
        googleTest = { success: false, status: 0, message: err?.message || 'تعذر الاتصال' };
      }

      // Test Meta Ads
      let metaTest: any = null;
      try {
        const mRes = await fetch('/api/discovery/meta-ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: 'clothing', wilaya: 'Laghouat' }),
        });
        const mData = await mRes.json();
        metaTest = {
          success: mData.success,
          status: mData.httpStatus || mRes.status,
          message: mData.errorMessage || (mData.success ? `اتصال ناجح (أعيد ${mData.ads?.length || 0} إعلان)` : 'حالة القيد الإقليمي'),
          isRestricted: mData.isRestricted,
        };
      } catch (err: any) {
        metaTest = { success: false, status: 0, message: err?.message || 'تعذر الاتصال' };
      }

      setApiTestResults({ google: googleTest, meta: metaTest });
      fetchDiscoveryStatus();
    } catch (err: any) {
      setApiSaveError(err?.message || 'حدث خطأ أثناء حفظ واختبار المفاتيح');
    } finally {
      setApiTesting(false);
    }
  };

  // User Accounts State (Section 4, 5, 7)
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => storage.getUserAccounts());
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'commercial' as UserRole,
    phone: '+213',
    email: '',
  });
  const [userError, setUserError] = useState<string | null>(null);

  // Password Reset State
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Backup & Recovery State (Section 50)
  const [backups, setBackups] = useState<DatabaseBackup[]>(() => storage.getDatabaseBackups());
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generic Directory Adapters & Scheduled Jobs State
  const [genericDirs, setGenericDirs] = useState<GenericDirectoryConfig[]>(() => storage.getGenericDirectories());
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>(() => storage.getScheduledJobs());
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  useEffect(() => {
    const unsubStorage = storage.subscribe(() => {
      setSession(storage.getUserSession());
      setUserAccounts(storage.getUserAccounts());
      setBackups(storage.getDatabaseBackups());
      setGenericDirs(storage.getGenericDirectories());
      setScheduledJobs(storage.getScheduledJobs());
    });
    const unsubI18n = i18n.subscribe((lang) => {
      setCurrentLang(lang);
    });
    return () => {
      unsubStorage();
      unsubI18n();
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    i18n.setLanguage(lang);
    setCurrentLang(lang);
  };

  const handleSaveSettings = () => {
    storage.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };



  // --- User Account Actions ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);

    const res = await storage.createUserAccount(newUser);
    if (res.success) {
      setShowCreateUserModal(false);
      setNewUser({
        full_name: '',
        username: '',
        password: '',
        role: 'commercial',
        phone: '+213',
        email: '',
      });
      setUserAccounts(storage.getUserAccounts());
    } else {
      setUserError(res.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  const handleToggleUserStatus = async (user: UserAccount) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    await storage.updateUserAccount(user.id, { status: newStatus });
    setUserAccounts(storage.getUserAccounts());
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (!confirm(`هل أنت متأكد من حذف حساب ${user.full_name}؟ سيتم إعادة تعيين تجاره تلقائياً للمسؤول الرئيسي.`)) {
      return;
    }
    const res = await storage.deleteUserAccount(user.id);
    if (!res.success) {
      alert(res.message);
    } else {
      setUserAccounts(storage.getUserAccounts());
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPasswordValue) return;

    const res = await storage.resetUserPassword(resetTargetUser.id, newPasswordValue);
    if (res.success) {
      setResetMessage('تم تحديث كلمة المرور المشفرة بنجاح!');
      setTimeout(() => {
        setResetTargetUser(null);
        setNewPasswordValue('');
        setResetMessage(null);
      }, 1500);
    } else {
      setResetMessage(res.message || 'فشلت العملية');
    }
  };

  // --- Backup & Disaster Recovery Actions ---
  const handleDownloadSnapshot = () => {
    const raw = storage.exportDatabaseSnapshot();
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `DROVA_DATABASE_BACKUP_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.json`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    storage.createDatabaseBackup(session.name);
    setBackups(storage.getDatabaseBackups());
    setBackupNotice('تم تصدير نسخة احتياطية مشفرة وتنزيلها إلى جهازك بنجاح.');
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = storage.restoreDatabaseFromBackup(content);
        if (res.success) {
          alert(res.message);
          window.location.reload();
        } else {
          alert(res.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-xs">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings size={18} className="text-[#FF0000]" />
            <span>إعدادات النظام والامتثال والتحكم الإداري</span>
          </h2>
          <p className="text-[11px] text-[#8E8E93] mt-0.5">
            إدارة الحسابات المشفرة، النسخ الاحتياطي للطوارئ، خوارزميات التصنيف واللغة
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[#141414] p-1 border border-[#2E2E2E]">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'about' ? 'bg-[#FF0000] text-white shadow' : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>حول المنصة والمطور</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-[#FF0000] text-white shadow' : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <Users size={13} />
            <span>المستخدمون ({userAccounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-[#FF0000] text-white shadow' : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <HardDrive size={13} />
            <span>النسخ الاحتياطي</span>
          </button>
          <button
            onClick={() => setActiveTab('discovery_api')}
            className={`px-3 py-1.5 font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'discovery_api' ? 'bg-[#FF0000] text-white shadow' : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <KeyRound size={13} />
            <span>مفاتيح الربط والـ API</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'general' ? 'bg-[#FF0000] text-white shadow' : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <Sliders size={13} />
            <span>الخوارزمية واللغة</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: ABOUT (DEVELOPED BY CHEROUIK IMAD) ================= */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="bg-gradient-to-r from-[#141414] via-[#1A1111] to-[#141414] border-2 border-red-950/80 p-6 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FF0000] text-white flex items-center justify-center font-black text-xl font-latin shadow-xl shadow-red-950/60">
                    D
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white font-latin tracking-tight">DROVA EXPRESS</span>
                      <span className="text-xs px-2 py-0.5 bg-[#FF0000] text-white font-bold font-mono">
                        ENTERPRISE v2.0
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA]">
                      منصة استخبارات التجار الوطنية وإدارة الشاحنين (Expéditeurs CRM)
                    </p>
                  </div>
                </div>

                {/* Developer Credit Tag */}
                <div className="bg-[#0C0C0C] border border-[#333333] px-4 py-2.5 text-right">
                  <span className="text-[10px] text-[#8E8E93] block uppercase tracking-wider">مطور ومعماري المنصة:</span>
                  <span className="text-sm font-extrabold text-[#FF0000] font-latin tracking-wide">
                    Developed by Cherouik Imad
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#262626]" />

              <p className="text-xs text-[#D1D1D6] leading-relaxed max-w-3xl">
                تم تصميم وبناء هذه المنصة الشاملة حصرياً لشركة <strong>DROVA Express الجزائر</strong> لتوفير حل متكامل
                يجمع بين خطوط استكشاف التجار من 14 مصدراً رقمياً عاماً، الإثراء التلقائي للأرقام والهويات التجارية،
                التطبيع الجزائري الدقيق، ونظام إدارة المبيعات والمكالمات الهاتفية والمتابعات والتفعيل الميداني.
              </p>

              {/* Core System Architectural Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#101010] border border-[#222222] p-3 space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>جودة وتحقق صارم</span>
                  </div>
                  <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                    منع التلفيق نهائياً (No Fake Records) وتثبيت الأدلة العامة مع تطبيع الهواتف +213.
                  </p>
                </div>

                <div className="bg-[#101010] border border-[#222222] p-3 space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Lock size={14} className="text-blue-400" />
                    <span>أمان وتشفير PBKDF2</span>
                  </div>
                  <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                    تخزين كلمات مرور الموظفين مشفرة بملح عشوائي (100k rounds) دون نصوص صريحة.
                  </p>
                </div>

                <div className="bg-[#101010] border border-[#222222] p-3 space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Globe size={14} className="text-amber-400" />
                    <span>تعدد لغات واتجاه RTL/LTR</span>
                  </div>
                  <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                    عربية كاملة باتجاه RTL حقيقي مع إمكانية التبديل إلى الفرنسية والإنجليزية.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Specifications Box */}
          <div className="bg-[#141414] border border-[#262626] p-5 space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Info size={15} className="text-[#FF0000]" />
              <span>مواصفات التكامل والامتثال القانوني</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#8E8E93]">
              <div>
                <strong className="text-white block mb-1">المصادر المفتوحة المعتمدة:</strong>
                سجل الشركات والتجارة CNRC / Sidjilcom، دليل CACI / الموشير، الصفحات العامة لفيسبوك وإنستغرام،
                خرائط جوجل، واد كنيس، الصفحات الصفراء الجزائرية، والمواقع المستقلة للمتاجر.
              </div>
              <div>
                <strong className="text-white block mb-1">دقة وتأهيل الطرود:</strong>
                خوارزمية تصنيف متقدمة (A+ / A / B / C) تحدد احتمالية الشحن وحجم الطرود المتوقع يومياً لتمكين المندوب
                التجاري من بدء مكالمات ذات عائد استثماري مرتفع.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: USER ACCOUNTS (PBKDF2 SALTED) ================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#141414] border border-[#262626] p-4">
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-[#FF0000]" />
                <span>إدارة حسابات الموظفين والصلاحيات (Staff & Role-Based Accounts)</span>
              </h3>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                كلمات المرور مشفرة آلياً بتقنية PBKDF2-SHA256 مع ملح عشوائي. لا يتم تخزين كلمات مرور صريحة أبداً.
              </p>
            </div>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="px-3.5 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-950/40"
            >
              <Plus size={14} />
              <span>إنشاء حساب موظف جديد</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-[#141414] border border-[#262626] overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-[#8E8E93] border-b border-[#262626] text-[11px]">
                  <th className="p-3">الموظف / الاسم</th>
                  <th className="p-3">اسم المستخدم</th>
                  <th className="p-3">الدور والصلاحية</th>
                  <th className="p-3">الهاتف المهني</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">آخر تسجيل دخول</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {userAccounts.map(u => (
                  <tr key={u.id} className="hover:bg-[#181818] transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{u.full_name}</div>
                      <div className="text-[10px] text-[#71717A]">{u.email}</div>
                    </td>
                    <td className="p-3 font-mono text-white" dir="ltr">{u.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase ${
                        u.role === 'super_admin'
                          ? 'bg-red-950 text-[#FF0000] border border-red-800'
                          : u.role === 'commercial_manager'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : u.role === 'commercial'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[#D1D1D6]" dir="ltr">{u.phone || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        u.status === 'active' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                      }`}>
                        {u.status === 'active' ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-3 text-[#71717A] font-mono text-[10px]">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'لم يسجل بعد'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setResetTargetUser(u);
                            setNewPasswordValue('');
                            setResetMessage(null);
                          }}
                          className="p-1 text-[#8E8E93] hover:text-white bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] cursor-pointer"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <KeyRound size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className="px-2 py-1 text-[10px] bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-[#A1A1AA] hover:text-white cursor-pointer"
                        >
                          {u.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        </button>
                        {u.id !== 'usr_cherouik' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 text-rose-400 hover:text-rose-200 bg-[#1C1C1C] hover:bg-rose-950/50 border border-[#333333] cursor-pointer"
                            title="حذف الحساب بأمان"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BACKUP & DISASTER RECOVERY ================= */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#262626] p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
              <div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <HardDrive size={16} className="text-[#FF0000]" />
                  <span>النسخ الاحتياطي واستعادة الكوارث (Disaster Recovery Engine)</span>
                </h3>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  تصدير لقطة بيانات فورية لكافة التجار والشاحنين وسجلات الاتصالات، أو استعادتها بضغطة زر.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleRestoreFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-[#1C1C1C] hover:bg-[#262626] text-[#EDEDED] border border-[#333333] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload size={14} className="text-amber-400" />
                  <span>استعادة نسخة احتياطية</span>
                </button>
                <button
                  onClick={handleDownloadSnapshot}
                  className="px-4 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-950/40"
                >
                  <Download size={14} />
                  <span>تنزيل لقطة قاعدة البيانات (Snapshot JSON)</span>
                </button>
              </div>
            </div>

            {backupNotice && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{backupNotice}</span>
              </div>
            )}
          </div>

          {/* Backup History Table */}
          <div className="bg-[#141414] border border-[#262626] overflow-x-auto">
            <div className="p-3 border-b border-[#262626] font-bold text-white text-xs">
              سجل النسخ الاحتياطية المعتمدة
            </div>
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-[#8E8E93] border-b border-[#262626] text-[11px]">
                  <th className="p-3">اسم الملف</th>
                  <th className="p-3">تاريخ الإنشاء</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">الحجم التقريبي</th>
                  <th className="p-3">عدد التجار</th>
                  <th className="p-3">الشاحنون</th>
                  <th className="p-3">حالة التحقق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#71717A]">
                      لم يتم إنشاء نسخ احتياطية مسجلة بعد. انقر على زر التنزيل لإنشاء أول نسخة.
                    </td>
                  </tr>
                ) : (
                  backups.map(b => (
                    <tr key={b.id} className="hover:bg-[#181818] transition-colors font-mono-data">
                      <td className="p-3 font-bold text-white" dir="ltr">{b.filename}</td>
                      <td className="p-3 text-[#A1A1AA]">{new Date(b.created_at).toLocaleString()}</td>
                      <td className="p-3 text-[#D1D1D6]">{b.created_by}</td>
                      <td className="p-3 text-white">{Math.round(b.size_bytes / 1024)} KB</td>
                      <td className="p-3 text-emerald-400 font-bold">{b.total_prospects}</td>
                      <td className="p-3 text-blue-400 font-bold">{b.total_expediteurs}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">
                          {b.status === 'verified' ? 'موثق وسليم' : b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: GENERAL & SCORING ================= */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Language Selector */}
          <div className="bg-[#141414] border border-[#262626] p-5 space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Globe size={15} className="text-[#FF0000]" />
              <span>نظام لغات الواجهة واتجاه العرض (Language & Layout Direction)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleLanguageChange('ar')}
                className={`p-3 border text-right transition-all cursor-pointer ${
                  currentLang === 'ar'
                    ? 'bg-[#1C1010] border-[#FF0000] text-white'
                    : 'bg-[#181818] border-[#2A2A2A] text-[#8E8E93] hover:text-white'
                }`}
              >
                <div className="font-bold text-white text-xs mb-1">العربية (RTL) - الافتراضي</div>
                <div className="text-[10px] text-[#8E8E93]">واجهة كاملة من اليمين إلى اليسار</div>
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('fr')}
                className={`p-3 border text-left transition-all cursor-pointer ${
                  currentLang === 'fr'
                    ? 'bg-[#1C1010] border-[#FF0000] text-white'
                    : 'bg-[#181818] border-[#2A2A2A] text-[#8E8E93] hover:text-white'
                }`}
              >
                <div className="font-bold text-white text-xs mb-1">Français (LTR)</div>
                <div className="text-[10px] text-[#8E8E93]">Interface commerciale en Français</div>
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`p-3 border text-left transition-all cursor-pointer ${
                  currentLang === 'en'
                    ? 'bg-[#1C1010] border-[#FF0000] text-white'
                    : 'bg-[#181818] border-[#2A2A2A] text-[#8E8E93] hover:text-white'
                }`}
              >
                <div className="font-bold text-white text-xs mb-1">English (LTR)</div>
                <div className="text-[10px] text-[#8E8E93]">International English Layout</div>
              </button>
            </div>
          </div>

          {/* Scoring Weights */}
          <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Sliders size={15} className="text-[#FF0000]" />
              <span>أوزان خوارزمية تسجيل التجار (Scoring Weights)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[#8E8E93] text-[11px] block">
                  وزن رقم الهاتف الجزائري الصحيح ({settings.weights?.phone || 25} نقطة)
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={settings.weights?.phone || 25}
                  onChange={e => setSettings({
                    ...settings,
                    weights: { ...settings.weights, phone: parseInt(e.target.value) }
                  })}
                  className="w-full accent-[#FF0000]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#8E8E93] text-[11px] block">
                  وزن مؤشر التجارة الإلكترونية والشحن ({settings.weights?.ecommerce || 30} نقطة)
                </label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={settings.weights?.ecommerce || 30}
                  onChange={e => setSettings({
                    ...settings,
                    weights: { ...settings.weights, ecommerce: parseInt(e.target.value) }
                  })}
                  className="w-full accent-[#FF0000]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} />
                <span>{saved ? 'تم الحفظ بنجاح!' : 'حفظ تعديلات الخوارزمية'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: DISCOVERY API KEYS (MANUAL CONFIGURATION) ================= */}
      {activeTab === 'discovery_api' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="p-4 bg-[#141414] border border-[#2E2E2E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#1F1F1F] text-[#FF0000] border border-[#333333]">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">مفاتيح الربط البرمجي السحابي (Discovery API Keys)</h3>
                <p className="text-[#8E8E93] text-[11px] mt-0.5">
                  أدخل مفاتيحك الخاصة بـ Google Places و Meta Ads يدوياً هنا ليتم حفظها واختبارها فوراً على الخادم
                </p>
              </div>
            </div>
            <button
              onClick={fetchDiscoveryStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] text-white text-xs cursor-pointer transition-colors"
            >
              <RefreshCw size={12} className={apiTesting ? 'animate-spin text-[#FF0000]' : 'text-[#8E8E93]'} />
              <span>تحديث الحالة</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {apiSaveStatus && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{apiSaveStatus}</span>
            </div>
          )}
          {apiSaveError && (
            <div className="p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span>{apiSaveError}</span>
            </div>
          )}

          {/* Grid: Google Places & Meta Ads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google Places Card */}
            <div className="p-5 bg-[#141414] border border-[#2A2A2A] space-y-4">
              <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                  <span className="font-bold text-white text-xs">Google Places API (New)</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono border ${
                    serverApiStatus?.googlePlaces?.configured
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : 'bg-[#222222] border-[#333333] text-[#8E8E93]'
                  }`}
                >
                  {serverApiStatus?.googlePlaces?.configured ? 'مُهيأ على الخادم' : 'غير مُهيأ'}
                </span>
              </div>

              {serverApiStatus?.googlePlaces?.maskedKey && (
                <div className="text-[11px] text-[#8E8E93]">
                  المفتاح النشط حالياً:{' '}
                  <span className="font-mono text-white bg-[#1A1A1A] px-1.5 py-0.5 border border-[#2A2A2A]">
                    {serverApiStatus.googlePlaces.maskedKey}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[#8E8E93] text-[11px] block font-medium">
                  أدخل مفتاح Google Places API Key الجديد:
                </label>
                <div className="relative">
                  <input
                    type={showGoogleKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={googleKeyInput}
                    onChange={e => setGoogleKeyInput(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333333] px-3 py-2 pr-10 text-white font-mono text-xs focus:border-[#FF0000] outline-none"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGoogleKey(!showGoogleKey)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white cursor-pointer"
                  >
                    {showGoogleKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#8E8E93] text-[11px] block font-medium">
                  عنوان HTTP Referer المسموح به (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="اتركه فارغاً إذا كان المفتاح غير مقيد بـ Referer"
                  value={customRefererInput}
                  onChange={e => setCustomRefererInput(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333333] px-3 py-2 text-white font-mono text-xs focus:border-[#FF0000] outline-none"
                  dir="ltr"
                />
              </div>

              <div className="p-3 bg-[#181818] border border-[#262626] text-[11px] text-[#8E8E93] space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Info size={13} className="text-blue-400" />
                  <span>توجيه هام لضبط المفتاح في Google Cloud Console:</span>
                </div>
                <p>
                  1. ادخل إلى <strong>Google Cloud Console → Credentials</strong> واختر المفتاح.
                </p>
                <p>
                  2. في قسم <strong>Application restrictions</strong>، اختر <strong>None</strong> لتمكين خادم Node.js من الاتصال مباشرة دون حظر Referer.
                </p>
                <p>
                  3. في قسم <strong>API restrictions</strong>، قم بتقييده على <strong>Places API (New)</strong>.
                </p>
              </div>
            </div>

            {/* Meta Ads Card */}
            <div className="p-5 bg-[#141414] border border-[#2A2A2A] space-y-4">
              <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                  <span className="font-bold text-white text-xs">Meta Ad Library / Graph API</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono border ${
                    serverApiStatus?.metaAds?.configured
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : 'bg-[#222222] border-[#333333] text-[#8E8E93]'
                  }`}
                >
                  {serverApiStatus?.metaAds?.configured ? 'مُهيأ على الخادم' : 'غير مُهيأ'}
                </span>
              </div>

              {serverApiStatus?.metaAds?.maskedToken && (
                <div className="text-[11px] text-[#8E8E93]">
                  الرمز النشط حالياً:{' '}
                  <span className="font-mono text-white bg-[#1A1A1A] px-1.5 py-0.5 border border-[#2A2A2A]">
                    {serverApiStatus.metaAds.maskedToken}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[#8E8E93] text-[11px] block font-medium">
                  أدخل رمز الوصول Meta Access Token الجديد:
                </label>
                <div className="relative">
                  <input
                    type={showMetaToken ? 'text' : 'password'}
                    placeholder="EAA... أو App Token"
                    value={metaTokenInput}
                    onChange={e => setMetaTokenInput(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333333] px-3 py-2 pr-10 text-white font-mono text-xs focus:border-[#FF0000] outline-none"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMetaToken(!showMetaToken)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white cursor-pointer"
                  >
                    {showMetaToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#181818] border border-[#262626] text-[11px] text-[#8E8E93] space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Info size={13} className="text-amber-400" />
                  <span>معلومات حالة Meta Ad Library في الجزائر:</span>
                </div>
                <p>
                  تقيّد منصة Meta الوصول إلى إعلانات التجارة الإلكترونية العامة في الجزائر، وتتطلب حساب شريك معتمد (Verified Business App).
                </p>
                <p>
                  يعالج نظام DROVA قيود Meta بشكل ذكي كـ (Restricted) دون التسبب بأي عطل في استكشاف التجار عبر Google Places والمصادر المحلية.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-4 bg-[#141414] border border-[#2E2E2E] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#8E8E93]">
              يمكنك أيضاً كتابة وتعديل المفاتيح مباشرة في الكود عبر الملف:{' '}
              <span className="font-mono text-white bg-[#1C1C1C] px-1.5 py-0.5 border border-[#333333]">
                credentials.config.ts
              </span>
            </div>
            <button
              onClick={handleSaveApiKeys}
              disabled={apiTesting}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              <Save size={14} />
              <span>{apiTesting ? 'جاري الحفظ واختبار الاتصال الحي...' : 'حفظ واختبار الاتصال المباشر'}</span>
            </button>
          </div>

          {/* Live Test Results */}
          {apiTestResults && (
            <div className="p-5 bg-[#141414] border border-[#2E2E2E] space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" />
                <span>نتائج اختبار الاتصال الحي بالمصادر:</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Google Result */}
                <div
                  className={`p-3.5 border ${
                    apiTestResults.google?.success
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                      : apiTestResults.google?.isReferrerBlocked
                      ? 'bg-amber-950/30 border-amber-800 text-amber-300'
                      : 'bg-rose-950/30 border-rose-800 text-rose-300'
                  } text-xs space-y-1`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Google Places API (New):</span>
                    <span className="font-mono text-[11px]">HTTP {apiTestResults.google?.status}</span>
                  </div>
                  <p className="text-[11px] opacity-90">{apiTestResults.google?.message}</p>
                  {apiTestResults.google?.isReferrerBlocked && (
                    <p className="text-[10px] text-amber-200 mt-1">
                      💡 ملاحظة: يرجى إزالة قيود HTTP Referrer من Google Cloud Console وضبطها على None.
                    </p>
                  )}
                </div>

                {/* Meta Result */}
                <div
                  className={`p-3.5 border ${
                    apiTestResults.meta?.success
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                      : apiTestResults.meta?.isRestricted
                      ? 'bg-blue-950/30 border-blue-800 text-blue-300'
                      : 'bg-rose-950/30 border-rose-800 text-rose-300'
                  } text-xs space-y-1`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Meta Ad Library:</span>
                    <span className="font-mono text-[11px]">
                      {apiTestResults.meta?.isRestricted ? 'Restricted' : `HTTP ${apiTestResults.meta?.status}`}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">{apiTestResults.meta?.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREATE USER ACCOUNT ================= */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#333333] max-w-md w-full p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Users size={16} className="text-[#FF0000]" />
                <span>إنشاء حساب موظف جديد (PBKDF2 Hashed)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="text-[#8E8E93] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {userError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300">
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-[#8E8E93] block mb-1">الاسم الكامل للموظف:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ياسمين بلقاسم"
                  value={newUser.full_name}
                  onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-[#8E8E93] block mb-1">اسم المستخدم للدخول (Username):</label>
                <input
                  type="text"
                  required
                  placeholder="yasmine_b"
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-1.5 text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[#8E8E93] block mb-1">كلمة المرور المشفرة الأولية:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-1.5 text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[#8E8E93] block mb-1">الدور والصلاحية:</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-2 py-1.5 text-white"
                >
                  <option value="commercial">Commercial (ممثل مبيعات واتصال ميداني)</option>
                  <option value="commercial_manager">Commercial Manager (مشرف فريق المبيعات)</option>
                  <option value="admin_marketing">Admin Marketing (إدارة التنقيب والمصادر)</option>
                  <option value="super_admin">Super Admin (مسؤول تنفيذي كامل)</option>
                  <option value="viewer">Viewer (اطلاع وقراءة فقط)</option>
                </select>
              </div>

              <div>
                <label className="text-[#8E8E93] block mb-1">الهاتف المهني الجزائري (+213):</label>
                <input
                  type="text"
                  placeholder="+213550123456"
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-1.5 text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-3 py-1.5 bg-[#222222] text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FF0000] text-white font-bold hover:bg-[#E00000] cursor-pointer"
                >
                  تأكيد وإنشاء الحساب المشفر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET PASSWORD ================= */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#333333] max-w-sm w-full p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <KeyRound size={16} className="text-amber-400" />
                <span>إعادة تعيين كلمة المرور</span>
              </h4>
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="text-[#8E8E93] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[#8E8E93]">
              المستخدم: <strong className="text-white">{resetTargetUser.full_name}</strong> ({resetTargetUser.username})
            </p>

            {resetMessage && (
              <div className="p-2 bg-emerald-950 border border-emerald-800 text-emerald-300">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="text-[#8E8E93] block mb-1">كلمة المرور المشفرة الجديدة:</label>
                <input
                  type="password"
                  required
                  placeholder="لا تقل عن 6 أحرف"
                  value={newPasswordValue}
                  onChange={e => setNewPasswordValue(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-1.5 text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-3 py-1.5 bg-[#222222] text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#FF0000] text-white font-bold hover:bg-[#E00000] cursor-pointer"
                >
                  تشفير وتحديث كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
