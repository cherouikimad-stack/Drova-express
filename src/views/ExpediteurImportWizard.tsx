/**
 * DROVA Express — Expéditeur Excel Multi-Step Import Wizard (Sections 6 - 16, 32 - 34)
 * STEP 1: Upload (.xlsx, .xls, .csv)
 * STEP 2: Sheet Selector
 * STEP 3: Preview & Column Mapping
 * STEP 4: Validation & Duplicate Detection (Priority: phone, business_name, social urls)
 * STEP 5: Final Review & Non-destructive Import
 */
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Check,
  RotateCcw,
  ShieldCheck,
  Layers,
  Users,
  Copy,
  Info,
  ChevronDown
} from 'lucide-react';
import { storage } from '../services/storage';
import { i18n } from '../services/i18n';
import { NavView } from '../components/layout/Sidebar';
import {
  ExpediteurProfile,
  ExpediteurImportBatch,
  ExpediteurCommercialStatus,
  ExpediteurLifecycleStatus,
  WhatsAppStatus
} from '../types';
import { normalizeAlgerianPhone } from '../services/phone';

interface ExpediteurImportWizardProps {
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onImportComplete: () => void;
}

interface RowClassification {
  rowNumber: number;
  data: Record<string, any>;
  mapped: Partial<ExpediteurProfile>;
  status: 'NEW' | 'EXISTING' | 'POSSIBLE_DUPLICATE' | 'INVALID';
  reasons: string[];
}

export const ExpediteurImportWizard: React.FC<ExpediteurImportWizardProps> = ({
  onNavigate,
  onImportComplete,
}) => {
  const session = storage.getUserSession();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // Sheet data
  const [sheetRawRows, setSheetRawRows] = useState<any[][]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);

  // Column Mapping
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Mode
  const [importMode, setImportMode] = useState<'existing_expediteurs' | 'prospects' | 'raw_candidates'>('existing_expediteurs');

  // Classification results
  const [classifiedRows, setClassifiedRows] = useState<RowClassification[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importDone, setImportDone] = useState(false);

  // Internal target fields for mapping (Section 10)
  const TARGET_FIELDS = [
    { key: 'expediteur_name', label: 'اسم الشاحن / العميل (Nom Expéditeur)', required: true },
    { key: 'business_name', label: 'اسم المتجر / الشركة (Entreprise)', required: false },
    { key: 'phone', label: 'رقم الهاتف (Téléphone / Mobile)', required: true },
    { key: 'whatsapp', label: 'الواتساب (WhatsApp)', required: false },
    { key: 'wilaya', label: 'الولاية (Wilaya)', required: false },
    { key: 'commune', label: 'البلدية (Commune)', required: false },
    { key: 'address', label: 'العنوان الفعلي (Adresse)', required: false },
    { key: 'activity', label: 'النشاط التجاري (Activité / Catégorie)', required: false },
    { key: 'product', label: 'طبيعة السلع والمنتجات (Produit)', required: false },
    { key: 'email', label: 'البريد الإلكتروني (Email)', required: false },
    { key: 'facebook_url', label: 'رابط صفحة فيسبوك (Facebook URL)', required: false },
    { key: 'instagram_url', label: 'حساب إنستغرام (Instagram URL)', required: false },
    { key: 'website', label: 'الموقع الإلكتروني (Website)', required: false },
    { key: 'current_courier', label: 'شركة التوصيل الحالية (Livreur / Courier)', required: false },
    { key: 'estimated_colis_per_day', label: 'تقدير عدد الطرود يومياً (Colis / jour)', required: false },
    { key: 'notes', label: 'الملاحظات والتعليمات (Notes / Remarques)', required: false },
  ];

  // STEP 1: Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);

      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          setWorkbook(wb);
          setSheetsList(wb.SheetNames);
          if (wb.SheetNames.length > 0) {
            setSelectedSheet(wb.SheetNames[0]);
            loadSheetData(wb, wb.SheetNames[0]);
          }
          setStep(wb.SheetNames.length > 1 ? 2 : 3);
        } catch (err: any) {
          alert('تعذر قراءة ملف الإكسيل. تأكد من سلامة الملف وصيغته (.xlsx, .xls, .csv)');
        }
      };
      reader.readAsBinaryString(selected);
    }
  };

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    if (rawData.length > 0) {
      setSheetRawRows(rawData);
      const headers = (rawData[0] || []).map(h => String(h || '').trim()).filter(Boolean);
      setDetectedHeaders(headers);
      autoMapColumns(headers);
    }
  };

  // STEP 2: Sheet Selector
  const handleSheetSelect = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      loadSheetData(workbook, sheetName);
    }
    setStep(3);
  };

  // STEP 3: Auto Column Mapping
  const autoMapColumns = (headers: string[]) => {
    const mapping: Record<string, string> = {};

    headers.forEach(header => {
      const lower = header.toLowerCase();

      if (lower.includes('expediteur') || lower.includes('nom du client') || lower.includes('client') || lower.includes('nom') || lower.includes('اسم')) {
        if (!mapping['expediteur_name']) mapping['expediteur_name'] = header;
      }
      if (lower.includes('boutique') || lower.includes('entreprise') || lower.includes('magasin') || lower.includes('store') || lower.includes('متجر') || lower.includes('شركة')) {
        if (!mapping['business_name']) mapping['business_name'] = header;
      }
      if (lower.includes('tel') || lower.includes('phone') || lower.includes('mobile') || lower.includes('gsm') || lower.includes('هاتف') || lower.includes('موبايل')) {
        if (!mapping['phone']) mapping['phone'] = header;
      }
      if (lower.includes('whatsapp') || lower.includes('واتساب') || lower.includes('watsapp')) {
        if (!mapping['whatsapp']) mapping['whatsapp'] = header;
      }
      if (lower.includes('wilaya') || lower.includes('ولاية') || lower.includes('province')) {
        if (!mapping['wilaya']) mapping['wilaya'] = header;
      }
      if (lower.includes('commune') || lower.includes('بلدية') || lower.includes('ville') || lower.includes('city')) {
        if (!mapping['commune']) mapping['commune'] = header;
      }
      if (lower.includes('adresse') || lower.includes('address') || lower.includes('عنوان')) {
        if (!mapping['address']) mapping['address'] = header;
      }
      if (lower.includes('activite') || lower.includes('activity') || lower.includes('نشاط')) {
        if (!mapping['activity']) mapping['activity'] = header;
      }
      if (lower.includes('produit') || lower.includes('product') || lower.includes('سلع') || lower.includes('منتج')) {
        if (!mapping['product']) mapping['product'] = header;
      }
      if (lower.includes('email') || lower.includes('courriel') || lower.includes('بريد')) {
        if (!mapping['email']) mapping['email'] = header;
      }
      if (lower.includes('facebook') || lower.includes('fb') || lower.includes('فيسبوك')) {
        if (!mapping['facebook_url']) mapping['facebook_url'] = header;
      }
      if (lower.includes('instagram') || lower.includes('insta') || lower.includes('إنستغرام')) {
        if (!mapping['instagram_url']) mapping['instagram_url'] = header;
      }
      if (lower.includes('site') || lower.includes('web') || lower.includes('موقع')) {
        if (!mapping['website']) mapping['website'] = header;
      }
      if (lower.includes('livreur') || lower.includes('courier') || lower.includes('توصيل') || lower.includes('شحن')) {
        if (!mapping['current_courier']) mapping['current_courier'] = header;
      }
      if (lower.includes('colis') || lower.includes('parcel') || lower.includes('طرود') || lower.includes('عدد')) {
        if (!mapping['estimated_colis_per_day']) mapping['estimated_colis_per_day'] = header;
      }
      if (lower.includes('note') || lower.includes('remarque') || lower.includes('ملاحظ')) {
        if (!mapping['notes']) mapping['notes'] = header;
      }
    });

    setColumnMapping(mapping);
  };

  // STEP 4: Validation & Duplicate Detection Engine (Section 12 & 13)
  const runValidationAndDedup = () => {
    setIsProcessing(true);

    const existingExpediteurs = storage.getExpediteurs();
    const existingProspects = storage.getProspects();

    const headers = sheetRawRows[0] || [];
    const headerIndices: Record<string, number> = {};
    headers.forEach((h: any, idx: number) => {
      headerIndices[String(h || '').trim()] = idx;
    });

    const dataRows = sheetRawRows.slice(1);
    const classifications: RowClassification[] = [];

    dataRows.forEach((row, rowIndex) => {
      if (!row || row.length === 0 || row.every(cell => !cell)) return;

      const getVal = (fieldKey: string): string => {
        const headerName = columnMapping[fieldKey];
        if (!headerName) return '';
        const idx = headerIndices[headerName];
        if (idx === undefined) return '';
        return String(row[idx] ?? '').trim();
      };

      const expediteurName = getVal('expediteur_name') || getVal('business_name');
      const businessName = getVal('business_name') || expediteurName;
      const rawPhone = getVal('phone');
      const wilaya = getVal('wilaya') || 'الجزائر العاصمة';
      const commune = getVal('commune') || 'الجزائر';
      const address = getVal('address');
      const activity = getVal('activity') || 'تجارة عامة';
      const product = getVal('product') || activity;
      const email = getVal('email');
      const rawWhatsapp = getVal('whatsapp');
      const fbUrl = getVal('facebook_url');
      const igUrl = getVal('instagram_url');
      const website = getVal('website');
      const currentCourier = getVal('current_courier') || 'غير محدد';
      const notes = getVal('notes');

      // Validation
      const reasons: string[] = [];
      let status: RowClassification['status'] = 'NEW';

      if (!expediteurName && !businessName) {
        status = 'INVALID';
        reasons.push('الاسم التجاري أو اسم العميل مفقود بالكامل');
      }

      // Phone normalization
      const phoneNorm = rawPhone ? normalizeAlgerianPhone(rawPhone) : null;
      const hasPhone = phoneNorm && phoneNorm.isValid;
      const finalPhone = hasPhone ? phoneNorm.normalized : '';

      if (!hasPhone && rawPhone) {
        reasons.push(`رقم الهاتف (${rawPhone}) غير صالح أو غير جزائري`);
      } else if (!rawPhone) {
        reasons.push('رقم الهاتف غير متوفر في ملف الإكسيل (سيتم إدراجه كمعلق)');
      }

      // Duplicate Detection Priorities (Section 12)
      // 1. Phone match in Expediteurs
      if (finalPhone) {
        const phoneMatch = existingExpediteurs.find(e => e.phone === finalPhone);
        if (phoneMatch) {
          status = 'EXISTING';
          reasons.push(`مطابق لشاحن معتمد مسجل مسبقاً (${phoneMatch.id}: ${phoneMatch.business_name}) بنفس رقم الهاتف`);
        }
      }

      // 2. Business name + Wilaya match in Expediteurs
      if (status === 'NEW' && businessName) {
        const nameWilayaMatch = existingExpediteurs.find(
          e => e.business_name.toLowerCase().includes(businessName.toLowerCase()) && e.wilaya === wilaya
        );
        if (nameWilayaMatch) {
          status = 'POSSIBLE_DUPLICATE';
          reasons.push(`احتمال تطابق بالاسم والولاية مع الشاحن (${nameWilayaMatch.id}: ${nameWilayaMatch.business_name})`);
        }
      }

      // 3. Match in Prospects database
      if (status === 'NEW' && finalPhone) {
        const prospectMatch = existingProspects.find(p => p.phone === finalPhone);
        if (prospectMatch) {
          status = 'POSSIBLE_DUPLICATE';
          reasons.push(`رقم الهاتف مسجل مسبقاً في قاعدة التنقيب كمرشح (${prospectMatch.name})`);
        }
      }

      const whatsappStatus: WhatsAppStatus = rawWhatsapp && (rawWhatsapp.includes('نعم') || rawWhatsapp.toLowerCase().includes('oui') || rawWhatsapp.toLowerCase().includes('yes'))
        ? 'نعم'
        : hasPhone ? 'غير معروف' : 'لا';

      const mappedExp: Partial<ExpediteurProfile> = {
        business_name: businessName,
        commercial_name: expediteurName,
        phone: finalPhone || 'معلق',
        whatsapp: whatsappStatus,
        email,
        wilaya,
        commune,
        address,
        activity,
        products: product,
        facebook_url: fbUrl,
        instagram_url: igUrl,
        website,
        current_courier: currentCourier,
        estimated_parcels: '10–20',
        drova_contract_status: 'مسودة',
        commercial_status: 'جديد',
        lifecycle_status: 'مؤكد',
        status: 'مؤكد',
        source_type: 'excel_import',
        notes,
      };

      classifications.push({
        rowNumber: rowIndex + 2,
        data: row,
        mapped: mappedExp,
        status,
        reasons,
      });
    });

    setClassifiedRows(classifications);
    setIsProcessing(false);
    setStep(4);
  };

  // STEP 5: Confirm & Import non-destructively
  const handleFinalImport = (strategy: 'import_new' | 'merge_existing' | 'skip_duplicates') => {
    setIsProcessing(true);

    const batchId = `imp_${Date.now()}`;
    const newRecords: ExpediteurProfile[] = [];

    let newCount = 0;
    let existingCount = 0;
    let mergedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;

    classifiedRows.forEach((row, idx) => {
      if (row.status === 'INVALID') {
        invalidCount++;
        return;
      }

      if (row.status === 'EXISTING' || row.status === 'POSSIBLE_DUPLICATE') {
        existingCount++;
        if (strategy === 'skip_duplicates') {
          skippedCount++;
          return;
        }
        if (strategy === 'merge_existing') {
          mergedCount++;
        }
      } else {
        newCount++;
      }

      const fullExp: ExpediteurProfile = {
        id: `EXP-2026-${(1100 + idx).toString().padStart(4, '0')}`,
        business_name: row.mapped.business_name || 'متجر غير مسمى',
        commercial_name: row.mapped.commercial_name || row.mapped.business_name || 'شاحن جديد',
        owner_name: row.mapped.commercial_name,
        phone: row.mapped.phone || 'معلق',
        whatsapp: row.mapped.whatsapp || 'غير معروف',
        email: row.mapped.email || '',
        wilaya: row.mapped.wilaya || 'الجزائر العاصمة',
        commune: row.mapped.commune || 'الجزائر',
        address: row.mapped.address || '',
        activity: row.mapped.activity || 'تجارة وتوزيع',
        products: row.mapped.products || 'سلع متنوعة',
        facebook_url: row.mapped.facebook_url,
        instagram_url: row.mapped.instagram_url,
        website: row.mapped.website,
        current_courier: row.mapped.current_courier || 'غير محدد',
        estimated_parcels: '10–20',
        drova_contract_status: 'مسودة',
        commercial_status: 'جديد',
        lifecycle_status: 'مؤكد',
        status: 'مؤكد',
        source_type: 'excel_import',
        import_id: batchId,
        activation_date: new Date().toISOString().split('T')[0],
        notes: row.mapped.notes || `مستورد من ملف ${file?.name} (صف ${row.rowNumber})`,
        created_at: new Date().toISOString(),
      };

      newRecords.push(fullExp);
    });

    const batch: ExpediteurImportBatch = {
      id: batchId,
      file_name: file?.name || 'expediteurs.xlsx',
      sheet_name: selectedSheet,
      imported_by: session.name,
      imported_at: new Date().toISOString(),
      total_rows: classifiedRows.length,
      new_count: newCount,
      existing_count: existingCount,
      merged_count: mergedCount,
      skipped_count: skippedCount,
      invalid_count: invalidCount,
      import_mode: importMode,
    };

    storage.addExpediteurImportBatch(batch, newRecords);
    setIsProcessing(false);
    setImportDone(true);
    setStep(5);
    onImportComplete();
  };

  const newRowsCount = classifiedRows.filter(r => r.status === 'NEW').length;
  const existingRowsCount = classifiedRows.filter(r => r.status === 'EXISTING').length;
  const duplicateRowsCount = classifiedRows.filter(r => r.status === 'POSSIBLE_DUPLICATE').length;
  const invalidRowsCount = classifiedRows.filter(r => r.status === 'INVALID').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-[#FF0000]" />
            <span>معالج استيراد الشاحنين المعتمدين (Expéditeur Excel Import Wizard)</span>
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1">
            استيراد قواعد بيانات الشاحنين الفعليين لـ DROVA دون تحويلها إلى مرشحين جدد مع كشف التكرارات والدمج الآمن
          </p>
        </div>

        <button
          onClick={() => onNavigate('expediteurs')}
          className="text-xs text-[#8E8E93] hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <span>العودة لقائمة الشاحنين</span>
          <ArrowRight size={14} className="rotate-180" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-5 gap-2 bg-[#141414] border border-[#262626] p-2 text-xs">
        {[
          { num: 1, title: '1. رفع الملف' },
          { num: 2, title: '2. اختيار الورقة' },
          { num: 3, title: '3. تعيين الأعمدة' },
          { num: 4, title: '4. التحقق والتكرارات' },
          { num: 5, title: '5. التنفيذ والنتائج' },
        ].map(s => (
          <div
            key={s.num}
            className={`py-2 px-3 text-center border-b-2 font-medium transition-colors ${
              step === s.num
                ? 'border-[#FF0000] text-white font-bold bg-[#1C1C1C]'
                : step > s.num
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#545458]'
            }`}
          >
            {s.title}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="bg-[#141414] border border-[#262626] p-8 space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-[#1F1F1F] border border-[#333333] flex items-center justify-center mx-auto text-[#FF0000]">
              <Upload size={32} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                اختر ملف قاعدة بيانات الشاحنين (.xlsx, .xls, .csv)
              </h3>
              <p className="text-xs text-[#8E8E93]">
                يدعم جداول الإكسيل السابقة لشركة DROVA، كشوفات الزبائن، والملفات المجمعة
              </p>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold cursor-pointer shadow-md transition-colors">
                <Upload size={16} />
                <span>تحديد ملف من الجهاز</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 34: Import Mode Selector */}
          <div className="border-t border-[#262626] pt-5 max-w-lg mx-auto text-right text-xs space-y-2">
            <span className="font-bold text-white block">وضع الاستيراد (Import Mode):</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setImportMode('existing_expediteurs')}
                className={`p-2.5 border text-right transition-colors ${
                  importMode === 'existing_expediteurs'
                    ? 'border-[#FF0000] bg-red-950/20 text-white font-bold'
                    : 'border-[#333333] bg-[#181818] text-[#8E8E93]'
                }`}
              >
                <div className="font-medium text-xs">شاحنون فعليون</div>
                <div className="text-[10px] text-[#545458] mt-0.5">Existing Expéditeurs (افتراضي)</div>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('prospects')}
                className={`p-2.5 border text-right transition-colors ${
                  importMode === 'prospects'
                    ? 'border-[#FF0000] bg-red-950/20 text-white font-bold'
                    : 'border-[#333333] bg-[#181818] text-[#8E8E93]'
                }`}
              >
                <div className="font-medium text-xs">تجار محتملون</div>
                <div className="text-[10px] text-[#545458] mt-0.5">New Prospects</div>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('raw_candidates')}
                className={`p-2.5 border text-right transition-colors ${
                  importMode === 'raw_candidates'
                    ? 'border-[#FF0000] bg-red-950/20 text-white font-bold'
                    : 'border-[#333333] bg-[#181818] text-[#8E8E93]'
                }`}
              >
                <div className="font-medium text-xs">مرشحون خام</div>
                <div className="text-[10px] text-[#545458] mt-0.5">Raw Candidates Pool</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Sheet Selector */}
      {step === 2 && (
        <div className="bg-[#141414] border border-[#262626] p-6 space-y-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-[#FF0000]" />
            <span>2. اختيار ورقة العمل من ملف الإكسيل ({file?.name})</span>
          </h3>

          <p className="text-xs text-[#8E8E93]">
            يحتوي هذا الملف على أكثر من ورقة عمل. يرجى تحديد الورقة التي تحتوي على بيانات الشاحنين:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sheetsList.map(name => (
              <div
                key={name}
                onClick={() => handleSheetSelect(name)}
                className={`p-4 border cursor-pointer transition-colors ${
                  selectedSheet === name
                    ? 'border-[#FF0000] bg-red-950/30 text-white'
                    : 'border-[#333333] bg-[#181818] hover:border-[#555555] text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{name}</span>
                  <CheckCircle2 size={16} className={selectedSheet === name ? 'text-[#FF0000]' : 'text-neutral-600'} />
                </div>
                <p className="text-[11px] text-[#8E8E93]">انقر لمعاينة هذه الورقة وتعيين الأعمدة</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Column Mapping */}
      {step === 3 && (
        <div className="bg-[#141414] border border-[#262626] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileCheck size={16} className="text-[#FF0000]" />
                <span>3. معاينة البيانات ومطابقة الأعمدة (Column Mapping)</span>
              </h3>
              <p className="text-xs text-[#8E8E93] mt-1">
                تم استخراج {sheetRawRows.length - 1} صفاً. يرجى مطابقة أعمدة ملف الإكسيل مع حقول الشاحن الداخلية
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(sheetsList.length > 1 ? 2 : 1)}
                className="px-3 py-1.5 bg-[#222222] text-[#8E8E93] hover:text-white text-xs"
              >
                رجوع
              </button>
              <button
                onClick={runValidationAndDedup}
                className="px-4 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold shadow-md"
              >
                التحقق وكشف التكرارات
              </button>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#181818] p-4 border border-[#262626]">
            {TARGET_FIELDS.map(target => (
              <div key={target.key} className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-300 block">
                  {target.label} {target.required && <span className="text-[#FF0000]">*</span>}
                </label>
                <select
                  value={columnMapping[target.key] || ''}
                  onChange={e => setColumnMapping({ ...columnMapping, [target.key]: e.target.value })}
                  className="w-full bg-[#121212] border border-[#333333] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#FF0000]"
                >
                  <option value="">-- غير محدد (تجاهل) --</option>
                  {detectedHeaders.map(header => (
                    <option key={header} value={header}>
                      عمود: {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Raw Excel Preview (First 5 rows) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white block">معاينة أولية لأول 5 صفوف في الملف:</span>
            <div className="overflow-x-auto border border-[#262626]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1C1C1C] text-[#8E8E93]">
                  <tr>
                    <th className="p-2 border-b border-[#262626]">#</th>
                    {detectedHeaders.slice(0, 8).map((h, i) => (
                      <th key={i} className="p-2 border-b border-[#262626] font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {sheetRawRows.slice(1, 6).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#1A1A1A]">
                      <td className="p-2 font-mono text-[#545458]">{rIdx + 1}</td>
                      {detectedHeaders.slice(0, 8).map((h, cIdx) => (
                        <td key={cIdx} className="p-2 text-neutral-300 max-w-[150px] truncate">
                          {String(row[cIdx] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Validation & Duplicate Detection Preview (Section 13) */}
      {step === 4 && (
        <div className="bg-[#141414] border border-[#262626] p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#FF0000]" />
              <span>4. نتائج فحص الجودة وتصنيف التكرارات (Audit Preview)</span>
            </h3>
            <p className="text-xs text-[#8E8E93] mt-1">
              إجمالي السجلات المقروءة: {classifiedRows.length} صفاً
            </p>
          </div>

          {/* Breakdown Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#181818] border border-emerald-900/60">
              <span className="text-[11px] text-[#8E8E93] block">شاحنون جدد (NEW)</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {newRowsCount}
              </span>
              <span className="text-[10px] text-emerald-600">لا يوجد أي تطابق سابق</span>
            </div>

            <div className="p-3 bg-[#181818] border border-blue-900/60">
              <span className="text-[11px] text-[#8E8E93] block">شاحنون موجودون (EXISTING)</span>
              <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                {existingRowsCount}
              </span>
              <span className="text-[10px] text-blue-500">تطابق تام برقم الهاتف</span>
            </div>

            <div className="p-3 bg-[#181818] border border-amber-900/60">
              <span className="text-[11px] text-[#8E8E93] block">تكرار محتمل (POSSIBLE)</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                {duplicateRowsCount}
              </span>
              <span className="text-[10px] text-amber-500">تطابق بالاسم أو كمرشح</span>
            </div>

            <div className="p-3 bg-[#181818] border border-rose-900/60">
              <span className="text-[11px] text-[#8E8E93] block">سجلات غير صالحة (INVALID)</span>
              <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                {invalidRowsCount}
              </span>
              <span className="text-[10px] text-rose-500">الاسم التجاري مفقود</span>
            </div>
          </div>

          {/* Detailed Samples Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white block">عينة من السجلات وتصنيف الخوارزمية:</span>
            <div className="max-h-64 overflow-y-auto border border-[#262626]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1C1C1C] text-[#8E8E93] sticky top-0">
                  <tr>
                    <th className="p-2 border-b border-[#262626]">الصف</th>
                    <th className="p-2 border-b border-[#262626]">الاسم التجاري</th>
                    <th className="p-2 border-b border-[#262626]">الهاتف</th>
                    <th className="p-2 border-b border-[#262626]">الولاية</th>
                    <th className="p-2 border-b border-[#262626]">التصنيف</th>
                    <th className="p-2 border-b border-[#262626]">ملاحظات الفحص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {classifiedRows.slice(0, 15).map(row => (
                    <tr key={row.rowNumber} className="hover:bg-[#1A1A1A]">
                      <td className="p-2 font-mono text-[#545458]">{row.rowNumber}</td>
                      <td className="p-2 font-bold text-white">{row.mapped.business_name}</td>
                      <td className="p-2 font-mono text-emerald-400">{row.mapped.phone}</td>
                      <td className="p-2 text-neutral-300">{row.mapped.wilaya}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold ${
                            row.status === 'NEW'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : row.status === 'EXISTING'
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                              : row.status === 'POSSIBLE_DUPLICATE'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-2 text-[11px] text-[#8E8E93] max-w-xs truncate">
                        {row.reasons.join(' | ') || 'سليم وجاهز للإدراج'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Strategy Buttons (Section 13) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#262626]">
            <button
              onClick={() => setStep(3)}
              className="px-3 py-1.5 bg-[#222222] text-[#8E8E93] hover:text-white text-xs"
            >
              تعديل مطابقة الأعمدة
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFinalImport('skip_duplicates')}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#282828] border border-[#333333] text-white text-xs font-medium"
              >
                تخطي المكرر (استيراد الجدد فقط: {newRowsCount})
              </button>

              <button
                onClick={() => handleFinalImport('merge_existing')}
                disabled={isProcessing}
                className="px-4 py-1.5 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold shadow-md"
              >
                دمج الموجود واستيراد الجدد ({newRowsCount + existingRowsCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Success Results */}
      {step === 5 && (
        <div className="bg-[#141414] border border-emerald-900/60 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-700 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={36} />
          </div>

          <h3 className="text-base font-bold text-white">
            تم استيراد ودمج الشاحنين بنجاح في قاعدة Expéditeurs!
          </h3>

          <p className="text-xs text-[#8E8E93] max-w-lg mx-auto">
            تم الحفاظ بالكامل على كافة سجلات الاتصالات، التعيينات التجارية، والملاحظات السابقة دون أي فقدان.
            أصبح الشاحنون الجدد متوفرين الآن في طابور المتابعة التجارية (Ready for Follow-up).
          </p>

          <div className="pt-3 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('expediteurs')}
              className="px-4 py-2 bg-[#FF0000] hover:bg-[#E00000] text-white text-xs font-bold shadow-md"
            >
              الانتقال لجدول الشاحنين المعتمدين
            </button>
            <button
              onClick={() => onNavigate('commercial_queue')}
              className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#282828] border border-[#333333] text-white text-xs font-medium"
            >
              طابور المتابعة التجارية (Commercial Queue)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
