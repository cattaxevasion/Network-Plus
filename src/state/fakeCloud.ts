// Test double for the cloud (auth + backend), used only when VITE_FAKE_CLOUD=1.
// Lets automated tests exercise sign-in, sync, conflicts and offline handling without a real Supabase project.
// window.__fakeCloud exposes controls: bumpRemote(), setOffline(bool), row().

import type { Auth, AppUser } from './auth';
import type { Backend } from './backend';
import type { AppData } from '../lib/types';

const USER_KEY = 'fakecloud:user';
const ROW_KEY = 'fakecloud:row';
let offline = false;

type Row = { data: AppData; version: number };
const readRow = (): Row | null => JSON.parse(localStorage.getItem(ROW_KEY) ?? 'null');
const writeRow = (r: Row | null) => (r ? localStorage.setItem(ROW_KEY, JSON.stringify(r)) : localStorage.removeItem(ROW_KEY));
const net = async () => {
  await new Promise((r) => setTimeout(r, 30));
  if (offline) throw new Error('Failed to fetch');
};

export function fakeCloud(): Auth {
  const listeners = new Set<(u: AppUser | null) => void>();
  const current = (): AppUser | null => (localStorage.getItem(USER_KEY) ? { id: 'u1', name: 'test-user' } : null);
  const emit = () => listeners.forEach((l) => l(current()));

  (window as unknown as Record<string, unknown>).__fakeCloud = {
    setOffline: (v: boolean) => (offline = v),
    row: readRow,
    /** Simulate another device saving a change. */
    bumpRemote: (mutate: (d: AppData) => AppData) => {
      const r = readRow();
      if (r) writeRow({ data: mutate(r.data), version: r.version + 1 });
    },
  };

  const backend: Backend = {
    kind: 'cloud',
    async load() {
      await net();
      return readRow();
    },
    async save(data, version) {
      await net();
      const r = readRow();
      if (version === null) {
        if (r) return { ok: false, conflict: true };
        writeRow({ data, version: 1 });
        return { ok: true, version: 1 };
      }
      if (!r || r.version !== version) return { ok: false, conflict: true };
      writeRow({ data, version: version + 1 });
      return { ok: true, version: version + 1 };
    },
    async clear() {
      await net();
      writeRow(null);
    },
  };

  return {
    onChange(cb) {
      listeners.add(cb);
      setTimeout(() => cb(current()), 0);
      return () => listeners.delete(cb);
    },
    async signIn() {
      localStorage.setItem(USER_KEY, '1');
      emit();
    },
    async signOut() {
      localStorage.removeItem(USER_KEY);
      emit();
    },
    takeUrlError: () => null,
    backendFor: () => backend,
  };
}
