/* Rapid Campaign V2 Supabase configuration. */
window.RAPID_CAMPAIGN_SUPABASE = {
  url: "https://lrgljkpgmsjeufyqqqfi.supabase.co",
  publishableKey: "sb_publishable_ztatvzK3clfYfr9LZDz4Pg_RZuXmuQx"
};
if (!window.supabase) throw new Error('Supabase client library is not loaded.');
window.cpSupabase = window.supabase.createClient(
  window.RAPID_CAMPAIGN_SUPABASE.url,
  window.RAPID_CAMPAIGN_SUPABASE.publishableKey,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
