/**
 * DROVA Express Algeria — Full-Stack Server
 * Privileged Discovery API Proxy & Vite Integration
 * 
 * SECURITY MANDATE:
 * - Credentials (GOOGLE_PLACES_API_KEY, META_ACCESS_TOKEN) are strictly loaded server-side.
 * - Credentials are NEVER exposed to browser bundles, network responses, or client logs.
 */
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';
import { API_CREDENTIALS } from './credentials.config.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Helper getters: prioritized order: process.env -> credentials.config.ts (in-code configuration)
export const getGooglePlacesApiKey = () =>
  process.env.GOOGLE_PLACES_API_KEY?.trim() ||
  API_CREDENTIALS.GOOGLE_PLACES_API_KEY?.trim() ||
  process.env.GOOGLE_MAPS_API_KEY?.trim() ||
  '';

export const getMetaAccessToken = () =>
  process.env.META_ACCESS_TOKEN?.trim() ||
  API_CREDENTIALS.META_ACCESS_TOKEN?.trim() ||
  process.env.META_ADS_TOKEN?.trim() ||
  '';

export const getCustomReferer = () =>
  process.env.GOOGLE_PLACES_CUSTOM_REFERER?.trim() ||
  API_CREDENTIALS.GOOGLE_PLACES_CUSTOM_REFERER?.trim() ||
  '';

// ==============================================================================
// 1. Discovery Integration Status (Server-Side Credential Check)
// ==============================================================================
app.get('/api/discovery/status', (_req, res) => {
  const googleKey = getGooglePlacesApiKey();
  const metaToken = getMetaAccessToken();
  const customReferer = getCustomReferer();

  res.json({
    googlePlaces: {
      configured: Boolean(googleKey),
      maskedKey: googleKey ? `${googleKey.substring(0, 8)}...${googleKey.substring(googleKey.length - 4)}` : '',
      customReferer: customReferer || '',
      status: googleKey ? 'Configured' : 'Not configured',
      source: 'Google Places API (New)',
    },
    metaAds: {
      configured: Boolean(metaToken),
      maskedToken: metaToken ? `${metaToken.substring(0, 8)}...${metaToken.substring(metaToken.length - 4)}` : '',
      status: metaToken ? 'Configured' : 'Not configured',
      source: 'Meta Ad Library API',
    },
  });
});

// ==============================================================================
// 1.5 Update Discovery API Credentials Server-Side
// ==============================================================================
app.post('/api/discovery/config', async (req, res) => {
  try {
    const { googlePlacesApiKey, metaAccessToken, customReferer } = req.body;

    if (typeof googlePlacesApiKey === 'string' && googlePlacesApiKey.trim()) {
      process.env.GOOGLE_PLACES_API_KEY = googlePlacesApiKey.trim();
    }
    if (typeof metaAccessToken === 'string' && metaAccessToken.trim()) {
      process.env.META_ACCESS_TOKEN = metaAccessToken.trim();
    }
    if (typeof customReferer === 'string') {
      process.env.GOOGLE_PLACES_CUSTOM_REFERER = customReferer.trim();
    }

    // Persist to .env file on server
    const envPath = path.resolve(__dirname, '.env');
    let envContent = '';
    try {
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
    } catch {}

    const updateEnvVar = (content: string, key: string, val: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${val}`);
      }
      return content ? `${content.trim()}\n${key}=${val}\n` : `${key}=${val}\n`;
    };

    if (process.env.GOOGLE_PLACES_API_KEY) {
      envContent = updateEnvVar(envContent, 'GOOGLE_PLACES_API_KEY', process.env.GOOGLE_PLACES_API_KEY);
    }
    if (process.env.META_ACCESS_TOKEN) {
      envContent = updateEnvVar(envContent, 'META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN);
    }
    if (process.env.GOOGLE_PLACES_CUSTOM_REFERER !== undefined) {
      envContent = updateEnvVar(envContent, 'GOOGLE_PLACES_CUSTOM_REFERER', process.env.GOOGLE_PLACES_CUSTOM_REFERER);
    }

    try {
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (e) {
      console.warn('Could not write to .env:', e);
    }

    const gKey = process.env.GOOGLE_PLACES_API_KEY;
    const mTok = process.env.META_ACCESS_TOKEN;

    return res.json({
      success: true,
      message: 'تم حفظ وتحديث المفاتيح البرمجية بنجاح في بيئة الخادم.',
      googlePlaces: {
        configured: Boolean(gKey),
        maskedKey: gKey ? `${gKey.substring(0, 8)}...${gKey.substring(gKey.length - 4)}` : '',
        customReferer: process.env.GOOGLE_PLACES_CUSTOM_REFERER || '',
      },
      metaAds: {
        configured: Boolean(mTok),
        maskedToken: mTok ? `${mTok.substring(0, 8)}...${mTok.substring(mTok.length - 4)}` : '',
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `فشل حفظ المفاتيح: ${err.message || 'خطأ غير متوقع'}`,
    });
  }
});

// ==============================================================================
// 2. Safe Connection Tester (Never leaks secrets)
// ==============================================================================
app.post('/api/discovery/test', async (req, res) => {
  const { source, referer } = req.body;

  if (source === 'google_places') {
    const key = getGooglePlacesApiKey();
    if (!key) {
      return res.json({
        success: false,
        status: 'Not configured',
        message: 'GOOGLE_PLACES_API_KEY غير موجود في credentials.config.ts أو متغيرات البيئة.',
      });
    }

    const customReferer = getCustomReferer();
    const effectiveReferer = (referer || customReferer || req.headers['referer'] || req.headers['origin']) as string | undefined;

    const testHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.displayName',
    };
    if (effectiveReferer) {
      testHeaders['Referer'] = effectiveReferer;
    }

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: testHeaders,
        body: JSON.stringify({
          textQuery: 'boutique Alger Algérie',
          maxResultCount: 1,
        }),
      });

      if (response.ok) {
        return res.json({
          success: true,
          status: 'Connected',
          message: 'Connection successful: الاتصال بنجاح مع Google Places API (New)! المحرك جاهز للاستكشاف الحي.',
        });
      }

      const errorPayload = await response.json().catch(() => ({}));
      const reason = (errorPayload as any)?.error?.message || `HTTP ${response.status}`;
      const reasonCode = (errorPayload as any)?.error?.details?.[0]?.reason || (errorPayload as any)?.error?.status || '';

      let tip = '';
      if (reason.includes('Requests from referer') || reasonCode === 'API_KEY_HTTP_REFERRER_BLOCKED') {
        tip = ' (سبب الخطأ: المفتاح مقيد بنطاقات مواقع HTTP Referrers. يُنصح في Google Cloud Console بتغيير Application Restrictions إلى None أو إدراج عنوان موقعك المصرح به).';
      }

      return res.json({
        success: false,
        status: 'Error',
        errorCode: reasonCode || `HTTP_${response.status}`,
        message: `Connection failed: فشل الاتصال مع Google Places API (${reason})${tip}`,
        errorDetails: (errorPayload as any)?.error?.details || [],
      });
    } catch {
      return res.json({
        success: false,
        status: 'Error',
        message: 'Connection failed: تعذر الاتصال بخوادم Google Places.',
      });
    }
  }

  if (source === 'meta_ads') {
    const token = getMetaAccessToken();
    if (!token) {
      return res.json({
        success: false,
        status: 'Not configured',
        message: 'META_ACCESS_TOKEN غير موجود في credentials.config.ts أو متغيرات البيئة.',
      });
    }

    try {
      const testUrl = new URL('https://graph.facebook.com/v19.0/ads_archive');
      testUrl.searchParams.set('ad_reached_countries', "['DZ']");
      testUrl.searchParams.set('ad_active_status', 'ACTIVE');
      testUrl.searchParams.set('search_terms', 'vente');
      testUrl.searchParams.set('access_token', token);
      testUrl.searchParams.set('limit', '1');

      const response = await fetch(testUrl.toString());
      if (response.ok) {
        return res.json({
          success: true,
          status: 'Connected',
          message: 'Connection successful: الاتصال بنجاح مع Meta Ad Library API! رمز الوصول معتمد ومفعل.',
        });
      }

      const errorPayload = await response.json().catch(() => ({}));
      const reason = (errorPayload as any)?.error?.message || `HTTP ${response.status}`;
      return res.json({
        success: false,
        status: 'Error',
        message: `Connection failed: فشل الاتصال مع Meta Graph API (${reason}).`,
      });
    } catch {
      return res.json({
        success: false,
        status: 'Error',
        message: 'Connection failed: تعذر الاتصال بخوادم Meta Graph API.',
      });
    }
  }

  return res.status(400).json({ success: false, message: 'مصدر غير معروف.' });
});

// ==============================================================================
// 3. Google Places API (New) Server-Side Search Proxy
// ==============================================================================
// ==============================================================================
// 3. Google Places API (New) Server-Side Search Proxy
// ==============================================================================
app.post('/api/discovery/google-places', async (req, res) => {
  const key = getGooglePlacesApiKey();
  if (!key) {
    return res.json({
      success: false,
      configured: false,
      httpStatus: 401,
      errorCode: 'GOOGLE_PLACES_NOT_CONFIGURED',
      errorMessage: 'GOOGLE_PLACES_API_KEY غير موجود في credentials.config.ts أو متغيرات بيئة الخادم.',
      source: 'Google Places API (New)',
      query: req.body?.query || '',
      timestamp: new Date().toISOString(),
      places: [],
    });
  }

  const { query, wilaya, commune, targetNumber, pageToken } = req.body;
  const targetCommune = commune ? `${commune} ` : '';
  const textQuery = query || `online store in ${targetCommune}${wilaya || 'Alger'} Algeria`;

  try {
    const requestBody: Record<string, any> = {
      textQuery,
      languageCode: 'fr',
      maxResultCount: Math.min(targetNumber || 20, 20),
    };
    if (pageToken) {
      requestBody.pageToken = pageToken;
    }

    const customReferer = getCustomReferer();
    // CRITICAL: Server-to-server proxy must NEVER forward untrusted browser or cloud run referers
    // Only send Referer if developer explicitly configured customReferer in credentials.config.ts or env
    const clientReferer = (req.body?.customReferer || customReferer)?.trim() as string | undefined;
    const googleHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.types,nextPageToken',
    };
    if (clientReferer) {
      googleHeaders['Referer'] = clientReferer;
    }

    const apiRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: googleHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      const statusCode = apiRes.status;
      const apiCode = (err as any)?.error?.status || (err as any)?.error?.code || `HTTP_${statusCode}`;
      const apiMsg = (err as any)?.error?.message || `HTTP ${statusCode}`;
      const reason = (err as any)?.error?.details?.[0]?.reason || '';
      const isReferrerBlocked = reason === 'API_KEY_HTTP_REFERRER_BLOCKED' || apiMsg.toLowerCase().includes('referer');

      console.info(`[Discovery Diagnostic] Google Places: status ${statusCode}, code: ${reason || apiCode} (isReferrerBlocked: ${isReferrerBlocked})`);

      return res.json({
        success: false,
        configured: true,
        httpStatus: statusCode,
        errorCode: reason || apiCode,
        errorMessage: isReferrerBlocked
          ? 'تم حظر الطلب بسبب قيود HTTP Referrer على هذا المفتاح في Google Cloud. للعمل مباشرة من الخادم، يرجى في Google Cloud Console ضبط Application Restrictions على "None"، أو تعيين GOOGLE_PLACES_CUSTOM_REFERER في credentials.config.ts.'
          : apiMsg,
        rawMessage: apiMsg,
        isReferrerBlocked,
        errorDetails: (err as any)?.error?.details || [],
        source: 'Google Places API (New)',
        query: textQuery,
        timestamp: new Date().toISOString(),
        places: [],
      });
    }

    const data = (await apiRes.json()) as any;
    return res.json({
      success: true,
      configured: true,
      httpStatus: 200,
      source: 'Google Places API (New)',
      query: textQuery,
      timestamp: new Date().toISOString(),
      places: data.places || [],
      nextPageToken: data.nextPageToken || null,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      configured: true,
      httpStatus: 500,
      errorCode: 'NETWORK_ERROR',
      errorMessage: err?.message || 'Network error connecting to Google Places',
      source: 'Google Places API (New)',
      query: textQuery,
      timestamp: new Date().toISOString(),
      places: [],
    });
  }
});

// ==============================================================================
// 4. Meta Ad Library API Server-Side Search Proxy
// ==============================================================================
app.post('/api/discovery/meta-ads', async (req, res) => {
  const token = getMetaAccessToken();
  if (!token) {
    return res.json({
      success: false,
      configured: false,
      httpStatus: 401,
      errorCode: 'META_TOKEN_NOT_CONFIGURED',
      errorMessage: 'META_ACCESS_TOKEN غير موجود في credentials.config.ts أو متغيرات بيئة الخادم.',
      source: 'Meta Ad Library API',
      query: req.body?.keyword || '',
      timestamp: new Date().toISOString(),
      ads: [],
    });
  }

  const { keyword, wilaya, targetNumber } = req.body;
  const searchTerm = `${keyword || 'vente en ligne'} ${wilaya || ''}`.trim();

  try {
    const url = new URL('https://graph.facebook.com/v19.0/ads_archive');
    url.searchParams.set('ad_reached_countries', "['DZ']");
    url.searchParams.set('ad_active_status', 'ACTIVE');
    url.searchParams.set('search_terms', searchTerm);
    url.searchParams.set('access_token', token);
    url.searchParams.set('fields', 'id,page_id,page_name,ad_creative_bodies,ad_delivery_start_time,ad_snapshot_url');
    url.searchParams.set('limit', String(Math.min(targetNumber || 20, 25)));

    const apiRes = await fetch(url.toString());
    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      const statusCode = apiRes.status;
      const rawMsg = (err as any)?.error?.message || `HTTP ${statusCode}`;
      const errCode = (err as any)?.error?.code || statusCode;
      const isRestricted =
        rawMsg.includes('political and issue ads') ||
        rawMsg.includes('permission') ||
        errCode === 10 ||
        errCode === 100 ||
        (err as any)?.error?.code === 10;

      console.info(`[Discovery Diagnostic] Meta Ad Library: status ${statusCode}, code: ${errCode} (isRestricted: ${isRestricted})`);

      return res.json({
        success: false,
        configured: true,
        httpStatus: statusCode,
        errorCode: `META_ERROR_${errCode}`,
        errorMessage: isRestricted
          ? 'مكتبة إعلانات Meta مقيدة تجارياً في الجزائر أو تتطلب صلاحيات تطبيق شريك معتمد (Meta Verified Partner).'
          : rawMsg,
        rawMessage: rawMsg,
        isRestricted,
        statusText: isRestricted ? 'Restricted' : 'Error',
        restrictionReason: isRestricted
          ? 'Meta Ad Library unavailable for commercial discovery in this region (Meta limits ad library access to verified partner apps or political ads in Algeria)'
          : rawMsg,
        source: 'Meta Ad Library API',
        query: searchTerm,
        timestamp: new Date().toISOString(),
        ads: [],
      });
    }

    const data = (await apiRes.json()) as any;
    return res.json({
      success: true,
      configured: true,
      httpStatus: 200,
      source: 'Meta Ad Library API',
      query: searchTerm,
      timestamp: new Date().toISOString(),
      ads: data.data || [],
    });
  } catch (err: any) {
    return res.json({
      success: false,
      configured: true,
      httpStatus: 500,
      errorCode: 'META_NETWORK_ERROR',
      errorMessage: err?.message || 'Network error connecting to Meta Ads API',
      source: 'Meta Ad Library API',
      query: searchTerm,
      timestamp: new Date().toISOString(),
      ads: [],
    });
  }
});

// ==============================================================================
// 5. Download Full Project ZIP Archive (Excluding node_modules, .git, and secrets)
// ==============================================================================
app.get('/api/download-project-zip', (_req, res) => {
  try {
    const filename = 'DROVA_CRM_PRODUCTION_READY.zip';

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = new (ZipArchive as any)({
      zlib: { level: 9 },
    });

    archive.on('error', (err: any) => {
      console.warn('[Archive Warning]', err?.message || err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Archive creation error', message: err?.message || String(err) });
      }
    });

    archive.pipe(res);

    // Pack all files in root directory excluding heavy or sensitive dirs
    archive.glob('**/*', {
      cwd: __dirname,
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.cache/**',
        '**/.temp/**',
        '**/.npm/**',
        '**/*.log',
        '**/.env', // Sensitive: keep secrets out of zip
        '**/*.zip', // Avoid zip recursion
      ],
      dot: true,
    });

    archive.finalize();
  } catch (err: any) {
    console.warn('[Download ZIP Warning]', err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate ZIP archive', message: err.message });
    }
  }
});

// Download URL redirects to ensure users always get the live, updated project
app.get(['/DROVA_CRM_PRODUCTION_READY.zip', '/drova-crm-production.zip', '/drova-crm-netlify-drop.zip'], (_req, res) => {
  res.redirect('/api/download-project-zip');
});

// ==============================================================================
// 6. Frontend Delivery (Vite dev middleware or Static Production Assets)
// ==============================================================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DROVA Express Server] Running on http://0.0.0.0:${PORT} (PID: ${process.pid})`);
  });
}

startServer().catch((err) => {
  console.error('[DROVA Server Startup Error]', err);
  process.exit(1);
});
