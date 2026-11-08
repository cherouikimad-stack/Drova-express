/**
 * Complete official list of 69 Algerian Wilayas and major Communes
 * Conforms to the official Algerian Territorial Organization (69 Wilayas & 1,541 Communes)
 * Includes the 11 newly promoted full wilayas:
 * 59. Aflou (آفلو)
 * 60. Barika (بريكة)
 * 61. El Kantara (القنطرة)
 * 62. Bir El Ater (بئر العاتر)
 * 63. El Aricha (العريشة)
 * 64. Ksar Chellala (قصر الشلالة)
 * 65. Aïn Oussera (عين وسارة)
 * 66. Messaad (مسعد)
 * 67. Ksar El Boukhari (قصر البخاري)
 * 68. Bou Saâda (بوسعادة)
 * 69. El Bayadh Sidi Cheikh (الأبيض سيدي الشيخ)
 */
import { Wilaya } from '../types';

export const ALGERIA_WILAYAS: Wilaya[] = [
  { code: '01', nameAr: 'أدرار', nameFr: 'Adrar', communes: ['أدرار', 'تمنطيط', 'فنوغيل', 'زاوية كنتة', 'رقان', 'أولف', 'تسابيت'] },
  { code: '02', nameAr: 'الشلف', nameFr: 'Chlef', communes: ['الشلف', 'تنس', 'أولاد فارس', 'بوقادير', 'وادي الفضة', 'زبوجة', 'عين مران', 'الكريمية'] },
  { code: '03', nameAr: 'الأغواط', nameFr: 'Laghouat', communes: ['الأغواط', 'قصر الحيران', 'عين ماضي', 'حاسي الرمل', 'سيدي مخلوف', 'الخنق', 'بن ناصر بن شهرة'] },
  { code: '04', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi', communes: ['أم البواقي', 'عين البيضاء', 'عين مليلة', 'سيقوس', 'مسكيانة', 'عين فكرون', 'عين كرشة'] },
  { code: '05', nameAr: 'باتنة', nameFr: 'Batna', communes: ['باتنة', 'عين التوتة', 'مروانة', 'نقاوس', 'أريس', 'تازولت', 'المعذر', 'رأس العيون', 'ثنية العابد'] },
  { code: '06', nameAr: 'بجاية', nameFr: 'Béjaïa', communes: ['بجاية', 'أميزور', 'أقبو', 'صدوق', 'سيدي عيش', 'خراطة', 'أوقاس', 'تيشي', 'القصر', 'شميني'] },
  { code: '07', nameAr: 'بسكرة', nameFr: 'Biskra', communes: ['بسكرة', 'طولقة', 'سيدي عقبة', 'زريبة الوادي', 'فرفار', 'الحوش', 'برج بن عزوز'] },
  { code: '08', nameAr: 'بشار', nameFr: 'Béchar', communes: ['بشار', 'القنادسة', 'العبادلة', 'تاغيت', 'بني ونيف', 'موغل', 'لحمر'] },
  { code: '09', nameAr: 'البليدة', nameFr: 'Blida', communes: ['البليدة', 'بوفاريك', 'أولاد يعيش', 'موزاية', 'العفرون', 'الشبلي', 'بوقرة', 'الأربعاء', 'وادي العلايق', 'بني تامو'] },
  { code: '10', nameAr: 'البويرة', nameFr: 'Bouira', communes: ['البويرة', 'سور الغزلان', 'الأخضرية', 'عين بسام', 'مشد الله', 'القادرية', 'برج أوخريص', 'حيزر'] },
  { code: '11', nameAr: 'تمنراست', nameFr: 'Tamanrasset', communes: ['تمنراست', 'أبلسة', 'إيدلس', 'تازروك', 'عين امقل'] },
  { code: '12', nameAr: 'تبسة', nameFr: 'Tébessa', communes: ['تبسة', 'الشريعة', 'العوينات', 'الونزة', 'مرسط', 'الماء الأبيض', 'بولحاف الدير'] },
  { code: '13', nameAr: 'تلمسان', nameFr: 'Tlemcen', communes: ['تلمسان', 'مغنية', 'منصورة', 'شتوان', 'الرمشي', 'ندرومة', 'الغزوات', 'أولاد ميمون', 'الحناية'] },
  { code: '14', nameAr: 'تيارت', nameFr: 'Tiaret', communes: ['تيارت', 'السوقر', 'فرندة', 'مهدية', 'الرحوية', 'مدروسة', 'الدحموني', 'عين دزاريت'] },
  { code: '15', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou', communes: ['تيزي وزو', 'ذراع بن خدة', 'عزازقة', 'تيزي غنيف', 'لاربعا نايث إيراثن', 'واضية', 'بوقلمون', 'بوغني', 'بني دوالة'] },
  { code: '16', nameAr: 'الجزائر العاصمة', nameFr: 'Alger', communes: ['الجزائر الوسطى', 'سيدي امحمد', 'باب الواد', 'حيدرة', 'الأبيار', 'القبة', 'الحراش', 'الرويبة', 'الدار البيضاء', 'دالي براهيم', 'بئر مراد رايس', 'بن عكنون', 'برج البحري', 'زرالدة', 'الشراقة', 'عين البنيان', 'بئر خادم', 'بابا حسن', 'درارية'] },
  { code: '17', nameAr: 'الجلفة', nameFr: 'Djelfa', communes: ['الجلفة', 'حاسي بحبح', 'الشارف', 'دار الشيوخ', 'الادريسية', 'الزعفران', 'سيدي بايزيد'] },
  { code: '18', nameAr: 'جيجل', nameFr: 'Jijel', communes: ['جيجل', 'الطاهير', 'الميلية', 'العوانة', 'زيامة منصورية', 'الشقفة', 'الأنصار', 'تاكسنة'] },
  { code: '19', nameAr: 'سطيف', nameFr: 'Sétif', communes: ['سطيف', 'العلمة', 'عين أرنات', 'عين ولمان', 'بوقاعة', 'عموشة', 'جميلة', 'عين الكبيرة', 'صالح باي', 'قجال'] },
  { code: '20', nameAr: 'سعيدة', nameFr: 'Saïda', communes: ['سعيدة', 'عين الحجر', 'يوب', 'أولاد براهيم', 'الحساسنة', 'سيدي بوبكر'] },
  { code: '21', nameAr: 'سكيكدة', nameFr: 'Skikda', communes: ['سكيكدة', 'القل', 'عزابة', 'الحروش', 'تمالوس', 'رمضان جمال', 'بين الويدان', 'سيدي مزغيش'] },
  { code: '22', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', communes: ['سيدي بلعباس', 'تلاغ', 'سفيزف', 'بن باديس', 'مرحوم', 'سيدي علي بن يوب', 'رأس الماء'] },
  { code: '23', nameAr: 'عنابة', nameFr: 'Annaba', communes: ['عنابة', 'البوني', 'سيدي عمار', 'الحجار', 'برحال', 'عين الباردة', 'سرايدي', 'شطايبي'] },
  { code: '24', nameAr: 'قالمة', nameFr: 'Guelma', communes: ['قالمة', 'وادي الزناتي', 'بوشقوف', 'هيليوبوليس', 'عين مخلوف', 'بلخير', 'حمام دباغ'] },
  { code: '25', nameAr: 'قسنطينة', nameFr: 'Constantine', communes: ['قسنطينة', 'الخروب', 'عين سمارة', 'حامة بوزيان', 'ديدوش مراد', 'زيغود يوسف', 'ابن باديس', 'علي منجلي'] },
  { code: '26', nameAr: 'المدية', nameFr: 'Médéa', communes: ['المدية', 'البرواقية', 'بني سليمان', 'تابلاط', 'وزرة', 'شلالة العذاورة', 'سي المحجوب'] },
  { code: '27', nameAr: 'مستغانم', nameFr: 'Mostaganem', communes: ['مستغانم', 'عين تادلس', 'سيدي علي', 'خير الدين', 'حاسي مماش', 'بوقيرات', 'سيدي لخضر'] },
  { code: '28', nameAr: 'المسيلة', nameFr: 'M\'Sila', communes: ['المسيلة', 'سيدي عيسى', 'مقرة', 'عين الحجل', 'أولاد دراج', 'حمام الضلعة', 'سيدي هجرس'] },
  { code: '29', nameAr: 'معسكر', nameFr: 'Mascara', communes: ['معسكر', 'سيق', 'تيغنيف', 'المحمدية', 'غريس', 'وادي الأبطال', 'عوف', 'بوحنيفية'] },
  { code: '30', nameAr: 'ورقلة', nameFr: 'Ouargla', communes: ['ورقلة', 'حاسي مسعود', 'سيدي خويلد', 'الرويسات', 'عين البيضاء', 'البرمة'] },
  { code: '31', nameAr: 'وهران', nameFr: 'Oran', communes: ['وهران', 'السانية', 'بئر الجير', 'عين الترك', 'أرزيو', 'قديل', 'بطيوة', 'مرسى الكبير', 'بوتليليس', 'الكرمة'] },
  { code: '32', nameAr: 'البيض', nameFr: 'El Bayadh', communes: ['البيض', 'بوقطب', 'رقاصة', 'كاف لحمر', 'الخيثر', 'توسمولين'] },
  { code: '33', nameAr: 'إليزي', nameFr: 'Illizi', communes: ['إليزي', 'إن أمناس', 'برج عمر إدريس', 'دبداب'] },
  { code: '34', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj', communes: ['برج بوعريريج', 'رأس الوادي', 'برج زمورة', 'المنصورة', 'الحمادية', 'مجانة', 'عين تاغروت'] },
  { code: '35', nameAr: 'بومرداس', nameFr: 'Boumerdès', communes: ['بومرداس', 'الرغاية', 'برج منايل', 'بودواو', 'دلس', 'يسر', 'خميس الخشنة', 'الثنية', 'الأربعطاش'] },
  { code: '36', nameAr: 'الطارف', nameFr: 'El Tarf', communes: ['الطارف', 'القالة', 'بن مهيدي', 'بوثلجة', 'الذرعان', 'بوحجار', 'عين العسل'] },
  { code: '37', nameAr: 'تندوف', nameFr: 'Tindouf', communes: ['تندوف', 'أم العسل'] },
  { code: '38', nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt', communes: ['تيسمسيلت', 'ثنية الحد', 'لرجام', 'خميستي', 'عماري', 'برج بونعامة'] },
  { code: '39', nameAr: 'الوادي', nameFr: 'El Oued', communes: ['الوادي', 'قمار', 'الدبيلة', 'الرقيبة', 'المقرن', 'البياضة', 'الرباح'] },
  { code: '40', nameAr: 'خنشلة', nameFr: 'Khenchela', communes: ['خنشلة', 'ششار', 'قايس', 'بابار', 'أولاد رشاش', 'المحمل', 'بوحمامة'] },
  { code: '41', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras', communes: ['سوق أهراس', 'سدراتة', 'مداوروش', 'تاغاست', 'أولاد إدريس', 'بئر بوحوش'] },
  { code: '42', nameAr: 'تيبازة', nameFr: 'Tipaza', communes: ['تيبازة', 'شرشال', 'القليعة', 'بوسماعيل', 'حجوط', 'فوكة', 'الداموس', 'سيدي غيلاس', 'بورقيقة'] },
  { code: '43', nameAr: 'ميلة', nameFr: 'Mila', communes: ['ميلة', 'شلغوم العيد', 'فرجيوة', 'تاجنانت', 'التلاغمة', 'سيدي مروان', 'قرارم قوقة'] },
  { code: '44', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla', communes: ['عين الدفلى', 'خميس مليانة', 'العطاف', 'مليانة', 'جليدة', 'الروينة', 'بوراشد'] },
  { code: '45', nameAr: 'النعامة', nameFr: 'Naâma', communes: ['النعامة', 'المشرية', 'عين الصفراء', 'مكمن بن عمار', 'عسلة', 'تيوت', 'صفيصيفة'] },
  { code: '46', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent', communes: ['عين تموشنت', 'بني صاف', 'حمام بوحجر', 'العامرية', 'عين الكيحل', 'المالح'] },
  { code: '47', nameAr: 'غرداية', nameFr: 'Ghardaïa', communes: ['غرداية', 'بني يزقن', 'القرارة', 'بريان', 'متليلي', 'ضاية بن ضحوة', 'العطف'] },
  { code: '48', nameAr: 'غليزان', nameFr: 'Relizane', communes: ['غليزان', 'وادي ارهيو', 'مازونة', 'يلل', 'عمي موسى', 'زمورة', 'جديوية'] },
  { code: '49', nameAr: 'تيميمون', nameFr: 'Timimoun', communes: ['تيميمون', 'شروين', 'أوقروت', 'تينركوك', 'دلدول', 'طلمين'] },
  { code: '50', nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar', communes: ['برج باجي مختار', 'تيمياوين'] },
  { code: '51', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal', communes: ['أولاد جلال', 'سيدي خالد', 'الدوسن', 'الشعيبة', 'البسباس', 'رأس الميعاد'] },
  { code: '52', nameAr: 'بني عباس', nameFr: 'Béni Abbès', communes: ['بني عباس', 'كرزاز', 'إقلي', 'الوطاية', 'تيمودي', 'تبلبالة'] },
  { code: '53', nameAr: 'عين صالح', nameFr: 'In Salah', communes: ['عين صالح', 'فقارة الزوى', 'إن غار'] },
  { code: '54', nameAr: 'عين قزام', nameFr: 'In Guezzam', communes: ['عين قزام', 'تين زواتين'] },
  { code: '55', nameAr: 'تقرت', nameFr: 'Touggourt', communes: ['تقرت', 'الطيبات', 'تماسين', 'المقارن', 'النزلة', 'بلدة عمر', 'سيدي سليمان'] },
  { code: '56', nameAr: 'جانت', nameFr: 'Djanet', communes: ['جانت', 'برج الحواس'] },
  { code: '57', nameAr: 'المغير', nameFr: 'El M\'Ghair', communes: ['المغير', 'جامعة', 'سيدي عمران', 'أم الطيور', 'تندلة'] },
  { code: '58', nameAr: 'المنيعة', nameFr: 'El Meniaa', communes: ['المنيعة', 'حاسي القارة', 'حاسي الفحل'] },

  // --- Official 11 Newly Promoted Full Wilayas (59 to 69) ---
  { code: '59', nameAr: 'آفلو', nameFr: 'Aflou', communes: ['آفلو', 'سيدي بوزيد', 'سبقاق', 'تاويالة', 'بريدة', 'الغيشة', 'الحاج مشري'] },
  { code: '60', nameAr: 'بريكة', nameFr: 'Barika', communes: ['بريكة', 'أولاد عمار', 'بيطام', 'أمدوكال', 'الجزار', 'سقانة', 'بومقر'] },
  { code: '61', nameAr: 'القنطرة', nameFr: 'El Kantara', communes: ['القنطرة', 'عين زعطوط', 'الوطاية', 'جمورة', 'برانيس'] },
  { code: '62', nameAr: 'بئر العاتر', nameFr: 'Bir El Ater', communes: ['بئر العاتر', 'العقلة', 'نقرين', 'فركان', 'أم علي', 'صفصاف الوسرى'] },
  { code: '63', nameAr: 'العريشة', nameFr: 'El Aricha', communes: ['العريشة', 'سبدو', 'البويهي', 'سيدي الجيلالي', 'القور'] },
  { code: '64', nameAr: 'قصر الشلالة', nameFr: 'Ksar Chellala', communes: ['قصر الشلالة', 'سرغين', 'زمالة الأمير عبد القادر', 'الرشايقة'] },
  { code: '65', nameAr: 'عين وسارة', nameFr: 'Aïn Oussera', communes: ['عين وسارة', 'البيرين', 'بنهار', 'سيدي لعجال', 'حاسي فدول'] },
  { code: '66', nameAr: 'مسعد', nameFr: 'Messaad', communes: ['مسعد', 'فيض البطمة', 'سلمانة', 'أم العظام', 'قطارة', 'دلول'] },
  { code: '67', nameAr: 'قصر البخاري', nameFr: 'Ksar El Boukhari', communes: ['قصر البخاري', 'المفاتحة', 'سانق', 'أولاد هلال', 'عين بوسيف', 'العيساوية'] },
  { code: '68', nameAr: 'بوسعادة', nameFr: 'Bou Saâda', communes: ['بوسعادة', 'أولاد سيدي إبراهيم', 'سيدي عامر', 'تامسة', 'بن سرور', 'ولهاصة', 'الهامل'] },
  { code: '69', nameAr: 'الأبيض سيدي الشيخ', nameFr: 'El Bayadh Sidi Cheikh', communes: ['الأبيض سيدي الشيخ', 'عين العراك', 'بريزينة', 'بوسمغون', 'شلالة', 'الكاف الأحمر', 'أربوات'] },
];

export const TOTAL_WILAYAS_COUNT = 69;

export function getWilayaByCode(code: string): Wilaya | undefined {
  if (!code) return undefined;
  const normalized = code.trim().padStart(2, '0');
  return ALGERIA_WILAYAS.find(w => w.code === normalized);
}

export function getWilayaByName(name: string): Wilaya | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();
  return ALGERIA_WILAYAS.find(
    w =>
      w.nameAr.toLowerCase() === clean ||
      w.nameFr.toLowerCase() === clean ||
      clean.includes(w.nameAr.toLowerCase()) ||
      clean.includes(w.nameFr.toLowerCase())
  );
}

export function searchWilayas(query: string): Wilaya[] {
  if (!query) return ALGERIA_WILAYAS;
  const q = query.trim().toLowerCase();
  return ALGERIA_WILAYAS.filter(
    w =>
      w.code.includes(q) ||
      w.nameAr.toLowerCase().includes(q) ||
      w.nameFr.toLowerCase().includes(q) ||
      w.communes.some(c => c.toLowerCase().includes(q))
  );
}
