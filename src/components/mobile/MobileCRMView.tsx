/**
 * DROVA Express Algeria — Dedicated Mobile Smartphone CRM Interface
 * Automatically rendered when opening from a mobile phone or tablet
 * Provides high-efficiency 1-thumb ergonomics, 1-tap dialer, and full Firestore sync.
 */
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  CalendarCheck,
  Truck,
  Menu as MenuIcon,
  Plus,
  Phone,
  Search,
  MapPin,
  ChevronRight,
  ChevronLeft,
  X,
  LogOut,
  Laptop,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  RefreshCw,
  Download
} from 'lucide-react';
import { storage } from '../../services/storage';
import { ALGERIA_WILAYAS } from '../../data/wilayas';
import { Prospect, CRMCall, CRMFollowUp, ExpediteurProfile } from '../../types';
import { NavView } from '../layout/Sidebar';
import { CallModal } from '../crm/CallModal';

interface MobileCRMViewProps {
  prospects: Prospect[];
  onSelectProspect: (prospect: Prospect) => void;
  onLogout: () => void;
  onSwitchToDesktop: () => void;
  onNavigateView: (view: NavView) => void;
}

export const MobileCRMView: React.FC<MobileCRMViewProps> = ({
  prospects,
  onSelectProspect,
  onLogout,
  onSwitchToDesktop,
  onNavigateView
}) => {
  const session = storage.getUserSession();
  const [activeTab, setActiveTab] = useState<'home' | 'prospects' | 'calls' | 'followups' | 'expediteurs'>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search & Filter in Prospects tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [callingProspect, setCallingProspect] = useState<Prospect | null>(null);
  const [showAddMerchantModal, setShowAddMerchantModal] = useState(false);

  // New Merchant form state
  const [newMerchant, setNewMerchant] = useState({
    name: '',
    phone: '+213',
    wilaya: ALGERIA_WILAYAS[0].nameAr,
    commune: '',
    address: '',
    product: 'تجارة عامة',
    notes: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Real data collections
  const allCalls = storage.getAllCalls();
  const allFollowUps = storage.getAllFollowUps();
  const expediteurs = storage.getExpediteurs();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCallsCount = allCalls.filter(c => c.date === todayStr).length;
  const overdueFollowUps = allFollowUps.filter(f => f.status !== 'completed' && f.status !== 'cancelled' && f.scheduled_date <= todayStr);
  const activeExpediteurs = expediteurs.filter(e => e.commercial_status === 'نشط' || e.lifecycle_status === 'نشط');

  // Filter prospects
  const filteredProspects = prospects.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchPhone = p.phone.includes(q);
      const matchCommune = p.commune?.toLowerCase().includes(q) || false;
      if (!matchName && !matchPhone && !matchCommune) return false;
    }
    if (selectedWilaya && p.wilaya !== selectedWilaya) return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    return true;
  });

  const handleAddMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchant.name.trim()) {
      setAddError('يرجى إدخال اسم المتجر أو الشركة');
      return;
    }
    if (!newMerchant.phone || newMerchant.phone.length < 9) {
      setAddError('يرجى إدخال رقم هاتف جزائري صالح');
      return;
    }

    setAddLoading(true);
    setAddError(null);
    try {
      await storage.addSingleProspect({
        name: newMerchant.name,
        phone: newMerchant.phone,
        wilaya: newMerchant.wilaya,
        commune: newMerchant.commune,
        address: newMerchant.address,
        product: newMerchant.product,
        notes: newMerchant.notes
      });
      setShowAddMerchantModal(false);
      setNewMerchant({
        name: '',
        phone: '+213',
        wilaya: ALGERIA_WILAYAS[0].nameAr,
        commune: '',
        address: '',
        product: 'تجارة عامة',
        notes: ''
      });
      setActiveTab('prospects');
    } catch (err: any) {
      setAddError(err.message || 'حدث خطأ أثناء حفظ التاجر');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0C0C0C] text-[#EDEDED] overflow-hidden select-none" dir="rtl">
      {/* 1. Mobile Top Header */}
      <header className="h-14 bg-[#141414] border-b border-[#262626] flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-[#8E8E93] hover:text-white rounded-lg active:bg-[#202020] transition-colors"
            aria-label="القائمة"
          >
            <MenuIcon size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="DROVA Express" className="h-6 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-white leading-tight">DROVA CRM</span>
              <span className="text-[9px] text-[#00E5FF] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-pulse" />
                سحابي مباشر
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">

          {/* Button to toggle to desktop layout */}
          <button
            type="button"
            onClick={onSwitchToDesktop}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-white border border-[#333] rounded-md transition-colors"
            title="التحويل إلى واجهة الحاسوب"
          >
            <Laptop size={13} />
            <span>حاسوب</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] rounded-lg transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* 2. Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-3 space-y-4 pb-20">
        {/* ================= TAB: HOME / DASHBOARD ================= */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* User Greeting Card */}
            <div className="bg-gradient-to-r from-[#1E1E1E] to-[#141414] border border-[#2E2E2E] rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#8E8E93]">مرحباً بك،</p>
                <h2 className="text-sm font-bold text-white">{session.name}</h2>
                <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-semibold bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30 rounded-full">
                  {session.role === 'super_admin' ? 'مدير عام النظام' : session.role === 'admin_marketing' ? 'إدارة التسويق' : 'ممثل تجاري'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMerchantModal(true)}
                className="flex items-center gap-1 px-3 py-2 bg-[#FF0000] hover:bg-[#D90000] active:scale-95 text-white text-xs font-bold rounded-lg shadow-lg shadow-[#FF0000]/20 transition-all"
              >
                <Plus size={15} />
                <span>إضافة تاجر</span>
              </button>
            </div>

            {/* Quick KPI Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setActiveTab('prospects')}
                className="bg-[#141414] border border-[#262626] rounded-xl p-3 cursor-pointer hover:border-[#383838] transition-colors"
              >
                <div className="flex items-center justify-between text-[#8E8E93]">
                  <span className="text-xs font-medium">إجمالي التجار</span>
                  <Users size={16} className="text-[#00E5FF]" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{prospects.length}</span>
                  <span className="text-[10px] text-[#8E8E93]">تاجر</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('calls')}
                className="bg-[#141414] border border-[#262626] rounded-xl p-3 cursor-pointer hover:border-[#383838] transition-colors"
              >
                <div className="flex items-center justify-between text-[#8E8E93]">
                  <span className="text-xs font-medium">مكالمات اليوم</span>
                  <PhoneCall size={16} className="text-[#30D158]" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{todayCallsCount}</span>
                  <span className="text-[10px] text-[#8E8E93]">مكالمة</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('followups')}
                className="bg-[#141414] border border-[#262626] rounded-xl p-3 cursor-pointer hover:border-[#383838] transition-colors"
              >
                <div className="flex items-center justify-between text-[#8E8E93]">
                  <span className="text-xs font-medium">متابعات مستعجلة</span>
                  <CalendarCheck size={16} className="text-[#FF9F0A]" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{overdueFollowUps.length}</span>
                  <span className="text-[10px] text-[#8E8E93]">مستحقة</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('expediteurs')}
                className="bg-[#141414] border border-[#262626] rounded-xl p-3 cursor-pointer hover:border-[#383838] transition-colors"
              >
                <div className="flex items-center justify-between text-[#8E8E93]">
                  <span className="text-xs font-medium">شاحنون نشطون</span>
                  <Truck size={16} className="text-[#FF0000]" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{activeExpediteurs.length}</span>
                  <span className="text-[10px] text-[#8E8E93]">شاحن</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (prospects.length > 0) {
                    setCallingProspect(prospects[0]);
                  } else {
                    setShowAddMerchantModal(true);
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-[#1C1C1E] border border-[#333] hover:border-[#555] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white transition-colors"
              >
                <Phone size={15} className="text-[#30D158]" />
                <span>تسجيل مكالمة سريعة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('prospects')}
                className="py-2.5 px-3 bg-[#1C1C1E] border border-[#333] hover:border-[#555] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-[#A0A0A0] transition-colors"
              >
                <Search size={15} />
                <span>بحث في التجار</span>
              </button>
            </div>

            {/* Prospects Ready to Call Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-[#FF0000]" />
                  <span>تجار جاهزون للاتصال</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('prospects')}
                  className="text-[11px] text-[#FF0000] hover:underline"
                >
                  عرض الكل ({prospects.length})
                </button>
              </div>

              {prospects.length === 0 ? (
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 text-center space-y-2">
                  <Users size={32} className="mx-auto text-[#48484A]" />
                  <p className="text-xs font-semibold text-white">لا توجد بيانات تجار مسجلة بعد</p>
                  <p className="text-[11px] text-[#8E8E93]">ابدأ بإضافة أول تاجر مؤهل أو استورد ملف الإكسيل</p>
                  <button
                    type="button"
                    onClick={() => setShowAddMerchantModal(true)}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-[#FF0000] text-white text-xs font-bold rounded-lg shadow"
                  >
                    <Plus size={14} />
                    <span>إضافة تاجر الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {prospects.slice(0, 5).map(p => (
                    <div
                      key={p.id}
                      className="bg-[#141414] border border-[#262626] rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0" onClick={() => onSelectProspect(p)}>
                        <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-[#8E8E93] mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <MapPin size={10} />
                            {p.wilaya}
                          </span>
                          <span>•</span>
                          <span className="text-[#FF9F0A]">{p.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${p.phone}`}
                          className="p-2 bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 rounded-lg active:scale-95 transition-transform"
                          title="اتصال مباشر"
                        >
                          <Phone size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => setCallingProspect(p)}
                          className="px-2.5 py-1.5 bg-[#FF0000] text-white text-[10px] font-bold rounded-lg active:scale-95 transition-transform"
                        >
                          تسجيل
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: PROSPECTS DIRECTORY ================= */}
        {activeTab === 'prospects' && (
          <div className="space-y-3">
            {/* Search and Filters */}
            <div className="space-y-2 bg-[#141414] border border-[#262626] rounded-xl p-2.5">
              <div className="relative">
                <Search size={15} className="absolute right-3 top-2.5 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الهاتف، أو البلدية..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-[#333] rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-[#666] focus:border-[#FF0000] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedWilaya}
                  onChange={e => setSelectedWilaya(e.target.value)}
                  className="bg-[#1C1C1E] border border-[#333] rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none"
                >
                  <option value="">جميع الولايات (69)</option>
                  {ALGERIA_WILAYAS.map(w => (
                    <option key={w.code} value={w.nameAr}>
                      {w.code} - {w.nameAr}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-[#1C1C1E] border border-[#333] rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none"
                >
                  <option value="">جميع الحالات</option>
                  <option value="جاهز للاتصال">جاهز للاتصال</option>
                  <option value="جديد">جديد</option>
                  <option value="مهتم">مهتم</option>
                  <option value="أكد التعامل مع DROVA">مؤكد</option>
                  <option value="Expéditeur نشط">شاحن نشط</option>
                  <option value="لم يرد">لم يرد</option>
                  <option value="غير مهتم">غير مهتم</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8E8E93] pt-1 border-t border-[#222]">
                <span>النتائج: <strong className="text-white">{filteredProspects.length}</strong> تاجر</span>
                <button
                  type="button"
                  onClick={() => setShowAddMerchantModal(true)}
                  className="text-[#FF0000] font-bold flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>تاجر جديد</span>
                </button>
              </div>
            </div>

            {/* Prospects List */}
            {filteredProspects.length === 0 ? (
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 text-center space-y-2">
                <p className="text-xs font-semibold text-white">لا توجد نتائج مطابقة</p>
                <p className="text-[11px] text-[#8E8E93]">جرب تغيير معايير البحث أو أضف تاجراً جديداً</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProspects.map(p => (
                  <div
                    key={p.id}
                    className="bg-[#141414] border border-[#262626] rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2" onClick={() => onSelectProspect(p)}>
                      <div>
                        <h4 className="text-xs font-bold text-white">{p.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-[#8E8E93] mt-0.5">
                          <span className="flex items-center gap-0.5 text-[#A0A0A0]">
                            <MapPin size={10} />
                            {p.wilaya} {p.commune ? `(${p.commune})` : ''}
                          </span>
                          <span>•</span>
                          <span className="text-[#00E5FF]">{p.product || 'تجارة عامة'}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        p.status === 'مهتم' || p.status === 'أكد التعامل مع DROVA'
                          ? 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30'
                          : p.status === 'جاهز للاتصال'
                          ? 'bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30'
                          : 'bg-[#8E8E93]/15 text-[#8E8E93] border border-[#8E8E93]/30'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#202020] flex items-center justify-between">
                      <span className="text-xs font-mono text-[#CCCCCC]">{p.phone}</span>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${p.phone}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#30D158]/15 hover:bg-[#30D158]/25 text-[#30D158] border border-[#30D158]/30 text-[10px] font-bold rounded-lg"
                        >
                          <Phone size={12} />
                          <span>اتصال</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setCallingProspect(p)}
                          className="px-2.5 py-1.5 bg-[#FF0000] text-white text-[10px] font-bold rounded-lg"
                        >
                          تسجيل مكالمة
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: CALLS ================= */}
        {activeTab === 'calls' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <PhoneCall size={14} className="text-[#30D158]" />
                <span>سجل المكالمات المسجلة ({allCalls.length})</span>
              </h3>
            </div>

            {allCalls.length === 0 ? (
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 text-center space-y-2">
                <PhoneCall size={32} className="mx-auto text-[#48484A]" />
                <p className="text-xs font-semibold text-white">لم يتم تسجيل أي مكالمات حتى الآن</p>
                <p className="text-[11px] text-[#8E8E93]">سجل مكالماتك مع التجار لتحديث أدائك التجاري لحظياً</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allCalls.map(c => {
                  const matchedProspect = prospects.find(p => p.id === c.prospect_id);
                  const pName = matchedProspect ? matchedProspect.name : c.prospect_id;
                  return (
                    <div key={c.id} className="bg-[#141414] border border-[#262626] rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{pName}</span>
                        <span className="text-[10px] text-[#8E8E93]">{c.date} {c.time || ''}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30 rounded">
                          {c.call_result}
                        </span>
                        <span className="text-[10px] text-[#8E8E93]">بواسطة: {c.commercial_name}</span>
                      </div>

                      {c.notes && (
                        <p className="text-[11px] text-[#A0A0A0] bg-[#1A1A1A] p-2 rounded-lg border border-[#222]">
                          {c.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: FOLLOW-UPS ================= */}
        {activeTab === 'followups' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CalendarCheck size={14} className="text-[#FF9F0A]" />
                <span>مواعيد المتابعة ({allFollowUps.length})</span>
              </h3>
            </div>

            {allFollowUps.length === 0 ? (
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 text-center space-y-2">
                <CalendarCheck size={32} className="mx-auto text-[#48484A]" />
                <p className="text-xs font-semibold text-white">لا توجد مواعيد متابعة مسجلة</p>
                <p className="text-[11px] text-[#8E8E93]">عند تسجيل مكالمة، يمكنك جدولة موعد إعادة اتصال قادم</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allFollowUps.map(f => {
                  const isOverdue = f.scheduled_date <= todayStr && f.status !== 'completed';
                  return (
                    <div
                      key={f.id}
                      className={`bg-[#141414] border rounded-xl p-3 space-y-1.5 ${
                        isOverdue ? 'border-[#FF3B30]/40' : 'border-[#262626]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{f.prospect_name}</span>
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FF3B30]/20 text-[#FF453A] rounded">
                            مستحقة اليوم
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                        <span>الموعد: {f.scheduled_date} {f.scheduled_time || ''}</span>
                        <span>{f.reason || 'متابعة عادية'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: EXPEDITEURS ================= */}
        {activeTab === 'expediteurs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Truck size={14} className="text-[#FF0000]" />
                <span>الشاحنون المعتمدون ({expediteurs.length})</span>
              </h3>
            </div>

            {expediteurs.length === 0 ? (
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-8 text-center space-y-2">
                <Truck size={32} className="mx-auto text-[#48484A]" />
                <p className="text-xs font-semibold text-white">لا يوجد شاحنون مسجلون حتى الآن</p>
                <p className="text-[11px] text-[#8E8E93]">يتم ترقية التاجر لشاحن معتمد فور تأكيد بدء الشحن الفعلي</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expediteurs.map(e => (
                  <div key={e.id} className="bg-[#141414] border border-[#262626] rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{e.business_name}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 rounded-full">
                        {e.commercial_status || 'نشط'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8E8E93]">
                      <span>الولاية: {e.wilaya}</span>
                      <span>الطرود: {e.estimated_colis_per_day || 0} طرد/يوم</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#121212] border-t border-[#262626] flex items-center justify-around px-1 z-30 select-none">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#FF0000]' : 'text-[#8E8E93] hover:text-white'
          }`}
        >
          <LayoutDashboard size={19} />
          <span>الرئيسية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prospects')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'prospects' ? 'text-[#FF0000]' : 'text-[#8E8E93] hover:text-white'
          }`}
        >
          <Users size={19} />
          <span>التجار</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calls')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'calls' ? 'text-[#FF0000]' : 'text-[#8E8E93] hover:text-white'
          }`}
        >
          <PhoneCall size={19} />
          <span>المكالمات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('followups')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-bold transition-colors cursor-pointer relative ${
            activeTab === 'followups' ? 'text-[#FF0000]' : 'text-[#8E8E93] hover:text-white'
          }`}
        >
          <CalendarCheck size={19} />
          <span>المتابعات</span>
          {overdueFollowUps.length > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 bg-[#FF0000] rounded-full animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expediteurs')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'expediteurs' ? 'text-[#FF0000]' : 'text-[#8E8E93] hover:text-white'
          }`}
        >
          <Truck size={19} />
          <span>الشاحنون</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[10px] font-bold text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
        >
          <MenuIcon size={19} />
          <span>المزيد</span>
        </button>
      </nav>

      {/* 4. Mobile Drawer Menu */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-[#141414] border-l border-[#262626] h-full flex flex-col p-4 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="DROVA" className="h-6 w-auto" />
                <span className="text-xs font-bold text-white">قائمة النظام</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-[#8E8E93] hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              <button
                type="button"
                onClick={() => {
                  onSwitchToDesktop();
                  setIsDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20"
              >
                <span className="flex items-center gap-2">
                  <Laptop size={15} />
                  <span>التحويل لواجهة الحاسوب (PC)</span>
                </span>
                <ChevronLeft size={14} />
              </button>


              <div className="pt-2 text-[10px] font-bold text-[#8E8E93] px-2">الوحدات الإدارية والميدانية</div>

              <button
                type="button"
                onClick={() => {
                  onNavigateView('wilayas');
                  setIsDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-[#CCCCCC] hover:bg-[#202020]"
              >
                <span className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#FF9F0A]" />
                  <span>تغطية الولايات الـ 69</span>
                </span>
                <ChevronLeft size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateView('commercial_performance');
                  setIsDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-[#CCCCCC] hover:bg-[#202020]"
              >
                <span className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-[#30D158]" />
                  <span>أداء الفريق والمبيعات</span>
                </span>
                <ChevronLeft size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateView('import');
                  setIsDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-[#CCCCCC] hover:bg-[#202020]"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={15} className="text-[#00E5FF]" />
                  <span>استيراد ملف إكسيل</span>
                </span>
                <ChevronLeft size={14} />
              </button>

              {session.role === 'super_admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateView('settings');
                      setIsDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-[#CCCCCC] hover:bg-[#202020]"
                  >
                    <span className="flex items-center gap-2">
                      <Settings size={15} className="text-[#FF0000]" />
                      <span>إدارة الحسابات والإعدادات</span>
                    </span>
                    <ChevronLeft size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateView('audit_log');
                      setIsDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-[#CCCCCC] hover:bg-[#202020]"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={15} className="text-[#A0A0A0]" />
                      <span>سجل التدقيق والرقابة</span>
                    </span>
                    <ChevronLeft size={14} />
                  </button>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#262626]">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30 rounded-lg text-xs font-bold"
              >
                <LogOut size={15} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Mobile Modal: Add New Merchant */}
      {showAddMerchantModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowAddMerchantModal(false)}
          />

          <div className="relative w-full max-w-lg bg-[#141414] border-t sm:border border-[#262626] rounded-t-2xl sm:rounded-2xl p-4 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus size={16} className="text-[#FF0000]" />
                <span>إضافة تاجر جديد إلى النظام</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMerchantModal(false)}
                className="p-1 text-[#8E8E93] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div className="mt-3 p-2.5 bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-[#FF453A] text-xs rounded-lg">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddMerchantSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#CCCCCC] mb-1">
                  اسم المتجر / الشركة التجارية *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: متجر النخبة للإلكترونيات"
                  value={newMerchant.name}
                  onChange={e => setNewMerchant({ ...newMerchant, name: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF0000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#CCCCCC] mb-1">
                  رقم الهاتف (الجزائر) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+213XXXXXXXXX"
                  value={newMerchant.phone}
                  onChange={e => setNewMerchant({ ...newMerchant, phone: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#666] focus:border-[#FF0000] focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#CCCCCC] mb-1">
                    الولاية (69 ولاية) *
                  </label>
                  <select
                    value={newMerchant.wilaya}
                    onChange={e => setNewMerchant({ ...newMerchant, wilaya: e.target.value })}
                    className="w-full bg-[#1C1C1E] border border-[#333] rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
                  >
                    {ALGERIA_WILAYAS.map(w => (
                      <option key={w.code} value={w.nameAr}>
                        {w.code} - {w.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#CCCCCC] mb-1">
                    البلدية
                  </label>
                  <input
                    type="text"
                    placeholder="البلدية"
                    value={newMerchant.commune}
                    onChange={e => setNewMerchant({ ...newMerchant, commune: e.target.value })}
                    className="w-full bg-[#1C1C1E] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#666] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#CCCCCC] mb-1">
                  فئة السلع / النشاط
                </label>
                <input
                  type="text"
                  placeholder="مثال: ملابس، هواتف، كوزميتيك..."
                  value={newMerchant.product}
                  onChange={e => setNewMerchant({ ...newMerchant, product: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#666] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#CCCCCC] mb-1">
                  ملاحظات
                </label>
                <textarea
                  rows={2}
                  placeholder="أي معلومات إضافية عن حجم الطرود..."
                  value={newMerchant.notes}
                  onChange={e => setNewMerchant({ ...newMerchant, notes: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#666] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMerchantModal(false)}
                  className="flex-1 py-2 bg-[#222] hover:bg-[#333] text-white text-xs font-bold rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2 bg-[#FF0000] hover:bg-[#D90000] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {addLoading ? 'جاري الحفظ...' : 'حفظ التاجر في السحابة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Call Logger Modal */}
      {callingProspect && (
        <CallModal
          prospect={callingProspect}
          onClose={() => setCallingProspect(null)}
          onCallLogged={() => {
            setCallingProspect(null);
          }}
        />
      )}
    </div>
  );
};
