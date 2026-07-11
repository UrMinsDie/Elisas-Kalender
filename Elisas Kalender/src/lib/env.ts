export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
  siteUrl: (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'http://localhost:5173',
};

export function getMissingBrowserEnv() {
  return Object.entries({
    VITE_SUPABASE_URL: env.supabaseUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: env.supabasePublishableKey,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);
}
