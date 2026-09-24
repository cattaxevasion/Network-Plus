// ============================================================================
//  Cloud sync (Supabase). Leave both values empty to keep data in this browser only.
//  Both values are safe to commit to a public repo: the anon key is meant to be public.
//  Your data is protected by sign-in + Row Level Security (see supabase/schema.sql).
//  Never put the service_role key here.
// ============================================================================

/** Project Settings → API → Project URL, e.g. https://abcdefgh.supabase.co */
export const SUPABASE_URL = '';

/** Project Settings → API → Project API keys → anon / public (or the new "publishable" key) */
export const SUPABASE_ANON_KEY = 'sb_publishable_2UB1GLHPTLPVARkx4RqEGw_CtNDV-P7';

export const CLOUD_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
