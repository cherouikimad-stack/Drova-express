/**
 * DROVA "New Prospecting Campaign" View (Section 4 & 28)
 * Full 58 Wilayas, modular sources, 22 categories, and strict quality configuration
 */
import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Target,
  Layers,
  PhoneCall,
  MessageCircle,
  ShieldCheck,
  Check,
  ArrowRight,
  Info
} from 'lucide-react';
import { ALGERIA_WILAYAS } from '../data/wilayas';
import { MERCHANT_CATEGORIES } from '../data/categories';
import { SourceType } from '../types';
import { storage } from '../services/storage';
import { NavView } from '../components/layout/Sidebar';

interface NewCampaignViewProps {
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onCampaignCreated: (campaignId: string) => void;
}

export const NewCampaignView: React.FC<NewCampaignViewProps> = ({
  onNavigate,
  onCampaignCreated,
}) => {
  // Wilaya Mode
  const [wilayaMode, setWilayaMode] = useState<'single' | 'multi' | 'all'>('single');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('الأغواط');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [multiWilayas, setMultiWilayas] = useState<string[]>(['الجزائر العاصمة', 'وهران', 'سطيف']);

  // Campaign Settings
  const [campaignName, setCampaignName] = useState('حملة استكشاف تجار الأغواط للشحن السريع');
  const [targetNumber, setTargetNumber] = useState<number>(50);

  // Modular Sources Selection (Section 4)
  const [selectedSources, setSelectedSources] = useState<SourceType[]>([
    'google_maps',
    'meta_ads',
    'facebook',
    'instagram',
  ]);

  // Merchant Categories Selection (22 categories)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'clothing',
    'cosmetics',
    'phones',
    'electronics',
    'shoes',
  ]);

  // Lead Quality & Filters
  const [minScore, setMinScore] = useState<'A+' | 'A' | 'B' | 'all'>('all');
  const [phoneRequired, setPhoneRequired] = useState(true); // Default REQUIRED (Section 4)
  const [whatsappPreference, setWhatsappPreference] = useState<'prefer' | 'not_required'>('prefer');
  const [activeBusinessRequired, setActiveBusinessRequired] = useState(true); // Default YES (Section 4)

  const currentWilayaObj = ALGERIA_WILAYAS.find(w => w.nameAr === selectedWilaya);

  const toggleSource = (source: SourceType) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(MERCHANT_CATEGORIES.map(c => c.id));
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSources.length === 0) {
      alert('يرجى تحديد مصدر استكشاف واحد على الأقل.');
      return;
    }

    if (selectedCategories.length === 0) {
      alert('يرجى تحديد فئة تجارية واحدة على الأقل.');
      return;
    }

    let wilayaField = selectedWilaya;
    if (wilayaMode === 'all') {
      wilayaField = 'all';
    } else if (wilayaMode === 'multi') {
      wilayaField = multiWilayas.join(', ');
    }

    const campaign = storage.createCampaign({
      name: campaignName.trim() || `حملة ${wilayaField} - ${new Date().toLocaleDateString('ar-DZ')}`,
      wilaya: wilayaField,
      commune: wilayaMode === 'single' ? selectedCommune : undefined,
      target_number: targetNumber,
      sources: selectedSources,
      categories: selectedCategories,
      min_score: minScore,
      phone_required: phoneRequired,
      whatsapp_preference: whatsappPreference,
      active_business_required: activeBusinessRequired,
    });

    onCampaignCreated(campaign.id);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass size={20} className="text-[#FF0000]" />
            <span>حملة تنقيب جديدة (New Prospecting Campaign)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            إعداد مسار المسح والاستخراج الذكي للتجار وفق معايير الامتثال والجودة المعتمدة
          </p>
        </div>

        <button
          onClick={() => onNavigate('campaigns')}
          className="text-xs text-[#8E8E93] hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>العودة لقائمة الحملات</span>
          <ArrowRight size={14} className="rotate-180" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Campaign Identity & Target */}
        <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Target size={14} className="text-[#FF0000]" />
            <span>1. هوية الحملة ونطاق الهدف</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="text-[#8E8E93] block mb-1">اسم الحملة التنقيبية:</label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="مثال: تنقيب تجار الأزياء والإلكترونيات - ولاية الأغواط"
                className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-2 text-white text-xs outline-none focus:border-[#FF0000]"
              />
            </div>

            <div>
              <label className="text-[#8E8E93] block mb-1">العدد المستهدف (Target Number):</label>
              <input
                type="number"
                min={5}
                max={500}
                required
                value={targetNumber}
                onChange={e => setTargetNumber(parseInt(e.target.value) || 50)}
                className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-2 text-white font-mono-data text-xs outline-none focus:border-[#FF0000]"
              />
              <span className="text-[10px] text-[#545458] block mt-1">
                الجودة أولاً: لن يتم اصطناع بيانات وهمية للوصول للرقم
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Geographic Scope (58 Wilayas) */}
        <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} className="text-[#FF0000]" />
              <span>2. النطاق الجغرافي (ولاية المقر الفعلي)</span>
            </h3>

            {/* Mode Switcher */}
            <div className="flex bg-[#1E1E1E] border border-[#333333] text-xs">
              <button
                type="button"
                onClick={() => setWilayaMode('single')}
                className={`px-3 py-1 ${wilayaMode === 'single' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#8E8E93] hover:text-white'}`}
              >
                ولاية واحدة
              </button>
              <button
                type="button"
                onClick={() => setWilayaMode('multi')}
                className={`px-3 py-1 ${wilayaMode === 'multi' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#8E8E93] hover:text-white'}`}
              >
                عدة ولايات
              </button>
              <button
                type="button"
                onClick={() => setWilayaMode('all')}
                className={`px-3 py-1 ${wilayaMode === 'all' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#8E8E93] hover:text-white'}`}
              >
                الـ 58 ولاية كاملة
              </button>
            </div>
          </div>

          {wilayaMode === 'single' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[#8E8E93] block mb-1">اختر الولاية:</label>
                <select
                  value={selectedWilaya}
                  onChange={e => {
                    setSelectedWilaya(e.target.value);
                    setSelectedCommune('');
                  }}
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-2 text-white text-xs outline-none focus:border-[#FF0000]"
                >
                  {ALGERIA_WILAYAS.map(w => (
                    <option key={w.code} value={w.nameAr}>
                      {w.code} - {w.nameAr} ({w.nameFr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#8E8E93] block mb-1">البلدية (اختياري / تركيز الاستكشاف):</label>
                <select
                  value={selectedCommune}
                  onChange={e => setSelectedCommune(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-2 text-white text-xs outline-none focus:border-[#FF0000]"
                >
                  <option value="">كافة بلديات ولاية {selectedWilaya}</option>
                  {currentWilayaObj?.communes.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wilayaMode === 'multi' && (
            <div className="space-y-2">
              <span className="text-xs text-[#8E8E93] block">حدد الولايات المستهدفة في هذه الدفعة:</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-[#1A1A1A] border border-[#2E2E2E]">
                {ALGERIA_WILAYAS.map(w => {
                  const isChecked = multiWilayas.includes(w.nameAr);
                  return (
                    <label
                      key={w.code}
                      className={`flex items-center gap-1.5 p-1.5 text-[11px] cursor-pointer border transition-colors ${
                        isChecked ? 'bg-[#2A1616] border-[#FF0000]/60 text-white' : 'border-[#333333] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setMultiWilayas(prev =>
                            prev.includes(w.nameAr) ? prev.filter(x => x !== w.nameAr) : [...prev, w.nameAr]
                          );
                        }}
                        className="hidden"
                      />
                      <span className="font-mono text-[10px] text-[#545458]">{w.code}</span>
                      <span className="truncate">{w.nameAr}</span>
                    </label>
                  );
                })}
              </div>
              <span className="text-[11px] text-[#545458] block">
                تم تحديد {multiWilayas.length} ولاية
              </span>
            </div>
          )}

          {wilayaMode === 'all' && (
            <div className="p-3 bg-[#1C1616] border border-[#441C1C] text-xs text-neutral-300 flex items-start gap-2">
              <Info size={16} className="text-[#FF0000] shrink-0 mt-0.5" />
              <span>
                سيتم فحص الأنشطة التجارية على مستوى كافة الولايات الـ 58 بالترتيب، مع احترام محددات معدل الطلبات والتأكد من تحديد مقر النشاط الفعلي لا وجهة التوصيل.
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Modular Sources (14 Connectors) */}
        <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-[#FF0000]" />
              <span>3. محركات الاستكشاف المتصلة (14 قناة تنقيب متوازية)</span>
            </h3>

            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedSources([
                  'google_maps',
                  'cnrc',
                  'meta_ads',
                  'facebook',
                  'instagram',
                  'tiktok',
                  'ouedkniss',
                  'pages_jaunes',
                  'annuaires_dz',
                  'el_mouchir',
                  'kompass',
                  'generic_directory',
                  'web_search',
                  'directories',
                  'reverse_discovery',
                ])}
                className="text-[#8E8E93] hover:text-white underline text-[11px]"
              >
                تحديد كافة القنوات الـ 15
              </button>
              <span className="text-[#444444]">|</span>
              <button
                type="button"
                onClick={() => setSelectedSources([])}
                className="text-[#8E8E93] hover:text-white underline text-[11px]"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {[
              { id: 'google_maps' as const, name: 'خرائط جوجل وسجلات الأعمال', desc: 'Google Maps & Places' },
              { id: 'cnrc' as const, name: 'السجل التجاري - سِجِلكم CNRC', desc: 'Registre de Commerce / النشاط القانوني' },
              { id: 'meta_ads' as const, name: 'مكتبة إعلانات ميتا', desc: 'Meta Ads Library (الحملات الممولة)' },
              { id: 'facebook' as const, name: 'صفحات فيسبوك التجارية', desc: 'Facebook Commercial Pages' },
              { id: 'instagram' as const, name: 'حسابات إنستغرام العامة', desc: 'Instagram Shop Profiles' },
              { id: 'tiktok' as const, name: 'حسابات تيك توك التجارية', desc: 'TikTok Commercial Profiles' },
              { id: 'ouedkniss' as const, name: 'متاجر واد كنيس المجمعة', desc: 'Ouedkniss Pro Stores & Listings' },
              { id: 'pages_jaunes' as const, name: 'الصفحات الصفراء الجزائرية', desc: 'Pages Jaunes Algérie' },
              { id: 'annuaires_dz' as const, name: 'دليل الشركات 58 ولاية', desc: 'AnnuairesDZ (58W Master)' },
              { id: 'el_mouchir' as const, name: 'دليل المشير / CACI', desc: 'El Mouchir / الغرف التجارية' },
              { id: 'kompass' as const, name: 'كومباس الجزائر للأعمال B2B', desc: 'Kompass Algeria Commercial' },
              { id: 'generic_directory' as const, name: 'محركات الأدلة المخصصة', desc: 'Configurable Generic Directories' },
              { id: 'web_search' as const, name: 'المواقع الإلكترونية المستقلة', desc: 'Public E-commerce (.dz / Shopify)' },
              { id: 'directories' as const, name: 'أدلة الأعمال الجزائرية المفتوحة', desc: 'Open Business Directories' },
              { id: 'reverse_discovery' as const, name: 'محرك الزحف العكسي والتقاطع', desc: 'Reverse Graph & Phone Recovery' },
            ].map(src => {
              const isChecked = selectedSources.includes(src.id);
              return (
                <div
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`p-2.5 border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-[#1D1616] border-[#FF0000]/60'
                      : 'bg-[#181818] border-[#2A2A2A] hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white text-[11px] truncate max-w-[170px]">{src.name}</span>
                    <span className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${isChecked ? 'bg-[#FF0000] border-[#FF0000] text-white' : 'border-[#444444]'}`}>
                      {isChecked && <Check size={10} />}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8E8E93] font-latin truncate">{src.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: 22 Merchant Categories Multi-Select (Section 4) */}
        <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>4. فئات التجار المستهدفة للشحن (22 فئة معتمدة)</span>
            </h3>

            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllCategories}
                className="text-[#8E8E93] hover:text-white underline text-[11px]"
              >
                تحديد الكل
              </button>
              <span className="text-[#444444]">|</span>
              <button
                type="button"
                onClick={clearAllCategories}
                className="text-[#8E8E93] hover:text-white underline text-[11px]"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {MERCHANT_CATEGORIES.map(cat => {
              const isChecked = selectedCategories.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2 p-2 border cursor-pointer text-xs transition-colors ${
                    isChecked
                      ? 'bg-[#221818] border-[#FF0000]/60 text-white font-medium'
                      : 'bg-[#181818] border-[#2E2E2E] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat.id)}
                    className="hidden"
                  />
                  <span className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${isChecked ? 'bg-[#FF0000] border-[#FF0000] text-white' : 'border-[#444444]'}`}>
                    {isChecked && <Check size={10} />}
                  </span>
                  <span className="truncate">{cat.nameAr}</span>
                </label>
              );
            })}
          </div>
          <span className="text-[11px] text-[#545458] block">
            تم تحديد {selectedCategories.length} من أصل 22 فئة تجارية
          </span>
        </div>

        {/* Section 5: Verification & Quality Filters */}
        <div className="bg-[#141414] border border-[#262626] p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>5. ضوابط التحقق والامتثال (Quality Control Invariants)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Phone Requirement (Default REQUIRED) */}
            <div className="p-3 bg-[#181818] border border-[#2A2A2A]">
              <label className="text-white font-semibold block mb-1">شرط توثيق الهاتف:</label>
              <select
                value={phoneRequired ? 'required' : 'optional'}
                onChange={e => setPhoneRequired(e.target.value === 'required')}
                className="w-full bg-[#121212] border border-[#333333] px-2 py-1.5 text-white text-xs mt-1"
              >
                <option value="required">إلزامي (REQUIRED - الافتراضي)</option>
                <option value="optional">اختياري (سجل مؤقت)</option>
              </select>
              <span className="text-[10px] text-[#8E8E93] block mt-1">
                استبعاد أي سجل بدون رقم جزائري صالح (+213)
              </span>
            </div>

            {/* WhatsApp Preference */}
            <div className="p-3 bg-[#181818] border border-[#2A2A2A]">
              <label className="text-white font-semibold block mb-1">تفضيل الواتساب:</label>
              <select
                value={whatsappPreference}
                onChange={e => setWhatsappPreference(e.target.value as any)}
                className="w-full bg-[#121212] border border-[#333333] px-2 py-1.5 text-white text-xs mt-1"
              >
                <option value="prefer">تفضيل الواتساب (Prefer WhatsApp)</option>
                <option value="not_required">غير مشروط (Not required)</option>
              </select>
              <span className="text-[10px] text-[#8E8E93] block mt-1">
                إبراز أصحاب قنوات التواصل الفوري
              </span>
            </div>

            {/* Active Business Requirement (Default YES) */}
            <div className="p-3 bg-[#181818] border border-[#2A2A2A]">
              <label className="text-white font-semibold block mb-1">نشاط تجاري ساري:</label>
              <select
                value={activeBusinessRequired ? 'yes' : 'no'}
                onChange={e => setActiveBusinessRequired(e.target.value === 'yes')}
                className="w-full bg-[#121212] border border-[#333333] px-2 py-1.5 text-white text-xs mt-1"
              >
                <option value="yes">نعم (نشاط حقيقي نشط)</option>
                <option value="no">السماح بالصفحات غير النشطة</option>
              </select>
              <span className="text-[10px] text-[#8E8E93] block mt-1">
                استبعاد الصفحات المعطلة وغير التجارية
              </span>
            </div>

            {/* Minimum Lead Score */}
            <div className="p-3 bg-[#181818] border border-[#2A2A2A]">
              <label className="text-white font-semibold block mb-1">الحد الأدنى للتقييم:</label>
              <select
                value={minScore}
                onChange={e => setMinScore(e.target.value as any)}
                className="w-full bg-[#121212] border border-[#333333] px-2 py-1.5 text-white text-xs mt-1"
              >
                <option value="all">كل المعتمدين (A+, A, B)</option>
                <option value="A+">فئة A+ فقط (أعلى أولوية)</option>
                <option value="A">فئة A وفوقها</option>
                <option value="B">فئة B وفوقها</option>
              </select>
              <span className="text-[10px] text-[#8E8E93] block mt-1">
                حسب معايير التأهيل المعتمدة في DROVA
              </span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onNavigate('campaigns')}
            className="px-4 py-2 text-xs text-[#8E8E93] hover:text-white transition-colors"
          >
            إلغاء
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold shadow-lg shadow-red-950/40 transition-colors"
          >
            <Compass size={16} />
            <span>إنشاء وبدء فحص الحملة (Start Scan)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
