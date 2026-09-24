// Where app data lives. The store only talks to this interface.
//   local : this browser's localStorage (when cloud sync is not configured)
//   cloud : Supabase table public.app_data (one row per user), with a version number
//           so a stale device can't silently overwrite newer data.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppData } from '../lib/types';
import { localStorageBackend, validateAppData } from './storage';

export interface Loaded {
  data: AppData;
  /** null for the local backend (no concurrency control needed). */
  version: number | null;
}

export type SaveResult = { ok: true; version: number | null } | { ok: false; conflict: true };

export interface Backend {
  kind: 'local' | 'cloud';
  /** Saved data or null when there is none yet. Throws on network errors or unreadable data. */
  load(): Promise<Loaded | null>;
  /** Save. `version` is what this device last loaded/saved; null means "no saved row yet". */
  save(data: AppData, version: number | null): Promise<SaveResult>;
  /** Delete everything. */
  clear(): Promise<void>;
}

export const localBackend: Backend = {
  kind: 'local',
  async load() {
    const data = localStorageBackend.load();
    return data ? { data, version: null } : null;
  },
  async save(data) {
    localStorageBackend.save(data);
    return { ok: true, version: null };
  },
  async clear() {
    localStorageBackend.clear();
  },
};

const TABLE = 'app_data';

export function cloudBackend(sb: SupabaseClient, userId: string): Backend {
  return {
    kind: 'cloud',
    async load() {
      const { data, error } = await sb.from(TABLE).select('data, version').eq('user_id', userId).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? { data: validateAppData(data.data), version: data.version as number } : null;
    },
    async save(data, version) {
      if (version === null) {
        const { data: row, error } = await sb
          .from(TABLE)
          .insert({ user_id: userId, data, version: 1 })
          .select('version')
          .single();
        if (error) {
          if (error.code === '23505') return { ok: false, conflict: true }; // row already exists (another device)
          throw new Error(error.message);
        }
        return { ok: true, version: row.version as number };
      }
      const { data: rows, error } = await sb
        .from(TABLE)
        .update({ data, version: version + 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('version', version)
        .select('version');
      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) return { ok: false, conflict: true };
      return { ok: true, version: rows[0].version as number };
    },
    async clear() {
      const { error } = await sb.from(TABLE).delete().eq('user_id', userId);
      if (error) throw new Error(error.message);
    },
  };
}
