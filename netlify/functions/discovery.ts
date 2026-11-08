/**
 * Netlify Serverless Function for DROVA Express Merchant Discovery
 * Handles /api/discovery/* requests in Netlify production deployments
 * 
 * SECURITY MANDATE:
 * - Reads GOOGLE_PLACES_API_KEY and META_ACCESS_TOKEN from process.env (Netlify Environment Variables)
 * - Secrets NEVER reach the client bundle
 */

import { API_CREDENTIALS } from '../../credentials.config.ts';

interface HandlerEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string>;
  body: string | null;
}

const getGooglePlacesApiKey = () =>
  process.env.GOOGLE_PLACES_API_KEY?.trim() ||
  API_CREDENTIALS.GOOGLE_PLACES_API_KEY?.trim() ||
  process.env.GOOGLE_MAPS_API_KEY?.trim() ||
  '';

const getMetaAccessToken = () =>
  process.env.META_ACCESS_TOKEN?.trim() ||
  API_CREDENTIALS.META_ACCESS_TOKEN?.trim() ||
  process.env.META_ADS_TOKEN?.trim() ||
  '';

const getCustomReferer = () =>
  process.env.GOOGLE_PLACES_CUSTOM_REFERER?.trim() ||
  API_CREDENTIALS.GOOGLE_PLACES_CUSTOM_REFERER?.trim() ||
  '';

export const handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const body = event.body ? JSON.parse(event.body) : {};

  // 1. GET /api/discovery/status
  if (path.endsWith('/status') || path.endsWith('/status/')) {
    const googleKey = getGooglePlacesApiKey();
    const metaToken = getMetaAccessToken();
    const customReferer = getCustomReferer();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
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
      }),
    };
  }

  // 1.5 POST /api/discovery/config
  if (path.endsWith('/config') || path.endsWith('/config/')) {
    const { googlePlacesApiKey, metaAccessToken, customReferer } = body;
    if (typeof googlePlacesApiKey === 'string' && googlePlacesApiKey.trim()) {
      process.env.GOOGLE_PLACES_API_KEY = googlePlacesApiKey.trim();
    }
    if (typeof metaAccessToken === 'string' && metaAccessToken.trim()) {
      process.env.META_ACCESS_TOKEN = metaAccessToken.trim();
    }
    if (typeof customReferer === 'string') {
      process.env.GOOGLE_PLACES_CUSTOM_REFERER = customReferer.trim();
    }

    const gKey = process.env.GOOGLE_PLACES_API_KEY;
    const mTok = process.env.META_ACCESS_TOKEN;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'تم حفظ وتحديث المفاتيح بنجاح في بيئة السيرفر.',
        googlePlaces: {
          configured: Boolean(gKey),
          maskedKey: gKey ? `${gKey.substring(0, 8)}...${gKey.substring(gKey.length - 4)}` : '',
          customReferer: process.env.GOOGLE_PLACES_CUSTOM_REFERER || '',
        },
        metaAds: {
          configured: Boolean(mTok),
          maskedToken: mTok ? `${mTok.substring(0, 8)}...${mTok.substring(mTok.length - 4)}` : '',
        },
      }),
    };
  }

  // 2. POST /api/discovery/test
  if (path.endsWith('/test') || path.endsWith('/test/')) {
    const { source, referer } = body;

    if (source === 'google_places') {
      const key = getGooglePlacesApiKey();
      if (!key) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'Not configured',
            message: 'GOOGLE_PLACES_API_KEY غير موجود في credentials.config.ts أو متغيرات بيئة Netlify.',
          }),
        };
      }

      const customReferer = getCustomReferer();
      const effectiveReferer = (referer || customReferer || event.headers['referer'] || event.headers['origin']) as string | undefined;
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
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              status: 'Connected',
              message: 'Connection successful: الاتصال بنجاح مع Google Places API (New) عبر Netlify Function!',
            }),
          };
        }

        const err = await response.json().catch(() => ({}));
        const reason = (err as any)?.error?.message || `HTTP ${response.status}`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'Error',
            message: `Connection failed: فشل الاتصال مع Google Places API (${reason}).`,
          }),
        };
      } catch {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'Error',
            message: 'Connection failed: تعذر الاتصال بخوادم Google Places.',
          }),
        };
      }
    }

    if (source === 'meta_ads') {
      const token = getMetaAccessToken();
      if (!token) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'Not configured',
            message: 'META_ACCESS_TOKEN غير موجود في credentials.config.ts أو متغيرات بيئة Netlify.',
          }),
        };
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
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              status: 'Connected',
              message: 'Connection successful: الاتصال بنجاح مع Meta Ad Library API!',
            }),
          };
        }

        const err = await response.json().catch(() => ({}));
        const reason = (err as any)?.error?.message || `HTTP ${response.status}`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'Error',
            message: `Connection failed: فشل الاتصال مع Meta Graph API (${reason}).`,
          }),
        };
      } catch {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            status: 'Error',
            message: 'Connection failed: تعذر الاتصال بخوادم Meta Graph API.',
          }),
        };
      }
    }
  }

  // 3. POST /api/discovery/google-places
  if (path.endsWith('/google-places') || path.endsWith('/google-places/')) {
    const key = getGooglePlacesApiKey();
    if (!key) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          configured: false,
          httpStatus: 401,
          errorCode: 'GOOGLE_PLACES_NOT_CONFIGURED',
          errorMessage: 'GOOGLE_PLACES_API_KEY غير موجود في credentials.config.ts أو متغيرات بيئة Netlify.',
          source: 'Google Places API (New)',
          query: body?.query || '',
          timestamp: new Date().toISOString(),
          places: [],
        }),
      };
    }

    const { query, wilaya, commune, targetNumber, pageToken } = body;
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

      const clientReferer = (event.headers['referer'] || event.headers['origin'] || process.env.URL || 'https://drova-express.netlify.app/') as string;
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

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            configured: true,
            httpStatus: statusCode,
            errorCode: apiCode,
            errorMessage: apiMsg,
            errorDetails: (err as any)?.error?.details || [],
            source: 'Google Places API (New)',
            query: textQuery,
            timestamp: new Date().toISOString(),
            places: [],
          }),
        };
      }

      const data = (await apiRes.json()) as any;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          configured: true,
          httpStatus: 200,
          source: 'Google Places API (New)',
          query: textQuery,
          timestamp: new Date().toISOString(),
          places: data.places || [],
          nextPageToken: data.nextPageToken || null,
        }),
      };
    } catch (err: any) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          configured: true,
          httpStatus: 500,
          errorCode: 'NETWORK_ERROR',
          errorMessage: err?.message || 'Network error connecting to Google Places',
          source: 'Google Places API (New)',
          query: textQuery,
          timestamp: new Date().toISOString(),
          places: [],
        }),
      };
    }
  }

  // 4. POST /api/discovery/meta-ads
  if (path.endsWith('/meta-ads') || path.endsWith('/meta-ads/')) {
    const token = getMetaAccessToken();
    if (!token) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          configured: false,
          httpStatus: 401,
          errorCode: 'META_TOKEN_NOT_CONFIGURED',
          errorMessage: 'META_ACCESS_TOKEN غير موجود في credentials.config.ts أو متغيرات بيئة Netlify.',
          source: 'Meta Ad Library API',
          query: body?.keyword || '',
          timestamp: new Date().toISOString(),
          ads: [],
        }),
      };
    }

    const { keyword, wilaya, targetNumber } = body;
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
        const isRestricted = rawMsg.includes('political and issue ads') || errCode === 100;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            configured: true,
            httpStatus: statusCode,
            errorCode: `META_ERROR_${errCode}`,
            errorMessage: rawMsg,
            isRestricted,
            statusText: isRestricted ? 'Restricted' : 'Error',
            restrictionReason: isRestricted
              ? 'Commercial Ad Library access unavailable for this region (Meta restricts ads_archive to political ads in Algeria unless using Verified Partner Business App)'
              : rawMsg,
            source: 'Meta Ad Library API',
            query: searchTerm,
            timestamp: new Date().toISOString(),
            ads: [],
          }),
        };
      }

      const data = (await apiRes.json()) as any;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          configured: true,
          httpStatus: 200,
          source: 'Meta Ad Library API',
          query: searchTerm,
          timestamp: new Date().toISOString(),
          ads: data.data || [],
        }),
      };
    } catch (err: any) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          configured: true,
          httpStatus: 500,
          errorCode: 'META_NETWORK_ERROR',
          errorMessage: err?.message || 'Network error connecting to Meta Ads API',
          source: 'Meta Ad Library API',
          query: searchTerm,
          timestamp: new Date().toISOString(),
          ads: [],
        }),
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not Found' }),
  };
};
