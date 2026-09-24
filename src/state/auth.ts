// Sign-in with GitHub through Supabase Auth.
// Only used when cloud sync is configured (src/config/supabase.ts).

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { CLOUD_ENABLED, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/supabase';
import { cloudBackend, type Backend } from './backend';
import { fakeCloud } from './fakeCloud';

export interface AppUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Auth {
  /** Called now with the current user (or null), then on every sign-in / sign-out. */
  onChange(cb: (user: AppUser | null) => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  /** Error from a failed sign-in redirect (e.g. sign-ups disabled), removed from the URL once read. */
  takeUrlError(): string | null;
  backendFor(user: AppUser): Backend;
}

function toAppUser(u: User): AppUser {
  const m = u.user_metadata ?? {};
  return {
    id: u.id,
    name: (m.user_name as string) || (m.preferred_username as string) || (m.full_name as string) || u.email || 'GitHub user',
    avatarUrl: m.avatar_url as string | undefined,
  };
}

function takeUrlError(): string | null {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith('#') && url.hash.includes('error') ? url.hash.slice(1) : '');
  const msg =
    url.searchParams.get('error_description') ||
    url.searchParams.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error');
  if (!msg) return null;
  for (const k of ['error', 'error_code', 'error_description']) url.searchParams.delete(k);
  if (hashParams.get('error')) url.hash = '';
  window.history.replaceState(window.history.state, '', url.toString());
  return msg.replace(/\+/g, ' ');
}

function supabaseAuth(): Auth {
  const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // PKCE puts ?code= in the query string, which doesn't clash with the app's #/ routes.
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return {
    onChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        // Supabase advises not to call other Supabase methods inside this callback: defer.
        setTimeout(() => cb(session?.user ? toAppUser(session.user) : null), 0);
      });
      return () => data.subscription.unsubscribe();
    },
    async signIn() {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw new Error(error.message);
    },
    async signOut() {
      await sb.auth.signOut();
    },
    takeUrlError,
    backendFor(user) {
      return cloudBackend(sb, user.id);
    },
  };
}

/**
 * null = cloud sync off (local browser storage only).
 * VITE_FAKE_CLOUD=1 swaps in an in-browser fake for automated tests; it is never set in real builds.
 */
export const auth: Auth | null = import.meta.env.VITE_FAKE_CLOUD === '1' ? fakeCloud() : CLOUD_ENABLED ? supabaseAuth() : null;
