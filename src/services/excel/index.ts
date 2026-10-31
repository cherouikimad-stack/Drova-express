/**
 * DROVA Express Excel (.xlsx) and CSV Export & Import Engine
 * Strictly follows Section 18 for column headers and Section 36 for smart import/merge
 */
import * as XLSX from 'xlsx';
import { Prospect } from '../../types';
import { normalizeAlgerianPhone } from '../phone';
import { checkDuplicate, mergeProspects } from '../deduplication';

export const EXACT_EXCEL_COLUMNS = [
  '#',
  'الاسم / الصفحة',
  'نوع التاجر',
  'المنتج',
  'الولاية',
  'البلدية',
  'الهاتف',
  'واتساب؟',
  'الإيميل',
  'رابط الصفحة',
  'المصدر',
  'شركة التوصيل الحالية',
  'مستوى الولاء',
  'colis/يوم (تقدير)',
  'الحالة',
  'تاريخ التواصل',
  'المتابعة القادمة',
  'المسؤول',
  'ملاحظات',
  'تنبيه',
];

export interface ImportResult {
  totalRows: number;
  imported: number;
  mergedDuplicates: number;
  rejectedInvalidPhone: number;
  prospects: Prospect[];
  errors: string[];
}

/**
 * Converts a list of Prospects into the exact DROVA Excel row format
 */
export function prospectsToExcelData(prospects: Prospect[]) {
  return prospects.map((p, index) => ({
    '#': index + 1,
    'الاسم / الصفحة': p.name || p.page_name || '',
    'نوع التاجر': p.merchant_type || 'متجر إلكتروني',
    'المنتج': p.product || '',
    'الولاية': p.wilaya || '',
    'البلدية': p.commune || '',
    'الهاتف': p.phone || '',
    'واتساب؟': p.whatsapp || 'غير معروف',
    'الإيميل': p.email || '',
    'رابط الصفحة': p.page_url || '',
    'المصدر': p.source || '',
    'شركة التوصيل الحالية': p.current_courier || 'غير معروف',
    'مستوى الولاء': p.loyalty_level || 'Unknown',
    'colis/يوم (تقدير)': p.parcel_estimate || 'غير معروف',
    'الحالة': p.status || 'جديد',
    'تاريخ التواصل': p.contact_date || '',
    'المتابعة القادمة': p.next_followup || '',
    'المسؤول': p.responsible || '',
    'ملاحظات': p.notes || '',
    'تنبيه': p.alert || '',
  }));
}

/**
 * Generates and downloads an .xlsx file matching the DROVA specification
 */
export function exportToExcel(prospects: Prospect[], filename = 'DROVA_PROSPECTS_2026.xlsx') {
  const data = prospectsToExcelData(prospects);
  const worksheet = XLSX.utils.json_to_sheet(data, { header: EXACT_EXCEL_COLUMNS });

  // Set column widths for optimal display in Excel
  const colWidths = [
    { wch: 6 },  // #
    { wch: 28 }, // الاسم / الصفحة
    { wch: 18 }, // نوع التاجر
    { wch: 32 }, // المنتج
    { wch: 18 }, // الولاية
    { wch: 18 }, // البلدية
    { wch: 18 }, // الهاتف
    { wch: 12 }, // واتساب؟
    { wch: 22 }, // الإيميل
    { wch: 35 }, // رابط الصفحة
    { wch: 18 }, // المصدر
    { wch: 22 }, // شركة التوصيل الحالية
    { wch: 14 }, // مستوى الولاء
    { wch: 18 }, // colis/يوم (تقدير)
    { wch: 16 }, // الحالة
    { wch: 15 }, // تاريخ التواصل
    { wch: 15 }, // المتابعة القادمة
    { wch: 18 }, // المسؤول
    { wch: 30 }, // ملاحظات
    { wch: 18 }, // تنبيه
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects DROVA');

  XLSX.writeFile(workbook, filename);
}

/**
 * Generates and downloads a CSV file with UTF-8 BOM for Arabic compatibility
 */
export function exportToCSV(prospects: Prospect[], filename = 'DROVA_PROSPECTS_2026.csv') {
  const data = prospectsToExcelData(prospects);
  const worksheet = XLSX.utils.json_to_sheet(data, { header: EXACT_EXCEL_COLUMNS });
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Add UTF-8 BOM (\uFEFF) so Excel on Windows opens Arabic characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Smart Excel / CSV file importer (Section 36)
 */
export async function parseAndImportFile(
  file: File,
  existingProspects: Prospect[]
): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  let imported = 0;
  let mergedDuplicates = 0;
  let rejectedInvalidPhone = 0;
  const errors: string[] = [];

  const workingList = [...existingProspects];
  const resultProspects: Prospect[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNum = i + 2;

    // Detect column aliases
    const name = row['الاسم / الصفحة'] || row['اسم المتجر'] || row['Name'] || row['Business Name'] || row['Page Name'] || '';
    const phoneRaw = String(row['الهاتف'] || row['Phone'] || row['Telephone'] || row['Numéro'] || '');
    const wilaya = row['الولاية'] || row['Wilaya'] || '';
    const commune = row['البلدية'] || row['Commune'] || '';
    const product = row['المنتج'] || row['Product'] || row['Catégorie'] || '';
    const courier = row['شركة التوصيل الحالية'] || row['الناقل الحالي'] || row['Courier'] || 'غير معروف';
    const loyalty = row['مستوى الولاء'] || row['Loyalty'] || 'Unknown';
    const parcelEst = row['colis/يوم (تقدير)'] || row['تقدير الطرود'] || row['Parcel Estimate'] || 'غير معروف';
    const status = row['الحالة'] || row['Status'] || 'جديد';
    const pageUrl = row['رابط الصفحة'] || row['Page URL'] || row['Lien'] || '';
    const email = row['الإيميل'] || row['Email'] || '';
    const notes = row['ملاحظات'] || row['Notes'] || '';
    const responsible = row['المسؤول'] || row['Responsible'] || '';
    const contactDate = row['تاريخ التواصل'] || '';
    const nextFollowup = row['المتابعة القادمة'] || '';
    const alert = row['تنبيه'] || '';
    const whatsapp = row['واتساب؟'] || 'غير معروف';

    if (!name && !phoneRaw) {
      continue; // skip empty rows
    }

    // Phone normalization
    const phoneRes = normalizeAlgerianPhone(phoneRaw);
    if (!phoneRes.isValid) {
      rejectedInvalidPhone++;
      errors.push(`السطر ${rowNum}: رقم هاتف غير صالح (${phoneRaw || 'فارغ'}) للمتجر "${name}"`);
      continue;
    }

    const candidate: Partial<Prospect> = {
      name: name || `تاجر مستورد #${i + 1}`,
      phone: phoneRes.normalized,
      wilaya: wilaya || 'غير محدد',
      commune: commune || '',
      product,
      current_courier: courier,
      loyalty_level: loyalty as any,
      parcel_estimate: parcelEst as any,
      status: status as any,
      page_url: pageUrl,
      email,
      notes,
      responsible,
      contact_date: contactDate,
      next_followup: nextFollowup,
      alert,
      whatsapp: whatsapp as any,
      source_urls: pageUrl ? [pageUrl] : [],
    };

    const dup = checkDuplicate(candidate, workingList);
    if (dup.isMatch && dup.existingRecord) {
      mergedDuplicates++;
      const updated = mergeProspects(dup.existingRecord, candidate);
      const idx = workingList.findIndex(p => p.id === updated.id);
      if (idx !== -1) workingList[idx] = updated;
      const resIdx = resultProspects.findIndex(p => p.id === updated.id);
      if (resIdx !== -1) resultProspects[resIdx] = updated;
    } else {
      imported++;
      const now = new Date().toISOString();
      const newPros: Prospect = {
        id: `pros_imp_${Date.now()}_${i}`,
        name: candidate.name!,
        page_name: candidate.name!,
        merchant_type: 'متجر إلكتروني',
        product: candidate.product || 'منتجات مستوردة',
        category: 'ecommerce_general',
        wilaya: candidate.wilaya!,
        commune: candidate.commune || '',
        phone: phoneRes.normalized,
        whatsapp: candidate.whatsapp || 'غير معروف',
        email: candidate.email || '',
        page_url: candidate.page_url || '',
        source: 'excel_import',
        source_urls: candidate.source_urls || [],
        current_courier: candidate.current_courier || 'غير معروف',
        loyalty_level: candidate.loyalty_level || 'Unknown',
        parcel_estimate: candidate.parcel_estimate || 'غير معروف',
        status: candidate.status || 'جديد',
        contact_date: candidate.contact_date || '',
        next_followup: candidate.next_followup || '',
        responsible: candidate.responsible || '',
        notes: candidate.notes || 'مستورد من ملف خارجي',
        alert: candidate.alert || '',
        score: 'A',
        score_reasons: ['مستورد من قاعدة بيانات خارجية', 'رقم هاتف جزائري موثق'],
        verification_status: 'VERIFIED',
        verification_notes: 'تم التحقق من صحة الرقم الجزائري عند الاستيراد',
        phone_verification_status: 'VERIFIED',
        business_location_verification: candidate.wilaya ? 'PROBABLE' : 'UNVERIFIED',
        shipping_potential: 'HIGH',
        created_at: now,
        updated_at: now,
      };

      workingList.push(newPros);
      resultProspects.push(newPros);
    }
  }

  return {
    totalRows: rawRows.length,
    imported,
    mergedDuplicates,
    rejectedInvalidPhone,
    prospects: resultProspects,
    errors,
  };
}
