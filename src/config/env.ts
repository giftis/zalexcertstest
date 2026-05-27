/** Read-only config derived from Expo public env vars. */
export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_ZALEX_API_BASE_URL ??
    'https://zalexinc.azure-api.net',
  apiKey: process.env.EXPO_PUBLIC_ZALEX_API_KEY ?? '',
} as const;

/**
 * Throws if the API key is missing.
 * Called at the start of every API request so issues surface early.
 */
export function assertApiKey(): void {
  if (!env.apiKey.trim()) {
    throw new Error(
      'Missing EXPO_PUBLIC_ZALEX_API_KEY. Add it to .env.local before running.',
    );
  }
}
