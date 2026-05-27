import { Platform } from 'react-native';
import { assertApiKey, env } from '../config/env';

/** Build a URL for the given API path.
 *  On web: uses a relative /zalex-api prefix so the Metro dev server proxy
 *  forwards the request to Azure server-side (avoids browser CORS block).
 *  On native: uses the full base URL from env directly.
 */
function buildUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (Platform.OS === 'web') {
    // Local CORS proxy (scripts/proxy.js) forwards to https://zalexinc.azure-api.net
    return `http://localhost:3001${cleanPath}?subscription-key=${env.apiKey}`;
  }
  const base = env.apiBaseUrl.endsWith('/')
    ? env.apiBaseUrl.slice(0, -1)
    : env.apiBaseUrl;
  const url = new URL(cleanPath, base + '/');
  url.searchParams.set('subscription-key', env.apiKey);
  return url.toString();
}

/** GET request — throws on non-2xx. */
export async function getJson<T>(path: string): Promise<T> {
  assertApiKey();
  const response = await fetch(buildUrl(path), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** POST request — throws on non-2xx. */
export async function postJson<TReq, TRes>(
  path: string,
  body: TReq,
): Promise<TRes> {
  assertApiKey();
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<TRes>;
}
