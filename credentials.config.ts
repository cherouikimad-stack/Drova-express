/**
 * ==============================================================================
 * DROVA Express Algeria — Discovery API Credentials & Keys Configuration
 * ==============================================================================
 * يمكنك وضع وتعديل مفاتيح الـ API الخاصة بك هنا مباشرة في هذا الملف:
 * 
 * 1. GOOGLE_PLACES_API_KEY: مفتاح Google Places API (New)
 * 2. META_ACCESS_TOKEN: رمز وصول Meta Ad Library / Graph API
 * 3. GOOGLE_PLACES_CUSTOM_REFERER: عنوان المرجع المسموح (اختياري لحل قيود Referer)
 * ==============================================================================
 */

export const API_CREDENTIALS = {
  // مفتاح Google Places API (New) — ضَع مفتاحك هنا
  // ملاحظة: لخوادم Node.js يُنصح بضبط Application Restrictions على 'None' في Google Cloud Console
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyCALhoC-_FSN5tVIErTvQfAEun28nXNVLU',

  // رمز وصول Meta Ad Library API — ضَع الرمز هنا
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '1100742089496204|tj572Nx9YagY_r5TtxpCy5juBp8',

  // عنوان HTTP Referer المسموح (اختياري: ضعه فقط إذا قمت بتقييد المفتاح بنطاق محدد، وإلا اتركه فارغاً)
  GOOGLE_PLACES_CUSTOM_REFERER: process.env.GOOGLE_PLACES_CUSTOM_REFERER || '',
};
